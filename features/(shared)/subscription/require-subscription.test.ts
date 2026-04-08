import { describe, expect, test } from 'bun:test'
import { requireActiveSubscription } from './require-subscription'

describe('requireActiveSubscription', () => {
	test('is a middleware function', () => {
		expect(typeof requireActiveSubscription).toBe('function')
	})
})
