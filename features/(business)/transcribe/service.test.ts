import { describe, it, expect, mock, beforeEach } from 'bun:test'

// Mock env
mock.module('@/platform/env', () => ({
  env: {
    DATABASE_URL: 'postgres://test',
    WHISPER_MODEL_PATH: 'models/test.bin',
  },
}))

// Mock DB
const mockInsert = mock(() => ({ returning: () => [{ id: 'run-1', inputVideoUrl: 'episodes/video.mp4', status: 'queued' }] }))
const mockUpdate = mock(() => ({ set: mock(() => ({ where: mock(() => Promise.resolve()) })) }))
const mockSelect = mock(() => ({ from: mock(() => [{ count: 5 }]) }))
const mockFindFirst = mock(() => Promise.resolve({ id: 'run-1', inputVideoUrl: 'episodes/video.mp4', status: 'queued', transcript: null }))
const mockFindMany = mock(() => Promise.resolve([]))

mock.module('@/platform/db/client', () => ({
  db: {
    insert: () => ({
      values: () => ({
        returning: () => Promise.resolve([{ id: 'run-1', inputVideoUrl: 'episodes/video.mp4', status: 'queued' }]),
      }),
    }),
    update: () => ({
      set: (data: unknown) => ({
        where: () => {
          // If setting transcript, prepare the findFirst to return updated
          if (data && typeof data === 'object' && 'transcript' in data) {
            mockFindFirst.mockResolvedValueOnce({
              id: 'run-1',
              inputVideoUrl: 'episodes/video.mp4',
              status: 'transcribed',
              transcript: '[00:00:01] Hello world',
            } as never)
          }
          return casResult('run-1')
        },
      }),
    }),
    select: () => ({ from: () => Promise.resolve([{ count: 5 }]) }),
    query: {
      pipelineRuns: { findFirst: () => mockFindFirst(), findMany: mockFindMany },
      clips: { findMany: mock(() => Promise.resolve([])) },
    },
  },
}))

import { mockSchema, casResult } from '@/features/(business)/test-helpers'
mock.module('@/platform/db/schema', () => mockSchema())

// Mock state machine
// Don't mock state-machine — it's pure logic with no external deps.
// Mocking it globally breaks the state-machine's own test file in Bun.

// Mock providers
const mockDownload = mock(() => Promise.resolve(Buffer.from('fake-video-data')))
mock.module('@/providers/storage', () => ({ download: mockDownload }))

const mockTranscribe = mock(() => Promise.resolve('[00:00:01] Hello world\n[00:00:05] Test transcript'))
mock.module('@/providers/transcription', () => ({ transcribe: mockTranscribe }))

// Mock fs
mock.module('node:fs/promises', () => ({
  writeFile: mock(() => Promise.resolve()),
  unlink: mock(() => Promise.resolve()),
}))

const { startTranscription, processTranscription, getPipelineRun, getClipsForRun } = await import('./service')

describe('features/(business)/transcribe/service', () => {
  beforeEach(() => {
    mockInsert.mockClear()
    mockFindFirst.mockReset()
    mockDownload.mockReset()
    mockTranscribe.mockReset()

    // Default: return a queued run
    mockFindFirst.mockResolvedValue({
      id: 'run-1',
      inputVideoUrl: 'episodes/video.mp4',
      status: 'queued',
      transcript: null,
    } as never)
    mockDownload.mockResolvedValue(Buffer.from('fake-video-data'))
    mockTranscribe.mockResolvedValue('[00:00:01] Hello world')
  })

  describe('startTranscription', () => {
    it('creates a pipeline run for valid video URL', async () => {
      const result = await startTranscription('episodes/video.mp4')
      expect(result).toHaveProperty('run')
      expect('error' in result).toBe(false)
    })

    it('rejects unsupported formats', async () => {
      const result = await startTranscription('episodes/image.gif')
      expect(result).toEqual({ error: 'TRANSCRIBE_INVALID_FORMAT' })
    })

    it('rejects txt files', async () => {
      const result = await startTranscription('episodes/file.txt')
      expect(result).toEqual({ error: 'TRANSCRIBE_INVALID_FORMAT' })
    })
  })

  describe('processTranscription', () => {
    it('downloads video, transcribes, and saves transcript', async () => {
      const result = await processTranscription('run-1')
      expect(result).toHaveProperty('run')
      expect(mockDownload).toHaveBeenCalledTimes(1)
      expect(mockTranscribe).toHaveBeenCalledTimes(1)
    })

    it('returns NOT_FOUND for missing run', async () => {
      mockFindFirst.mockResolvedValueOnce(null as never)
      const result = await processTranscription('missing')
      expect(result).toEqual({ error: 'NOT_FOUND' })
    })

    it('returns error when video not found in storage', async () => {
      const { ProviderError } = await import('@/providers/errors')
      mockDownload.mockRejectedValueOnce(new ProviderError('r2', 'download', 404, 'not found'))
      const result = await processTranscription('run-1')
      expect(result).toEqual({ error: 'TRANSCRIBE_VIDEO_NOT_FOUND' })
    })

    it('returns error when whisper fails', async () => {
      const { ProviderError } = await import('@/providers/errors')
      mockTranscribe.mockRejectedValueOnce(new ProviderError('whisper', 'transcribe', 500, 'crash'))
      const result = await processTranscription('run-1')
      expect(result).toEqual({ error: 'TRANSCRIBE_PROCESSING_FAILED' })
    })

    it('returns TRANSCRIBE_TIMEOUT on whisper timeout', async () => {
      const { ProviderError } = await import('@/providers/errors')
      mockTranscribe.mockRejectedValueOnce(new ProviderError('whisper', 'transcribe', 504, 'timeout'))
      const result = await processTranscription('run-1')
      expect(result).toEqual({ error: 'TRANSCRIBE_TIMEOUT' })
    })

    it('returns TRANSCRIBE_EMPTY_RESULT on empty output', async () => {
      const { ProviderError } = await import('@/providers/errors')
      mockTranscribe.mockRejectedValueOnce(new ProviderError('whisper', 'transcribe', 422, 'empty'))
      const result = await processTranscription('run-1')
      expect(result).toEqual({ error: 'TRANSCRIBE_EMPTY_RESULT' })
    })
  })

  describe('getPipelineRun', () => {
    it('returns run when found', async () => {
      const result = await getPipelineRun('run-1')
      expect(result).toHaveProperty('run')
    })

    it('returns NOT_FOUND when missing', async () => {
      mockFindFirst.mockResolvedValueOnce(null as never)
      const result = await getPipelineRun('missing')
      expect(result).toEqual({ error: 'NOT_FOUND' })
    })
  })

  describe('getClipsForRun', () => {
    it('returns NOT_FOUND when run missing', async () => {
      mockFindFirst.mockResolvedValueOnce(null as never)
      const result = await getClipsForRun('missing')
      expect(result).toEqual({ error: 'NOT_FOUND' })
    })
  })
})
