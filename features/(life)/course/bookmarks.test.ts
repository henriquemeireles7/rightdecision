import { beforeEach, describe, expect, it, mock } from 'bun:test'

mock.module('@/platform/env', () => ({
	env: { DATABASE_URL: 'postgres://test' },
}))

const mockFindFirst = mock(() => Promise.resolve(null))
const mockFindMany = mock(() => Promise.resolve([]))
const mockDeleteWhere = mock(() => Promise.resolve())
const mockDelete = mock(() => ({ where: mockDeleteWhere }))
const mockOnConflictDoNothing = mock(() => Promise.resolve())
const mockInsertValues = mock(() => ({ onConflictDoNothing: mockOnConflictDoNothing }))
const mockInsert = mock(() => ({ values: mockInsertValues }))

mock.module('@/platform/db/client', () => ({
	db: {
		query: {
			bookmarks: { findFirst: mockFindFirst, findMany: mockFindMany },
		},
		delete: mockDelete,
		insert: mockInsert,
	},
}))

mock.module('@/platform/db/schema', () => ({
	users: {}, sessions: {}, accounts: {}, verifications: {}, purchases: {},
	subscriptions: {}, courseProgress: {},
	onboardingSessions: {}, onboardingProfiles: {},
	wins: {},
	bookmarks: { id: 'id', userId: 'user_id', classId: 'class_id' },
	platformAccounts: {}, pipelineRuns: {}, clips: {}, posts: {}, postAnalytics: {}, insights: {},
}))

const { toggleBookmark, getUserBookmarks, isBookmarked } = await import('./bookmarks')

describe('bookmarks', () => {
	beforeEach(() => {
		mockFindFirst.mockReset()
		mockFindMany.mockReset()
		mockDelete.mockReset()
		mockDeleteWhere.mockReset()
		mockInsert.mockReset()
		mockInsertValues.mockReset()
		mockOnConflictDoNothing.mockReset()

		mockDelete.mockReturnValue({ where: mockDeleteWhere } as never)
		mockInsert.mockReturnValue({ values: mockInsertValues } as never)
		mockInsertValues.mockReturnValue({ onConflictDoNothing: mockOnConflictDoNothing } as never)
	})

	describe('toggleBookmark', () => {
		it('removes bookmark when it exists', async () => {
			mockFindFirst.mockResolvedValueOnce({ id: 'b1', userId: 'u1', classId: 'c1' } as never)

			const result = await toggleBookmark('u1', 'c1')
			expect(result).toEqual({ bookmarked: false })
			expect(mockDelete).toHaveBeenCalled()
		})

		it('creates bookmark when it does not exist', async () => {
			mockFindFirst.mockResolvedValueOnce(null as never)

			const result = await toggleBookmark('u1', 'c1')
			expect(result).toEqual({ bookmarked: true })
			expect(mockInsert).toHaveBeenCalled()
		})
	})

	describe('getUserBookmarks', () => {
		it('returns user bookmarks', async () => {
			const bookmarkList = [
				{ id: 'b1', userId: 'u1', classId: 'c1' },
				{ id: 'b2', userId: 'u1', classId: 'c2' },
			]
			mockFindMany.mockResolvedValueOnce(bookmarkList as never)

			const result = await getUserBookmarks('u1')
			expect(result).toEqual(bookmarkList)
		})

		it('returns empty array when no bookmarks', async () => {
			mockFindMany.mockResolvedValueOnce([] as never)

			const result = await getUserBookmarks('u1')
			expect(result).toEqual([])
		})
	})

	describe('isBookmarked', () => {
		it('returns true when bookmark exists', async () => {
			mockFindFirst.mockResolvedValueOnce({ id: 'b1' } as never)

			const result = await isBookmarked('u1', 'c1')
			expect(result).toBe(true)
		})

		it('returns false when bookmark does not exist', async () => {
			mockFindFirst.mockResolvedValueOnce(null as never)

			const result = await isBookmarked('u1', 'c1')
			expect(result).toBe(false)
		})
	})
})
