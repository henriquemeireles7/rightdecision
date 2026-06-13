import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { and, eq } from 'drizzle-orm'
import { events } from '@/platform/db/schema'
import {
  createTestCourse,
  createTestLesson,
  createTestModule,
  createTestProgram,
  createTestProgramCourse,
  createTestUser,
} from '@/platform/test/factories'
import { apiCall, assertError, assertSuccess, stubAuth } from '@/platform/test/helpers'
import { setupTestDb, teardownTestDb, testDb } from '@/platform/test/setup'
import { createWatchEventsRoutes, WATCH_EVENTS_RATE_LIMIT_PER_MINUTE } from './routes'

describe('integration: watch-events routes', () => {
  beforeAll(setupTestDb)
  afterAll(teardownTestDb)

  async function buildLesson() {
    const program = await createTestProgram()
    const course = await createTestCourse()
    await createTestProgramCourse(program!.id, course!.id)
    const courseModule = await createTestModule(course!.id)
    const lesson = await createTestLesson(courseModule!.id, {
      status: 'published',
      durationSeconds: 600,
    })
    return lesson!
  }

  test('POST / requires authentication', async () => {
    const app = createWatchEventsRoutes()

    assertError(await apiCall(app, 'POST', '/', { events: [] }), 'UNAUTHORIZED')
  })

  test('POST / ingests a valid batch', async () => {
    const user = await createTestUser()
    const lesson = await buildLesson()
    const app = createWatchEventsRoutes({ auth: stubAuth(user!) })

    const response = await apiCall(app, 'POST', '/', {
      events: [
        { lessonId: lesson.id, secondsWatched: 30 },
        { lessonId: lesson.id, secondsWatched: 60 },
      ],
    })

    const data = assertSuccess(response) as { tracked: number; progressUpdated: number }
    expect(data.tracked).toBe(2)
    expect(data.progressUpdated).toBe(1)

    const rows = await testDb
      .select()
      .from(events)
      .where(and(eq(events.userId, user!.id), eq(events.name, 'watch_heartbeat')))
    expect(rows.length).toBe(2)
  })

  test('POST / rejects invalid payloads with EVENT_INVALID', async () => {
    const user = await createTestUser()
    const app = createWatchEventsRoutes({ auth: stubAuth(user!) })

    assertError(await apiCall(app, 'POST', '/', { events: [] }), 'EVENT_INVALID')
    assertError(
      await apiCall(app, 'POST', '/', {
        events: [{ lessonId: 'not-a-uuid', secondsWatched: 30 }],
      }),
      'EVENT_INVALID',
    )
    assertError(await apiCall(app, 'POST', '/', { nope: true }), 'EVENT_INVALID')
  })

  test('POST / is rate-limited per user', async () => {
    const user = await createTestUser()
    const lesson = await buildLesson()
    const app = createWatchEventsRoutes({ auth: stubAuth(user!) })
    const body = { events: [{ lessonId: lesson.id, secondsWatched: 1 }] }

    for (let i = 0; i < WATCH_EVENTS_RATE_LIMIT_PER_MINUTE; i++) {
      assertSuccess(await apiCall(app, 'POST', '/', body))
    }

    assertError(await apiCall(app, 'POST', '/', body), 'RATE_LIMITED')
  })
})
