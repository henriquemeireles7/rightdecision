import { eq } from 'drizzle-orm'
import { type Context, Hono } from 'hono'
import {
  accessRevokedEmail,
  paymentFailedEmail,
  renewalReceiptEmail,
  renewalReminderEmail,
  subscriptionCancelledEmail,
} from '@/features/(shared)/email/payment-emails'
import { db } from '@/platform/db/client'
import { subscriptions, webhookEvents } from '@/platform/db/schema'
import { env } from '@/platform/env'
import { throwError } from '@/platform/errors'
import { success } from '@/platform/server/responses'
import { sendEmail } from '@/providers/email'
import {
  formatStripeAmount,
  intervalFromPriceId,
  invoiceSubscriptionId,
  payments,
  plans,
  subscriptionPeriodEnd,
} from '@/providers/payments'
import {
  syncEnrollmentForCheckoutCompleted,
  syncEnrollmentForSubscriptionDeleted,
  syncEnrollmentForSubscriptionUpdate,
} from './enrollment-sync'
import { getUserForSubscription } from './helpers'

export const webhookRoutes = new Hono()

/**
 * Send an email inside a webhook handler.
 * CRITICAL: If Resend is down, log the error but don't fail the webhook.
 * Stripe retries indefinitely if we return non-200.
 */
async function safeSendEmail(to: string, email: { subject: string; html: string; text: string }) {
  try {
    await sendEmail(to, email)
  } catch (err) {
    console.error(`[webhook] Failed to send email "${email.subject}" to ${to}:`, err)
  }
}

/**
 * Run a paid-enrollment sync inside a webhook handler (P4).
 * CRITICAL: never fail the webhook on a sync error — the webhookEvents dedup row is
 * already written, so a non-200 would make Stripe retry into a guaranteed no-op.
 * The sync functions are themselves idempotent; a missed sync self-heals on the next
 * subscription event (or via the M8 migration script).
 */
async function safeEnrollmentSync(sync: () => Promise<unknown>) {
  try {
    await sync()
  } catch (err) {
    console.error('[webhook] Paid enrollment sync failed (webhook still 200):', err)
  }
}

webhookRoutes.post('/', async (c) => {
  const body = await c.req.text()
  const signature = c.req.header('stripe-signature')

  if (!signature) {
    return throwError(c, 'VALIDATION_ERROR', 'No signature')
  }

  let event: ReturnType<typeof payments.webhooks.constructEvent> extends Promise<infer T>
    ? T
    : ReturnType<typeof payments.webhooks.constructEvent>
  try {
    event = payments.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err)
    return throwError(c, 'VALIDATION_ERROR', 'Invalid signature')
  }

  // ─── Idempotency: INSERT-first with ON CONFLICT DO NOTHING ───
  // postgres-js result affected-rows is `.count`, NOT `.rowCount`; detect a real insert
  // via RETURNING so a genuine Stripe redelivery (same event id) is skipped.
  const inserted = await db
    .insert(webhookEvents)
    .values({ stripeEventId: event.id, eventType: event.type })
    .onConflictDoNothing({ target: webhookEvents.stripeEventId })
    .returning({ id: webhookEvents.id })

  if (inserted.length === 0) {
    console.info(`[webhook] Duplicate: ${event.type} ${event.id}`)
    return success(c, { received: true })
  }

  console.info(`[webhook] ${event.type} ${event.id}`)

  // The dedup row is claimed BEFORE processing. If the handler throws (e.g. a transient
  // Stripe/DB blip), release the claim so Stripe's retry re-processes instead of hitting a
  // now-permanent "duplicate" and silently dropping the event.
  try {
    return await handleEvent(c, event)
  } catch (err) {
    await db.delete(webhookEvents).where(eq(webhookEvents.stripeEventId, event.id))
    throw err
  }
})

async function handleEvent(c: Context, event: ReturnType<typeof payments.webhooks.constructEvent>) {
  // ─── Event Handlers ───
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      if (session.mode !== 'subscription') break

      const subscriptionId =
        typeof session.subscription === 'string'
          ? session.subscription
          : (session.subscription?.id ?? '')

      if (!subscriptionId) break

      const customerId =
        typeof session.customer === 'string' ? session.customer : (session.customer?.id ?? '')

      const sub = await payments.subscriptions.retrieve(subscriptionId)
      const periodEnd = subscriptionPeriodEnd(sub)
      const priceId =
        (sub as unknown as { items?: { data?: Array<{ price?: { id?: string } }> } }).items
          ?.data?.[0]?.price?.id ?? ''

      await db
        .insert(subscriptions)
        .values({
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          status: 'active',
          planInterval: intervalFromPriceId(priceId),
          currentPeriodEnd: new Date(periodEnd * 1000),
        })
        .onConflictDoNothing({ target: subscriptions.stripeSubscriptionId })

      // P4: paid enrollment (evergreen, cohortId NULL). NULL-userId rows are
      // reported inside the sync, never enrolled — linkage lands via /complete.
      await safeEnrollmentSync(() => syncEnrollmentForCheckoutCompleted(subscriptionId))

      // No email here — success page flow handles first-payment email
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as unknown as {
        billing_reason: string
        amount_paid?: number
        currency?: string
        lines?: { data?: Array<{ period?: { end?: number } }> }
      }

      // Skip first payment — that's handled by success page
      if (invoice.billing_reason !== 'subscription_cycle') break

      const subId = invoiceSubscriptionId(invoice)
      if (!subId) break

      // Update period end
      const periodEnd = invoice.lines?.data?.[0]?.period?.end
      if (periodEnd) {
        await db
          .update(subscriptions)
          .set({ currentPeriodEnd: new Date(periodEnd * 1000), updatedAt: new Date() })
          .where(eq(subscriptions.stripeSubscriptionId, subId))
      }

      // Send renewal receipt
      const user = await getUserForSubscription(subId)
      if (user) {
        const portalUrl = `${env.PUBLIC_APP_URL}/settings`
        await safeSendEmail(
          user.email,
          renewalReceiptEmail({
            name: user.name,
            amount: formatStripeAmount(
              invoice.amount_paid ?? plans.yearly.amount,
              invoice.currency,
            ),
            cardLast4: '****',
            nextRenewalDate: periodEnd
              ? new Date(periodEnd * 1000).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : 'next year',
            portalUrl,
          }),
        )
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as unknown as {
        amount_due?: number
        currency?: string
        attempt_count: number
        next_payment_attempt: number | null
      }

      const subId = invoiceSubscriptionId(invoice)
      if (!subId) break

      console.error(
        `[webhook] Payment failed for subscription ${subId} (attempt ${invoice.attempt_count})`,
      )

      await db
        .update(subscriptions)
        .set({ status: 'past_due', updatedAt: new Date() })
        .where(eq(subscriptions.stripeSubscriptionId, subId))

      const user = await getUserForSubscription(subId)
      if (user) {
        const portalUrl = `${env.PUBLIC_APP_URL}/settings`
        await safeSendEmail(
          user.email,
          paymentFailedEmail({
            name: user.name,
            amount: formatStripeAmount(invoice.amount_due ?? plans.yearly.amount, invoice.currency),
            portalUrl,
          }),
        )
      }
      break
    }

    case 'invoice.upcoming': {
      const invoice = event.data.object as unknown as {
        amount_due: number
        currency?: string
        period_end: number
      }

      const subId = invoiceSubscriptionId(invoice)
      if (!subId) break

      const user = await getUserForSubscription(subId)
      if (user) {
        const portalUrl = `${env.PUBLIC_APP_URL}/settings`
        const renewalDate = new Date(invoice.period_end * 1000).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
        await safeSendEmail(
          user.email,
          renewalReminderEmail({
            name: user.name,
            amount: formatStripeAmount(invoice.amount_due, invoice.currency),
            renewalDate,
            cardBrand: 'Card',
            cardLast4: '****',
            portalUrl,
          }),
        )
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as unknown as {
        id: string
        cancel_at_period_end: boolean
        status: string
        items?: { data?: Array<{ current_period_end?: number }> }
      }
      // dahlia API version: period end lives on the subscription item, not top-level.
      const periodEnd = sub.items?.data?.[0]?.current_period_end ?? 0

      // Map status accurately
      let dbStatus: 'active' | 'past_due' | 'cancelled'
      if (sub.status === 'active') {
        dbStatus = 'active'
      } else if (sub.status === 'past_due') {
        dbStatus = 'past_due'
      } else if (sub.status === 'canceled' || sub.status === 'unpaid') {
        dbStatus = 'cancelled'
      } else {
        dbStatus = 'past_due' // incomplete, incomplete_expired, paused
      }

      await db
        .update(subscriptions)
        .set({
          status: dbStatus,
          currentPeriodEnd: new Date(periodEnd * 1000),
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.stripeSubscriptionId, sub.id))

      // P4: mirror the status mapping onto the paid enrollment
      // (revoke on cancelled, expiresAt on cancel-at-period-end, re-grant on active)
      await safeEnrollmentSync(() =>
        syncEnrollmentForSubscriptionUpdate({
          stripeSubscriptionId: sub.id,
          status: dbStatus,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          currentPeriodEnd: new Date(periodEnd * 1000),
        }),
      )

      // User-initiated cancellation (cancel at period end)
      if (sub.cancel_at_period_end) {
        const user = await getUserForSubscription(sub.id)
        if (user) {
          const periodEndDate = new Date(periodEnd * 1000).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
          await safeSendEmail(
            user.email,
            subscriptionCancelledEmail({
              name: user.name,
              periodEndDate,
              pricingUrl: env.PUBLIC_APP_URL,
            }),
          )
        }
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subObj = event.data.object as unknown as { id: string }

      // Check previous status to distinguish user-initiated vs involuntary
      const existingSub = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.stripeSubscriptionId, subObj.id),
      })
      const wasPaymentFailure = existingSub?.status === 'past_due'

      await db
        .update(subscriptions)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(subscriptions.stripeSubscriptionId, subObj.id))

      // P4: hard cancel revokes the paid enrollment now. NOT wrapped in safeEnrollmentSync:
      // there is no later subscription event to self-heal a missed revoke, so a failure must
      // surface → the claim is released and Stripe retries (revoke is idempotent).
      await syncEnrollmentForSubscriptionDeleted(subObj.id)

      const user = await getUserForSubscription(subObj.id)
      if (user) {
        if (wasPaymentFailure) {
          // Involuntary — payment failed after retry window
          await safeSendEmail(
            user.email,
            accessRevokedEmail({
              name: user.name,
              reactivateUrl: env.PUBLIC_APP_URL,
            }),
          )
        } else {
          // User-initiated cancellation (immediate, not cancel-at-period-end)
          await safeSendEmail(
            user.email,
            subscriptionCancelledEmail({
              name: user.name,
              periodEndDate: 'today',
              pricingUrl: env.PUBLIC_APP_URL,
            }),
          )
        }
      }
      break
    }
  }

  return success(c, { received: true })
}
