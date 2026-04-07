export type AccessTier = 'free' | 'paid' | 'expired'

/**
 * Check if a user can access a specific class.
 * Module 0 (onboarding) and Module 1 are free for everyone.
 * Modules 2-9 require an active subscription.
 */
export function canAccessClass(moduleNumber: number, accessTier: AccessTier): boolean {
  if (moduleNumber <= 1) return true
  return accessTier === 'paid'
}

/**
 * Parse module number from a classId like "module-02/class-01"
 */
export function getModuleFromClassId(classId: string): number {
  const match = classId.match(/^module-(\d+)/)
  return match ? Number.parseInt(match[1]!, 10) : -1
}

/**
 * Check if a user has an active subscription.
 * Returns 'paid' if active, 'expired' if had one but it lapsed, 'free' if never subscribed.
 * Lazy-imports db to avoid env validation at import time (enables pure function testing).
 */
export async function getUserAccessTier(userId: string | null): Promise<AccessTier> {
  if (!userId) return 'free'

  const { eq } = await import('drizzle-orm')
  const { db } = await import('@/platform/db/client')
  const { subscriptions } = await import('@/platform/db/schema')

  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
    orderBy: (s, { desc }) => [desc(s.createdAt)],
  })

  if (!sub) return 'free'
  if (sub.status === 'active' && sub.currentPeriodEnd > new Date()) return 'paid'
  return 'expired'
}
