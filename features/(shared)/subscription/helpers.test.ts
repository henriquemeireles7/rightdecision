import { describe, expect, test } from 'bun:test'
import { getUserForSubscription } from './helpers'

// These tests verify the function signature and return shape.
// Full integration tests with DB require DATABASE_URL — covered in CI.

describe('getUserForSubscription', () => {
	test('is a function that accepts stripeSubscriptionId', () => {
		expect(typeof getUserForSubscription).toBe('function')
		expect(getUserForSubscription.length).toBe(1)
	})

	test('returns a promise', () => {
		// Call with a non-existent ID — will resolve to null since no DB in test
		const result = getUserForSubscription('sub_nonexistent')
		expect(result).toBeInstanceOf(Promise)
	})
})
