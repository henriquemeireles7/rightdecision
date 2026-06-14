import { afterAll, beforeAll, describe, expect, mock, test } from 'bun:test'
import { and, eq } from 'drizzle-orm'
import { events, lessonProgress } from '@/platform/db/schema'
import {
  createTestCourse,
  createTestLesson,
  createTestModule,
  createTestProgram,
  createTestProgramCourse,
  createTestUser,
} from '@/platform/test/factories'
import { setupTestDb, teardownTestDb, testDb } from '@/platform/test/setup'
import { ingestWatchEvents, watchEventsBatchSchema } from './service'

describe('integration: watch-events ingestWatchEvents', () => {
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

  async function progressRow(userId: string, lessonId: string) {
    const [row] = await testDb
      .select()
      .from(lessonProgress)
      .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, lessonId)))
    return row ?? null
  }

  test('tracks every heartbeat to the events spine', async () => {
    const user = await createTestUser()
    const lesson = await buildLesson()

    const result = await ingestWatchEvents(user!.id, [
      { lessonId: lesson.id, secondsWatched: 30 },
      { lessonId: lesson.id, secondsWatched: 60 },
    ])

    expect(result.tracked).toBe(2)
    const rows = await testDb
      .select()
      .from(events)
      .where(and(eq(events.userId, user!.id), eq(events.name, 'watch_heartbeat')))
    expect(rows.length).toBe(2)
    expect(rows.every((row) => row.isDecision === false)).toBe(true)
  })

  test('folds the batch into ONE upsert per lesson at the max position', async () => {
    const user = await createTestUser()
    const lessonA = await buildLesson()
    const lessonB = await buildLesson()
    const upsertCalls = mock(() => {})

    const result = await ingestWatchEvents(
      user!.id,
      [
        { lessonId: lessonA.id, secondsWatched: 30 },
        { lessonId: lessonA.id, secondsWatched: 90 },
        { lessonId: lessonA.id, secondsWatched: 60 }, // out of order
        { lessonId: lessonB.id, secondsWatched: 45 },
      ],
      { onUpsert: upsertCalls },
    )

    expect(result.progressUpdated).toBe(2)
    expect(upsertCalls).toHaveBeenCalledTimes(2) // single upsert per lesson per batch
    expect((await progressRow(user!.id, lessonA.id))?.secondsWatched).toBe(90)
    expect((await progressRow(user!.id, lessonA.id))?.durationSeconds).toBe(600)
    expect((await progressRow(user!.id, lessonB.id))?.secondsWatched).toBe(45)
  })

  test('fold is monotonic against existing progress', async () => {
    const user = await createTestUser()
    const lesson = await buildLesson()
    await testDb.insert(lessonProgress).values({
      userId: user!.id,
      lessonId: lesson.id,
      secondsWatched: 120,
      lastWatchedAt: new Date(),
    })

    await ingestWatchEvents(user!.id, [{ lessonId: lesson.id, secondsWatched: 90 }])

    expect((await progressRow(user!.id, lesson.id))?.secondsWatched).toBe(120)
  })

  test('unknown lesson ids are tracked but skipped in the fold (no crash)', async () => {
    const user = await createTestUser()
    const ghostLessonId = '00000000-0000-4000-8000-000000000000'

    const result = await ingestWatchEvents(user!.id, [
      { lessonId: ghostLessonId, secondsWatched: 10 },
    ])

    expect(result.tracked).toBe(1)
    expect(result.progressUpdated).toBe(0)
    expect(await progressRow(user!.id, ghostLessonId)).toBeNull()
  })

  test('occurredAt folds into lastWatchedAt at the latest timestamp', async () => {
    const user = await createTestUser()
    const lesson = await buildLesson()
    const earlier = new Date(Date.now() - 60_000)
    const later = new Date(Date.now() - 30_000)

    await ingestWatchEvents(user!.id, [
      { lessonId: lesson.id, secondsWatched: 30, occurredAt: later },
      { lessonId: lesson.id, secondsWatched: 20, occurredAt: earlier },
    ])

    expect((await progressRow(user!.id, lesson.id))?.lastWatchedAt.getTime()).toBe(later.getTime())
  })
})

describe('watch-events batch schema (taxonomy boundary)', () => {
  test('accepts a valid batch and rejects malformed heartbeats', () => {
    const valid = watchEventsBatchSchema.safeParse({
      events: [{ lessonId: '00000000-0000-4000-8000-000000000000', secondsWatched: 30 }],
    })
    expect(valid.success).toBe(true)

    expect(watchEventsBatchSchema.safeParse({ events: [] }).success).toBe(false)
    expect(
      watchEventsBatchSchema.safeParse({
        events: [{ lessonId: 'nope', secondsWatched: 30 }],
      }).success,
    ).toBe(false)
    expect(
      watchEventsBatchSchema.safeParse({
        events: [{ lessonId: '00000000-0000-4000-8000-000000000000', secondsWatched: -1 }],
      }).success,
    ).toBe(false)
  })
})
