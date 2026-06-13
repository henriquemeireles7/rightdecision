import { afterAll, beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test'
import type Stripe from 'stripe'

// ─── Passthrough mocks (platform/test rule: never hand-roll bare replacements) ───
// providers/email: placeholder Resend keys must never be hit.
const mockSendEmail = mock(() => Promise.resolve())
mock.module('@/providers/email', () => ({ sendEmail: mockSendEmail }))

// providers/payments: shim ONLY webhooks.constructEvent + subscriptions.retrieve via a
// settable override; everything else (and cleared overrides) delegates to the real module.
import * as realPayments from '@/providers/payments'

let fakeEvent: { id: string; type: string; data: { object: unknown } } | undefined
let fakeRetrieve: ((id: string) => unknown) | undefined

const paymentsShim = new Proxy(realPayments.payments, {
  get(target, prop) {
    if (prop === 'webhooks' && fakeEvent) {
      return { constructEvent: () => fakeEvent }
    }
    if (prop === 'subscriptions' && fakeRetrieve) {
      return { retrieve: (id: string) => Promise.resolve(fakeRetrieve?.(id)) }
    }
    return Reflect.get(target, prop)
  },
})

mock.module('@/providers/payments', () => ({
  ...realPayments,
  payments: paymentsShim as unknown as Stripe,
}))

import { PAID_PROGRAM_SLUG } from '@/platform/programs'
import {
  createTestProgram,
  createTestSubscription,
  createTestUser,
} from '@/platform/test/factories'
import { apiCall, assertSuccess } from '@/platform/test/helpers'
import { setupTestDb, teardownTestDb, testDb } from '@/platform/test/setup'

const { webhookRoutes } = await import('./handle-webhook')

let eventCounter = 0
function postEvent(type: string, object: unknown, id?: string) {
  eventCounter++
  fakeEvent = { id: id ?? `evt_test_${eventCounter}`, type, data: { object } }
  return apiCall(webhookRoutes, 'POST', '/', {}, { 'stripe-signature': 'test-sig' })
}

async function setupPaidWorld() {
  const program = await createTestProgram({ slug: PAID_PROGRAM_SLUG, tier: 'paid' })
  if (!program) throw new Error('failed to create paid program')
  const user = await createTestUser()
  if (!user) throw new Error('failed to create user')
  const subscription = await createTestSubscription(user.id)
  if (!subscription) throw new Error('failed to create subscription')
  return { program, user, subscription }
}

describe('integration: webhook → paid enrollment wiring', () => {
  beforeAll(setupTestDb)
  afterAll(() => {
    fakeEvent = undefined
    fakeRetrieve = undefined
    return teardownTestDb()
  })
  beforeEach(async () => {
    await teardownTestDb()
    mockSendEmail.mockClear()
    fakeRetrieve = () => ({
      current_period_end: Math.floor(Date.now() / 1000) + 365 * 24 * 3600,
      items: { data: [{ price: { id: 'price_placeholder' } }] },
    })
  })

  it('checkout.session.completed with a linked user grants the paid enrollment', async () => {
    const { program, user, subscription } = await setupPaidWorld()

    const response = await postEvent('checkout.session.completed', {
      mode: 'subscription',
      subscription: subscription.stripeSubscriptionId,
      customer: subscription.stripeCustomerId,
    })

    assertSuccess(response)
    const rows = await testDb.query.enrollments.findMany()
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      userId: user.id,
      programId: program.id,
      cohortId: null,
      source: 'purchase',
      status: 'active',
      stripeSubscriptionId: subscription.stripeSubscriptionId,
    })
    const names = (await testDb.query.events.findMany()).map((e) => e.name)
    expect(names).toContain('checkout_completed')
    expect(names).toContain('enrollment_upgraded')
  })

  it('idempotent re-delivery: the same event id is deduped by webhookEvents', async () => {
    const { subscription } = await setupPaidWorld()

    await postEvent(
      'checkout.session.completed',
      {
        mode: 'subscription',
        subscription: subscription.stripeSubscriptionId,
        customer: subscription.stripeCustomerId,
      },
      'evt_redelivered',
    )
    const eventsAfterFirst = (await testDb.query.events.findMany()).length
    const replay = await postEvent(
      'checkout.session.completed',
      {
        mode: 'subscription',
        subscription: subscription.stripeSubscriptionId,
        customer: subscription.stripeCustomerId,
      },
      'evt_redelivered',
    )

    assertSuccess(replay)
    expect(await testDb.query.enrollments.findMany()).toHaveLength(1)
    expect((await testDb.query.events.findMany()).length).toBe(eventsAfterFirst)
  })

  it('NULL-userId session edge: subscription row is created (existing behavior) but NO enrollment', async () => {
    await createTestProgram({ slug: PAID_PROGRAM_SLUG, tier: 'paid' })

    const response = await postEvent('checkout.session.completed', {
      mode: 'subscription',
      subscription: 'sub_webhook_first',
      customer: 'cus_webhook_first',
    })

    assertSuccess(response)
    const subs = await testDb.query.subscriptions.findMany()
    expect(subs).toHaveLength(1) // regression: subscriptions insert unchanged
    expect(subs[0]?.userId).toBeNull()
    expect(await testDb.query.enrollments.findMany()).toHaveLength(0) // reported, not enrolled
  })

  it('subscription.updated with cancel_at_period_end schedules enrollment expiry; subscriptions table updated as before', async () => {
    const { subscription } = await setupPaidWorld()
    await postEvent('checkout.session.completed', {
      mode: 'subscription',
      subscription: subscription.stripeSubscriptionId,
      customer: subscription.stripeCustomerId,
    })
    const periodEnd = Math.floor(Date.now() / 1000) + 30 * 24 * 3600

    const response = await postEvent('customer.subscription.updated', {
      id: subscription.stripeSubscriptionId,
      status: 'active',
      cancel_at_period_end: true,
      current_period_end: periodEnd,
    })

    assertSuccess(response)
    const [enrollment] = await testDb.query.enrollments.findMany()
    expect(enrollment?.status).toBe('active')
    expect(enrollment?.expiresAt?.getTime()).toBe(periodEnd * 1000)
    const [sub] = await testDb.query.subscriptions.findMany()
    expect(sub?.status).toBe('active') // existing mapping untouched
    expect(mockSendEmail).toHaveBeenCalled() // cancellation email still goes out
  })

  it('subscription.updated to canceled revokes the enrollment (mirrors the status mapping)', async () => {
    const { subscription } = await setupPaidWorld()
    await postEvent('checkout.session.completed', {
      mode: 'subscription',
      subscription: subscription.stripeSubscriptionId,
      customer: subscription.stripeCustomerId,
    })

    await postEvent('customer.subscription.updated', {
      id: subscription.stripeSubscriptionId,
      status: 'canceled',
      cancel_at_period_end: false,
      current_period_end: Math.floor(Date.now() / 1000),
    })

    const [enrollment] = await testDb.query.enrollments.findMany()
    expect(enrollment?.status).toBe('revoked')
    const [sub] = await testDb.query.subscriptions.findMany()
    expect(sub?.status).toBe('cancelled')
  })

  it('subscription.deleted (hard cancel) revokes the enrollment', async () => {
    const { subscription } = await setupPaidWorld()
    await postEvent('checkout.session.completed', {
      mode: 'subscription',
      subscription: subscription.stripeSubscriptionId,
      customer: subscription.stripeCustomerId,
    })

    const response = await postEvent('customer.subscription.deleted', {
      id: subscription.stripeSubscriptionId,
    })

    assertSuccess(response)
    const [enrollment] = await testDb.query.enrollments.findMany()
    expect(enrollment?.status).toBe('revoked')
    const names = (await testDb.query.events.findMany()).map((e) => e.name)
    expect(names).toContain('enrollment_revoked')
  })

  it('non-subscription checkout sessions are ignored (existing behavior)', async () => {
    await setupPaidWorld()

    const response = await postEvent('checkout.session.completed', { mode: 'payment' })

    assertSuccess(response)
    expect(await testDb.query.enrollments.findMany()).toHaveLength(0)
  })
})
