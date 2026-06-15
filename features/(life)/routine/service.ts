import { and, asc, eq, gte, lte, type SQL } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/platform/db/client'
import { habitCadences, habitLogs, habits, lifeAreas } from '@/platform/db/schema'
import type { ErrorCode } from '@/platform/errors'
import { record } from '@/platform/events'

type ServiceError = { error: ErrorCode }
type Habit = typeof habits.$inferSelect
type HabitLog = typeof habitLogs.$inferSelect

// ─── Input contracts (owned here; routes import them for zValidator) ───
export const createHabitSchema = z.object({
  name: z.string().min(1).max(120),
  lifeArea: z.enum(lifeAreas).optional(),
  cadence: z.enum(habitCadences).optional(),
  intention: z.string().max(2000).optional(),
  sortOrder: z.number().int().min(0).optional(),
})
export const updateHabitSchema = createHabitSchema.extend({ isArchived: z.boolean() }).partial()

export const logHabitSchema = z.object({
  /** Calendar date ('YYYY-MM-DD') computed CLIENT-side in the user's zone. */
  logDate: z.iso.date(),
  done: z.boolean().optional(),
  note: z.string().max(2000).optional(),
})

export type CreateHabitInput = z.infer<typeof createHabitSchema>
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>
export type LogHabitInput = z.infer<typeof logHabitSchema>

/** postgres-js surfaces unique violations as code 23505 (drizzle may wrap it in `cause`). */
function isUniqueViolation(error: unknown): boolean {
  const err = error as { code?: string; cause?: { code?: string } } | null
  return err?.code === '23505' || err?.cause?.code === '23505'
}

/** A member's habits in board order; archived hidden unless asked for. */
export function listHabits(userId: string, opts: { includeArchived?: boolean } = {}) {
  const clauses: SQL[] = [eq(habits.userId, userId)]
  if (!opts.includeArchived) clauses.push(eq(habits.isArchived, false))
  return db
    .select()
    .from(habits)
    .where(and(...clauses))
    .orderBy(asc(habits.sortOrder), asc(habits.createdAt))
}

export async function createHabit(
  userId: string,
  input: CreateHabitInput,
): Promise<{ habit: Habit }> {
  const [habit] = await db
    .insert(habits)
    .values({ userId, ...input })
    .returning()
  return { habit: habit! }
}

/** Patch a member-owned habit (incl. archive). Wrong owner / missing → HABIT_NOT_FOUND. */
export async function updateHabit(
  userId: string,
  habitId: string,
  patch: UpdateHabitInput,
): Promise<{ habit: Habit } | ServiceError> {
  const [row] = await db
    .update(habits)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
    .returning()
  if (!row) return { error: 'HABIT_NOT_FOUND' }
  return { habit: row }
}

/** Delete a member-owned habit (cascade removes its logs). Missing → HABIT_NOT_FOUND. */
export async function deleteHabit(
  userId: string,
  habitId: string,
): Promise<{ id: string } | ServiceError> {
  const [row] = await db
    .delete(habits)
    .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
    .returning({ id: habits.id })
  if (!row) return { error: 'HABIT_NOT_FOUND' }
  return { id: row.id }
}

async function ownsHabit(userId: string, habitId: string): Promise<boolean> {
  const [habit] = await db
    .select({ id: habits.id })
    .from(habits)
    .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
    .limit(1)
  return Boolean(habit)
}

async function findLog(habitId: string, logDate: string): Promise<HabitLog | null> {
  const [log] = await db
    .select()
    .from(habitLogs)
    .where(and(eq(habitLogs.habitId, habitId), eq(habitLogs.logDate, logDate)))
    .limit(1)
  return log ?? null
}

/**
 * Log a habit for a calendar day (idempotent per date). First log of (habit, date) inserts and
 * records `habit_logged` in one transaction; a same-day re-log just updates done/note (no event).
 * Wrong owner / missing habit → HABIT_NOT_FOUND.
 */
export async function logHabit(
  userId: string,
  habitId: string,
  input: LogHabitInput,
): Promise<{ log: HabitLog; created: boolean } | ServiceError> {
  if (!(await ownsHabit(userId, habitId))) return { error: 'HABIT_NOT_FOUND' }

  const values = { done: input.done ?? true, note: input.note ?? null }

  const existing = await findLog(habitId, input.logDate)
  if (existing) {
    const [log] = await db
      .update(habitLogs)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(habitLogs.id, existing.id))
      .returning()
    return { log: log!, created: false }
  }

  try {
    return await db.transaction(async (tx) => {
      const [log] = await tx
        .insert(habitLogs)
        .values({ habitId, userId, logDate: input.logDate, ...values })
        .returning()
      // habitId + logDate ONLY — never the note (PII rule).
      await record(
        { name: 'habit_logged', properties: { habitId, logDate: input.logDate }, userId },
        tx,
      )
      return { log: log!, created: true }
    })
  } catch (error) {
    if (isUniqueViolation(error)) {
      // Race: a concurrent first-log won between our check and our insert — fall back to update.
      const raced = await findLog(habitId, input.logDate)
      if (raced) {
        const [log] = await db
          .update(habitLogs)
          .set({ ...values, updatedAt: new Date() })
          .where(eq(habitLogs.id, raced.id))
          .returning()
        return { log: log!, created: false }
      }
    }
    throw error
  }
}

/** Logs for a member-owned habit, optionally date-ranged, oldest first. Missing → HABIT_NOT_FOUND. */
export async function getHabitLogs(
  userId: string,
  habitId: string,
  range: { from?: string; to?: string } = {},
): Promise<{ logs: HabitLog[] } | ServiceError> {
  if (!(await ownsHabit(userId, habitId))) return { error: 'HABIT_NOT_FOUND' }

  const clauses: SQL[] = [eq(habitLogs.habitId, habitId)]
  if (range.from) clauses.push(gte(habitLogs.logDate, range.from))
  if (range.to) clauses.push(lte(habitLogs.logDate, range.to))

  const logs = await db
    .select()
    .from(habitLogs)
    .where(and(...clauses))
    .orderBy(asc(habitLogs.logDate))
  return { logs }
}
