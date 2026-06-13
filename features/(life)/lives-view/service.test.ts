import { afterAll, beforeEach, describe, expect, mock, test } from 'bun:test'
import { and, eq } from 'drizzle-orm'
import { events } from '@/platform/db/schema'
import {
  createTestEnrollment,
  createTestLive,
  createTestProgram,
  createTestUser,
} from '@/platform/test/factories'
import { setupTestDb, teardownTestDb, testDb } from '@/platform/test/setup'
import * as realVideo from '@/providers/video'

const signPlaybackTokenMock = mock((_videoId: string) => Promise.resolve('replay-token'))
mock.module('@/providers/video', () => ({
  ...realVideo,
  signPlaybackToken: signPlaybackTokenMock,
}))
afterAll(() => {
  mock.module('@/providers/video', () => realVideo)
})

const { deriveLiveState, getLive, getLiveReplay, listLives, programIdForLive } = await import(
  './service'
)

await setupTestDb()
afterAll(teardownTestDb)

const NOW = new Date('2026-06-12T15:00:00Z')
const PAST = new Date('2026-06-12T14:00:00Z')
const FUTURE = new Date('2026-06-13T15:00:00Z')

async function eventRows(userId: string, name: string) {
  return testDb
    .select()
    .from(events)
    .where(and(eq(events.userId, userId), eq(events.name, name)))
}

describe('lives-view deriveLiveState (fixtures)', () => {
  const base = {
    scheduledAt: FUTURE,
    cancelledAt: null,
    replayStatus: 'none' as const,
    replayStreamVideoId: null,
  }

  test('upcoming: scheduled in the future', () => {
    expect(deriveLiveState(base, NOW)).toBe('upcoming')
  })

  test('live-now: scheduled time passed, no ready replay', () => {
    expect(deriveLiveState({ ...base, scheduledAt: PAST }, NOW)).toBe('live-now')
    expect(deriveLiveState({ ...base, scheduledAt: PAST, replayStatus: 'processing' }, NOW)).toBe(
      'live-now',
    )
  })

  test('replay-ready: requires replayStatus ready AND a stream video id', () => {
    expect(
      deriveLiveState(
        { ...base, scheduledAt: PAST, replayStatus: 'ready', replayStreamVideoId: 'replay-vid' },
        NOW,
      ),
    ).toBe('replay-ready')
    // ready status without a video id is NOT replay-ready
    expect(deriveLiveState({ ...base, scheduledAt: PAST, replayStatus: 'ready' }, NOW)).toBe(
      'live-now',
    )
  })

  test('cancelled wins over every other state', () => {
    expect(
      deriveLiveState(
        {
          scheduledAt: PAST,
          cancelledAt: PAST,
          replayStatus: 'ready',
          replayStreamVideoId: 'replay-vid',
        },
        NOW,
      ),
    ).toBe('cancelled')
    expect(deriveLiveState({ ...base, cancelledAt: PAST }, NOW)).toBe('cancelled')
  })
})

describe('integration: lives-view listLives', () => {
  test('returns the enrolled programs lives with derived states, cancelled included', async () => {
    const user = await createTestUser()
    const program = await createTestProgram()
    const otherProgram = await createTestProgram()
    await createTestEnrollment(user!.id, program!.id)

    const upcoming = await createTestLive(program!.id, { scheduledAt: FUTURE })
    const replay = await createTestLive(program!.id, {
      scheduledAt: PAST,
      replayStatus: 'ready',
      replayStreamVideoId: 'replay-vid',
    })
    const cancelled = await createTestLive(program!.id, {
      scheduledAt: FUTURE,
      cancelledAt: NOW,
    })
    const foreign = await createTestLive(otherProgram!.id, { scheduledAt: FUTURE })

    const lives = await listLives(user!.id, NOW)

    const byId = new Map(lives.map((live) => [live.id, live]))
    expect(byId.get(upcoming!.id)?.state).toBe('upcoming')
    expect(byId.get(replay!.id)?.state).toBe('replay-ready')
    expect(byId.get(cancelled!.id)?.state).toBe('cancelled') // never silently skipped
    expect(byId.has(foreign!.id)).toBe(false)

    // Sorted by scheduledAt ascending
    expect(lives.map((live) => live.scheduledAt.getTime())).toEqual(
      [...lives.map((live) => live.scheduledAt.getTime())].sort((a, b) => a - b),
    )
  })

  test('expired enrollment sees no lives', async () => {
    const user = await createTestUser()
    const program = await createTestProgram()
    await createTestEnrollment(user!.id, program!.id, {
      expiresAt: new Date(Date.now() - 60_000),
    })
    await createTestLive(program!.id, { scheduledAt: FUTURE })

    expect(await listLives(user!.id, NOW)).toEqual([])
  })
})

describe('integration: lives-view getLive', () => {
  test("records 'live_viewed' when fetching a live-now live", async () => {
    const user = await createTestUser()
    const program = await createTestProgram()
    await createTestEnrollment(user!.id, program!.id)
    const live = await createTestLive(program!.id, {
      scheduledAt: PAST,
      youtubeUrl: 'https://youtube.com/live/x',
    })

    const result = await getLive(user!.id, live!.id, NOW)

    if ('error' in result) throw new Error(`unexpected error ${result.error}`)
    expect(result.data.state).toBe('live-now')
    expect(result.data.youtubeUrl).toBe('https://youtube.com/live/x')
    expect((await eventRows(user!.id, 'live_viewed')).length).toBe(1)
  })

  test('upcoming fetch records nothing', async () => {
    const user = await createTestUser()
    const program = await createTestProgram()
    await createTestEnrollment(user!.id, program!.id)
    const live = await createTestLive(program!.id, { scheduledAt: FUTURE })

    const result = await getLive(user!.id, live!.id, NOW)

    if ('error' in result) throw new Error(`unexpected error ${result.error}`)
    expect(result.data.state).toBe('upcoming')
    expect(await eventRows(user!.id, 'live_viewed')).toEqual([])
  })

  test('NOT_FOUND for unknown ids, ENROLLMENT_REQUIRED without access', async () => {
    const user = await createTestUser()
    expect(await getLive(user!.id, '00000000-0000-4000-8000-000000000000', NOW)).toEqual({
      error: 'NOT_FOUND',
    })

    const program = await createTestProgram()
    const live = await createTestLive(program!.id, { scheduledAt: FUTURE })
    expect(await getLive(user!.id, live!.id, NOW)).toEqual({ error: 'ENROLLMENT_REQUIRED' })
  })
})

describe('integration: lives-view getLiveReplay', () => {
  beforeEach(() => {
    signPlaybackTokenMock.mockClear()
  })

  test("signs a replay token and records 'replay_watched'", async () => {
    const user = await createTestUser()
    const program = await createTestProgram()
    await createTestEnrollment(user!.id, program!.id)
    const live = await createTestLive(program!.id, {
      scheduledAt: PAST,
      replayStatus: 'ready',
      replayStreamVideoId: 'replay-vid',
    })

    const result = await getLiveReplay(user!.id, live!.id, NOW)

    if ('error' in result) throw new Error(`unexpected error ${result.error}`)
    expect(result.data.playbackToken).toBe('replay-token')
    expect(signPlaybackTokenMock).toHaveBeenCalledWith('replay-vid')
    expect((await eventRows(user!.id, 'replay_watched')).length).toBe(1)
  })

  test('PLAYBACK_UNAVAILABLE when signing throws — clean 503, no event', async () => {
    const user = await createTestUser()
    const program = await createTestProgram()
    await createTestEnrollment(user!.id, program!.id)
    const live = await createTestLive(program!.id, {
      scheduledAt: PAST,
      replayStatus: 'ready',
      replayStreamVideoId: 'replay-vid',
    })

    signPlaybackTokenMock.mockImplementationOnce(() =>
      Promise.reject(new Error('signing key not configured')),
    )
    const result = await getLiveReplay(user!.id, live!.id, NOW)
    expect(result).toEqual({ error: 'PLAYBACK_UNAVAILABLE' })
    expect(await eventRows(user!.id, 'replay_watched')).toEqual([])
  })

  test('VIDEO_NOT_READY for processing and cancelled replays — no token, no event', async () => {
    const user = await createTestUser()
    const program = await createTestProgram()
    await createTestEnrollment(user!.id, program!.id)
    const processing = await createTestLive(program!.id, {
      scheduledAt: PAST,
      replayStatus: 'processing',
    })
    const cancelled = await createTestLive(program!.id, {
      scheduledAt: PAST,
      replayStatus: 'ready',
      replayStreamVideoId: 'replay-vid',
      cancelledAt: PAST,
    })

    expect(await getLiveReplay(user!.id, processing!.id, NOW)).toEqual({
      error: 'VIDEO_NOT_READY',
    })
    expect(await getLiveReplay(user!.id, cancelled!.id, NOW)).toEqual({
      error: 'VIDEO_NOT_READY',
    })
    expect(signPlaybackTokenMock).not.toHaveBeenCalled()
    expect(await eventRows(user!.id, 'replay_watched')).toEqual([])
  })

  test('NOT_FOUND / ENROLLMENT_REQUIRED guards', async () => {
    const user = await createTestUser()
    expect(await getLiveReplay(user!.id, '00000000-0000-4000-8000-000000000000', NOW)).toEqual({
      error: 'NOT_FOUND',
    })

    const program = await createTestProgram()
    const live = await createTestLive(program!.id, {
      scheduledAt: PAST,
      replayStatus: 'ready',
      replayStreamVideoId: 'replay-vid',
    })
    expect(await getLiveReplay(user!.id, live!.id, NOW)).toEqual({
      error: 'ENROLLMENT_REQUIRED',
    })
  })
})

describe('integration: programIdForLive', () => {
  test('resolves the lives program; null for unknown ids', async () => {
    const program = await createTestProgram()
    const live = await createTestLive(program!.id)

    expect(await programIdForLive(live!.id)).toBe(program!.id)
    expect(await programIdForLive('00000000-0000-4000-8000-000000000000')).toBeNull()
  })
})
