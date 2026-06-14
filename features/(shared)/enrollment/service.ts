import { and, eq, gt, isNull, or, type SQL } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/platform/db/client'
import {
  enrollments,
  lessons,
  lives,
  modules,
  programCourses,
  programMaterials,
} from '@/platform/db/schema'

/**
 * THE access predicate (eng-schema table 3): an enrollment grants access only while
 * status='active' AND not past expiresAt. Never trust status alone between expiry sweeps.
 * Exported for member-facing read models (catalog/lives/materials) that join content
 * down to active enrollments — never re-implement this clause.
 */
export function activeEnrollmentClause(): SQL {
  const clause = and(
    eq(enrollments.status, 'active'),
    or(isNull(enrollments.expiresAt), gt(enrollments.expiresAt, new Date())),
  )
  // and() with non-empty args always returns SQL
  return clause as SQL
}

export const grantEnrollmentInput = z.object({
  userId: z.string().uuid(),
  programId: z.string().uuid(),
  cohortId: z.string().uuid().optional(),
  source: z.enum(enrollments.source.enumValues),
  stripeSubscriptionId: z.string().min(1).optional(),
})

export type GrantEnrollmentInput = z.infer<typeof grantEnrollmentInput>

/**
 * Upsert against enrollments(userId, programId) unique — one row per user per program.
 * Re-enrollment into a later cohort UPDATEs cohortId (TD-2; cohort-join history belongs
 * to the events spine as 'cohort_joined'). Re-granting reactivates expired/revoked rows.
 */
export async function grantEnrollment(input: GrantEnrollmentInput) {
  const data = grantEnrollmentInput.parse(input)
  const values = {
    userId: data.userId,
    programId: data.programId,
    cohortId: data.cohortId ?? null,
    source: data.source,
    stripeSubscriptionId: data.stripeSubscriptionId ?? null,
  }
  const [enrollment] = await db
    .insert(enrollments)
    .values(values)
    .onConflictDoUpdate({
      target: [enrollments.userId, enrollments.programId],
      set: {
        cohortId: values.cohortId,
        source: values.source,
        stripeSubscriptionId: values.stripeSubscriptionId,
        status: 'active',
        updatedAt: new Date(),
      },
    })
    .returning()
  // Insert ... returning always yields exactly one row
  return enrollment as typeof enrollments.$inferSelect
}

/** Flip the user's enrollment in a program to 'revoked'. Returns null if none exists. */
export async function revokeEnrollment(userId: string, programId: string) {
  const [enrollment] = await db
    .update(enrollments)
    .set({ status: 'revoked', updatedAt: new Date() })
    .where(and(eq(enrollments.userId, userId), eq(enrollments.programId, programId)))
    .returning()
  return enrollment ?? null
}

/** All enrollments for a user (any status), newest first. */
export async function listEnrollments(userId: string) {
  return db
    .select()
    .from(enrollments)
    .where(eq(enrollments.userId, userId))
    .orderBy(enrollments.createdAt)
}

/** The user's active (and unexpired) enrollment for a program, or null. */
export async function getActiveEnrollment(userId: string, programId: string) {
  const [enrollment] = await db
    .select()
    .from(enrollments)
    .where(
      and(
        eq(enrollments.userId, userId),
        eq(enrollments.programId, programId),
        activeEnrollmentClause(),
      ),
    )
    .limit(1)
  return enrollment ?? null
}

export async function hasActiveEnrollment(userId: string, programId: string): Promise<boolean> {
  return (await getActiveEnrollment(userId, programId)) !== null
}

/**
 * ONE indexed join: lessons → modules → program_courses (on courseId) → enrollments
 * (on programId + userId + active). True if ANY program containing the lesson's course
 * has an active enrollment for the user.
 */
export async function canAccessLesson(userId: string, lessonId: string): Promise<boolean> {
  const rows = await db
    .select({ enrollmentId: enrollments.id })
    .from(lessons)
    .innerJoin(modules, eq(modules.id, lessons.moduleId))
    .innerJoin(programCourses, eq(programCourses.courseId, modules.courseId))
    .innerJoin(
      enrollments,
      and(
        eq(enrollments.programId, programCourses.programId),
        eq(enrollments.userId, userId),
        activeEnrollmentClause(),
      ),
    )
    .where(eq(lessons.id, lessonId))
    .limit(1)
  return rows.length > 0
}

/** Analogous to canAccessLesson via program_materials. */
export async function canAccessMaterial(userId: string, materialId: string): Promise<boolean> {
  const rows = await db
    .select({ enrollmentId: enrollments.id })
    .from(programMaterials)
    .innerJoin(
      enrollments,
      and(
        eq(enrollments.programId, programMaterials.programId),
        eq(enrollments.userId, userId),
        activeEnrollmentClause(),
      ),
    )
    .where(eq(programMaterials.materialId, materialId))
    .limit(1)
  return rows.length > 0
}

/** Analogous to canAccessLesson via lives.programId. */
export async function canAccessLive(userId: string, liveId: string): Promise<boolean> {
  const rows = await db
    .select({ enrollmentId: enrollments.id })
    .from(lives)
    .innerJoin(
      enrollments,
      and(
        eq(enrollments.programId, lives.programId),
        eq(enrollments.userId, userId),
        activeEnrollmentClause(),
      ),
    )
    .where(eq(lives.id, liveId))
    .limit(1)
  return rows.length > 0
}
