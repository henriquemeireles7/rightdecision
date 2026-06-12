import { afterAll, beforeEach, describe, expect, it, mock } from 'bun:test'
import { clearEnvOverride, envProxy, setEnvOverride } from '@/platform/test/mocks'
import { ProviderError } from '@/providers/errors'

// Mock env before storage imports it
mock.module('@/platform/env', () => ({ env: envProxy }))
setEnvOverride({
  R2_ENDPOINT: 'https://r2.example.com',
  R2_ACCESS_KEY_ID: 'test-key-id',
  R2_SECRET_ACCESS_KEY: 'test-secret',
  R2_BUCKET_NAME: 'test-bucket',
})

afterAll(clearEnvOverride)

// Mock the S3 client
const mockSend = mock(() => Promise.resolve({}))
const mockGetSignedUrl = mock(() => Promise.resolve('https://signed-url.example.com/key'))

mock.module('@aws-sdk/client-s3', () => ({
  S3Client: class {
    send = mockSend
  },
  PutObjectCommand: class {
    constructor(public input: unknown) {}
  },
  GetObjectCommand: class {
    constructor(public input: unknown) {}
  },
  DeleteObjectCommand: class {
    constructor(public input: unknown) {}
  },
}))

mock.module('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: mockGetSignedUrl,
}))

const { upload, download, getSignedUrl, getUploadUrl, remove } = await import('./storage')

describe('providers/storage', () => {
  beforeEach(() => {
    mockSend.mockReset()
    mockGetSignedUrl.mockReset()
  })

  describe('upload', () => {
    it('uploads data and returns URL', async () => {
      mockSend.mockResolvedValueOnce({})
      const url = await upload('test/video.mp4', Buffer.from('data'), 'video/mp4')
      expect(url).toContain('test/video.mp4')
      expect(mockSend).toHaveBeenCalledTimes(1)
    })

    it('throws ProviderError on failure', async () => {
      mockSend.mockRejectedValueOnce(new Error('Network error'))
      await expect(upload('key', Buffer.from(''), 'text/plain')).rejects.toThrow(ProviderError)
    })
  })

  describe('download', () => {
    it('downloads data as Buffer', async () => {
      const testData = new Uint8Array([1, 2, 3])
      mockSend.mockResolvedValueOnce({
        Body: { transformToByteArray: () => Promise.resolve(testData) },
      })
      const result = await download('test/file.mp4')
      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBe(3)
    })

    it('throws ProviderError when body is empty', async () => {
      mockSend.mockResolvedValueOnce({ Body: null })
      await expect(download('missing')).rejects.toThrow(ProviderError)
    })

    it('throws ProviderError on S3 error', async () => {
      mockSend.mockRejectedValueOnce(new Error('Access denied'))
      await expect(download('key')).rejects.toThrow(ProviderError)
    })
  })

  describe('getSignedUrl', () => {
    it('returns a presigned URL', async () => {
      mockGetSignedUrl.mockResolvedValueOnce('https://signed.example.com/key?token=abc')
      const url = await getSignedUrl('test/file.mp4')
      expect(url).toContain('signed')
    })

    it('throws ProviderError on failure', async () => {
      mockGetSignedUrl.mockRejectedValueOnce(new Error('Auth error'))
      await expect(getSignedUrl('key')).rejects.toThrow(ProviderError)
    })
  })

  describe('getUploadUrl', () => {
    it('returns a presigned PUT URL', async () => {
      mockGetSignedUrl.mockResolvedValueOnce('https://signed.example.com/key?token=put')
      const url = await getUploadUrl('uploads/cover.png', 'image/png')
      expect(url).toContain('signed')
      expect(mockGetSignedUrl).toHaveBeenCalledTimes(1)
    })

    it('signs a PutObjectCommand with the content type', async () => {
      mockGetSignedUrl.mockResolvedValueOnce('https://signed.example.com/key?token=put')
      await getUploadUrl('uploads/cover.png', 'image/png')
      const [, command] = mockGetSignedUrl.mock.calls[0] as unknown as [
        unknown,
        { input: { Key: string; ContentType: string } },
      ]
      expect(command.input.Key).toBe('uploads/cover.png')
      expect(command.input.ContentType).toBe('image/png')
    })

    it('throws ProviderError on failure', async () => {
      mockGetSignedUrl.mockRejectedValueOnce(new Error('Auth error'))
      await expect(getUploadUrl('key', 'image/png')).rejects.toThrow(ProviderError)
    })

    it('rejects path-traversal and unsafe keys with ProviderError 400', async () => {
      const unsafe = ['../etc/passwd', 'a/../../b', '/absolute/key', 'a\\b', 'a/./b', '', 'a\0b']
      for (const key of unsafe) {
        try {
          await getUploadUrl(key, 'image/png')
          expect.unreachable(`key should have been rejected: ${JSON.stringify(key)}`)
        } catch (error) {
          expect(error).toBeInstanceOf(ProviderError)
          expect((error as ProviderError).statusCode).toBe(400)
        }
      }
      expect(mockGetSignedUrl).not.toHaveBeenCalled()
    })
  })

  describe('remove', () => {
    it('deletes object without error', async () => {
      mockSend.mockResolvedValueOnce({})
      await expect(remove('test/file.mp4')).resolves.toBeUndefined()
    })

    it('throws ProviderError on failure', async () => {
      mockSend.mockRejectedValueOnce(new Error('Not found'))
      await expect(remove('key')).rejects.toThrow(ProviderError)
    })
  })
})
