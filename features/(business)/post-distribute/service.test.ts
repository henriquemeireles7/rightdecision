import { afterAll, beforeEach, describe, expect, it, mock } from 'bun:test'
import {
  clearDbOverride,
  clearEnvOverride,
  dbProxy,
  envProxy,
  setDbOverride,
  setEnvOverride,
} from '@/platform/test/mocks'
import * as actualSocialPosting from '@/providers/social-posting'
import * as actualStorage from '@/providers/storage'

mock.module('@/platform/env', () => ({ env: envProxy }))
setEnvOverride({ DATABASE_URL: 'postgres://test', UPLOAD_POST_API_KEY: 'key' })

const mockFindFirstRun = mock(() => Promise.resolve(null))
const mockFindManyPosts = mock(() => Promise.resolve([]))
const mockFindManyClips = mock(() => Promise.resolve([]))

mock.module('@/platform/db/client', () => ({ db: dbProxy }))
setDbOverride({
  query: {
    pipelineRuns: { findFirst: () => mockFindFirstRun() },
    posts: { findMany: () => mockFindManyPosts() },
    clips: { findMany: () => mockFindManyClips() },
  },
  update: () => ({ set: () => ({ where: () => casResult() }) }),
})

import { casResult, mockSchema } from '@/features/(business)/test-helpers'

mock.module('@/platform/db/schema', () => mockSchema())

afterAll(() => {
  clearDbOverride()
  clearEnvOverride()
})

// Don't mock state-machine — it's pure logic, no external deps

const mockPost = mock(() => Promise.resolve({ id: 'upload-123', status: 'queued' }))
mock.module('@/providers/social-posting', () => ({
  ...actualSocialPosting,
  post: mockPost,
  listProfiles: mock(() => Promise.resolve([])),
  getPostStatus: mock(() => Promise.resolve({ id: 'test', status: 'queued' })),
}))

const mockGetSignedUrl = mock(() => Promise.resolve('https://signed.example.com/clip.mp4'))
mock.module('@/providers/storage', () => ({
  ...actualStorage,
  getSignedUrl: mockGetSignedUrl,
  upload: mock(() => Promise.resolve('test-key')),
  download: mock(() => Promise.resolve(Buffer.from('test'))),
  remove: mock(() => Promise.resolve()),
}))

const { distributePostsForRun } = await import('./service')

describe('features/(business)/post-distribute/service', () => {
  beforeEach(() => {
    mockFindFirstRun.mockReset()
    mockFindManyPosts.mockReset()
    mockFindManyClips.mockReset()
    mockPost.mockReset()
    mockGetSignedUrl.mockReset()
    mockPost.mockResolvedValue({ id: 'upload-123', status: 'queued' })
    mockGetSignedUrl.mockResolvedValue('https://signed.example.com/clip.mp4')
  })

  it('returns NOT_FOUND for missing run', async () => {
    mockFindFirstRun.mockResolvedValueOnce(null as never)
    const result = await distributePostsForRun('missing')
    expect(result).toEqual({ error: 'NOT_FOUND' })
  })

  it('returns invalid state for wrong status', async () => {
    mockFindFirstRun.mockResolvedValueOnce({ id: 'run-1', status: 'queued' } as never)
    const result = await distributePostsForRun('run-1')
    expect(result).toEqual({ error: 'PIPELINE_INVALID_STATE' })
  })

  it('returns NOT_FOUND when no clips exist', async () => {
    mockFindFirstRun.mockResolvedValueOnce({ id: 'run-1', status: 'metadata_ready' } as never)
    mockFindManyClips.mockResolvedValueOnce([] as never)
    const result = await distributePostsForRun('run-1')
    expect(result).toEqual({ error: 'NOT_FOUND' })
  })

  it('returns NOT_FOUND when no scheduled posts', async () => {
    mockFindFirstRun.mockResolvedValueOnce({ id: 'run-1', status: 'metadata_ready' } as never)
    mockFindManyClips.mockResolvedValueOnce([{ id: 'clip-1' }] as never)
    mockFindManyPosts.mockResolvedValueOnce([] as never)
    const result = await distributePostsForRun('run-1')
    expect(result).toEqual({ error: 'NOT_FOUND' })
  })

  it('skips actual posting when dryRun is true', async () => {
    mockFindFirstRun.mockResolvedValueOnce({
      id: 'run-1',
      status: 'metadata_ready',
      config: { dryRun: true },
    } as never)
    mockFindManyClips.mockResolvedValueOnce([
      { id: 'clip-1', storageUrl: 'clips/clip-1.mp4' },
    ] as never)
    mockFindManyPosts.mockResolvedValueOnce([
      {
        id: 'post-1',
        clipId: 'clip-1',
        platformAccountId: 'acc-1',
        description: 'test',
        hashtags: [],
        retryCount: 0,
      },
    ] as never)

    const result = await distributePostsForRun('run-1')
    expect(result).toHaveProperty('dryRun', true)
    expect(result).toHaveProperty('posts')
    expect(mockPost).not.toHaveBeenCalled()
    expect(mockGetSignedUrl).not.toHaveBeenCalled()
  })

  it('distributes posts successfully', async () => {
    mockFindFirstRun.mockResolvedValueOnce({
      id: 'run-1',
      status: 'metadata_ready',
      config: {},
    } as never)
    mockFindManyClips.mockResolvedValueOnce([
      { id: 'clip-1', storageUrl: 'https://r2.example.com/clips/clip-1.mp4' },
    ] as never)
    mockFindManyPosts.mockResolvedValueOnce([
      {
        id: 'post-1',
        clipId: 'clip-1',
        platformAccountId: 'acc-1',
        description: 'test',
        hashtags: [],
        retryCount: 0,
      },
    ] as never)

    const result = await distributePostsForRun('run-1')
    expect(result).toHaveProperty('posts')
    expect('error' in result).toBe(false)
  })
})
