import {
  cohorts,
  courses,
  enrollments,
  lessons,
  lives,
  materials,
  modules,
  onboardingProfiles,
  pipelineRuns,
  platformAccounts,
  programCourses,
  programMaterials,
  programs,
  sessions,
  subscriptions,
  users,
  wins,
} from '@/platform/db/schema'
import { testDb } from './setup'

let counter = 0
function nextId() {
  counter++
  return counter
}

export async function createTestUser(overrides: Partial<typeof users.$inferInsert> = {}) {
  const n = nextId()
  const [user] = await testDb
    .insert(users)
    .values({
      email: `test-${n}@example.com`,
      name: `Test User ${n}`,
      role: 'free',
      ...overrides,
    })
    .returning()
  return user
}

export async function createTestSession(userId: string) {
  const [session] = await testDb
    .insert(sessions)
    .values({
      userId,
      token: `test-session-${nextId()}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })
    .returning()
  return session
}

export async function createTestSubscription(
  userId: string,
  overrides: Partial<typeof subscriptions.$inferInsert> = {},
) {
  const n = nextId()
  const [subscription] = await testDb
    .insert(subscriptions)
    .values({
      userId,
      stripeCustomerId: `cus_test_${n}`,
      stripeSubscriptionId: `sub_test_${n}`,
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      ...overrides,
    })
    .returning()
  return subscription
}

export async function createTestWin(
  userId: string,
  overrides: Partial<typeof wins.$inferInsert> = {},
) {
  const [win] = await testDb
    .insert(wins)
    .values({
      userId,
      lifeArea: 'career',
      description: `Test win ${nextId()}`,
      ...overrides,
    })
    .returning()
  return win
}

export async function createTestOnboardingProfile(
  userId: string,
  overrides: Partial<typeof onboardingProfiles.$inferInsert> = {},
) {
  const [profile] = await testDb
    .insert(onboardingProfiles)
    .values({
      userId,
      throughlineQ1: 'Test answer 1',
      throughlineQ2: 'Test answer 2',
      throughlineQ3: 'Test answer 3',
      throughlineNamed: 'Test throughline',
      ...overrides,
    })
    .returning()
  return profile
}

export async function createTestPipelineRun(
  overrides: Partial<typeof pipelineRuns.$inferInsert> = {},
) {
  const [run] = await testDb
    .insert(pipelineRuns)
    .values({
      inputVideoUrl: `https://storage.example.com/test-${nextId()}.mp4`,
      status: 'queued',
      ...overrides,
    })
    .returning()
  return run
}

// ─── Platform V2 factories (programs → courses → modules → lessons + enrollments) ───

export async function createTestProgram(overrides: Partial<typeof programs.$inferInsert> = {}) {
  const n = nextId()
  const [program] = await testDb
    .insert(programs)
    .values({
      slug: `test-program-${n}`,
      name: `Test Program ${n}`,
      tier: 'free',
      status: 'active',
      ...overrides,
    })
    .returning()
  return program
}

export async function createTestCohort(
  programId: string,
  overrides: Partial<typeof cohorts.$inferInsert> = {},
) {
  const n = nextId()
  const [cohort] = await testDb
    .insert(cohorts)
    .values({
      programId,
      title: `Test Cohort ${n}`,
      startsAt: new Date(),
      ...overrides,
    })
    .returning()
  return cohort
}

export async function createTestCourse(overrides: Partial<typeof courses.$inferInsert> = {}) {
  const n = nextId()
  const [course] = await testDb
    .insert(courses)
    .values({
      slug: `test-course-${n}`,
      title: `Test Course ${n}`,
      status: 'published',
      ...overrides,
    })
    .returning()
  return course
}

export async function createTestProgramCourse(
  programId: string,
  courseId: string,
  overrides: Partial<typeof programCourses.$inferInsert> = {},
) {
  const [programCourse] = await testDb
    .insert(programCourses)
    .values({ programId, courseId, sortOrder: 0, ...overrides })
    .returning()
  return programCourse
}

export async function createTestModule(
  courseId: string,
  overrides: Partial<typeof modules.$inferInsert> = {},
) {
  const n = nextId()
  const [courseModule] = await testDb
    .insert(modules)
    .values({
      courseId,
      title: `Test Module ${n}`,
      sortOrder: 0,
      status: 'published',
      ...overrides,
    })
    .returning()
  return courseModule
}

export async function createTestLesson(
  moduleId: string,
  overrides: Partial<typeof lessons.$inferInsert> = {},
) {
  const n = nextId()
  const [lesson] = await testDb
    .insert(lessons)
    .values({
      moduleId,
      title: `Test Lesson ${n}`,
      sortOrder: 0,
      ...overrides,
    })
    .returning()
  return lesson
}

export async function createTestEnrollment(
  userId: string,
  programId: string,
  overrides: Partial<typeof enrollments.$inferInsert> = {},
) {
  const [enrollment] = await testDb
    .insert(enrollments)
    .values({
      userId,
      programId,
      status: 'active',
      source: 'signup',
      ...overrides,
    })
    .returning()
  return enrollment
}

export async function createTestMaterial(overrides: Partial<typeof materials.$inferInsert> = {}) {
  const n = nextId()
  const [material] = await testDb
    .insert(materials)
    .values({
      title: `Test Material ${n}`,
      fileKey: `materials/test-${n}.pdf`,
      ...overrides,
    })
    .returning()
  return material
}

export async function createTestProgramMaterial(
  programId: string,
  materialId: string,
  overrides: Partial<typeof programMaterials.$inferInsert> = {},
) {
  const [programMaterial] = await testDb
    .insert(programMaterials)
    .values({ programId, materialId, ...overrides })
    .returning()
  return programMaterial
}

export async function createTestLive(
  programId: string,
  overrides: Partial<typeof lives.$inferInsert> = {},
) {
  const n = nextId()
  const [live] = await testDb
    .insert(lives)
    .values({
      programId,
      title: `Test Live ${n}`,
      scheduledAt: new Date(),
      ...overrides,
    })
    .returning()
  return live
}

export async function createTestPlatformAccount(
  overrides: Partial<typeof platformAccounts.$inferInsert> = {},
) {
  const n = nextId()
  const [account] = await testDb
    .insert(platformAccounts)
    .values({
      platform: 'tiktok',
      accountHandle: `@test_account_${n}`,
      accountType: 'brand',
      ...overrides,
    })
    .returning()
  return account
}
