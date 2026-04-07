import { eq } from 'drizzle-orm'
import { db } from '@/platform/db/client'
import {
  bookmarks,
  courseProgress,
  onboardingProfiles,
  subscriptions,
  users,
  wins,
} from '@/platform/db/schema'

/**
 * Export all user data as JSON (GDPR/LGPD right to data portability).
 */
export async function exportUserData(userId: string) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
  const profile = await db.query.onboardingProfiles.findFirst({
    where: eq(onboardingProfiles.userId, userId),
  })
  const progress = await db.query.courseProgress.findMany({
    where: eq(courseProgress.userId, userId),
  })
  const userWins = await db.query.wins.findMany({ where: eq(wins.userId, userId) })
  const userBookmarks = await db.query.bookmarks.findMany({
    where: eq(bookmarks.userId, userId),
  })
  const userSubs = await db.query.subscriptions.findMany({
    where: eq(subscriptions.userId, userId),
  })

  return {
    user: user
      ? { email: user.email, name: user.name, createdAt: user.createdAt }
      : null,
    onboardingProfile: profile,
    courseProgress: progress,
    wins: userWins,
    bookmarks: userBookmarks,
    subscriptions: userSubs.map((s) => ({
      status: s.status,
      currentPeriodEnd: s.currentPeriodEnd,
      createdAt: s.createdAt,
    })),
    exportedAt: new Date().toISOString(),
  }
}

/**
 * Delete all user data (GDPR/LGPD right to erasure).
 * Cascading deletes handle most relations. We explicitly delete non-cascaded data.
 */
export async function deleteUserAccount(userId: string) {
  // Delete in order: leaf tables first, then user (cascade handles the rest)
  await db.delete(wins).where(eq(wins.userId, userId))
  await db.delete(bookmarks).where(eq(bookmarks.userId, userId))
  await db.delete(courseProgress).where(eq(courseProgress.userId, userId))
  await db.delete(onboardingProfiles).where(eq(onboardingProfiles.userId, userId))
  await db.delete(subscriptions).where(eq(subscriptions.userId, userId))
  // Deleting user cascades sessions, accounts
  await db.delete(users).where(eq(users.id, userId))

  return { deleted: true }
}
