import { afterAll, beforeEach, describe, expect, it, mock } from 'bun:test'
import {
  clearDbOverride,
  clearEnvOverride,
  dbProxy,
  envProxy,
  setDbOverride,
  setEnvOverride,
} from '@/platform/test/mocks'

mock.module('@/platform/env', () => ({ env: envProxy }))
setEnvOverride({ DATABASE_URL: 'postgres://test' })

const mockFindFirst = mock(() => Promise.resolve(null))
const _mockDelete = mock(() => ({ where: () => Promise.resolve() }))
const mockInsertReturning = mock(() =>
  Promise.resolve([
    {
      id: 'clip-1',
      pipelineRunId: 'run-1',
      sourceTimestampStart: 10,
      sourceTimestampEnd: 40,
      duration: 30,
      score: 8,
    },
  ]),
)
const _mockUpdateSet = mock(() => ({ where: () => Promise.resolve() }))

const mockTx = {
  delete: () => ({ where: () => Promise.resolve() }),
  insert: () => ({ values: () => ({ returning: () => mockInsertReturning() }) }),
  update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
}

mock.module('@/platform/db/client', () => ({ db: dbProxy }))
const __dbOverride = {
  query: {
    pipelineRuns: { findFirst: () => mockFindFirst() },
  },
  update: () => ({ set: () => ({ where: () => casResult() }) }),
  delete: () => ({ where: () => Promise.resolve() }),
  insert: () => ({ values: () => ({ returning: () => mockInsertReturning() }) }),
  transaction: mockTransaction(mockTx),
}
setDbOverride(__dbOverride)
beforeEach(() => setDbOverride(__dbOverride))

import { casResult, mockSchema, mockTransaction } from '@/features/(business)/test-helpers'

mock.module('@/platform/db/schema', () => mockSchema())

afterAll(() => {
  clearDbOverride()
  clearEnvOverride()
})

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
      {
        id: 'clip-1',
        pipelineRunId: 'run-1',
        sourceTimestampStart: 10,
        sourceTimestampEnd: 40,
        duration: 30,
        score: 8,
      },
      {
        id: 'clip-2',
        pipelineRunId: 'run-1',
        sourceTimestampStart: 60,
        sourceTimestampEnd: 90,
        duration: 30,
        score: 7,
      },
    ] as never)
  })

  it('saves clips for a transcribed run', async () => {
    mockFindFirst.mockResolvedValueOnce({
      id: 'run-1',
      status: 'transcribed',
      transcript: '[00:00:01] Hello',
      durationSeconds: 120,
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

  it('returns PIPELINE_INVALID_STATE if not transcribed', async () => {
    mockFindFirst.mockResolvedValueOnce({
      id: 'run-1',
      status: 'queued',
      transcript: 'test',
    } as never)
    const result = await saveClipSelections('run-1', validClips)
    expect(result).toEqual({ error: 'PIPELINE_INVALID_STATE' })
  })

  it('returns CLIP_SELECT_NO_TRANSCRIPT when transcript empty', async () => {
    mockFindFirst.mockResolvedValueOnce({
      id: 'run-1',
      status: 'transcribed',
      transcript: '',
    } as never)
    const result = await saveClipSelections('run-1', validClips)
    expect(result).toEqual({ error: 'CLIP_SELECT_NO_TRANSCRIPT' })
  })

  it('returns CLIP_SELECT_INVALID_TIMESTAMPS when clip exceeds duration', async () => {
    mockFindFirst.mockResolvedValueOnce({
      id: 'run-1',
      status: 'transcribed',
      transcript: 'test',
      durationSeconds: 30,
    } as never)
    const result = await saveClipSelections('run-1', validClips) // clips go to 90s, duration is 30s
    expect(result).toEqual({ error: 'CLIP_SELECT_INVALID_TIMESTAMPS' })
  })

  it('returns CLIP_SELECT_VALIDATION_FAILED when end <= start', async () => {
    mockFindFirst.mockResolvedValueOnce({
      id: 'run-1',
      status: 'transcribed',
      transcript: 'test',
      durationSeconds: 120,
    } as never)
    const badClips = [{ sourceTimestampStart: 40, sourceTimestampEnd: 10 }]
    const result = await saveClipSelections('run-1', badClips)
    expect(result).toEqual({ error: 'CLIP_SELECT_VALIDATION_FAILED' })
  })

  it('returns CLIP_SELECT_NO_TRANSCRIPT when transcript is null', async () => {
    mockFindFirst.mockResolvedValueOnce({
      id: 'run-1',
      status: 'transcribed',
      transcript: null,
    } as never)
    const result = await saveClipSelections('run-1', validClips)
    expect(result).toEqual({ error: 'CLIP_SELECT_NO_TRANSCRIPT' })
  })
})
