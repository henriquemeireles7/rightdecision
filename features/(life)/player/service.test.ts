import { afterAll, beforeEach, describe, expect, mock, test } from 'bun:test'
import { and, eq } from 'drizzle-orm'
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
import { setupTestDb, teardownTestDb, testDb } from '@/platform/test/setup'
import { ProviderError } from '@/providers/errors'
import * as realVideo from '@/providers/video'

// Repo provider-mocking pattern: mock.module BEFORE dynamically importing the
// service, restore the real module in afterAll so later-loaded tests are unaffected.
const signPlaybackTokenMock = mock((_videoId: string) => Promise.resolve('signed-token'))
mock.module('@/providers/video', () => ({
  ...realVideo,
  signPlaybackToken: signPlaybackTokenMock,
}))
afterAll(() => {
  mock.module('@/providers/video', () => realVideo)
})

const { answerDecisionPrompt, getLesson, programIdsForLesson, saveProgress, upsertLessonProgress } =
  await import('./service')

await setupTestDb()
afterAll(teardownTestDb)

async function buildLesson(lessonOverrides: Parameters<typeof createTestLesson>[1] = {}) {
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
    ...lessonOverrides,
  })
  return { program: program!, course: course!, courseModule: courseModule!, lesson: lesson! }
}

async function enrolledLesson(lessonOverrides: Parameters<typeof createTestLesson>[1] = {}) {
  const user = await createTestUser()
  const tree = await buildLesson(lessonOverrides)
  await createTestEnrollment(user!.id, tree.program.id)
  return { user: user!, ...tree }
}

async function eventRows(userId: string, name: string) {
  return testDb
    .select()
    .from(events)
    .where(and(eq(events.userId, userId), eq(events.name, name)))
}

async function progressRow(userId: string, lessonId: string) {
  const [row] = await testDb
    .select()
    .from(lessonProgress)
    .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, lessonId)))
    .limit(1)
  return row ?? null
}

describe('integration: player getLesson', () => {
  beforeEach(() => {
    signPlaybackTokenMock.mockClear()
    signPlaybackTokenMock.mockImplementation(() => Promise.resolve('signed-token'))
  })

  test('returns metadata + signed playback token + decision prompt for an enrolled user', async () => {
    const { user, lesson } = await enrolledLesson()

    const result = await getLesson(user.id, lesson.id)

    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.data.playbackToken).toBe('signed-token')
    expect(signPlaybackTokenMock).toHaveBeenCalledWith('stream-video-id')
    expect(result.data.streamVideoId).toBe('stream-video-id')
    expect(result.data.lesson).toMatchObject({
      id: lesson.id,
      title: lesson.title,
      durationSeconds: 600,
      captionsReady: true,
      decisionPrompt: 'What is the one decision?',
    })
    expect(result.data.promptAnswer).toBeNull()
    expect(result.data.progress?.secondsWatched).toBe(0)
  })

  test("records 'lesson_started' once — idempotent via lesson_progress existence", async () => {
    const { user, lesson } = await enrolledLesson()

    await getLesson(user.id, lesson.id)
    await getLesson(user.id, lesson.id)

    const started = await eventRows(user.id, 'lesson_started')
    expect(started.length).toBe(1)
    expect(started[0]?.properties).toEqual({ lessonId: lesson.id })
    const rows = await testDb
      .select()
      .from(lessonProgress)
      .where(eq(lessonProgress.userId, user.id))
    expect(rows.length).toBe(1)
  })

  test('VIDEO_NOT_READY when the video is processing or has no stream id', async () => {
    const processing = await enrolledLesson({ videoStatus: 'processing' })
    const missingId = await enrolledLesson({ videoStatus: 'ready', streamVideoId: null })

    expect(await getLesson(processing.user.id, processing.lesson.id)).toEqual({
      error: 'VIDEO_NOT_READY',
    })
    expect(await getLesson(missingId.user.id, missingId.lesson.id)).toEqual({
      error: 'VIDEO_NOT_READY',
    })
    expect(signPlaybackTokenMock).not.toHaveBeenCalled()
  })

  test('ENROLLMENT_REQUIRED without an active enrollment (none / expired)', async () => {
    const stranger = await createTestUser()
    const expired = await createTestUser()
    const tree = await buildLesson()
    await createTestEnrollment(expired!.id, tree.program.id, {
      expiresAt: new Date(Date.now() - 60_000),
    })

    expect(await getLesson(stranger!.id, tree.lesson.id)).toEqual({
      error: 'ENROLLMENT_REQUIRED',
    })
    expect(await getLesson(expired!.id, tree.lesson.id)).toEqual({ error: 'ENROLLMENT_REQUIRED' })
  })

  test('LESSON_NOT_FOUND for draft lessons, draft modules, and unknown ids', async () => {
    const draft = await enrolledLesson({ status: 'draft' })
    expect(await getLesson(draft.user.id, draft.lesson.id)).toEqual({ error: 'LESSON_NOT_FOUND' })

    // Published lesson inside a DRAFT module is not playable either
    const hidden = await enrolledLesson()
    const draftModule = await createTestModule(hidden.course.id, { status: 'draft', sortOrder: 1 })
    const lessonInDraftModule = await createTestLesson(draftModule!.id, { status: 'published' })
    expect(await getLesson(hidden.user.id, lessonInDraftModule!.id)).toEqual({
      error: 'LESSON_NOT_FOUND',
    })

    const user = await createTestUser()
    expect(await getLesson(user!.id, '00000000-0000-4000-8000-000000000000')).toEqual({
      error: 'LESSON_NOT_FOUND',
    })
  })

  test('token signing failure propagates and records NO lesson_started', async () => {
    const { user, lesson } = await enrolledLesson()
    signPlaybackTokenMock.mockImplementation(() => {
      throw new ProviderError('stream', 'signPlaybackToken', 500, 'no key configured')
    })

    await expect(getLesson(user.id, lesson.id)).rejects.toBeInstanceOf(ProviderError)

    expect(await eventRows(user.id, 'lesson_started')).toEqual([])
    expect(await progressRow(user.id, lesson.id)).toBeNull()
  })

  test('returns the existing prompt answer when the user already answered', async () => {
    const { user, lesson } = await enrolledLesson()
    await answerDecisionPrompt(user.id, lesson.id, 'I will quit the job.')

    const result = await getLesson(user.id, lesson.id)

    if ('error' in result) throw new Error(`unexpected error ${result.error}`)
    expect(result.data.promptAnswer).toBe('I will quit the job.')
    expect(result.data.progress?.completedAt).toBeInstanceOf(Date)
  })
})

describe('integration: player saveProgress (monotonic)', () => {
  test('secondsWatched never decreases', async () => {
    const { user, lesson } = await enrolledLesson()

    await saveProgress(user.id, lesson.id, 120)
    const after120 = await progressRow(user.id, lesson.id)
    expect(after120?.secondsWatched).toBe(120)
    expect(after120?.durationSeconds).toBe(600) // denormalized at write

    await saveProgress(user.id, lesson.id, 60) // out-of-order — must NOT rewind
    expect((await progressRow(user.id, lesson.id))?.secondsWatched).toBe(120)

    await saveProgress(user.id, lesson.id, 180)
    expect((await progressRow(user.id, lesson.id))?.secondsWatched).toBe(180)
  })

  test('lastWatchedAt is monotonic too', async () => {
    const { user, lesson } = await enrolledLesson()
    const future = new Date(Date.now() + 60_000)
    await upsertLessonProgress(user.id, lesson.id, {
      secondsWatched: 30,
      durationSeconds: 600,
      watchedAt: future,
    })

    await saveProgress(user.id, lesson.id, 45) // now() < future

    const row = await progressRow(user.id, lesson.id)
    expect(row?.lastWatchedAt.getTime()).toBe(future.getTime())
    expect(row?.secondsWatched).toBe(45)
  })

  test('LESSON_NOT_FOUND for unknown lessons, ENROLLMENT_REQUIRED without access', async () => {
    const user = await createTestUser()
    expect(await saveProgress(user!.id, '00000000-0000-4000-8000-000000000000', 10)).toEqual({
      error: 'LESSON_NOT_FOUND',
    })

    const tree = await buildLesson()
    expect(await saveProgress(user!.id, tree.lesson.id, 10)).toEqual({
      error: 'ENROLLMENT_REQUIRED',
    })
  })
})

describe('integration: player answerDecisionPrompt (ADR 1 — one transaction)', () => {
  test('sets completedAt + promptAnswer and records the decision event', async () => {
    const { user, lesson } = await enrolledLesson()

    const result = await answerDecisionPrompt(user.id, lesson.id, 'I decide to move out.')

    if ('error' in result) throw new Error(`unexpected error ${result.error}`)
    expect(result.data.completedAt).toBeInstanceOf(Date)
    expect(result.data.promptAnswer).toBe('I decide to move out.')

    const row = await progressRow(user.id, lesson.id)
    expect(row?.completedAt).toBeInstanceOf(Date)
    expect(row?.promptAnswer).toBe('I decide to move out.')

    const decisionEvents = await eventRows(user.id, 'decision_prompt_answered')
    expect(decisionEvents.length).toBe(1)
    expect(decisionEvents[0]).toMatchObject({
      isDecision: true,
      decisionKind: 'lesson_prompt',
      properties: { lessonId: lesson.id },
    })
    // The answer TEXT never reaches the spine (PII)
    expect(JSON.stringify(decisionEvents[0]?.properties)).not.toContain('I decide to move out.')
  })

  test('re-answering updates the answer, keeps the original completedAt, no double event', async () => {
    const { user, lesson } = await enrolledLesson()
    const first = await answerDecisionPrompt(user.id, lesson.id, 'First answer')
    if ('error' in first) throw new Error('unexpected error')

    const second = await answerDecisionPrompt(user.id, lesson.id, 'Second answer')

    if ('error' in second) throw new Error('unexpected error')
    expect(second.data.promptAnswer).toBe('Second answer')
    expect(second.data.completedAt?.getTime()).toBe(first.data.completedAt?.getTime())
    expect((await eventRows(user.id, 'decision_prompt_answered')).length).toBe(1)
  })

  test('ROLLBACK: a failing decision event aborts the completion (all-or-nothing)', async () => {
    const { user, lesson } = await enrolledLesson()
    await saveProgress(user.id, lesson.id, 90) // pre-existing progress row

    const failingRecord = () => Promise.reject(new Error('spine write failed'))
    await expect(
      answerDecisionPrompt(user.id, lesson.id, 'Doomed answer', { record: failingRecord }),
    ).rejects.toThrow('spine write failed')

    const row = await progressRow(user.id, lesson.id)
    expect(row?.completedAt).toBeNull()
    expect(row?.promptAnswer).toBeNull()
    expect(row?.secondsWatched).toBe(90) // untouched
    expect(await eventRows(user.id, 'decision_prompt_answered')).toEqual([])
  })

  test('LESSON_NOT_FOUND / ENROLLMENT_REQUIRED guards', async () => {
    const user = await createTestUser()
    expect(
      await answerDecisionPrompt(user!.id, '00000000-0000-4000-8000-000000000000', 'x'),
    ).toEqual({ error: 'LESSON_NOT_FOUND' })

    const tree = await buildLesson()
    expect(await answerDecisionPrompt(user!.id, tree.lesson.id, 'x')).toEqual({
      error: 'ENROLLMENT_REQUIRED',
    })

    // A lesson without a decision prompt cannot be answered
    const noPrompt = await enrolledLesson({ decisionPrompt: null })
    expect(await answerDecisionPrompt(noPrompt.user.id, noPrompt.lesson.id, 'x')).toEqual({
      error: 'LESSON_NOT_FOUND',
    })
  })
})

describe('integration: programIdsForLesson', () => {
  test('returns every program containing the lesson; [] for unknown ids', async () => {
    const tree = await buildLesson()
    const secondProgram = await createTestProgram({ tier: 'paid' })
    await createTestProgramCourse(secondProgram!.id, tree.course.id)

    const ids = await programIdsForLesson(tree.lesson.id)
    expect(ids.sort()).toEqual([tree.program.id, secondProgram!.id].sort())

    expect(await programIdsForLesson('00000000-0000-4000-8000-000000000000')).toEqual([])
  })
})
