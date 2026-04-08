import { describe, expect, test } from 'bun:test'

describe('customer-portal', () => {
	test('portalRoutes exports correctly', async () => {
		const { portalRoutes } = await import('./customer-portal')
		expect(portalRoutes).toBeDefined()
		expect(typeof portalRoutes.fetch).toBe('function')
	})
})
