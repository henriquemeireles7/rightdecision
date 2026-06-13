import { afterAll, beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test'

// Mock ONLY signature verification (needs the env secret); parsing stays real.
const actualVideo = await import('@/providers/video')
const mockVerify = mock(() => true)
mock.module('@/providers/video', () => ({
  ...actualVideo,
  verifyWebhookSignature: mockVerify,
}))

import { eq } from 'drizzle-orm'
import { lessons, lives } from '@/platform/db/schema'
import {
  createTestCourse,
  createTestLesson,
  createTestLive,
  createTestModule,
  createTestProgram,
} from '@/platform/test/factories'
import { setupTestDb, teardownTestDb, testDb } from '@/platform/test/setup'

const { handleStreamWebhook } = await import('./webhook')

function readyBody(uid: string, duration = 123.4) {
  return JSON.stringify({
    uid,
    readyToStream: true,
    status: { state: 'ready' },
    duration,
  })
}

function errorBody(uid: string) {
  return JSON.stringify({
    uid,
    readyToStream: false,
    status: { state: 'error', errorReasonCode: 'ERR_DURATION', errorReasonText: 'too long' },
  })
}

const SIG = 'time=1,sig1=ok'

describe('integration: stream webhook handler', () => {
  beforeAll(setupTestDb)
  afterAll(teardownTestDb)
  beforeEach(async () => {
    await teardownTestDb()
    mockVerify.mockClear()
    mockVerify.mockReturnValue(true)
  })

  it('rejects an invalid signature with STREAM_WEBHOOK_INVALID', async () => {
    mockVerify.mockReturnValueOnce(false)
    const result = await handleStreamWebhook(readyBody('sv-1'), 'time=1,sig1=bad')
    expect(result).toEqual({ error: 'STREAM_WEBHOOK_INVALID' })
  })

  it('rejects an unparseable body with VALIDATION_ERROR', async () => {
    const result = await handleStreamWebhook('not-json', SIG)
    expect(result).toMatchObject({ error: 'VALIDATION_ERROR' })
  })

  it('video.ready marks the lesson ready with duration', async () => {
    const course = await createTestCourse()
    const mod = await createTestModule(course!.id)
    const lesson = await createTestLesson(mod!.id, {
      streamVideoId: 'sv-1',
      videoStatus: 'processing',
    })

    const result = await handleStreamWebhook(readyBody('sv-1', 421.6), SIG)
    expect(result).toEqual({ received: true, lessonsUpdated: 1, livesUpdated: 0 })

    const [row] = await testDb.select().from(lessons).where(eq(lessons.id, lesson!.id))
    expect(row?.videoStatus).toBe('ready')
    expect(row?.durationSeconds).toBe(422)
  })

  it('video.ready delivered twice is idempotent (second delivery no-ops)', async () => {
    const course = await createTestCourse()
    const mod = await createTestModule(course!.id)
    const lesson = await createTestLesson(mod!.id, {
      streamVideoId: 'sv-2',
      videoStatus: 'uploading',
    })

    const first = await handleStreamWebhook(readyBody('sv-2'), SIG)
    const second = await handleStreamWebhook(readyBody('sv-2'), SIG)
    expect(first).toEqual({ received: true, lessonsUpdated: 1, livesUpdated: 0 })
    expect(second).toEqual({ received: true, lessonsUpdated: 0, livesUpdated: 0 })

    const [row] = await testDb.select().from(lessons).where(eq(lessons.id, lesson!.id))
    expect(row?.videoStatus).toBe('ready')
  })

  it('video.error marks the lesson errored', async () => {
    const course = await createTestCourse()
    const mod = await createTestModule(course!.id)
    const lesson = await createTestLesson(mod!.id, {
      streamVideoId: 'sv-3',
      videoStatus: 'uploading',
    })

    const result = await handleStreamWebhook(errorBody('sv-3'), SIG)
    expect(result).toEqual({ received: true, lessonsUpdated: 1, livesUpdated: 0 })
    const [row] = await testDb.select().from(lessons).where(eq(lessons.id, lesson!.id))
    expect(row?.videoStatus).toBe('error')
  })

  it('in-progress states move an uploading lesson to processing', async () => {
    const course = await createTestCourse()
    const mod = await createTestModule(course!.id)
    const lesson = await createTestLesson(mod!.id, {
      streamVideoId: 'sv-4',
      videoStatus: 'uploading',
    })

    const body = JSON.stringify({
      uid: 'sv-4',
      readyToStream: false,
      status: { state: 'inprogress' },
    })
    const result = await handleStreamWebhook(body, SIG)
    expect(result).toEqual({ received: true, lessonsUpdated: 1, livesUpdated: 0 })
    const [row] = await testDb.select().from(lessons).where(eq(lessons.id, lesson!.id))
    expect(row?.videoStatus).toBe('processing')

    // a ready lesson is never downgraded by a late in-progress event
    await handleStreamWebhook(readyBody('sv-4'), SIG)
    const late = await handleStreamWebhook(body, SIG)
    expect(late).toEqual({ received: true, lessonsUpdated: 0, livesUpdated: 0 })
  })

  it('video.ready flips a live replay from processing to ready (idempotent)', async () => {
    const program = await createTestProgram()
    const live = await createTestLive(program!.id, {
      replayStreamVideoId: 'sv-replay',
      replayStatus: 'processing',
    })

    const first = await handleStreamWebhook(readyBody('sv-replay'), SIG)
    const second = await handleStreamWebhook(readyBody('sv-replay'), SIG)
    expect(first).toEqual({ received: true, lessonsUpdated: 0, livesUpdated: 1 })
    expect(second).toEqual({ received: true, lessonsUpdated: 0, livesUpdated: 0 })

    const [row] = await testDb.select().from(lives).where(eq(lives.id, live!.id))
    expect(row?.replayStatus).toBe('ready')
  })

  it('video.error resets a processing replay to none so the admin can retry', async () => {
    const program = await createTestProgram()
    const live = await createTestLive(program!.id, {
      replayStreamVideoId: 'sv-replay-2',
      replayStatus: 'processing',
    })

    const result = await handleStreamWebhook(errorBody('sv-replay-2'), SIG)
    expect(result).toEqual({ received: true, lessonsUpdated: 0, livesUpdated: 1 })
    const [row] = await testDb.select().from(lives).where(eq(lives.id, live!.id))
    expect(row?.replayStatus).toBe('none')
  })

  it('acknowledges unknown stream video ids without touching anything', async () => {
    const result = await handleStreamWebhook(readyBody('sv-unknown'), SIG)
    expect(result).toEqual({ received: true, lessonsUpdated: 0, livesUpdated: 0 })
  })
})
