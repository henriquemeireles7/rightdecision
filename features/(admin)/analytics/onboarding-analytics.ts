import { count } from 'drizzle-orm'
import { db } from '@/platform/db/client'
import { onboardingProfiles, onboardingSessions } from '@/platform/db/schema'

export async function getOnboardingAnalytics() {
  // Total profiles completed
  const [profileCount] = await db.select({ count: count() }).from(onboardingProfiles)

  // Active sessions (not expired)
  const [activeSessionCount] = await db.select({ count: count() }).from(onboardingSessions)

  // Step-by-step drop-off (sessions grouped by current_step)
  const stepDropoff = await db
    .select({
      step: onboardingSessions.currentStep,
      count: count(),
    })
    .from(onboardingSessions)
    .groupBy(onboardingSessions.currentStep)
    .orderBy(onboardingSessions.currentStep)

  // Profile aggregates
  const ageRanges = await db
    .select({
      ageRange: onboardingProfiles.ageRange,
      count: count(),
    })
    .from(onboardingProfiles)
    .groupBy(onboardingProfiles.ageRange)

  const timeStuckDistribution = await db
    .select({
      timeStuck: onboardingProfiles.timeStuck,
      count: count(),
    })
    .from(onboardingProfiles)
    .groupBy(onboardingProfiles.timeStuck)

  return {
    completedProfiles: profileCount?.count ?? 0,
    activeSessions: activeSessionCount?.count ?? 0,
    stepDropoff,
    ageRanges,
    timeStuckDistribution,
  }
}
