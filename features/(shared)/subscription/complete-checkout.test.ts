import { describe, expect, test } from 'bun:test'

describe('complete-checkout', () => {
	test('completeCheckoutRoutes exports correctly', async () => {
		const { completeCheckoutRoutes } = await import('./complete-checkout')
		expect(completeCheckoutRoutes).toBeDefined()
		expect(typeof completeCheckoutRoutes.fetch).toBe('function')
	})
})
