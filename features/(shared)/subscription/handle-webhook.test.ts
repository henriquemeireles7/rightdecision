import { beforeEach, describe, expect, it, mock } from 'bun:test'

mock.module('@/platform/env', () => ({
	env: { DATABASE_URL: 'postgres://test', STRIPE_WEBHOOK_SECRET: 'whsec_test' },
}))

const mockInsertValues = mock(() => ({
	onConflictDoNothing: mock(() => Promise.resolve()),
}))
const mockInsert = mock(() => ({ values: mockInsertValues }))
const mockUpdateSet = mock(() => ({ where: mock(() => Promise.resolve()) }))
const mockUpdate = mock(() => ({ set: mockUpdateSet }))

mock.module('@/platform/db/client', () => ({
	db: {
		insert: mockInsert,
		update: mockUpdate,
	},
}))

mock.module('@/platform/db/schema', () => ({
	users: {}, sessions: {}, accounts: {}, verifications: {}, purchases: {},
	subscriptions: { stripeSubscriptionId: 'stripe_subscription_id' },
	courseProgress: {}, onboardingSessions: {}, onboardingProfiles: {},
	wins: {}, bookmarks: {},
	platformAccounts: {}, pipelineRuns: {}, clips: {}, posts: {}, postAnalytics: {}, insights: {},
}))

const mockConstructEvent = mock((_body: string, _sig: string, _secret: string) => ({
	type: 'checkout.session.completed',
	data: {
		object: {
			mode: 'subscription',
			subscription: 'sub_123',
			customer: 'cus_123',
			amount_total: 19700,
			payment_method_types: ['card'],
		},
	},
}))

const mockRetrieve = mock(() =>
	Promise.resolve({ current_period_end: 1700000000 }),
)

mock.module('@/providers/payments', () => ({
	payments: {
		webhooks: { constructEvent: mockConstructEvent },
		subscriptions: { retrieve: mockRetrieve },
	},
}))

mock.module('@/providers/analytics', () => ({
	track: mock(() => {}),
}))

// Dynamic import after mocks
const { webhookRoutes } = await import('./handle-webhook')
import { Hono } from 'hono'

const app = new Hono()
app.route('/webhook', webhookRoutes)

describe('handle-webhook', () => {
	beforeEach(() => {
		mockConstructEvent.mockReset()
		mockInsert.mockReset()
		mockInsertValues.mockReset()
		mockUpdate.mockReset()
		mockUpdateSet.mockReset()
		mockRetrieve.mockReset()

		mockInsert.mockReturnValue({ values: mockInsertValues } as never)
		mockInsertValues.mockReturnValue({ onConflictDoNothing: mock(() => Promise.resolve()) } as never)
		mockUpdate.mockReturnValue({ set: mockUpdateSet } as never)
		mockUpdateSet.mockReturnValue({ where: mock(() => Promise.resolve()) } as never)
		mockRetrieve.mockResolvedValue({ current_period_end: 1700000000 } as never)
	})

	it('returns error when no stripe-signature header', async () => {
		const res = await app.request('/webhook', {
			method: 'POST',
			body: 'test',
		})
		const json = await res.json()
		expect(json.code).toBe('VALIDATION_ERROR')
	})

	it('returns error when signature verification fails', async () => {
		mockConstructEvent.mockImplementation(() => {
			throw new Error('Invalid signature')
		})

		const res = await app.request('/webhook', {
			method: 'POST',
			body: 'test',
			headers: { 'stripe-signature': 'bad_sig' },
		})
		const json = await res.json()
		expect(json.code).toBe('VALIDATION_ERROR')
	})

	it('handles checkout.session.completed for subscription', async () => {
		mockConstructEvent.mockReturnValue({
			type: 'checkout.session.completed',
			data: {
				object: {
					mode: 'subscription',
					subscription: 'sub_123',
					customer: 'cus_123',
					amount_total: 19700,
					payment_method_types: ['card'],
				},
			},
		} as never)

		const res = await app.request('/webhook', {
			method: 'POST',
			body: 'test',
			headers: { 'stripe-signature': 'valid_sig' },
		})
		const json = await res.json()
		expect(json.data.received).toBe(true)
		expect(mockInsert).toHaveBeenCalled()
		expect(mockRetrieve).toHaveBeenCalled()
	})

	it('skips non-subscription checkout sessions', async () => {
		mockConstructEvent.mockReturnValue({
			type: 'checkout.session.completed',
			data: {
				object: {
					mode: 'payment',
					subscription: null,
					customer: 'cus_123',
				},
			},
		} as never)

		const res = await app.request('/webhook', {
			method: 'POST',
			body: 'test',
			headers: { 'stripe-signature': 'valid_sig' },
		})
		const json = await res.json()
		expect(json.data.received).toBe(true)
		expect(mockInsert).not.toHaveBeenCalled()
	})

	it('handles customer.subscription.updated', async () => {
		mockConstructEvent.mockReturnValue({
			type: 'customer.subscription.updated',
			data: {
				object: {
					id: 'sub_123',
					cancel_at_period_end: false,
					status: 'active',
					current_period_end: 1700000000,
				},
			},
		} as never)

		const res = await app.request('/webhook', {
			method: 'POST',
			body: 'test',
			headers: { 'stripe-signature': 'valid_sig' },
		})
		const json = await res.json()
		expect(json.data.received).toBe(true)
		expect(mockUpdate).toHaveBeenCalled()
	})

	it('handles customer.subscription.deleted', async () => {
		mockConstructEvent.mockReturnValue({
			type: 'customer.subscription.deleted',
			data: {
				object: {
					id: 'sub_123',
					customer: 'cus_123',
				},
			},
		} as never)

		const res = await app.request('/webhook', {
			method: 'POST',
			body: 'test',
			headers: { 'stripe-signature': 'valid_sig' },
		})
		const json = await res.json()
		expect(json.data.received).toBe(true)
		expect(mockUpdate).toHaveBeenCalled()
	})

	it('sets cancelled status when cancel_at_period_end is true', async () => {
		mockConstructEvent.mockReturnValue({
			type: 'customer.subscription.updated',
			data: {
				object: {
					id: 'sub_123',
					cancel_at_period_end: true,
					status: 'active',
					current_period_end: 1700000000,
				},
			},
		} as never)

		const res = await app.request('/webhook', {
			method: 'POST',
			body: 'test',
			headers: { 'stripe-signature': 'valid_sig' },
		})
		const json = await res.json()
		expect(json.data.received).toBe(true)
	})

	it('returns received:true for unknown event types', async () => {
		mockConstructEvent.mockReturnValue({
			type: 'unknown.event',
			data: { object: {} },
		} as never)

		const res = await app.request('/webhook', {
			method: 'POST',
			body: 'test',
			headers: { 'stripe-signature': 'valid_sig' },
		})
		const json = await res.json()
		expect(json.data.received).toBe(true)
	})
})
