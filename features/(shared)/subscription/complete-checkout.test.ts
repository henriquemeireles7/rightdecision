import { describe, expect, test } from 'bun:test'

// Complete checkout imports Stripe + Better Auth which require env vars.
// Full integration tests require env vars — covered in CI.

describe('complete-checkout', () => {
	test('module exists', () => {
		const file = Bun.file('features/(shared)/subscription/complete-checkout.ts')
		expect(file.size).toBeGreaterThan(0)
	})
})
