import { afterAll, beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test'

const actualVideo = await import('@/providers/video')
const mockVerify = mock(() => true)
mock.module('@/providers/video', () => ({
  ...actualVideo,
  verifyWebhookSignature: mockVerify,
}))

import { eq } from 'drizzle-orm'
import { lessons } from '@/platform/db/schema'
import { createTestCourse, createTestLesson, createTestModule } from '@/platform/test/factories'
import { assertError } from '@/platform/test/helpers'
import { setupTestDb, teardownTestDb, testDb } from '@/platform/test/setup'

const { streamWebhookRoutes } = await import('./webhook-routes')

async function postWebhook(body: string, signature?: string) {
  const response = await streamWebhookRoutes.fetch(
    new Request('http://localhost/', {
      method: 'POST',
      headers: signature ? { 'Webhook-Signature': signature } : {},
      body,
    }),
  )
  return { status: response.status, body: (await response.json()) as unknown }
}

describe('integration: stream webhook route', () => {
  beforeAll(setupTestDb)
  afterAll(teardownTestDb)
  beforeEach(async () => {
    await teardownTestDb()
    mockVerify.mockClear()
    mockVerify.mockReturnValue(true)
  })

  it('401 STREAM_WEBHOOK_INVALID when the signature fails verification', async () => {
    mockVerify.mockReturnValueOnce(false)
    const res = await postWebhook(JSON.stringify({ uid: 'x' }), 'time=1,sig1=bad')
    assertError(res, 'STREAM_WEBHOOK_INVALID')
  })

  it('processes video.ready and is idempotent across re-deliveries', async () => {
    const course = await createTestCourse()
    const mod = await createTestModule(course!.id)
    const lesson = await createTestLesson(mod!.id, {
      streamVideoId: 'sv-hook',
      videoStatus: 'processing',
    })
    const body = JSON.stringify({
      uid: 'sv-hook',
      readyToStream: true,
      status: { state: 'ready' },
      duration: 60,
    })

    const first = await postWebhook(body, 'time=1,sig1=ok')
    expect(first.status).toBe(200)
    expect(first.body).toMatchObject({ ok: true, data: { lessonsUpdated: 1 } })

    const second = await postWebhook(body, 'time=1,sig1=ok')
    expect(second.body).toMatchObject({ ok: true, data: { lessonsUpdated: 0 } })

    const [row] = await testDb.select().from(lessons).where(eq(lessons.id, lesson!.id))
    expect(row?.videoStatus).toBe('ready')
    expect(row?.durationSeconds).toBe(60)
  })

  it('400 VALIDATION_ERROR for an unparseable payload', async () => {
    const res = await postWebhook('}{', 'time=1,sig1=ok')
    expect(res.status).toBe(400)
    expect(res.body).toMatchObject({ ok: false, code: 'VALIDATION_ERROR' })
  })
})
