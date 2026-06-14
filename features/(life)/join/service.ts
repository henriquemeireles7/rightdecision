import { and, asc, desc, eq, gt, gte, lte } from 'drizzle-orm'
import { scheduleCohortDripSequence } from '@/features/(shared)/drip-email/cohort-drips'
import { grantEnrollment } from '@/features/(shared)/enrollment/service'
import { computeFirstMonday, nextMonthOf } from '@/features/(shared)/scheduler/date-math'
import { COHORT_START_HOUR } from '@/features/(shared)/scheduler/jobs'
import { db } from '@/platform/db/client'
import { cohorts, enrollments, programs } from '@/platform/db/schema'
import { env } from '@/platform/env'
import { record } from '@/platform/events'

/** A cohort that started at most this many days ago is still joinable ("current"). */
export const JOIN_GRACE_DAYS = 7

const DAY_MS = 24 * 60 * 60 * 1000

type Program = typeof programs.$inferSelect
type Cohort = typeof cohorts.$inferSelect

/** Calendar (year, month) that `now` falls in, as seen in the cohort timezone. */
function currentMonthOf(now: Date, timezone: string): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(now)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  return { year: get('year'), month: get('month') }
}

/**
 * The program's next upcoming cohort. When the scheduler hasn't created one yet,
 * create it on read with the SAME idempotent insert (cohorts_program_start_idx +
 * onConflictDoNothing) — the ad landing page must never 404 on an empty table.
 * Target: the next first Monday at COHORT_START_HOUR local (this month's if still
 * ahead, else next month's) — identical date math to cohortAutoCreationJob.
 */
async function ensureUpcomingCohort(programId: string, now: Date): Promise<Cohort> {
  const [upcoming] = await db
    .select()
    .from(cohorts)
    .where(and(eq(cohorts.programId, programId), gt(cohorts.startsAt, now)))
    .orderBy(asc(cohorts.startsAt))
    .limit(1)
  if (upcoming) return upcoming

  const timezone = env.COHORT_TIMEZONE
  let { year, month } = currentMonthOf(now, timezone)
  let startsAt = computeFirstMonday(year, month, timezone, COHORT_START_HOUR)
  if (startsAt.getTime() <= now.getTime()) {
    ;({ year, month } = nextMonthOf(now, timezone))
    startsAt = computeFirstMonday(year, month, timezone, COHORT_START_HOUR)
  }

  await db
    .insert(cohorts)
    .values({
      programId,
      title: `Cohort ${year}-${String(month).padStart(2, '0')}`,
      startsAt,
    })
    .onConflictDoNothing({ target: [cohorts.programId, cohorts.startsAt] })

  // Re-select instead of trusting returning(): a concurrent insert no-ops on conflict.
  const [created] = await db
    .select()
    .from(cohorts)
    .where(and(eq(cohorts.programId, programId), eq(cohorts.startsAt, startsAt)))
    .limit(1)
  // The row exists by construction (insert or pre-existing conflict row)
  return created as Cohort
}

/**
 * Next-cohort lookup for landing/join pages. Returns null ONLY when the program
 * doesn't exist — a missing cohort is created on read (never 404 the ad page).
 */
export async function getNextCohort(
  programSlug: string,
  now: Date = new Date(),
): Promise<{ program: Program; cohort: Cohort } | null> {
  const program = await db.query.programs.findFirst({ where: eq(programs.slug, programSlug) })
  if (!program) return null
  const cohort = await ensureUpcomingCohort(program.id, now)
  return { program, cohort }
}

/**
 * The join rule (P4, exactly this): if the latest cohort started ≤JOIN_GRACE_DAYS ago,
 * join it; otherwise join the next upcoming cohort (created on read when absent).
 */
async function selectJoinCohort(programId: string, now: Date): Promise<Cohort> {
  const graceStart = new Date(now.getTime() - JOIN_GRACE_DAYS * DAY_MS)
  const [running] = await db
    .select()
    .from(cohorts)
    .where(
      and(
        eq(cohorts.programId, programId),
        lte(cohorts.startsAt, now),
        gte(cohorts.startsAt, graceStart),
      ),
    )
    .orderBy(desc(cohorts.startsAt))
    .limit(1)
  if (running) return running
  return ensureUpcomingCohort(programId, now)
}

/**
 * Enroll a user into the free program's current-or-next cohort (source 'signup').
 * One row per user×program: re-join UPDATEs cohortId (TD-2); the join history lives on
 * the events spine as 'cohort_joined'. Also schedules the cohort drip sequence — this
 * call site is what keeps cohort drips gated behind the (cutover-flagged) join flow.
 * Returns null only when the program doesn't exist.
 */
export async function joinFreeCohort(
  userId: string,
  programSlug: string,
  now: Date = new Date(),
): Promise<{
  enrollment: typeof enrollments.$inferSelect
  cohort: Cohort
  createdEnrollment: boolean
} | null> {
  const program = await db.query.programs.findFirst({ where: eq(programs.slug, programSlug) })
  if (!program) return null

  const cohort = await selectJoinCohort(program.id, now)

  const existing = await db.query.enrollments.findFirst({
    where: and(eq(enrollments.userId, userId), eq(enrollments.programId, program.id)),
  })

  const enrollment = await grantEnrollment({
    userId,
    programId: program.id,
    cohortId: cohort.id,
    source: 'signup',
  })

  await record({
    name: 'cohort_joined',
    properties: { programId: program.id, cohortId: cohort.id },
    userId,
  })
  if (!existing) {
    await record({
      name: 'enrollment_created',
      properties: {
        enrollmentId: enrollment.id,
        programId: program.id,
        enrollmentSource: 'signup',
      },
      userId,
    })
  }

  await scheduleCohortDripSequence({ userId, cohortStartsAt: cohort.startsAt, now })

  return { enrollment, cohort, createdEnrollment: !existing }
}
