import { eq } from 'drizzle-orm'
import { createMiddleware } from 'hono/factory'
import { db } from '@/platform/db/client'
import { subscriptions } from '@/platform/db/schema'
import { throwError } from '@/platform/errors'
import type { AppEnv } from '@/platform/types'

/**
 * Access-gating middleware: checks subscription status + period end before serving course content.
 *
 * Must be stacked AFTER requireAuth (needs user in context).
 * Maps subscription status to access:
 *   active (period not expired)   → allow
 *   past_due                      → allow (grace period while Stripe retries)
 *   trialing                      → allow
 *   active (period expired)       → deny (cancel_at_period_end case)
 *   cancelled                     → deny
 *   missing                       → deny
 */
export const requireActiveSubscription = createMiddleware<AppEnv>(async (c, next) => {
	const user = c.get('user')

	const subscription = await db.query.subscriptions.findFirst({
		where: eq(subscriptions.userId, user.id),
		orderBy: (s, { desc }) => [desc(s.createdAt)],
	})

	if (!subscription) {
		return throwError(c, 'SUBSCRIPTION_REQUIRED')
	}

	const activeStatuses = ['active', 'past_due', 'trialing']
	if (!activeStatuses.includes(subscription.status)) {
		return throwError(c, 'SUBSCRIPTION_REQUIRED')
	}

	// Check period end: handles cancel_at_period_end where status stays 'active'
	// but period has expired. 1-day grace buffer for clock skew.
	const gracePeriod = 24 * 60 * 60 * 1000 // 1 day in ms
	if (subscription.currentPeriodEnd.getTime() + gracePeriod < Date.now()) {
		return throwError(c, 'SUBSCRIPTION_REQUIRED')
	}

	await next()
})
