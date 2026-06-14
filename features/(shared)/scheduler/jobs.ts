import { and, eq, lt } from 'drizzle-orm'
import { processPendingDrips } from '@/features/(shared)/drip-email/scheduler'
import { db } from '@/platform/db/client'
import { cohorts, enrollments, programs } from '@/platform/db/schema'
import { env } from '@/platform/env'
import { computeFirstMonday, nextMonthOf } from './date-math'

/** Fixed local hour (in env.COHORT_TIMEZONE) at which monthly cohorts start. */
export const COHORT_START_HOUR = 9

/**
 * Sends due drip emails — the caller the previously-dead processPendingDrips never had.
 * Idempotent: sent drips flip to status='sent' and are not re-queried.
 * (`now` is unused: processPendingDrips owns its own clock for the 48h retry window.)
 */
export async function processPendingDripsJob(_now: Date): Promise<number> {
  return processPendingDrips(env.PUBLIC_APP_URL)
}

/**
 * Ensures every active free program has next month's cohort: first Monday of next month
 * at COHORT_START_HOUR local in env.COHORT_TIMEZONE, stored as a timestamptz instant.
 * Idempotent via cohorts_program_start_idx + onConflictDoNothing (eng-schema M2/M7).
 */
export async function cohortAutoCreationJob(now: Date): Promise<number> {
  const { year, month } = nextMonthOf(now, env.COHORT_TIMEZONE)
  const startsAt = computeFirstMonday(year, month, env.COHORT_TIMEZONE, COHORT_START_HOUR)
  const title = `Cohort ${year}-${String(month).padStart(2, '0')}`

  const freePrograms = await db.query.programs.findMany({
    where: and(eq(programs.tier, 'free'), eq(programs.status, 'active')),
  })

  let created = 0
  for (const program of freePrograms) {
    const inserted = await db
      .insert(cohorts)
      .values({ programId: program.id, title, startsAt })
      .onConflictDoNothing({ target: [cohorts.programId, cohorts.startsAt] })
      .returning({ id: cohorts.id })
    created += inserted.length
  }
  return created
}

/**
 * Flips active enrollments whose expiresAt has passed to status='expired'.
 * Idempotent: only matches status='active', so flipped rows never match again.
 * NULL expiresAt (paid evergreen) never matches — SQL NULL comparison is falsy.
 */
export async function enrollmentExpirySweepJob(now: Date): Promise<number> {
  const flipped = await db
    .update(enrollments)
    .set({ status: 'expired', updatedAt: now })
    .where(and(eq(enrollments.status, 'active'), lt(enrollments.expiresAt, now)))
    .returning({ id: enrollments.id })
  return flipped.length
}
