import { describe, it, expect, mock, beforeEach } from 'bun:test'

mock.module('@/platform/env', () => ({ env: { DATABASE_URL: 'postgres://test' } }))

const mockFindFirstRun = mock(() => Promise.resolve(null))
const mockFindManyAccounts = mock(() => Promise.resolve([]))
const mockFindFirstPost = mock(() => Promise.resolve(null))
const mockInsertPost = mock(() => Promise.resolve([{ id: 'post-1', clipId: 'clip-1', platformAccountId: 'acc-1', status: 'scheduled' }]))

mock.module('@/platform/db/client', () => ({
  db: {
    query: {
      pipelineRuns: { findFirst: () => mockFindFirstRun() },
      platformAccounts: { findMany: () => mockFindManyAccounts() },
      posts: { findFirst: () => mockFindFirstPost() },
    },
    update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
    insert: () => ({ values: () => ({ returning: () => mockInsertPost() }) }),
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

const { saveMetadata } = await import('./service')

const validMetadata = [
  { clipId: 'clip-1', platformAccountId: 'acc-1', description: 'Great clip about AI!', hashtags: ['#ai'] },
]

describe('features/(business)/metadata-generate/service', () => {
  beforeEach(() => {
    mockFindFirstRun.mockReset()
    mockFindManyAccounts.mockReset()
    mockFindFirstPost.mockReset()
    mockInsertPost.mockReset()
    mockFindManyAccounts.mockResolvedValue([
      { id: 'acc-1', platform: 'tiktok', charLimit: 300, hashtagLimit: 5 },
    ] as never)
    mockFindFirstPost.mockResolvedValue(null as never)
    mockInsertPost.mockResolvedValue([{ id: 'post-1', clipId: 'clip-1', platformAccountId: 'acc-1', status: 'scheduled' }] as never)
  })

  it('saves metadata for cut run', async () => {
    mockFindFirstRun.mockResolvedValueOnce({ id: 'run-1', status: 'cut' } as never)
    const result = await saveMetadata('run-1', validMetadata)
    expect(result).toHaveProperty('posts')
    expect('error' in result).toBe(false)
  })

  it('returns NOT_FOUND for missing run', async () => {
    mockFindFirstRun.mockResolvedValueOnce(null as never)
    const result = await saveMetadata('missing', validMetadata)
    expect(result).toEqual({ error: 'NOT_FOUND' })
  })

  it('returns invalid state for wrong status', async () => {
    mockFindFirstRun.mockResolvedValueOnce({ id: 'run-1', status: 'queued' } as never)
    const result = await saveMetadata('run-1', validMetadata)
    expect(result).toEqual({ error: 'CLIP_SELECT_INVALID_STATE' })
  })

  it('returns METADATA_UNKNOWN_PLATFORM for invalid account', async () => {
    mockFindFirstRun.mockResolvedValueOnce({ id: 'run-1', status: 'cut' } as never)
    mockFindManyAccounts.mockResolvedValueOnce([] as never) // no accounts
    const result = await saveMetadata('run-1', validMetadata)
    expect(result).toEqual({ error: 'METADATA_UNKNOWN_PLATFORM' })
  })

  it('returns METADATA_CHAR_LIMIT_EXCEEDED for long description', async () => {
    mockFindFirstRun.mockResolvedValueOnce({ id: 'run-1', status: 'cut' } as never)
    mockFindManyAccounts.mockResolvedValueOnce([
      { id: 'acc-1', platform: 'tiktok', charLimit: 10, hashtagLimit: 5 },
    ] as never)
    const longMeta = [{ clipId: 'clip-1', platformAccountId: 'acc-1', description: 'This description is way too long for the limit' }]
    const result = await saveMetadata('run-1', longMeta)
    expect(result).toEqual({ error: 'METADATA_CHAR_LIMIT_EXCEEDED' })
  })
})
