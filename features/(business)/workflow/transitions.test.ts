import { beforeEach, describe, expect, it, mock } from 'bun:test'

mock.module('@/platform/env', () => ({
	env: { DATABASE_URL: 'postgres://test' },
}))

const mockFindFirst = mock(() => Promise.resolve(null))
const mockReturning = mock(() => Promise.resolve([{ id: 'run-1' }]))
const mockUpdateWhere = mock(() => ({ returning: mockReturning }))
const mockUpdateSet = mock(() => ({ where: mockUpdateWhere }))
const mockUpdate = mock(() => ({ set: mockUpdateSet }))

mock.module('@/platform/db/client', () => ({
	db: {
		query: {
			pipelineRuns: { findFirst: mockFindFirst },
		},
		update: mockUpdate,
	},
}))

import { mockSchema } from '@/features/(business)/test-helpers'
mock.module('@/platform/db/schema', () => mockSchema())

// Don't mock state-machine — it's pure logic
const { transitionPipeline, findRunInState } = await import('./transitions')

describe('transitions', () => {
	beforeEach(() => {
		mockFindFirst.mockReset()
		mockUpdate.mockReset()
		mockUpdateSet.mockReset()
		mockUpdateWhere.mockReset()
		mockReturning.mockReset()

		mockUpdate.mockReturnValue({ set: mockUpdateSet } as never)
		mockUpdateSet.mockReturnValue({ where: mockUpdateWhere } as never)
		mockUpdateWhere.mockReturnValue({ returning: mockReturning } as never)
		mockReturning.mockResolvedValue([{ id: 'run-1' }] as never)
	})

	describe('transitionPipeline', () => {
		it('returns true on successful transition', async () => {
			const result = await transitionPipeline('run-1', 'queued', 'transcribing')
			expect(result).toBe(true)
			expect(mockUpdate).toHaveBeenCalled()
		})

		it('returns false when no row matched (race condition)', async () => {
			mockReturning.mockResolvedValueOnce([] as never)

			const result = await transitionPipeline('run-1', 'queued', 'transcribing')
			expect(result).toBe(false)
		})

		it('throws on invalid transition', async () => {
			await expect(
				transitionPipeline('run-1', 'queued', 'completed'),
			).rejects.toThrow('Invalid status transition')
		})

		it('passes extraFields to set', async () => {
			await transitionPipeline('run-1', 'transcribing', 'transcribed', { transcript: 'hello' })
			expect(mockUpdateSet).toHaveBeenCalled()
		})
	})

	describe('findRunInState', () => {
		it('returns run when found in allowed status', async () => {
			const run = { id: 'run-1', status: 'transcribed' }
			mockFindFirst.mockResolvedValueOnce(run as never)

			const result = await findRunInState('run-1', 'transcribed', 'selecting')
			expect(result).toEqual({ run })
		})

		it('returns NOT_FOUND when run does not exist', async () => {
			mockFindFirst.mockResolvedValueOnce(null as never)

			const result = await findRunInState('missing', 'transcribed')
			expect(result).toEqual({ error: 'NOT_FOUND' })
		})

		it('returns PIPELINE_INVALID_STATE when status not allowed', async () => {
			mockFindFirst.mockResolvedValueOnce({ id: 'run-1', status: 'queued' } as never)

			const result = await findRunInState('run-1', 'transcribed', 'selecting')
			expect(result).toEqual({ error: 'PIPELINE_INVALID_STATE' })
		})
	})
})
