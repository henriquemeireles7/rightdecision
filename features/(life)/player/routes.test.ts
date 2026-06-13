import { afterAll, describe, expect, mock, test } from 'bun:test'
import { and, eq } from 'drizzle-orm'
import { setV2CutoverOverrideForTests } from '@/platform/auth/enrollment'
import { events, lessonProgress } from '@/platform/db/schema'
import {
  createTestCourse,
  createTestEnrollment,
  createTestLesson,
  createTestModule,
  createTestProgram,
  createTestProgramCourse,
  createTestUser,
} from '@/platform/test/factories'
import { apiCall, assertError, assertSuccess, stubAuth } from '@/platform/test/helpers'
import { setupTestDb, teardownTestDb, testDb } from '@/platform/test/setup'
import * as realVideo from '@/providers/video'

const signPlaybackTokenMock = mock((_videoId: string) => Promise.resolve('signed-token'))
mock.module('@/providers/video', () => ({
  ...realVideo,
  signPlaybackToken: signPlaybackTokenMock,
}))
afterAll(() => {
  mock.module('@/providers/video', () => realVideo)
})

const { createPlayerRoutes } = await import('./routes')

await setupTestDb()
setV2CutoverOverrideForTests(true) // route gates run against enrollments, not legacy subs
afterAll(() => {
  setV2CutoverOverrideForTests(undefined)
  return teardownTestDb()
})

async function enrolledLesson() {
  const user = await createTestUser()
  const program = await createTestProgram()
  const course = await createTestCourse()
  await createTestProgramCourse(program!.id, course!.id)
  const courseModule = await createTestModule(course!.id)
  const lesson = await createTestLesson(courseModule!.id, {
    status: 'published',
    videoStatus: 'ready',
    streamVideoId: 'stream-video-id',
    durationSeconds: 600,
    captionsReady: true,
    decisionPrompt: 'What is the one decision?',
  })
  await createTestEnrollment(user!.id, program!.id)
  return { user: user!, program: program!, lesson: lesson! }
}

describe('integration: player routes', () => {
  test('GET /lessons/:id requires authentication', async () => {
    const app = createPlayerRoutes()

    assertError(
      await apiCall(app, 'GET', '/lessons/00000000-0000-4000-8000-000000000000'),
      'UNAUTHORIZED',
    )
  })

  test('GET /lessons/:id rejects invalid uuids with 400 before touching the db', async () => {
    const user = await createTestUser()
    const app = createPlayerRoutes({ auth: stubAuth(user!) })

    const response = await apiCall(app, 'GET', '/lessons/not-a-uuid')

    expect(response.status).toBe(400)
  })

  test('GET /lessons/:id is enrollment-gated', async () => {
    const stranger = await createTestUser()
    const { lesson } = await enrolledLesson()
    const app = createPlayerRoutes({ auth: stubAuth(stranger!) })

    assertError(await apiCall(app, 'GET', `/lessons/${lesson.id}`), 'ENROLLMENT_REQUIRED')
  })

  test('GET /lessons/:id returns the lesson payload with a signed token', async () => {
    const { user, lesson } = await enrolledLesson()
    const app = createPlayerRoutes({ auth: stubAuth(user) })

    const response = await apiCall(app, 'GET', `/lessons/${lesson.id}`)

    const data = assertSuccess(response) as { playbackToken: string; lesson: { id: string } }
    expect(data.playbackToken).toBe('signed-token')
    expect(data.lesson.id).toBe(lesson.id)
  })

  test('GET /lessons/:id for a nonexistent lesson resolves no program → 404', async () => {
    const user = await createTestUser()
    const app = createPlayerRoutes({ auth: stubAuth(user!) })

    assertError(
      await apiCall(app, 'GET', '/lessons/00000000-0000-4000-8000-000000000000'),
      'PROGRAM_NOT_FOUND',
    )
  })

  test('PUT /lessons/:id/progress upserts monotonic progress', async () => {
    const { user, lesson } = await enrolledLesson()
    const app = createPlayerRoutes({ auth: stubAuth(user) })

    assertSuccess(
      await apiCall(app, 'PUT', `/lessons/${lesson.id}/progress`, { secondsWatched: 90 }),
    )
    assertSuccess(
      await apiCall(app, 'PUT', `/lessons/${lesson.id}/progress`, { secondsWatched: 30 }),
    )

    const [row] = await testDb
      .select()
      .from(lessonProgress)
      .where(and(eq(lessonProgress.userId, user.id), eq(lessonProgress.lessonId, lesson.id)))
    expect(row?.secondsWatched).toBe(90)
  })

  test('PUT /lessons/:id/progress validates the body', async () => {
    const { user, lesson } = await enrolledLesson()
    const app = createPlayerRoutes({ auth: stubAuth(user) })

    const response = await apiCall(app, 'PUT', `/lessons/${lesson.id}/progress`, {
      secondsWatched: -5,
    })

    expect(response.status).toBe(400)
  })

  test('POST /lessons/:id/answer completes the lesson and records the decision', async () => {
    const { user, lesson } = await enrolledLesson()
    const app = createPlayerRoutes({ auth: stubAuth(user) })

    const response = await apiCall(app, 'POST', `/lessons/${lesson.id}/answer`, {
      answer: 'I will say no.',
    })

    const data = assertSuccess(response) as { completedAt: string; promptAnswer: string }
    expect(data.promptAnswer).toBe('I will say no.')
    expect(data.completedAt).toBeTruthy()

    const rows = await testDb
      .select()
      .from(events)
      .where(and(eq(events.userId, user.id), eq(events.name, 'decision_prompt_answered')))
    expect(rows.length).toBe(1)
  })
})
