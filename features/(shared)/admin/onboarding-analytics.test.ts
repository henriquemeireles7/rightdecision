import { beforeEach, describe, expect, it, mock } from 'bun:test'

mock.module('@/platform/env', () => ({
	env: { DATABASE_URL: 'postgres://test' },
}))

const mockSelectFrom = mock(() => Promise.resolve([{ count: 5 }]))
const mockSelect = mock(() => ({ from: mockSelectFrom }))
const mockGroupBy = mock(() => ({ orderBy: mock(() => Promise.resolve([{ step: 1, count: 3 }])) }))

mock.module('@/platform/db/client', () => ({
	db: {
		select: mockSelect,
	},
}))

mock.module('@/platform/db/schema', () => ({
	users: {}, sessions: {}, accounts: {}, verifications: {}, purchases: {},
	subscriptions: {}, courseProgress: {},
	onboardingSessions: { currentStep: 'current_step' },
	onboardingProfiles: { ageRange: 'age_range', timeStuck: 'time_stuck' },
	wins: {}, bookmarks: {},
	platformAccounts: {}, pipelineRuns: {}, clips: {}, posts: {}, postAnalytics: {}, insights: {},
}))

const { getOnboardingAnalytics } = await import('./onboarding-analytics')

describe('onboarding-analytics', () => {
	beforeEach(() => {
		mockSelect.mockReset()
		mockSelectFrom.mockReset()

		// Chain: select().from() returns [{ count }] for the first two calls
		// then groupBy chains for the remaining three
		const mockGroupByOrderBy = mock(() =>
			Promise.resolve([{ step: 1, count: 3 }]),
		)
		const mockGroupByResult = mock(() => ({ orderBy: mockGroupByOrderBy }))
		const mockFromGroupBy = mock(() => ({ groupBy: mockGroupByResult }))

		let callCount = 0
		mockSelect.mockImplementation(() => {
			callCount++
			if (callCount <= 2) {
				// Profile count, session count
				return { from: mock(() => Promise.resolve([{ count: 5 }])) }
			}
			// Step dropoff, age ranges, time stuck
			return { from: mockFromGroupBy }
		})
	})

	it('returns all analytics fields', async () => {
		const result = await getOnboardingAnalytics()
		expect(result).toHaveProperty('completedProfiles')
		expect(result).toHaveProperty('activeSessions')
		expect(result).toHaveProperty('stepDropoff')
		expect(result).toHaveProperty('ageRanges')
		expect(result).toHaveProperty('timeStuckDistribution')
	})

	it('returns 0 for completedProfiles when no profiles exist', async () => {
		let callCount = 0
		mockSelect.mockImplementation(() => {
			callCount++
			if (callCount === 1) {
				// Profile count returns undefined
				return { from: mock(() => Promise.resolve([undefined])) }
			}
			if (callCount === 2) {
				return { from: mock(() => Promise.resolve([{ count: 0 }])) }
			}
			const mockGroupByOrderBy = mock(() => Promise.resolve([]))
			return { from: mock(() => ({ groupBy: mock(() => ({ orderBy: mockGroupByOrderBy })) })) }
		})

		const result = await getOnboardingAnalytics()
		expect(result.completedProfiles).toBe(0)
	})

	it('handles empty step dropoff', async () => {
		let callCount = 0
		mockSelect.mockImplementation(() => {
			callCount++
			if (callCount <= 2) {
				return { from: mock(() => Promise.resolve([{ count: 0 }])) }
			}
			const mockGroupByOrderBy = mock(() => Promise.resolve([]))
			return { from: mock(() => ({ groupBy: mock(() => ({ orderBy: mockGroupByOrderBy })) })) }
		})

		const result = await getOnboardingAnalytics()
		expect(result.stepDropoff).toEqual([])
	})
})
