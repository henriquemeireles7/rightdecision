import { and, asc, desc, eq, gte, lt } from 'drizzle-orm'
import { computeFirstMonday, nextMonthOf } from '@/features/(shared)/scheduler/date-math'
import { COHORT_START_HOUR } from '@/features/(shared)/scheduler/jobs'
import { db } from '@/platform/db/client'
import { cohorts, programs } from '@/platform/db/schema'
import { env } from '@/platform/env'
import type { ErrorCode } from '@/platform/errors'

type ServiceError = { error: ErrorCode; details?: string }
type Cohort = typeof cohorts.$inferSelect

export type CohortsWhen = 'upcoming' | 'past' | 'all'

/** postgres-js surfaces unique violations as code 23505 (drizzle may wrap it in `cause`). */
function isUniqueViolation(error: unknown): boolean {
  const err = error as { code?: string; cause?: { code?: string } } | null
  return err?.code === '23505' || err?.cause?.code === '23505'
}

/** upcoming/past derives from startsAt vs now — cohorts have no status enum (TD-1). */
export async function listCohorts(
  programId: string,
  when: CohortsWhen = 'all',
  now: Date = new Date(),
): Promise<{ cohorts: Cohort[] } | ServiceError> {
  const program = await db.query.programs.findFirst({ where: eq(programs.id, programId) })
  if (!program) return { error: 'PROGRAM_NOT_FOUND' }

  const scope = eq(cohorts.programId, programId)
  const rows =
    when === 'upcoming'
      ? await db
          .select()
          .from(cohorts)
          .where(and(scope, gte(cohorts.startsAt, now)))
          .orderBy(asc(cohorts.startsAt))
      : when === 'past'
        ? await db
            .select()
            .from(cohorts)
            .where(and(scope, lt(cohorts.startsAt, now)))
            .orderBy(desc(cohorts.startsAt))
        : await db.select().from(cohorts).where(scope).orderBy(asc(cohorts.startsAt))
  return { cohorts: rows }
}

/**
 * Manual cohort creation (override). Refuses to collide with the cron's idempotency key
 * uniqueIndex(programId, startsAt) — the auto-created row is never silently replaced.
 */
export async function createCohort(input: {
  programId: string
  title: string
  startsAt: Date
  endsAt?: Date
}): Promise<{ cohort: Cohort } | ServiceError> {
  const program = await db.query.programs.findFirst({ where: eq(programs.id, input.programId) })
  if (!program) return { error: 'PROGRAM_NOT_FOUND' }

  const [cohort] = await db
    .insert(cohorts)
    .values(input)
    .onConflictDoNothing({ target: [cohorts.programId, cohorts.startsAt] })
    .returning()
  if (!cohort) {
    return {
      error: 'VALIDATION_ERROR',
      details: 'A cohort already exists for this program at this start time',
    }
  }
  return { cohort }
}

/** Edit a FUTURE cohort (date override). Started cohorts are a founder decision — refused. */
export async function updateCohort(
  cohortId: string,
  patch: { title?: string; startsAt?: Date; endsAt?: Date | null },
  now: Date = new Date(),
): Promise<{ cohort: Cohort } | ServiceError> {
  const cohort = await db.query.cohorts.findFirst({ where: eq(cohorts.id, cohortId) })
  if (!cohort) return { error: 'COHORT_NOT_FOUND' }
  if (cohort.startsAt <= now) {
    return {
      error: 'VALIDATION_ERROR',
      details: 'This cohort has already started — destructive edits need a founder decision',
    }
  }

  try {
    const [updated] = await db
      .update(cohorts)
      .set({ ...patch, updatedAt: now })
      .where(eq(cohorts.id, cohortId))
      .returning()
    if (!updated) return { error: 'COHORT_NOT_FOUND' }
    return { cohort: updated }
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        error: 'VALIDATION_ERROR',
        details: 'A cohort already exists for this program at this start time',
      }
    }
    throw error
  }
}

/**
 * The next N first-Monday instants — the SAME date math (and therefore the same UTC
 * instants) the auto-creation cron uses, so suggestions never drift from reality.
 */
export function suggestCohorts(
  months = 3,
  now: Date = new Date(),
): { suggestions: Array<{ startsAt: Date; title: string }> } {
  const suggestions: Array<{ startsAt: Date; title: string }> = []
  let { year, month } = nextMonthOf(now, env.COHORT_TIMEZONE)
  for (let i = 0; i < months; i++) {
    suggestions.push({
      startsAt: computeFirstMonday(year, month, env.COHORT_TIMEZONE, COHORT_START_HOUR),
      title: `Cohort ${year}-${String(month).padStart(2, '0')}`,
    })
    month += 1
    if (month > 12) {
      month = 1
      year += 1
    }
  }
  return { suggestions }
}
