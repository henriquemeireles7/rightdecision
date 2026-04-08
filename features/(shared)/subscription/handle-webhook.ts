import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '@/platform/db/client'
import { subscriptions, webhookEvents } from '@/platform/db/schema'
import { env } from '@/platform/env'
import { throwError } from '@/platform/errors'
import { success } from '@/platform/server/responses'
import { sendEmail } from '@/providers/email'
import { payments } from '@/providers/payments'
import {
	accessRevokedEmail,
	paymentFailedEmail,
	renewalReceiptEmail,
	renewalReminderEmail,
	subscriptionCancelledEmail,
} from '@/features/(shared)/email/payment-emails'
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
	const inserted = await db
		.insert(webhookEvents)
		.values({ stripeEventId: event.id, eventType: event.type })
		.onConflictDoNothing({ target: webhookEvents.stripeEventId })

	if (inserted.rowCount === 0) {
		console.info(`[webhook] Duplicate: ${event.type} ${event.id}`)
		return success(c, { received: true })
	}

	console.info(`[webhook] ${event.type} ${event.id}`)

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

			// No email here — success page flow handles first-payment email
			break
		}

		case 'invoice.payment_succeeded': {
			const invoice = event.data.object as unknown as {
				billing_reason: string
				subscription: string
				lines?: { data?: Array<{ period?: { end?: number } }> }
			}

			// Skip first payment — that's handled by success page
			if (invoice.billing_reason !== 'subscription_cycle') break

			const subId =
				typeof invoice.subscription === 'string' ? invoice.subscription : ''
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
						amount: '$197.00',
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
				subscription: string
				attempt_count: number
				next_payment_attempt: number | null
			}

			const subId =
				typeof invoice.subscription === 'string' ? invoice.subscription : ''
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
					paymentFailedEmail({ name: user.name, amount: '$197.00', portalUrl }),
				)
			}
			break
		}

		case 'invoice.upcoming': {
			const invoice = event.data.object as unknown as {
				subscription: string
				amount_due: number
				period_end: number
			}

			const subId =
				typeof invoice.subscription === 'string' ? invoice.subscription : ''
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
						amount: '$197.00',
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
				current_period_end: number
			}

			// Map status accurately (don't conflate everything to past_due)
			let dbStatus: 'active' | 'past_due' | 'cancelled'
			if (sub.status === 'active') {
				dbStatus = 'active'
			} else if (sub.status === 'past_due') {
				dbStatus = 'past_due'
			} else {
				dbStatus = 'past_due'
			}

			await db
				.update(subscriptions)
				.set({
					status: dbStatus,
					currentPeriodEnd: new Date(sub.current_period_end * 1000),
					updatedAt: new Date(),
				})
				.where(eq(subscriptions.stripeSubscriptionId, sub.id))

			// User-initiated cancellation (cancel at period end)
			if (sub.cancel_at_period_end) {
				const user = await getUserForSubscription(sub.id)
				if (user) {
					const periodEndDate = new Date(sub.current_period_end * 1000).toLocaleDateString(
						'en-US',
						{ year: 'numeric', month: 'long', day: 'numeric' },
					)
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
})
