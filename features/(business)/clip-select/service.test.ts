import { describe, it, expect, mock, beforeEach } from 'bun:test'

mock.module('@/platform/env', () => ({
  env: { DATABASE_URL: 'postgres://test' },
}))

const mockFindFirst = mock(() => Promise.resolve(null))
const mockDelete = mock(() => ({ where: () => Promise.resolve() }))
const mockInsertReturning = mock(() => Promise.resolve([
  { id: 'clip-1', pipelineRunId: 'run-1', sourceTimestampStart: 10, sourceTimestampEnd: 40, duration: 30, score: 8 },
]))
const mockUpdateSet = mock(() => ({ where: () => Promise.resolve() }))

mock.module('@/platform/db/client', () => ({
  db: {
    query: {
      pipelineRuns: { findFirst: () => mockFindFirst() },
    },
    update: () => ({ set: (data: unknown) => ({ where: () => Promise.resolve() }) }),
    delete: () => ({ where: () => Promise.resolve() }),
    insert: () => ({ values: () => ({ returning: () => mockInsertReturning() }) }),
  },
}))

mock.module('@/platform/db/schema', () => ({
  users: {}, sessions: {}, accounts: {}, verifications: {},
  purchases: {}, subscriptions: {}, courseProgress: {},
  onboardingSessions: {}, onboardingProfiles: {},
  wins: {}, bookmarks: {},
  platformAccounts: { id: 'id', platform: 'platform' },
  pipelineRuns: { id: 'id', status: 'status', createdAt: 'created_at', inputVideoUrl: 'input_video_url' },
  clips: { id: 'id', pipelineRunId: 'pipeline_run_id', approved: 'approved', sourceTimestampStart: 'source_timestamp_start' },
  posts: { id: 'id', status: 'status', clipId: 'clip_id', platformAccountId: 'platform_account_id', postedAt: 'posted_at', uploadPostId: 'upload_post_id' },
  postAnalytics: { snapshotAt: 'snapshot_at', postId: 'post_id' },
  insights: { createdAt: 'created_at' },
}))

// Don't mock state-machine — it's pure logic, no external deps

const { saveClipSelections } = await import('./service')

const validClips = [
  { sourceTimestampStart: 10, sourceTimestampEnd: 40, score: 8, suggestedTitle: 'Great clip' },
  { sourceTimestampStart: 60, sourceTimestampEnd: 90, score: 7, suggestedTitle: 'Good clip' },
]

describe('features/(business)/clip-select/service', () => {
  beforeEach(() => {
    mockFindFirst.mockReset()
    mockInsertReturning.mockReset()
    mockInsertReturning.mockResolvedValue([
      { id: 'clip-1', pipelineRunId: 'run-1', sourceTimestampStart: 10, sourceTimestampEnd: 40, duration: 30, score: 8 },
      { id: 'clip-2', pipelineRunId: 'run-1', sourceTimestampStart: 60, sourceTimestampEnd: 90, duration: 30, score: 7 },
    ] as never)
  })

  it('saves clips for a transcribed run', async () => {
    mockFindFirst.mockResolvedValueOnce({
      id: 'run-1', status: 'transcribed', transcript: '[00:00:01] Hello', durationSeconds: 120,
    } as never)
    const result = await saveClipSelections('run-1', validClips)
    expect(result).toHaveProperty('clips')
    expect('error' in result).toBe(false)
  })

  it('returns NOT_FOUND for missing run', async () => {
    mockFindFirst.mockResolvedValueOnce(null as never)
    const result = await saveClipSelections('missing', validClips)
    expect(result).toEqual({ error: 'NOT_FOUND' })
  })

  it('returns CLIP_SELECT_INVALID_STATE if not transcribed', async () => {
    mockFindFirst.mockResolvedValueOnce({ id: 'run-1', status: 'queued', transcript: 'test' } as never)
    const result = await saveClipSelections('run-1', validClips)
    expect(result).toEqual({ error: 'CLIP_SELECT_INVALID_STATE' })
  })

  it('returns CLIP_SELECT_NO_TRANSCRIPT when transcript empty', async () => {
    mockFindFirst.mockResolvedValueOnce({ id: 'run-1', status: 'transcribed', transcript: '' } as never)
    const result = await saveClipSelections('run-1', validClips)
    expect(result).toEqual({ error: 'CLIP_SELECT_NO_TRANSCRIPT' })
  })

  it('returns CLIP_SELECT_INVALID_TIMESTAMPS when clip exceeds duration', async () => {
    mockFindFirst.mockResolvedValueOnce({
      id: 'run-1', status: 'transcribed', transcript: 'test', durationSeconds: 30,
    } as never)
    const result = await saveClipSelections('run-1', validClips) // clips go to 90s, duration is 30s
    expect(result).toEqual({ error: 'CLIP_SELECT_INVALID_TIMESTAMPS' })
  })

  it('returns CLIP_SELECT_VALIDATION_FAILED when end <= start', async () => {
    mockFindFirst.mockResolvedValueOnce({
      id: 'run-1', status: 'transcribed', transcript: 'test', durationSeconds: 120,
    } as never)
    const badClips = [{ sourceTimestampStart: 40, sourceTimestampEnd: 10 }]
    const result = await saveClipSelections('run-1', badClips)
    expect(result).toEqual({ error: 'CLIP_SELECT_VALIDATION_FAILED' })
  })

  it('returns CLIP_SELECT_NO_TRANSCRIPT when transcript is null', async () => {
    mockFindFirst.mockResolvedValueOnce({ id: 'run-1', status: 'transcribed', transcript: null } as never)
    const result = await saveClipSelections('run-1', validClips)
    expect(result).toEqual({ error: 'CLIP_SELECT_NO_TRANSCRIPT' })
  })
})
