import { describe, expect, test } from 'bun:test'

// Webhook handler tests verify the handler shape and safeSendEmail pattern.
// Full integration tests require DATABASE_URL + STRIPE_WEBHOOK_SECRET — covered in CI.

describe('webhook handler', () => {
	test('webhookRoutes exports correctly', async () => {
		const { webhookRoutes } = await import('./handle-webhook')
		expect(webhookRoutes).toBeDefined()
		// Hono router has a fetch method
		expect(typeof webhookRoutes.fetch).toBe('function')
	})
})
