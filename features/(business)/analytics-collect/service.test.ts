import { describe, it, expect, mock, beforeEach } from 'bun:test'
import { ProviderError } from '@/providers/errors'

mock.module('@/platform/env', () => ({ env: { DATABASE_URL: 'postgres://test', UPLOAD_POST_API_KEY: 'key' } }))

const mockFindManyPosts = mock(() => Promise.resolve([]))
const mockFindFirstPost = mock(() => Promise.resolve(null))

mock.module('@/platform/db/client', () => ({
  db: {
    query: {
      posts: { findMany: () => mockFindManyPosts(), findFirst: () => mockFindFirstPost() },
    },
    insert: () => ({ values: () => Promise.resolve() }),
    update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
  },
}))

import { mockSchema } from '@/features/(business)/test-helpers'
mock.module('@/platform/db/schema', () => mockSchema())

const mockGetMetrics = mock(() => Promise.resolve({ views: 100, likes: 10, comments: 2, shares: 1, saves: 0, impressions: 200, reach: 150 }))
mock.module('@/providers/social-analytics', () => ({ getMetrics: mockGetMetrics }))

const { collectAnalytics } = await import('./service')

describe('features/(business)/analytics-collect/service', () => {
  beforeEach(() => {
    mockFindManyPosts.mockReset()
    mockGetMetrics.mockReset()
    mockGetMetrics.mockResolvedValue({ views: 100, likes: 10, comments: 2, shares: 1, saves: 0, impressions: 200, reach: 150 })
  })

  it('returns zero when no posts', async () => {
    mockFindManyPosts.mockResolvedValueOnce([] as never)
    const result = await collectAnalytics()
    expect(result).toEqual({ collected: 0, errors: 0 })
  })

  it('collects metrics for posted posts', async () => {
    mockFindManyPosts.mockResolvedValueOnce([
      { id: 'post-1', uploadPostId: 'up-1', status: 'posted' },
    ] as never)
    const result = await collectAnalytics()
    expect(result.collected).toBe(1)
    expect(result.errors).toBe(0)
  })

  it('counts errors for posts without uploadPostId', async () => {
    mockFindManyPosts.mockResolvedValueOnce([
      { id: 'post-1', uploadPostId: null, status: 'posted' },
    ] as never)
    const result = await collectAnalytics()
    expect(result.collected).toBe(0)
    expect(result.errors).toBe(1)
  })

  it('marks deleted posts when 404/410', async () => {
    mockFindManyPosts.mockResolvedValueOnce([
      { id: 'post-1', uploadPostId: 'up-1', status: 'posted' },
    ] as never)
    mockGetMetrics.mockRejectedValueOnce(new ProviderError('analytics', 'getMetrics', 410, 'deleted'))
    const result = await collectAnalytics()
    expect(result.collected).toBe(0)
    expect(result.errors).toBe(1)
  })
})
