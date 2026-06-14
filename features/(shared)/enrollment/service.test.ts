import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { eq } from 'drizzle-orm'
import { enrollments } from '@/platform/db/schema'
import {
  createTestCohort,
  createTestCourse,
  createTestEnrollment,
  createTestLesson,
  createTestLive,
  createTestMaterial,
  createTestModule,
  createTestProgram,
  createTestProgramCourse,
  createTestProgramMaterial,
  createTestUser,
} from '@/platform/test/factories'
import { setupTestDb, teardownTestDb, testDb } from '@/platform/test/setup'
import {
  canAccessLesson,
  canAccessLive,
  canAccessMaterial,
  getActiveEnrollment,
  grantEnrollment,
  hasActiveEnrollment,
  listEnrollments,
  revokeEnrollment,
} from './service'

const FUTURE = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
const PAST = new Date(Date.now() - 24 * 60 * 60 * 1000)

/** Build program → course → module → lesson chain and return the pieces. */
async function createLessonChain() {
  const program = await createTestProgram()
  const course = await createTestCourse()
  await createTestProgramCourse(program!.id, course!.id)
  const courseModule = await createTestModule(course!.id)
  const lesson = await createTestLesson(courseModule!.id)
  return { program: program!, course: course!, courseModule: courseModule!, lesson: lesson! }
}

describe('integration: enrollment service', () => {
  beforeAll(setupTestDb)
  afterAll(teardownTestDb)

  describe('grantEnrollment', () => {
    test('creates an active enrollment with defaults', async () => {
      const user = await createTestUser()
      const program = await createTestProgram()

      const enrollment = await grantEnrollment({
        userId: user!.id,
        programId: program!.id,
        source: 'signup',
      })

      expect(enrollment.userId).toBe(user!.id)
      expect(enrollment.programId).toBe(program!.id)
      expect(enrollment.status).toBe('active')
      expect(enrollment.cohortId).toBeNull()
      expect(enrollment.stripeSubscriptionId).toBeNull()
    })

    test('stores cohortId and stripeSubscriptionId when provided', async () => {
      const user = await createTestUser()
      const program = await createTestProgram()
      const cohort = await createTestCohort(program!.id)

      const enrollment = await grantEnrollment({
        userId: user!.id,
        programId: program!.id,
        cohortId: cohort!.id,
        source: 'purchase',
        stripeSubscriptionId: 'sub_test_grant',
      })

      expect(enrollment.cohortId).toBe(cohort!.id)
      expect(enrollment.source).toBe('purchase')
      expect(enrollment.stripeSubscriptionId).toBe('sub_test_grant')
    })

    test('re-enrollment into a later cohort UPDATEs cohortId — no duplicate row (TD-2)', async () => {
      const user = await createTestUser()
      const program = await createTestProgram()
      const firstCohort = await createTestCohort(program!.id)
      const laterCohort = await createTestCohort(program!.id, {
        startsAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      })

      const first = await grantEnrollment({
        userId: user!.id,
        programId: program!.id,
        cohortId: firstCohort!.id,
        source: 'signup',
      })
      const second = await grantEnrollment({
        userId: user!.id,
        programId: program!.id,
        cohortId: laterCohort!.id,
        source: 'signup',
      })

      expect(second.id).toBe(first.id)
      expect(second.cohortId).toBe(laterCohort!.id)

      const rows = await testDb.select().from(enrollments).where(eq(enrollments.userId, user!.id))
      expect(rows).toHaveLength(1)
    })

    test('re-grant reactivates a revoked enrollment', async () => {
      const user = await createTestUser()
      const program = await createTestProgram()
      await createTestEnrollment(user!.id, program!.id, { status: 'revoked' })

      const enrollment = await grantEnrollment({
        userId: user!.id,
        programId: program!.id,
        source: 'admin',
      })

      expect(enrollment.status).toBe('active')
    })

    test('rejects an invalid source', async () => {
      const user = await createTestUser()
      const program = await createTestProgram()

      expect(
        grantEnrollment({
          userId: user!.id,
          programId: program!.id,
          // @ts-expect-error — invalid source must fail Zod validation
          source: 'hacked',
        }),
      ).rejects.toThrow()
    })
  })

  describe('revokeEnrollment', () => {
    test('flips status to revoked', async () => {
      const user = await createTestUser()
      const program = await createTestProgram()
      await createTestEnrollment(user!.id, program!.id)

      const revoked = await revokeEnrollment(user!.id, program!.id)

      expect(revoked?.status).toBe('revoked')
      expect(await hasActiveEnrollment(user!.id, program!.id)).toBe(false)
    })

    test('returns null when no enrollment exists', async () => {
      const user = await createTestUser()
      const program = await createTestProgram()

      expect(await revokeEnrollment(user!.id, program!.id)).toBeNull()
    })
  })

  describe('listEnrollments', () => {
    test('returns only the given user enrollments', async () => {
      const user = await createTestUser()
      const otherUser = await createTestUser()
      const programA = await createTestProgram()
      const programB = await createTestProgram()
      await createTestEnrollment(user!.id, programA!.id)
      await createTestEnrollment(user!.id, programB!.id, { status: 'expired' })
      await createTestEnrollment(otherUser!.id, programA!.id)

      const list = await listEnrollments(user!.id)

      expect(list).toHaveLength(2)
      expect(list.every((e) => e.userId === user!.id)).toBe(true)
    })

    test('returns empty array for a user with no enrollments', async () => {
      const user = await createTestUser()
      expect(await listEnrollments(user!.id)).toEqual([])
    })
  })

  describe('hasActiveEnrollment / getActiveEnrollment', () => {
    test('true for an active enrollment', async () => {
      const user = await createTestUser()
      const program = await createTestProgram()
      await createTestEnrollment(user!.id, program!.id)

      expect(await hasActiveEnrollment(user!.id, program!.id)).toBe(true)
      expect((await getActiveEnrollment(user!.id, program!.id))?.programId).toBe(program!.id)
    })

    test('false for expired/revoked status and for past expiresAt', async () => {
      const user = await createTestUser()
      const expired = await createTestProgram()
      const revoked = await createTestProgram()
      const lapsed = await createTestProgram()
      const future = await createTestProgram()
      await createTestEnrollment(user!.id, expired!.id, { status: 'expired' })
      await createTestEnrollment(user!.id, revoked!.id, { status: 'revoked' })
      // Sweep has not run yet: status still 'active' but expiresAt passed
      await createTestEnrollment(user!.id, lapsed!.id, { expiresAt: PAST })
      await createTestEnrollment(user!.id, future!.id, { expiresAt: FUTURE })

      expect(await hasActiveEnrollment(user!.id, expired!.id)).toBe(false)
      expect(await hasActiveEnrollment(user!.id, revoked!.id)).toBe(false)
      expect(await hasActiveEnrollment(user!.id, lapsed!.id)).toBe(false)
      expect(await hasActiveEnrollment(user!.id, future!.id)).toBe(true)
      expect(await getActiveEnrollment(user!.id, lapsed!.id)).toBeNull()
    })
  })

  describe('canAccessLesson', () => {
    test('true for a free user in a cohort whose program includes the course', async () => {
      const { program, lesson } = await createLessonChain()
      const cohort = await createTestCohort(program.id)
      const user = await createTestUser()
      await createTestEnrollment(user!.id, program.id, { cohortId: cohort!.id })

      expect(await canAccessLesson(user!.id, lesson.id)).toBe(true)
    })

    test('true for a paid evergreen enrollment (null cohortId)', async () => {
      const { program, lesson } = await createLessonChain()
      const user = await createTestUser()
      await createTestEnrollment(user!.id, program.id, { source: 'purchase' })

      expect(await canAccessLesson(user!.id, lesson.id)).toBe(true)
    })

    test('false for expired, revoked, lapsed, and unenrolled users', async () => {
      const { program, lesson } = await createLessonChain()
      const expiredUser = await createTestUser()
      const revokedUser = await createTestUser()
      const lapsedUser = await createTestUser()
      const strangerUser = await createTestUser()
      await createTestEnrollment(expiredUser!.id, program.id, { status: 'expired' })
      await createTestEnrollment(revokedUser!.id, program.id, { status: 'revoked' })
      await createTestEnrollment(lapsedUser!.id, program.id, { expiresAt: PAST })

      expect(await canAccessLesson(expiredUser!.id, lesson.id)).toBe(false)
      expect(await canAccessLesson(revokedUser!.id, lesson.id)).toBe(false)
      expect(await canAccessLesson(lapsedUser!.id, lesson.id)).toBe(false)
      expect(await canAccessLesson(strangerUser!.id, lesson.id)).toBe(false)
    })

    test('false when enrolled in a different program that does not include the course', async () => {
      const { lesson } = await createLessonChain()
      const otherProgram = await createTestProgram()
      const user = await createTestUser()
      await createTestEnrollment(user!.id, otherProgram!.id)

      expect(await canAccessLesson(user!.id, lesson.id)).toBe(false)
    })
  })

  describe('canAccessMaterial', () => {
    test('true when enrolled in a program containing the material', async () => {
      const program = await createTestProgram()
      const material = await createTestMaterial()
      await createTestProgramMaterial(program!.id, material!.id)
      const user = await createTestUser()
      await createTestEnrollment(user!.id, program!.id)

      expect(await canAccessMaterial(user!.id, material!.id)).toBe(true)
    })

    test('false when not enrolled or enrollment inactive', async () => {
      const program = await createTestProgram()
      const material = await createTestMaterial()
      await createTestProgramMaterial(program!.id, material!.id)
      const stranger = await createTestUser()
      const revokedUser = await createTestUser()
      await createTestEnrollment(revokedUser!.id, program!.id, { status: 'revoked' })

      expect(await canAccessMaterial(stranger!.id, material!.id)).toBe(false)
      expect(await canAccessMaterial(revokedUser!.id, material!.id)).toBe(false)
    })
  })

  describe('canAccessLive', () => {
    test('true when enrolled in the live program', async () => {
      const program = await createTestProgram()
      const live = await createTestLive(program!.id)
      const user = await createTestUser()
      await createTestEnrollment(user!.id, program!.id)

      expect(await canAccessLive(user!.id, live!.id)).toBe(true)
    })

    test('false when not enrolled or enrollment inactive', async () => {
      const program = await createTestProgram()
      const live = await createTestLive(program!.id)
      const stranger = await createTestUser()
      const expiredUser = await createTestUser()
      await createTestEnrollment(expiredUser!.id, program!.id, { status: 'expired' })

      expect(await canAccessLive(stranger!.id, live!.id)).toBe(false)
      expect(await canAccessLive(expiredUser!.id, live!.id)).toBe(false)
    })
  })
})
