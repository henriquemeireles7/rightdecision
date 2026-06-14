import { afterAll, beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test'

const actualVideo = await import('@/providers/video')
const mockCreateTusUploadUrl = mock(() =>
  Promise.resolve({ uploadUrl: 'https://upload.test/replay', streamVideoId: 'sv-replay' }),
)
mock.module('@/providers/video', () => ({
  ...actualVideo,
  createTusUploadUrl: mockCreateTusUploadUrl,
}))

import { eq } from 'drizzle-orm'
import { lives } from '@/platform/db/schema'
import { createTestLive, createTestProgram } from '@/platform/test/factories'
import { setupTestDb, teardownTestDb, testDb } from '@/platform/test/setup'
import { ProviderError } from '@/providers/errors'

const { cancelLive, listLives, requestReplayUploadUrl, scheduleLive, updateLive } = await import(
  './service'
)

const MISSING_ID = '00000000-0000-0000-0000-000000000000'
const NOW = new Date('2026-06-12T12:00:00Z')
const FUTURE = new Date('2026-07-01T18:00:00Z')
const PAST = new Date('2026-05-01T18:00:00Z')

describe('integration: lives service', () => {
  beforeAll(setupTestDb)
  afterAll(teardownTestDb)
  beforeEach(async () => {
    await teardownTestDb()
    mockCreateTusUploadUrl.mockClear()
    mockCreateTusUploadUrl.mockResolvedValue({
      uploadUrl: 'https://upload.test/replay',
      streamVideoId: 'sv-replay',
    })
  })

  it('schedules a live scoped to a program', async () => {
    const program = await createTestProgram()
    const result = await scheduleLive({
      programId: program!.id,
      title: 'June Live',
      scheduledAt: FUTURE,
      youtubeUrl: 'https://youtube.com/watch?v=abc',
    })
    if ('error' in result) throw new Error(result.error)
    expect(result.live.programId).toBe(program!.id)
    expect(result.live.scheduledAt.toISOString()).toBe(FUTURE.toISOString())
    expect(result.live.replayStatus).toBe('none')
    expect(result.live.cancelledAt).toBeNull()
  })

  it('returns PROGRAM_NOT_FOUND scheduling against a missing program', async () => {
    expect(await scheduleLive({ programId: MISSING_ID, title: 'x', scheduledAt: FUTURE })).toEqual({
      error: 'PROGRAM_NOT_FOUND',
    })
  })

  it('lists upcoming and past lives derived from dates', async () => {
    const program = await createTestProgram()
    const past = await createTestLive(program!.id, { scheduledAt: PAST })
    const future = await createTestLive(program!.id, { scheduledAt: FUTURE })

    const upcoming = await listLives(program!.id, 'upcoming', NOW)
    if ('error' in upcoming) throw new Error(upcoming.error)
    expect(upcoming.lives.map((l) => l.id)).toEqual([future!.id])

    const pastResult = await listLives(program!.id, 'past', NOW)
    if ('error' in pastResult) throw new Error(pastResult.error)
    expect(pastResult.lives.map((l) => l.id)).toEqual([past!.id])

    const all = await listLives(program!.id, 'all', NOW)
    if ('error' in all) throw new Error(all.error)
    expect(all.lives).toHaveLength(2)

    expect(await listLives(MISSING_ID, 'all', NOW)).toEqual({ error: 'PROGRAM_NOT_FOUND' })
  })

  it('updates a live (reschedule + youtube url) without touching cancellation', async () => {
    const program = await createTestProgram()
    const live = await createTestLive(program!.id, { scheduledAt: FUTURE })

    const result = await updateLive(live!.id, {
      scheduledAt: new Date('2026-07-08T18:00:00Z'),
      youtubeUrl: 'https://youtube.com/watch?v=next',
      title: 'Rescheduled',
    })
    if ('error' in result) throw new Error(result.error)
    expect(result.live.title).toBe('Rescheduled')
    expect(result.live.youtubeUrl).toBe('https://youtube.com/watch?v=next')
    expect(result.live.cancelledAt).toBeNull()

    expect(await updateLive(MISSING_ID, { title: 'x' })).toEqual({ error: 'NOT_FOUND' })
  })

  it('cancels explicitly, idempotently, and never deletes', async () => {
    const program = await createTestProgram()
    const live = await createTestLive(program!.id, { scheduledAt: FUTURE })

    const first = await cancelLive(live!.id, NOW)
    if ('error' in first) throw new Error(first.error)
    expect(first.live.cancelledAt?.toISOString()).toBe(NOW.toISOString())

    const second = await cancelLive(live!.id, new Date('2026-06-13T00:00:00Z'))
    if ('error' in second) throw new Error(second.error)
    expect(second.live.cancelledAt?.toISOString()).toBe(NOW.toISOString())

    const rows = await testDb.select().from(lives).where(eq(lives.id, live!.id))
    expect(rows).toHaveLength(1)
    expect(await cancelLive(MISSING_ID, NOW)).toEqual({ error: 'NOT_FOUND' })
  })

  it('refuses to update or attach a replay to a cancelled live', async () => {
    const program = await createTestProgram()
    const live = await createTestLive(program!.id, { scheduledAt: FUTURE, cancelledAt: NOW })

    expect(await updateLive(live!.id, { title: 'x' })).toMatchObject({
      error: 'VALIDATION_ERROR',
    })
    expect(await requestReplayUploadUrl(live!.id, 1024)).toMatchObject({
      error: 'VALIDATION_ERROR',
    })
  })

  it('requests a replay tus upload URL and marks the replay processing', async () => {
    const program = await createTestProgram()
    const live = await createTestLive(program!.id, { scheduledAt: PAST })

    const result = await requestReplayUploadUrl(live!.id, 10_000_000)
    if ('error' in result) throw new Error(result.error)
    expect(result.uploadUrl).toBe('https://upload.test/replay')
    expect(result.streamVideoId).toBe('sv-replay')

    const [row] = await testDb.select().from(lives).where(eq(lives.id, live!.id))
    expect(row?.replayStreamVideoId).toBe('sv-replay')
    expect(row?.replayStatus).toBe('processing')

    expect(await requestReplayUploadUrl(MISSING_ID, 1024)).toEqual({ error: 'NOT_FOUND' })
  })

  it('maps replay tus failure to VIDEO_UPLOAD_FAILED and leaves the live untouched', async () => {
    mockCreateTusUploadUrl.mockRejectedValueOnce(
      new ProviderError('stream', 'createTusUploadUrl', 502, 'down') as never,
    )
    const program = await createTestProgram()
    const live = await createTestLive(program!.id, { scheduledAt: PAST })

    expect(await requestReplayUploadUrl(live!.id, 1024)).toMatchObject({
      error: 'VIDEO_UPLOAD_FAILED',
    })
    const [row] = await testDb.select().from(lives).where(eq(lives.id, live!.id))
    expect(row?.replayStatus).toBe('none')
    expect(row?.replayStreamVideoId).toBeNull()
  })
})
