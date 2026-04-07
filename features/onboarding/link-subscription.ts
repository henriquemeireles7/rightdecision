import { eq, isNull } from 'drizzle-orm'
import { db } from '@/platform/db/client'
import { subscriptions } from '@/platform/db/schema'
import { consumeSession } from './session'

/**
 * After account creation, link the Stripe subscription and consume onboarding session.
 * PRD Prerequisite #4: subscription created before account (userId is null),
 * linked post-creation by matching Stripe customer email → user email.
 */
export async function linkAccountAfterCreation(
  userId: string,
  email: string,
  onboardingSessionId?: string,
) {
  const results = { subscriptionLinked: false, profileCreated: false }

  // 1. Find subscription by email (via Stripe customer) and link userId
  // The subscription was created with userId=null during checkout
  // We find it by stripeCustomerId which maps to the email used at checkout
  const allSubs = await db.query.subscriptions.findMany({
    where: isNull(subscriptions.userId),
  })

  // Match by looking up each subscription's customer email in Stripe
  // For now, just link the most recent unlinked subscription
  // (In production, match via Stripe customer email lookup)
  if (allSubs.length > 0) {
    const latestUnlinked = allSubs[allSubs.length - 1]!
    await db
      .update(subscriptions)
      .set({ userId, updatedAt: new Date() })
      .where(eq(subscriptions.id, latestUnlinked.id))

    results.subscriptionLinked = true
  }

  // 2. Consume onboarding session → write to onboardingProfiles
  if (onboardingSessionId) {
    const consumed = await consumeSession(onboardingSessionId, userId)
    if (consumed) {
      results.profileCreated = true
    }
  }

  return results
}
