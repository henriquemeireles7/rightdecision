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

const mockSelectFromWhere = mock(() => Promise.resolve([{ count: 0 }]))
const mockSelectFrom = mock(() => ({ where: mockSelectFromWhere }))
const mockSelect = mock(() => ({ from: mockSelectFrom }))
const _mockInnerJoin = mock(() => ({ where: mock(() => Promise.resolve([{ count: 0 }])) }))

mock.module('@/platform/db/client', () => ({ db: dbProxy }))
setDbOverride({
  select: mockSelect,
})

import { mockSchema } from '@/features/(business)/test-helpers'

mock.module('@/platform/db/schema', () => mockSchema())

afterAll(() => {
  clearDbOverride()
  clearEnvOverride()
})

const {
  assertStatus,
  assertTranscriptExists,
  assertApprovedClipsExist,
  assertCutClipsExist,
  assertScheduledPostsExist,
  PreconditionError,
} = await import('./preconditions')

describe('preconditions', () => {
  beforeEach(() => {
    mockSelect.mockReset()
    mockSelectFrom.mockReset()
    mockSelectFromWhere.mockReset()

    mockSelect.mockReturnValue({ from: mockSelectFrom } as never)
    mockSelectFrom.mockReturnValue({ where: mockSelectFromWhere } as never)
  })

  describe('assertStatus', () => {
    it('does not throw when status matches', () => {
      const run = { status: 'transcribed' } as never
      expect(() => assertStatus(run, 'transcribed')).not.toThrow()
    })

    it('accepts array of statuses', () => {
      const run = { status: 'selected' } as never
      expect(() => assertStatus(run, ['transcribed', 'selected'])).not.toThrow()
    })

    it('throws PreconditionError when status does not match', () => {
      const run = { status: 'queued' } as never
      expect(() => assertStatus(run, 'transcribed')).toThrow(PreconditionError)
    })

    it('throws PreconditionError when status not in array', () => {
      const run = { status: 'queued' } as never
      expect(() => assertStatus(run, ['transcribed', 'selected'])).toThrow(PreconditionError)
    })
  })

  describe('assertTranscriptExists', () => {
    it('does not throw when transcript exists', () => {
      const run = { transcript: 'Hello world' } as never
      expect(() => assertTranscriptExists(run)).not.toThrow()
    })

    it('throws when transcript is null', () => {
      const run = { transcript: null } as never
      expect(() => assertTranscriptExists(run)).toThrow(PreconditionError)
    })

    it('throws when transcript is empty string', () => {
      const run = { transcript: '' } as never
      expect(() => assertTranscriptExists(run)).toThrow(PreconditionError)
    })

    it('throws when transcript is whitespace only', () => {
      const run = { transcript: '   ' } as never
      expect(() => assertTranscriptExists(run)).toThrow(PreconditionError)
    })
  })

  describe('assertApprovedClipsExist', () => {
    it('does not throw when approved clips exist', async () => {
      mockSelectFromWhere.mockResolvedValueOnce([{ count: 3 }] as never)
      await expect(assertApprovedClipsExist('run-1')).resolves.toBeUndefined()
    })

    it('throws when no approved clips', async () => {
      mockSelectFromWhere.mockResolvedValueOnce([{ count: 0 }] as never)
      await expect(assertApprovedClipsExist('run-1')).rejects.toThrow(PreconditionError)
    })

    it('throws when result is empty', async () => {
      mockSelectFromWhere.mockResolvedValueOnce([] as never)
      await expect(assertApprovedClipsExist('run-1')).rejects.toThrow(PreconditionError)
    })
  })

  describe('assertCutClipsExist', () => {
    it('does not throw when cut clips exist', async () => {
      mockSelectFromWhere.mockResolvedValueOnce([{ count: 2 }] as never)
      await expect(assertCutClipsExist('run-1')).resolves.toBeUndefined()
    })

    it('throws when no cut clips', async () => {
      mockSelectFromWhere.mockResolvedValueOnce([{ count: 0 }] as never)
      await expect(assertCutClipsExist('run-1')).rejects.toThrow(PreconditionError)
    })
  })

  describe('assertScheduledPostsExist', () => {
    it('does not throw when scheduled posts exist', async () => {
      // For this one, we need innerJoin chain
      mockSelectFrom.mockReturnValueOnce({
        innerJoin: mock(() => ({
          where: mock(() => Promise.resolve([{ count: 5 }])),
        })),
      } as never)

      await expect(assertScheduledPostsExist('run-1')).resolves.toBeUndefined()
    })

    it('throws when no scheduled posts', async () => {
      mockSelectFrom.mockReturnValueOnce({
        innerJoin: mock(() => ({
          where: mock(() => Promise.resolve([{ count: 0 }])),
        })),
      } as never)

      await expect(assertScheduledPostsExist('run-1')).rejects.toThrow(PreconditionError)
    })
  })
})
