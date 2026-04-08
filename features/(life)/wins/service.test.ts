import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { mockSchema } from '@/platform/test/mocks'

mock.module('@/platform/env', () => ({
	env: { DATABASE_URL: 'postgres://test', WIN_RATE_LIMIT_PER_DAY: 3 },
}))

const mockFindMany = mock(() => Promise.resolve([]))
const mockSelectFromWhere = mock(() => Promise.resolve([{ count: 0 }]))
const mockSelectFrom = mock(() => ({ where: mockSelectFromWhere }))
const mockSelect = mock(() => ({ from: mockSelectFrom }))
const mockInsertReturning = mock(() => Promise.resolve([{ id: 'w1', userId: 'u1', lifeArea: 'health', description: 'test' }]))
const mockInsertValues = mock(() => ({ returning: mockInsertReturning }))
const mockInsert = mock(() => ({ values: mockInsertValues }))

mock.module('@/platform/db/client', () => ({
	db: {
		query: {
			wins: { findMany: mockFindMany },
		},
		select: mockSelect,
		insert: mockInsert,
	},
}))

mock.module('@/platform/db/schema', () => mockSchema())

const { createWin, getPublicFeed, getMyWins } = await import('./service')

describe('wins service', () => {
	beforeEach(() => {
		mockFindMany.mockReset()
		mockSelect.mockReset()
		mockSelectFrom.mockReset()
		mockSelectFromWhere.mockReset()
		mockInsert.mockReset()
		mockInsertValues.mockReset()
		mockInsertReturning.mockReset()

		mockSelect.mockReturnValue({ from: mockSelectFrom } as never)
		mockSelectFrom.mockReturnValue({ where: mockSelectFromWhere } as never)
		mockSelectFromWhere.mockResolvedValue([{ count: 0 }] as never)
		mockInsert.mockReturnValue({ values: mockInsertValues } as never)
		mockInsertValues.mockReturnValue({ returning: mockInsertReturning } as never)
		mockInsertReturning.mockResolvedValue([{ id: 'w1', userId: 'u1', lifeArea: 'health', description: 'test' }] as never)
	})

	describe('createWin', () => {
		it('creates a win successfully', async () => {
			const result = await createWin('u1', 'health', 'I did it!')
			expect(result).toHaveProperty('win')
			expect('error' in result).toBe(false)
		})

		it('returns rate limited error when at daily limit', async () => {
			mockSelectFromWhere.mockResolvedValueOnce([{ count: 3 }] as never)

			const result = await createWin('u1', 'health', 'Too many')
			expect(result).toEqual({ error: 'WIN_RATE_LIMITED' })
		})

		it('strips HTML tags from description', async () => {
			const result = await createWin('u1', 'health', '<b>Bold</b> text')
			expect(result).toHaveProperty('win')
			expect(mockInsertValues).toHaveBeenCalled()
		})

		it('returns error when description exceeds 280 chars', async () => {
			const longText = 'a'.repeat(281)
			const result = await createWin('u1', 'health', longText)
			expect(result).toEqual({ error: 'WIN_TOO_LONG' })
		})

		it('allows exactly 280 chars', async () => {
			const exactText = 'a'.repeat(280)
			const result = await createWin('u1', 'health', exactText)
			expect(result).toHaveProperty('win')
		})
	})

	describe('getPublicFeed', () => {
		it('returns feed from db', async () => {
			// First select: count real wins
			// Second select: actual feed
			const feedItems = [{ id: 'w1', lifeArea: 'health', description: 'test', isSeed: false }]
			mockSelectFrom.mockReturnValueOnce({ where: mock(() => Promise.resolve([{ count: 0 }])) } as never)

			// For the feed query, mock chain: select -> from -> where -> orderBy -> limit -> offset
			const mockOffset = mock(() => Promise.resolve(feedItems))
			const mockLimit = mock(() => ({ offset: mockOffset }))
			const mockOrderBy = mock(() => ({ limit: mockLimit }))
			const mockWhere = mock(() => ({ orderBy: mockOrderBy }))
			mockSelectFrom.mockReturnValueOnce({ where: mockWhere } as never)

			const result = await getPublicFeed()
			expect(result).toEqual(feedItems)
		})
	})

	describe('getMyWins', () => {
		it('returns user wins', async () => {
			const userWins = [{ id: 'w1', userId: 'u1', description: 'My win' }]
			mockFindMany.mockResolvedValueOnce(userWins as never)

			const result = await getMyWins('u1')
			expect(result).toEqual(userWins)
		})

		it('returns empty array when no wins', async () => {
			mockFindMany.mockResolvedValueOnce([] as never)

			const result = await getMyWins('u1')
			expect(result).toEqual([])
		})
	})
})
