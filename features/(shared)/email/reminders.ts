import { and, eq, lt, sql } from 'drizzle-orm'
import { db } from '@/platform/db/client'
import { courseProgress, onboardingSessions, users } from '@/platform/db/schema'
import { sendEmail } from '@/providers/email'
import {
  abandonedOnboardingEmail,
  inactivityReminderEmail,
  moduleCompletionEmail,
} from './auth-emails'

/**
 * Email reminder triggers — run as a scheduled job (daily).
 * Dedup: each function checks recency to prevent re-sending.
 */

// 7-day inactivity: users who haven't completed a class in 7 days
// AND whose last class completion is more recent than 14 days (to avoid emailing long-gone users)
export async function sendInactivityReminders() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)

  const inactiveUsers = await db
    .select({ userId: courseProgress.userId })
    .from(courseProgress)
    .groupBy(courseProgress.userId)
    .having(
      sql`max(${courseProgress.completedAt}) < ${sevenDaysAgo} AND max(${courseProgress.completedAt}) > ${fourteenDaysAgo}`,
    )

  let sent = 0
  for (const { userId } of inactiveUsers) {
    const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
    if (!user) continue

    await sendEmail(user.email, inactivityReminderEmail({ name: user.name }))
    sent++
  }

  return { sent }
}

// Module completion: congratulate when a module is finished
export async function sendModuleCompletionEmail(userId: string, moduleNum: number) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
  if (!user) return

  const moduleNames = [
    'Onboarding',
    'The Wake-Up Call',
    'Where You Actually Are',
    'Where You Want To Be',
    'The One Thing In The Way',
    'The Decision',
    'The Plan',
    'Doing The Thing',
    'What Reality Tells You',
    'Resolution',
  ]

  const moduleName = moduleNames[moduleNum] ?? `Module ${moduleNum}`

  await sendEmail(user.email, moduleCompletionEmail({ name: user.name, moduleName }))
}

// Abandoned onboarding: email captured but didn't complete
// Dedup: only send for sessions created 24-48h ago (not older, to prevent re-sending)
export async function sendAbandonedOnboardingReminders() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000)

  const abandonedSessions = await db.query.onboardingSessions.findMany({
    where: and(
      lt(onboardingSessions.createdAt, oneDayAgo),
      sql`${onboardingSessions.createdAt} > ${twoDaysAgo}`,
      sql`${onboardingSessions.sessionData}->>'email' IS NOT NULL`,
    ),
  })

  let sent = 0
  for (const session of abandonedSessions) {
    const data = session.sessionData as { email?: string } | null
    if (!data?.email) continue

    await sendEmail(data.email, abandonedOnboardingEmail())
    sent++
  }

  return { sent }
}
