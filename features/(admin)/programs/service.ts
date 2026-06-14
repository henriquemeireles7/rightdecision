import { and, asc, eq } from 'drizzle-orm'
import { db } from '@/platform/db/client'
import { courses, programCourses, programs } from '@/platform/db/schema'
import type { ErrorCode } from '@/platform/errors'

type ServiceError = { error: ErrorCode; details?: string }
type Program = typeof programs.$inferSelect
type Course = typeof courses.$inferSelect
type ProgramCourse = typeof programCourses.$inferSelect

/** postgres-js surfaces unique violations as code 23505 (drizzle may wrap it in `cause`). */
function isUniqueViolation(error: unknown): boolean {
  const err = error as { code?: string; cause?: { code?: string } } | null
  return err?.code === '23505' || err?.cause?.code === '23505'
}

export async function createProgram(input: {
  slug: string
  name: string
  description?: string
  tier: 'free' | 'paid'
}): Promise<{ program: Program } | ServiceError> {
  try {
    const [program] = await db.insert(programs).values(input).returning()
    if (!program) return { error: 'INTERNAL_ERROR' }
    return { program }
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        error: 'VALIDATION_ERROR',
        details: `A program with slug "${input.slug}" already exists`,
      }
    }
    throw error
  }
}

export async function listPrograms(): Promise<{ programs: Program[] }> {
  const rows = await db.select().from(programs).orderBy(asc(programs.createdAt))
  return { programs: rows }
}

export async function getProgram(
  programId: string,
): Promise<{ program: Program; courses: Array<Course & { sortOrder: number }> } | ServiceError> {
  const program = await db.query.programs.findFirst({ where: eq(programs.id, programId) })
  if (!program) return { error: 'PROGRAM_NOT_FOUND' }

  const rows = await db
    .select({ course: courses, sortOrder: programCourses.sortOrder })
    .from(programCourses)
    .innerJoin(courses, eq(programCourses.courseId, courses.id))
    .where(eq(programCourses.programId, programId))
    .orderBy(asc(programCourses.sortOrder))
  return { program, courses: rows.map((row) => ({ ...row.course, sortOrder: row.sortOrder })) }
}

export async function updateProgram(
  programId: string,
  patch: {
    slug?: string
    name?: string
    description?: string | null
    tier?: 'free' | 'paid'
    status?: 'draft' | 'active' | 'archived'
  },
): Promise<{ program: Program } | ServiceError> {
  try {
    const [program] = await db
      .update(programs)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(programs.id, programId))
      .returning()
    if (!program) return { error: 'PROGRAM_NOT_FOUND' }
    return { program }
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        error: 'VALIDATION_ERROR',
        details: `A program with slug "${patch.slug}" already exists`,
      }
    }
    throw error
  }
}

// ─── program_courses mapping (changes member access — eng-schema table 4) ───

export async function addCourseToProgram(
  programId: string,
  courseId: string,
  sortOrder?: number,
): Promise<{ mapping: ProgramCourse } | ServiceError> {
  const program = await db.query.programs.findFirst({ where: eq(programs.id, programId) })
  if (!program) return { error: 'PROGRAM_NOT_FOUND' }
  const course = await db.query.courses.findFirst({ where: eq(courses.id, courseId) })
  if (!course) return { error: 'COURSE_NOT_FOUND' }

  const siblings = await db
    .select({ sortOrder: programCourses.sortOrder })
    .from(programCourses)
    .where(eq(programCourses.programId, programId))
  const nextSortOrder =
    sortOrder ?? siblings.reduce((max, row) => Math.max(max, row.sortOrder + 1), 0)

  // Idempotent: re-adding an existing pair no-ops on the unique index.
  const [inserted] = await db
    .insert(programCourses)
    .values({ programId, courseId, sortOrder: nextSortOrder })
    .onConflictDoNothing({ target: [programCourses.programId, programCourses.courseId] })
    .returning()
  if (inserted) return { mapping: inserted }

  const existing = await db.query.programCourses.findFirst({
    where: and(eq(programCourses.programId, programId), eq(programCourses.courseId, courseId)),
  })
  if (!existing) return { error: 'INTERNAL_ERROR' }
  return { mapping: existing }
}

export async function removeCourseFromProgram(
  programId: string,
  courseId: string,
): Promise<{ removed: true } | ServiceError> {
  const removed = await db
    .delete(programCourses)
    .where(and(eq(programCourses.programId, programId), eq(programCourses.courseId, courseId)))
    .returning({ id: programCourses.id })
  if (removed.length === 0) return { error: 'NOT_FOUND' }
  return { removed: true }
}

/** sortOrder = array index; courseIds must exactly match the program's current courses. */
export async function reorderProgramCourses(
  programId: string,
  courseIds: string[],
): Promise<{ mappings: ProgramCourse[] } | ServiceError> {
  const program = await db.query.programs.findFirst({ where: eq(programs.id, programId) })
  if (!program) return { error: 'PROGRAM_NOT_FOUND' }

  const existing = await db
    .select({ courseId: programCourses.courseId })
    .from(programCourses)
    .where(eq(programCourses.programId, programId))
  const existingIds = new Set(existing.map((row) => row.courseId))
  const requested = new Set(courseIds)
  if (existingIds.size !== requested.size || ![...existingIds].every((id) => requested.has(id))) {
    return {
      error: 'VALIDATION_ERROR',
      details: 'courseIds must contain exactly the ids of this program’s courses',
    }
  }

  await db.transaction(async (tx) => {
    for (const [index, courseId] of courseIds.entries()) {
      await tx
        .update(programCourses)
        .set({ sortOrder: index, updatedAt: new Date() })
        .where(and(eq(programCourses.programId, programId), eq(programCourses.courseId, courseId)))
    }
  })
  const mappings = await db
    .select()
    .from(programCourses)
    .where(eq(programCourses.programId, programId))
    .orderBy(asc(programCourses.sortOrder))
  return { mappings }
}
