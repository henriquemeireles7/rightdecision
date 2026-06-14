import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { lessonProgress } from '@/platform/db/schema'
import {
  createTestCohort,
  createTestCourse,
  createTestEnrollment,
  createTestLesson,
  createTestModule,
  createTestProgram,
  createTestProgramCourse,
  createTestUser,
} from '@/platform/test/factories'
import { setupTestDb, teardownTestDb, testDb } from '@/platform/test/setup'
import { CONTINUE_WATCHING_LIMIT, getCatalog } from './service'

/** Full published program tree: program → course → module → ready lesson. */
async function buildProgramTree(overrides: { tier?: 'free' | 'paid' } = {}) {
  const program = await createTestProgram({ tier: overrides.tier ?? 'free' })
  const course = await createTestCourse()
  await createTestProgramCourse(program!.id, course!.id)
  const courseModule = await createTestModule(course!.id)
  const lesson = await createTestLesson(courseModule!.id, {
    status: 'published',
    videoStatus: 'ready',
    streamVideoId: 'stream-video',
    durationSeconds: 300,
    captionsReady: true,
    decisionPrompt: 'What will you decide?',
  })
  return { program: program!, course: course!, courseModule: courseModule!, lesson: lesson! }
}

async function createProgress(
  userId: string,
  lessonId: string,
  overrides: Partial<typeof lessonProgress.$inferInsert> = {},
) {
  const [row] = await testDb
    .insert(lessonProgress)
    .values({ userId, lessonId, secondsWatched: 30, lastWatchedAt: new Date(), ...overrides })
    .returning()
  return row!
}

describe('integration: catalog getCatalog', () => {
  beforeAll(setupTestDb)
  afterAll(teardownTestDb)

  test('free mid-cohort user: own program unlocked first, paid program locked', async () => {
    const user = await createTestUser()
    const free = await buildProgramTree({ tier: 'free' })
    const paid = await buildProgramTree({ tier: 'paid' })
    const cohort = await createTestCohort(free.program.id, {
      startsAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    })
    await createTestEnrollment(user!.id, free.program.id, { cohortId: cohort!.id })

    const catalog = await getCatalog(user!.id)

    const ids = catalog.programs.map((p) => p.id)
    expect(ids).toContain(free.program.id)
    expect(ids).toContain(paid.program.id)
    // Unlocked content comes FIRST (Lock-State UX)
    expect(ids.indexOf(free.program.id)).toBeLessThan(ids.indexOf(paid.program.id))

    const freeEntry = catalog.programs.find((p) => p.id === free.program.id)
    const paidEntry = catalog.programs.find((p) => p.id === paid.program.id)
    expect(freeEntry?.unlocked).toBe(true)
    expect(paidEntry?.unlocked).toBe(false)

    // Unlocked lessons carry full metadata
    const freeLesson = freeEntry?.courses[0]?.modules[0]?.lessons[0]
    expect(freeLesson).toMatchObject({
      id: free.lesson.id,
      title: free.lesson.title,
      durationSeconds: 300,
      videoStatus: 'ready',
    })

    // Mid-cohort (started in the past) — no pre-start state
    expect(catalog.cohortStartsAt).toBeNull()
    expect(freeEntry?.cohortStartsAt).toBeNull()
  })

  test('locked lessons expose ONLY id and title — never lesson content', async () => {
    const user = await createTestUser()
    const own = await buildProgramTree({ tier: 'free' })
    const locked = await buildProgramTree({ tier: 'paid' })
    await createTestEnrollment(user!.id, own.program.id)

    const catalog = await getCatalog(user!.id)
    const lockedEntry = catalog.programs.find((p) => p.id === locked.program.id)

    // Locked previews keep title/cover/description at course/module level
    expect(lockedEntry?.courses[0]?.title).toBe(locked.course.title)
    expect(lockedEntry?.courses[0]?.modules[0]?.title).toBe(locked.courseModule.title)

    const lockedLesson = lockedEntry?.courses[0]?.modules[0]?.lessons[0]
    expect(lockedLesson).toEqual({ id: locked.lesson.id, title: locked.lesson.title })
    expect(Object.keys(lockedLesson ?? {}).sort()).toEqual(['id', 'title'])
  })

  test('paid evergreen user (no cohort) sees all enrolled programs unlocked', async () => {
    const user = await createTestUser()
    const free = await buildProgramTree({ tier: 'free' })
    const paid = await buildProgramTree({ tier: 'paid' })
    await createTestEnrollment(user!.id, free.program.id)
    await createTestEnrollment(user!.id, paid.program.id, { source: 'purchase' })

    const catalog = await getCatalog(user!.id)

    expect(catalog.programs.find((p) => p.id === free.program.id)?.unlocked).toBe(true)
    expect(catalog.programs.find((p) => p.id === paid.program.id)?.unlocked).toBe(true)
    expect(catalog.cohortStartsAt).toBeNull()
  })

  test('expired and revoked enrollments render the program locked', async () => {
    const expiredUser = await createTestUser()
    const revokedUser = await createTestUser()
    const tree = await buildProgramTree()
    await createTestEnrollment(expiredUser!.id, tree.program.id, {
      expiresAt: new Date(Date.now() - 60_000),
    })
    await createTestEnrollment(revokedUser!.id, tree.program.id, { status: 'revoked' })

    const expiredCatalog = await getCatalog(expiredUser!.id)
    const revokedCatalog = await getCatalog(revokedUser!.id)

    expect(expiredCatalog.programs.find((p) => p.id === tree.program.id)?.unlocked).toBe(false)
    expect(revokedCatalog.programs.find((p) => p.id === tree.program.id)?.unlocked).toBe(false)
  })

  test('pre-start cohort: catalog returns cohortStartsAt for the welcome state', async () => {
    const user = await createTestUser()
    const tree = await buildProgramTree()
    const startsAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    const cohort = await createTestCohort(tree.program.id, { startsAt })
    await createTestEnrollment(user!.id, tree.program.id, { cohortId: cohort!.id })

    const catalog = await getCatalog(user!.id)

    expect(catalog.cohortStartsAt?.getTime()).toBe(startsAt.getTime())
    const entry = catalog.programs.find((p) => p.id === tree.program.id)
    expect(entry?.cohortStartsAt?.getTime()).toBe(startsAt.getTime())
    expect(entry?.unlocked).toBe(true)
  })

  test('draft content NEVER leaks — not in unlocked programs, not in locked previews', async () => {
    const user = await createTestUser()
    const own = await buildProgramTree()
    const locked = await buildProgramTree({ tier: 'paid' })
    await createTestEnrollment(user!.id, own.program.id)

    // Draft module + draft lesson in the user's own program
    const draftModule = await createTestModule(own.course.id, { status: 'draft', sortOrder: 1 })
    const draftLesson = await createTestLesson(own.courseModule.id, {
      status: 'draft',
      sortOrder: 1,
    })
    // Draft course mapped to the locked program
    const draftCourse = await createTestCourse({ status: 'draft' })
    await createTestProgramCourse(locked.program.id, draftCourse!.id, { sortOrder: 1 })
    // Draft lesson inside the locked program's published module
    const draftLockedLesson = await createTestLesson(locked.courseModule.id, {
      status: 'draft',
      sortOrder: 1,
    })
    // Draft program is invisible entirely
    const draftProgram = await createTestProgram({ status: 'draft' })

    const catalog = await getCatalog(user!.id)

    expect(catalog.programs.map((p) => p.id)).not.toContain(draftProgram!.id)

    const ownEntry = catalog.programs.find((p) => p.id === own.program.id)
    expect(ownEntry?.courses[0]?.modules.map((m) => m.id)).not.toContain(draftModule!.id)
    expect(ownEntry?.courses[0]?.modules[0]?.lessons.map((l) => l.id)).not.toContain(
      draftLesson!.id,
    )

    const lockedEntry = catalog.programs.find((p) => p.id === locked.program.id)
    expect(lockedEntry?.courses.map((course) => course.id)).not.toContain(draftCourse!.id)
    expect(lockedEntry?.courses[0]?.modules[0]?.lessons.map((l) => l.id)).not.toContain(
      draftLockedLesson!.id,
    )
  })

  test('unlocked lessons join the user lesson_progress rows', async () => {
    const user = await createTestUser()
    const tree = await buildProgramTree()
    await createTestEnrollment(user!.id, tree.program.id)
    const completedAt = new Date()
    await createProgress(user!.id, tree.lesson.id, { secondsWatched: 120, completedAt })

    const catalog = await getCatalog(user!.id)

    const lesson = catalog.programs.find((p) => p.id === tree.program.id)?.courses[0]?.modules[0]
      ?.lessons[0] as
      | { progress: { secondsWatched: number; completedAt: Date | null } | null }
      | undefined
    if (!lesson?.progress) throw new Error('expected an unlocked lesson with progress')
    expect(lesson.progress.secondsWatched).toBe(120)
    expect(lesson.progress.completedAt?.getTime()).toBe(completedAt.getTime())
  })

  test('continue-watching: most recent incomplete first; completed and unenrolled excluded', async () => {
    const user = await createTestUser()
    const tree = await buildProgramTree()
    await createTestEnrollment(user!.id, tree.program.id)
    const lessonB = await createTestLesson(tree.courseModule.id, {
      status: 'published',
      sortOrder: 1,
    })
    const lessonC = await createTestLesson(tree.courseModule.id, {
      status: 'published',
      sortOrder: 2,
    })
    const otherTree = await buildProgramTree({ tier: 'paid' }) // NOT enrolled

    await createProgress(user!.id, tree.lesson.id, {
      secondsWatched: 10,
      lastWatchedAt: new Date(Date.now() - 3_000),
    })
    await createProgress(user!.id, lessonB!.id, {
      secondsWatched: 20,
      lastWatchedAt: new Date(Date.now() - 1_000),
    })
    await createProgress(user!.id, lessonC!.id, {
      secondsWatched: 30,
      lastWatchedAt: new Date(),
      completedAt: new Date(), // completed → excluded
    })
    await createProgress(user!.id, otherTree.lesson.id, {
      secondsWatched: 40,
      lastWatchedAt: new Date(), // unenrolled program → excluded
    })

    const catalog = await getCatalog(user!.id)

    expect(catalog.continueWatching.map((item) => item.lessonId)).toEqual([
      lessonB!.id,
      tree.lesson.id,
    ])
    expect(catalog.continueWatching[0]).toMatchObject({ secondsWatched: 20 })
    expect(catalog.continueWatching.length).toBeLessThanOrEqual(CONTINUE_WATCHING_LIMIT)
  })

  test('continue-watching excludes draft lessons', async () => {
    const user = await createTestUser()
    const tree = await buildProgramTree()
    await createTestEnrollment(user!.id, tree.program.id)
    const draftLesson = await createTestLesson(tree.courseModule.id, {
      status: 'draft',
      sortOrder: 1,
    })
    await createProgress(user!.id, draftLesson!.id, { lastWatchedAt: new Date() })

    const catalog = await getCatalog(user!.id)

    expect(catalog.continueWatching.map((item) => item.lessonId)).not.toContain(draftLesson!.id)
  })

  test('user with no enrollments: everything locked, empty continue-watching', async () => {
    const user = await createTestUser()
    const tree = await buildProgramTree()

    const catalog = await getCatalog(user!.id)

    expect(catalog.programs.find((p) => p.id === tree.program.id)?.unlocked).toBe(false)
    expect(catalog.continueWatching).toEqual([])
    expect(catalog.cohortStartsAt).toBeNull()
  })
})
