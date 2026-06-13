import { afterAll, beforeEach, describe, expect, it, mock } from 'bun:test'
import * as realFsPromises from 'node:fs/promises'
import {
  clearDbOverride,
  clearEnvOverride,
  dbProxy,
  envProxy,
  setDbOverride,
  setEnvOverride,
} from '@/platform/test/mocks'
import { ProviderError } from '@/providers/errors'

mock.module('@/platform/env', () => ({ env: envProxy }))
setEnvOverride({ DATABASE_URL: 'postgres://test' })

const mockFindFirstRun = mock(() => Promise.resolve(null))
const mockFindManyClips = mock(() => Promise.resolve([]))

mock.module('@/platform/db/client', () => ({ db: dbProxy }))
setDbOverride({
  query: {
    pipelineRuns: { findFirst: () => mockFindFirstRun() },
    clips: { findMany: () => mockFindManyClips() },
  },
  update: () => ({ set: () => ({ where: () => casResult() }) }),
  delete: () => ({ where: () => Promise.resolve() }),
})

import { casResult, mockSchema } from '@/features/(business)/test-helpers'

mock.module('@/platform/db/schema', () => mockSchema())

afterAll(() => {
  clearDbOverride()
  clearEnvOverride()
})

// Don't mock state-machine — it's pure logic, no external deps

const mockDownload = mock(() => Promise.resolve(Buffer.from('video-data')))
const mockUpload = mock(() => Promise.resolve('https://r2.example.com/clips/run-1/clip-1.mp4'))
mock.module('@/providers/storage', () => ({
  download: mockDownload,
  upload: mockUpload,
  getSignedUrl: mock(() => Promise.resolve('https://signed.example.com')),
  remove: mock(() => Promise.resolve()),
}))
// Spread the real module so the mock keeps its full shape (incl. `default`) —
// mock.module leaks process-wide and a shape-incomplete factory breaks later
// lazy imports of node:fs/promises in unrelated test files.
mock.module('node:fs/promises', () => ({
  ...realFsPromises,
  writeFile: mock(() => Promise.resolve()),
  unlink: mock(() => Promise.resolve()),
}))

const { cutClipsForRun } = await import('./service')

describe('features/(business)/clip-cut/service', () => {
  beforeEach(() => {
    mockFindFirstRun.mockReset()
    mockFindManyClips.mockReset()
    mockDownload.mockReset()
    mockUpload.mockReset()
    mockDownload.mockResolvedValue(Buffer.from('video-data'))
    mockUpload.mockResolvedValue('https://r2.example.com/clips/run-1/clip-1.mp4')
  })

  it('returns NOT_FOUND for missing run', async () => {
    mockFindFirstRun.mockResolvedValueOnce(null as never)
    const result = await cutClipsForRun('missing')
    expect(result).toEqual({ error: 'NOT_FOUND' })
  })

  it('returns CLIP_CUT_NO_APPROVED_CLIPS when none approved', async () => {
    mockFindFirstRun.mockResolvedValueOnce({
      id: 'run-1',
      status: 'selected',
      inputVideoUrl: 'https://r2.example.com/bucket/video.mp4',
    } as never)
    mockFindManyClips.mockResolvedValueOnce([] as never)
    const result = await cutClipsForRun('run-1')
    expect(result).toEqual({ error: 'CLIP_CUT_NO_APPROVED_CLIPS' })
  })

  it('returns CLIP_CUT_VIDEO_NOT_FOUND when source missing', async () => {
    mockFindFirstRun.mockResolvedValueOnce({
      id: 'run-1',
      status: 'selected',
      inputVideoUrl: 'https://r2.example.com/bucket/video.mp4',
    } as never)
    mockFindManyClips.mockResolvedValueOnce([
      {
        id: 'clip-1',
        pipelineRunId: 'run-1',
        sourceTimestampStart: 10,
        duration: 30,
        approved: true,
      },
    ] as never)
    mockDownload.mockRejectedValueOnce(new ProviderError('r2', 'download', 404, 'not found'))
    const result = await cutClipsForRun('run-1')
    expect(result).toEqual({ error: 'CLIP_CUT_VIDEO_NOT_FOUND' })
  })

  it('returns invalid state for wrong status', async () => {
    mockFindFirstRun.mockResolvedValueOnce({ id: 'run-1', status: 'queued' } as never)
    const result = await cutClipsForRun('run-1')
    expect(result).toEqual({ error: 'PIPELINE_INVALID_STATE' })
  })
})
