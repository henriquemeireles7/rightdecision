import { describe, it, expect, mock, beforeEach, spyOn } from 'bun:test'
import { ProviderError } from '@/providers/errors'

mock.module('@/platform/env', () => ({
  env: { UPLOAD_POST_API_KEY: 'test-api-key' },
}))

const mockFetch = spyOn(globalThis, 'fetch')

const { getMetrics } = await import('./social-analytics')

describe('providers/social-analytics', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('returns metrics on success', async () => {
    const metrics = { views: 1000, likes: 50, comments: 10, shares: 5, saves: 3, impressions: 1500, reach: 1200 }
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(metrics), { status: 200 }))

    const result = await getMetrics('post-123')
    expect(result.views).toBe(1000)
    expect(result.impressions).toBe(1500)
  })

  it('throws ProviderError on 404 (post deleted)', async () => {
    mockFetch.mockResolvedValueOnce(new Response('Not found', { status: 404 }))
    try {
      await getMetrics('deleted-post')
      expect(true).toBe(false)
    } catch (error) {
      expect(error).toBeInstanceOf(ProviderError)
      expect((error as ProviderError).statusCode).toBe(404)
    }
  })

  it('throws ProviderError on 429 rate limit', async () => {
    mockFetch.mockResolvedValueOnce(new Response('Rate limited', { status: 429 }))
    try {
      await getMetrics('post-123')
      expect(true).toBe(false)
    } catch (error) {
      expect(error).toBeInstanceOf(ProviderError)
      expect((error as ProviderError).statusCode).toBe(429)
    }
  })

  it('throws ProviderError on 503', async () => {
    mockFetch.mockResolvedValueOnce(new Response('Down', { status: 503 }))
    try {
      await getMetrics('post-123')
      expect(true).toBe(false)
    } catch (error) {
      expect(error).toBeInstanceOf(ProviderError)
      expect((error as ProviderError).statusCode).toBe(503)
    }
  })
})
