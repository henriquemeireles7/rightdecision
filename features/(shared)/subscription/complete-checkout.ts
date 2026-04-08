import { eq, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '@/platform/db/client'
import { subscriptions, users } from '@/platform/db/schema'
import { env } from '@/platform/env'
import { throwError } from '@/platform/errors'
import { success } from '@/platform/server/responses'
import { sendEmail } from '@/providers/email'
import { payments } from '@/providers/payments'
import { paymentConfirmationEmail } from '@/features/(shared)/email/payment-emails'
import { auth } from '@/platform/auth/config'

const completeCheckoutSchema = z.object({
	sessionId: z.string().min(1),
	name: z.string().min(1),
	email: z.string().email(),
	password: z.string().min(8),
})

export const completeCheckoutRoutes = new Hono()

// GET /session-info — retrieve customer email from Stripe session for pre-fill
completeCheckoutRoutes.get('/session-info', async (c) => {
	const sessionId = c.req.query('session_id')
	if (!sessionId) return throwError(c, 'VALIDATION_ERROR', 'Missing session_id')

	try {
		const session = await payments.checkout.sessions.retrieve(sessionId)
		if (session.status !== 'complete') {
			return throwError(c, 'VALIDATION_ERROR', 'Session not complete')
		}
		const customerEmail = session.customer_details?.email ?? ''
		return success(c, { email: customerEmail })
	} catch {
		return throwError(c, 'VALIDATION_ERROR', 'Invalid session_id')
	}
})

// POST /complete — create account + link subscription after Stripe Checkout
completeCheckoutRoutes.post(
	'/complete',
	zValidator('json', completeCheckoutSchema),
	async (c) => {
		const { sessionId, name, email, password } = c.req.valid('json')

		// 1. Retrieve Stripe Checkout session
		let session: Awaited<ReturnType<typeof payments.checkout.sessions.retrieve>>
		try {
			session = await payments.checkout.sessions.retrieve(sessionId)
		} catch {
			return throwError(c, 'VALIDATION_ERROR', 'Invalid or expired session_id')
		}

		if (session.status !== 'complete') {
			return throwError(c, 'VALIDATION_ERROR', 'Payment session not complete')
		}

		// 2. Extract Stripe IDs
		const stripeCustomerId =
			typeof session.customer === 'string' ? session.customer : (session.customer?.id ?? '')
		const stripeSubscriptionId =
			typeof session.subscription === 'string'
				? session.subscription
				: (session.subscription?.id ?? '')

		if (!stripeCustomerId || !stripeSubscriptionId) {
			return throwError(c, 'INTERNAL_ERROR', 'Missing Stripe customer or subscription')
		}

		// 3. Validate email matches Stripe session (prevent subscription hijacking)
		const sessionEmail = session.customer_details?.email?.toLowerCase().trim()
		if (sessionEmail && sessionEmail !== email.toLowerCase().trim()) {
			return throwError(c, 'VALIDATION_ERROR', 'Email must match the one used at checkout')
		}

		// 4. Get subscription details for period end
		const stripeSub = await payments.subscriptions.retrieve(stripeSubscriptionId)
		const periodEnd = (stripeSub as unknown as { current_period_end: number }).current_period_end

		// 5-8. Create subscription + user + link atomically
		// Atomic linking: UPDATE ... WHERE userId IS NULL prevents race condition
		let userId: string
		try {
			// 5. Create subscription in DB (idempotent — webhook may have already created it)
			await db
				.insert(subscriptions)
				.values({
					stripeCustomerId,
					stripeSubscriptionId,
					status: 'active',
					currentPeriodEnd: new Date(periodEnd * 1000),
				})
				.onConflictDoNothing({ target: subscriptions.stripeSubscriptionId })

			// Check if already linked (duplicate completion)
			const existingSub = await db.query.subscriptions.findFirst({
				where: eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId),
			})
			if (existingSub?.userId) {
				return throwError(c, 'VALIDATION_ERROR', 'Account already created for this purchase. Please log in.')
			}

			// 6. Create user account via Better Auth
			const result = await auth.api.signUpEmail({
				body: { name, email, password },
			})
			userId = (result as unknown as { user: { id: string } }).user.id

			// 7. Atomic link: only succeeds if userId IS NULL (prevents race condition)
			const linked = await db
				.update(subscriptions)
				.set({ userId, updatedAt: new Date() })
				.where(
					sql`${subscriptions.stripeSubscriptionId} = ${stripeSubscriptionId} AND ${subscriptions.userId} IS NULL`,
				)

			if (linked.rowCount === 0) {
				// Another request linked it first — user created but subscription already taken
				return throwError(c, 'VALIDATION_ERROR', 'Account already created for this purchase. Please log in.')
			}

			// 8. Upgrade user role to 'pro'
			await db
				.update(users)
				.set({ role: 'pro', updatedAt: new Date() })
				.where(eq(users.id, userId))
		} catch (err) {
			if (err instanceof Error && 'code' in err) throw err // re-throw Hono errors
			return throwError(c, 'VALIDATION_ERROR', 'Could not create account. Email may already be registered.')
		}

		// 9. Send payment confirmation + course welcome email
		const renewalDate = new Date(periodEnd * 1000).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		})
		try {
			await sendEmail(
				email,
				paymentConfirmationEmail({
					name,
					amount: '$197.00',
					renewalDate,
					firstLessonUrl: `${env.PUBLIC_APP_URL}/course`,
				}),
			)
		} catch (err) {
			console.error('[complete-checkout] Failed to send confirmation email:', err)
		}

		return success(c, { redirectUrl: '/course' })
	},
)
