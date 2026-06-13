import { sql } from 'drizzle-orm'
import { db } from '@/platform/db/client'
import { dripEmails } from '@/platform/db/schema'

/**
 * Cohort-lifecycle drip scheduling (P4) on the EXISTING dripEmails table.
 *
 * Index namespace: 100+ (free-intro owns 0-2). The (userId, emailIndex) unique index is
 * the dedup key. decisionText is reused to carry the cohort-start instant as an ISO
 * string — the send-time template formats it (see CLAUDE.md; it is NOT a decision here).
 */
export const COHORT_DRIP_INDEXES = {
  welcome: 100,
  startsSoon: 101,
  upgradeNudge: 102,
} as const

/** Everything at or above this emailIndex belongs to the cohort namespace. */
export const COHORT_DRIP_BASE_INDEX = 100

export type CohortDripOffsets = {
  /** starts-soon goes out this many days BEFORE cohort start (T-1 by default). */
  startsSoonDaysBefore: number
  /** upgrade nudge goes out this many days AFTER cohort start. */
  upgradeNudgeDaysAfter: number
}

export const DEFAULT_COHORT_DRIP_OFFSETS: CohortDripOffsets = {
  startsSoonDaysBefore: 1,
  upgradeNudgeDaysAfter: 3,
}

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Schedule the cohort drip sequence for a user who just joined a cohort.
 * - Sends whose time already passed are skipped at scheduling time (joining a running
 *   cohort must not fire a stale "starts tomorrow").
 * - Upsert on (userId, emailIndex): re-joining a later cohort reschedules PENDING rows
 *   to the new cohort's dates; sent/skipped rows are never touched (no resends).
 * Returns the number of rows scheduled or rescheduled.
 */
export async function scheduleCohortDripSequence(input: {
  userId: string
  cohortStartsAt: Date
  now?: Date
  offsets?: Partial<CohortDripOffsets>
}): Promise<number> {
  const now = input.now ?? new Date()
  const offsets = { ...DEFAULT_COHORT_DRIP_OFFSETS, ...input.offsets }
  const startsAtMs = input.cohortStartsAt.getTime()

  const sends: Array<{ emailIndex: number; scheduledAt: Date }> = [
    { emailIndex: COHORT_DRIP_INDEXES.welcome, scheduledAt: now },
    {
      emailIndex: COHORT_DRIP_INDEXES.startsSoon,
      scheduledAt: new Date(startsAtMs - offsets.startsSoonDaysBefore * DAY_MS),
    },
    {
      emailIndex: COHORT_DRIP_INDEXES.upgradeNudge,
      scheduledAt: new Date(startsAtMs + offsets.upgradeNudgeDaysAfter * DAY_MS),
    },
  ].filter((send) => send.scheduledAt.getTime() >= now.getTime())

  let scheduled = 0
  for (const send of sends) {
    const rows = await db
      .insert(dripEmails)
      .values({
        userId: input.userId,
        emailIndex: send.emailIndex,
        decisionText: input.cohortStartsAt.toISOString(),
        scheduledAt: send.scheduledAt,
      })
      .onConflictDoUpdate({
        target: [dripEmails.userId, dripEmails.emailIndex],
        set: {
          scheduledAt: send.scheduledAt,
          decisionText: input.cohortStartsAt.toISOString(),
        },
        // Only pending rows move to the new cohort — sent/skipped stay history.
        setWhere: sql`${dripEmails.status} = 'pending'`,
      })
      .returning({ id: dripEmails.id })
    scheduled += rows.length
  }
  return scheduled
}
