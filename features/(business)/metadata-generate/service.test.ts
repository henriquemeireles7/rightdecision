import { beforeEach, describe, expect, it, mock } from 'bun:test'

mock.module('@/platform/env', () => ({ env: { DATABASE_URL: 'postgres://test' } }))

const mockFindFirstRun = mock(() => Promise.resolve(null))
const mockFindManyAccounts = mock(() => Promise.resolve([]))
const mockFindFirstPost = mock(() => Promise.resolve(null))
const mockInsertPost = mock(() =>
  Promise.resolve([
    { id: 'post-1', clipId: 'clip-1', platformAccountId: 'acc-1', status: 'scheduled' },
  ]),
)

const mockTx = {
  query: { posts: { findFirst: () => mockFindFirstPost() } },
  insert: () => ({ values: () => ({ returning: () => mockInsertPost() }) }),
  update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
}

mock.module('@/platform/db/client', () => ({
  db: {
    query: {
      pipelineRuns: { findFirst: () => mockFindFirstRun() },
      platformAccounts: { findMany: () => mockFindManyAccounts() },
      posts: { findFirst: () => mockFindFirstPost() },
    },
    update: () => ({ set: () => ({ where: () => casResult() }) }),
    insert: () => ({ values: () => ({ returning: () => mockInsertPost() }) }),
    transaction: mockTransaction(mockTx),
  },
}))

import { casResult, mockSchema, mockTransaction } from '@/features/(business)/test-helpers'

mock.module('@/platform/db/schema', () => mockSchema())

// Don't mock state-machine — it's pure logic, no external deps

const { saveMetadata } = await import('./service')

const validMetadata = [
  {
    clipId: 'clip-1',
    platformAccountId: 'acc-1',
    description: 'Great clip about AI!',
    hashtags: ['#ai'],
  },
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
    mockInsertPost.mockResolvedValue([
      { id: 'post-1', clipId: 'clip-1', platformAccountId: 'acc-1', status: 'scheduled' },
    ] as never)
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
    expect(result).toEqual({ error: 'PIPELINE_INVALID_STATE' })
  })

  it('returns METADATA_UNKNOWN_PLATFORM for invalid account', async () => {
    mockFindFirstRun.mockResolvedValueOnce({ id: 'run-1', status: 'cut' } as never)
    mockFindManyAccounts.mockResolvedValueOnce([] as never) // no accounts
    const result = await saveMetadata('run-1', validMetadata)
    expect(result).toEqual({ error: 'METADATA_UNKNOWN_PLATFORM' })
  })

  it('saves metadata with profileSlug', async () => {
    mockFindFirstRun.mockResolvedValueOnce({ id: 'run-1', status: 'cut' } as never)
    const result = await saveMetadata('run-1', validMetadata, 'indy-kaz')
    expect(result).toHaveProperty('posts')
    expect('error' in result).toBe(false)
  })

  it('saves metadata without profileSlug (backward compat)', async () => {
    mockFindFirstRun.mockResolvedValueOnce({ id: 'run-1', status: 'cut' } as never)
    const result = await saveMetadata('run-1', validMetadata)
    expect(result).toHaveProperty('posts')
    expect('error' in result).toBe(false)
  })

  it('saves metadata with null profileSlug', async () => {
    mockFindFirstRun.mockResolvedValueOnce({ id: 'run-1', status: 'cut' } as never)
    const result = await saveMetadata('run-1', validMetadata, null)
    expect(result).toHaveProperty('posts')
    expect('error' in result).toBe(false)
  })

  it('returns METADATA_CHAR_LIMIT_EXCEEDED for long description', async () => {
    mockFindFirstRun.mockResolvedValueOnce({ id: 'run-1', status: 'cut' } as never)
    mockFindManyAccounts.mockResolvedValueOnce([
      { id: 'acc-1', platform: 'tiktok', charLimit: 10, hashtagLimit: 5 },
    ] as never)
    const longMeta = [
      {
        clipId: 'clip-1',
        platformAccountId: 'acc-1',
        description: 'This description is way too long for the limit',
      },
    ]
    const result = await saveMetadata('run-1', longMeta)
    expect(result).toEqual({ error: 'METADATA_CHAR_LIMIT_EXCEEDED' })
  })
})
