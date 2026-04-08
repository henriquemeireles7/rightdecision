import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '@/platform/db/client'
import { subscriptions } from '@/platform/db/schema'
import { env } from '@/platform/env'
import { throwError } from '@/platform/errors'
import { success } from '@/platform/server/responses'
import { payments } from '@/providers/payments'

export const webhookRoutes = new Hono()

webhookRoutes.post('/', async (c) => {
  const body = await c.req.text()
  const signature = c.req.header('stripe-signature')

  if (!signature) {
    return throwError(c, 'VALIDATION_ERROR', 'No signature')
  }

  let event: ReturnType<typeof payments.webhooks.constructEvent>
  try {
    event = payments.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return throwError(c, 'VALIDATION_ERROR', 'Invalid signature')
  }

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

      // Fetch subscription details for period end
      const sub = await payments.subscriptions.retrieve(subscriptionId)
      const periodEnd = (sub as unknown as { current_period_end: number }).current_period_end

      await db
        .insert(subscriptions)
        .values({
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          status: 'active',
          currentPeriodEnd: new Date(periodEnd * 1000),
        })
        .onConflictDoNothing({ target: subscriptions.stripeSubscriptionId })

      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as unknown as {
        id: string
        cancel_at_period_end: boolean
        status: string
        current_period_end: number
      }
      const status = sub.cancel_at_period_end
        ? 'cancelled'
        : sub.status === 'active'
          ? 'active'
          : 'past_due'

      await db
        .update(subscriptions)
        .set({
          status: status as 'active' | 'past_due' | 'cancelled',
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.stripeSubscriptionId, sub.id))

      break
    }

    case 'customer.subscription.deleted': {
      await db
        .update(subscriptions)
        .set({
          status: 'cancelled',
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.stripeSubscriptionId, event.data.object.id))

      break
    }
  }

  return success(c, { received: true })
})
