import { eq } from 'drizzle-orm'
import { createMiddleware } from 'hono/factory'
import { db } from '@/platform/db/client'
import { subscriptions } from '@/platform/db/schema'
import { throwError } from '@/platform/errors'
import type { AppEnv } from '@/platform/types'

/**
 * Access-gating middleware: checks subscription status before serving course content.
 *
 * Must be stacked AFTER requireAuth (needs user in context).
 * Maps subscription status to access:
 *   active    → allow (full access)
 *   past_due  → allow (grace period while Stripe retries, up to 14 days)
 *   trialing  → allow
 *   cancelled → deny
 *   missing   → deny
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

	await next()
})
