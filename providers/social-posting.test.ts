import { afterAll, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { clearEnvOverride, envProxy, setEnvOverride } from '@/platform/test/mocks'
import { ProviderError } from '@/providers/errors'

mock.module('@/platform/env', () => ({ env: envProxy }))
setEnvOverride({ UPLOAD_POST_API_KEY: 'test-api-key' })

afterAll(clearEnvOverride)

const mockFetch = spyOn(globalThis, 'fetch')

const { post, getPostStatus, listProfiles } = await import('./social-posting')

describe('providers/social-posting', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('post', () => {
    it('posts a video and returns result', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 'post-123', status: 'queued' }), { status: 200 }),
      )
      const result = await post(
        'https://r2.example.com/clip.mp4',
        'Great clip!',
        ['#ai'],
        'profile-1',
      )
      expect(result.id).toBe('post-123')
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('throws ProviderError on 401', async () => {
      mockFetch.mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }))
      try {
        await post('url', 'desc', [], 'p1')
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(ProviderError)
        expect((error as ProviderError).statusCode).toBe(401)
      }
    })

    it('throws ProviderError on 429 after retries exhausted', async () => {
      // Provider retries 3 times, so mock 4 responses (initial + 3 retries)
      for (let i = 0; i < 4; i++)
        mockFetch.mockResolvedValueOnce(new Response('Rate limited', { status: 429 }))
      try {
        await post('url', 'desc', [], 'p1')
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(ProviderError)
        expect((error as ProviderError).statusCode).toBe(429)
      }
    })

    it('throws ProviderError on 503 after retries exhausted', async () => {
      for (let i = 0; i < 4; i++)
        mockFetch.mockResolvedValueOnce(new Response('Service down', { status: 503 }))
      try {
        await post('url', 'desc', [], 'p1')
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(ProviderError)
        expect((error as ProviderError).statusCode).toBe(503)
      }
    })
  })

  describe('getPostStatus', () => {
    it('returns post status', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 'post-123', status: 'posted' }), { status: 200 }),
      )
      const result = await getPostStatus('post-123')
      expect(result.status).toBe('posted')
    })
  })

  describe('listProfiles', () => {
    it('returns list of profiles', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify([{ id: 'p1', platform: 'tiktok', handle: '@test' }]), {
          status: 200,
        }),
      )
      const profiles = await listProfiles()
      expect(profiles).toHaveLength(1)
      expect(profiles[0]?.platform).toBe('tiktok')
    })
  })
})
