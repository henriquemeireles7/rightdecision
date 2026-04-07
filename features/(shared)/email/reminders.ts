import { and, eq, lt, sql } from 'drizzle-orm'
import { db } from '@/platform/db/client'
import { courseProgress, onboardingSessions, users } from '@/platform/db/schema'
import { sendEmail } from '@/providers/email'

/**
 * Email reminder triggers — run as a scheduled job (daily).
 * Max 1 email per trigger per user per week.
 */

// 7-day inactivity: users who haven't completed a class in 7 days
export async function sendInactivityReminders() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  // Find users with progress but no recent activity
  const inactiveUsers = await db
    .select({ userId: courseProgress.userId })
    .from(courseProgress)
    .groupBy(courseProgress.userId)
    .having(sql`max(${courseProgress.completedAt}) < ${sevenDaysAgo}`)

  let sent = 0
  for (const { userId } of inactiveUsers) {
    const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
    if (!user) continue

    await sendEmail(
      user.email,
      'Your decision is waiting',
      `<p>Hi ${user.name},</p>
       <p>You started something important. Your throughline decision doesn't go away just because life got busy.</p>
       <p>Pick up where you left off — it takes 15 minutes.</p>`,
    )
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

  await sendEmail(
    user.email,
    `You completed: ${moduleName}`,
    `<p>Hi ${user.name},</p>
     <p>You just finished <strong>${moduleName}</strong>. That's real progress on your decision.</p>
     <p>Keep going — the next module builds directly on what you just learned.</p>`,
  )
}

// Abandoned onboarding: email captured but didn't complete
export async function sendAbandonedOnboardingReminders() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const abandonedSessions = await db.query.onboardingSessions.findMany({
    where: and(
      lt(onboardingSessions.createdAt, oneDayAgo),
      sql`${onboardingSessions.sessionData}->>'email' IS NOT NULL`,
    ),
  })

  let sent = 0
  for (const session of abandonedSessions) {
    const data = session.sessionData as { email?: string } | null
    if (!data?.email) continue

    await sendEmail(
      data.email,
      'You were so close',
      `<p>You started naming your decision yesterday but didn't finish.</p>
       <p>The hardest part is starting. You already did that.</p>
       <p>Come back and finish — it takes 3 more minutes.</p>`,
    )
    sent++
  }

  return { sent }
}
