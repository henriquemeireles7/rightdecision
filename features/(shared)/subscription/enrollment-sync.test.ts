import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { eq } from 'drizzle-orm'
import { enrollments } from '@/platform/db/schema'
import { PAID_PROGRAM_SLUG } from '@/platform/programs'
import {
  createTestCohort,
  createTestEnrollment,
  createTestProgram,
  createTestSubscription,
  createTestUser,
} from '@/platform/test/factories'
import { setupTestDb, teardownTestDb, testDb } from '@/platform/test/setup'
import {
  syncEnrollmentForCheckoutCompleted,
  syncEnrollmentForSubscriptionDeleted,
  syncEnrollmentForSubscriptionUpdate,
  syncPaidEnrollment,
} from './enrollment-sync'

const PERIOD_END = new Date('2027-06-12T00:00:00Z')

async function setupPaidWorld() {
  const program = await createTestProgram({ slug: PAID_PROGRAM_SLUG, tier: 'paid' })
  if (!program) throw new Error('failed to create paid program')
  const user = await createTestUser()
  if (!user) throw new Error('failed to create user')
  const subscription = await createTestSubscription(user.id)
  if (!subscription) throw new Error('failed to create subscription')
  return { program, user, subscription }
}

async function allEnrollments() {
  return testDb.query.enrollments.findMany()
}

async function eventNames() {
  return (await testDb.query.events.findMany()).map((e) => e.name).sort()
}

describe('integration: syncPaidEnrollment', () => {
  beforeAll(setupTestDb)
  afterAll(teardownTestDb)
  beforeEach(teardownTestDb)

  it('grants an evergreen paid enrollment (source purchase, cohortId NULL) for a linked subscription', async () => {
    const { program, user, subscription } = await setupPaidWorld()

    const result = await syncPaidEnrollment(subscription.stripeSubscriptionId)

    expect(result).toMatchObject({ enrolled: true, changed: true })
    const rows = await allEnrollments()
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      userId: user.id,
      programId: program.id,
      cohortId: null,
      status: 'active',
      source: 'purchase',
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      expiresAt: null,
    })
  })

  it('records enrollment_created + enrollment_upgraded for a brand-new paid enrollment', async () => {
    const { subscription } = await setupPaidWorld()

    await syncPaidEnrollment(subscription.stripeSubscriptionId)

    const names = await eventNames()
    expect(names).toContain('enrollment_created')
    expect(names).toContain('enrollment_upgraded')
  })

  it('is idempotent — a second sync changes nothing and records no duplicate events', async () => {
    const { subscription } = await setupPaidWorld()

    const first = await syncPaidEnrollment(subscription.stripeSubscriptionId)
    const second = await syncPaidEnrollment(subscription.stripeSubscriptionId)

    expect(first).toMatchObject({ enrolled: true, changed: true })
    expect(second).toMatchObject({ enrolled: true, changed: false })
    expect(await allEnrollments()).toHaveLength(1)
    const upgraded = (await testDb.query.events.findMany()).filter(
      (e) => e.name === 'enrollment_upgraded',
    )
    expect(upgraded).toHaveLength(1)
  })

  it('keeps the free cohort enrollment intact when upgrading (one row per user per program)', async () => {
    const { user, subscription } = await setupPaidWorld()
    const freeProgram = await createTestProgram()
    if (!freeProgram) throw new Error('no free program')
    const cohort = await createTestCohort(freeProgram.id)
    await createTestEnrollment(user.id, freeProgram.id, { cohortId: cohort?.id })

    await syncPaidEnrollment(subscription.stripeSubscriptionId)

    const rows = await allEnrollments()
    expect(rows).toHaveLength(2)
    const free = rows.find((r) => r.programId === freeProgram.id)
    expect(free?.status).toBe('active')
    expect(free?.cohortId).toBe(cohort?.id ?? null)
  })

  it('reactivates a revoked paid enrollment and clears a scheduled expiresAt', async () => {
    const { program, user, subscription } = await setupPaidWorld()
    await createTestEnrollment(user.id, program.id, {
      status: 'revoked',
      source: 'purchase',
      expiresAt: PERIOD_END,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
    })

    const result = await syncPaidEnrollment(subscription.stripeSubscriptionId)

    expect(result).toMatchObject({ enrolled: true, changed: true })
    const rows = await allEnrollments()
    expect(rows).toHaveLength(1)
    expect(rows[0]?.status).toBe('active')
    expect(rows[0]?.expiresAt).toBeNull()
    // existing row → upgraded, but NOT created
    const names = await eventNames()
    expect(names).toContain('enrollment_upgraded')
    expect(names).not.toContain('enrollment_created')
  })

  it('REPORTS (never enrolls) a NULL-userId subscription — the webhook-before-linkage edge', async () => {
    await createTestProgram({ slug: PAID_PROGRAM_SLUG, tier: 'paid' })
    const orphan = await testDb.query.subscriptions.findFirst()
    expect(orphan).toBeUndefined()
    const sub = await createTestSubscription(undefined as unknown as string, {
      userId: null,
      stripeSubscriptionId: 'sub_orphan_1',
    })
    if (!sub) throw new Error('no subscription')

    const result = await syncPaidEnrollment('sub_orphan_1')

    expect(result).toEqual({ enrolled: false, reason: 'user_not_linked' })
    expect(await allEnrollments()).toHaveLength(0)
    expect(await eventNames()).toHaveLength(0)
  })

  it('reports an unknown subscription id', async () => {
    await createTestProgram({ slug: PAID_PROGRAM_SLUG, tier: 'paid' })

    const result = await syncPaidEnrollment('sub_does_not_exist')

    expect(result).toEqual({ enrolled: false, reason: 'subscription_not_found' })
    expect(await allEnrollments()).toHaveLength(0)
  })

  it('reports a missing paid program instead of creating one from a webhook', async () => {
    const user = await createTestUser()
    if (!user) throw new Error('no user')
    const sub = await createTestSubscription(user.id)

    const result = await syncPaidEnrollment(sub?.stripeSubscriptionId ?? '')

    expect(result).toEqual({ enrolled: false, reason: 'paid_program_missing' })
    expect(await allEnrollments()).toHaveLength(0)
  })
})

describe('integration: syncEnrollmentForCheckoutCompleted', () => {
  beforeAll(setupTestDb)
  afterAll(teardownTestDb)
  beforeEach(teardownTestDb)

  it('also records checkout_completed (funnel taxonomy)', async () => {
    const { subscription } = await setupPaidWorld()

    await syncEnrollmentForCheckoutCompleted(subscription.stripeSubscriptionId)

    expect(await eventNames()).toContain('checkout_completed')
  })

  it('does not duplicate checkout_completed on an idempotent re-run', async () => {
    const { subscription } = await setupPaidWorld()

    await syncEnrollmentForCheckoutCompleted(subscription.stripeSubscriptionId)
    await syncEnrollmentForCheckoutCompleted(subscription.stripeSubscriptionId)

    const completed = (await testDb.query.events.findMany()).filter(
      (e) => e.name === 'checkout_completed',
    )
    expect(completed).toHaveLength(1)
  })
})

describe('integration: syncEnrollmentForSubscriptionUpdate', () => {
  beforeAll(setupTestDb)
  afterAll(teardownTestDb)
  beforeEach(teardownTestDb)

  it('active + cancel_at_period_end schedules expiry at period end (sweep revokes later)', async () => {
    const { subscription } = await setupPaidWorld()
    await syncPaidEnrollment(subscription.stripeSubscriptionId)

    const result = await syncEnrollmentForSubscriptionUpdate({
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      status: 'active',
      cancelAtPeriodEnd: true,
      currentPeriodEnd: PERIOD_END,
    })

    expect(result.action).toBe('expiry_scheduled')
    const rows = await allEnrollments()
    expect(rows[0]?.status).toBe('active') // still active until period end
    expect(rows[0]?.expiresAt?.getTime()).toBe(PERIOD_END.getTime())
  })

  it('active without cancel_at_period_end re-syncs and clears a scheduled expiry (reactivation)', async () => {
    const { subscription } = await setupPaidWorld()
    await syncPaidEnrollment(subscription.stripeSubscriptionId)
    await syncEnrollmentForSubscriptionUpdate({
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      status: 'active',
      cancelAtPeriodEnd: true,
      currentPeriodEnd: PERIOD_END,
    })

    const result = await syncEnrollmentForSubscriptionUpdate({
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      status: 'active',
      cancelAtPeriodEnd: false,
      currentPeriodEnd: PERIOD_END,
    })

    expect(result.action).toBe('granted')
    const rows = await allEnrollments()
    expect(rows[0]?.status).toBe('active')
    expect(rows[0]?.expiresAt).toBeNull()
  })

  it('cancelled revokes the enrollment and records enrollment_revoked once', async () => {
    const { subscription } = await setupPaidWorld()
    await syncPaidEnrollment(subscription.stripeSubscriptionId)

    const first = await syncEnrollmentForSubscriptionUpdate({
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      status: 'cancelled',
      cancelAtPeriodEnd: false,
      currentPeriodEnd: PERIOD_END,
    })
    const second = await syncEnrollmentForSubscriptionUpdate({
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      status: 'cancelled',
      cancelAtPeriodEnd: false,
      currentPeriodEnd: PERIOD_END,
    })

    expect(first.action).toBe('revoked')
    expect(second.action).toBe('revoked')
    const rows = await allEnrollments()
    expect(rows[0]?.status).toBe('revoked')
    const revokedEvents = (await testDb.query.events.findMany()).filter(
      (e) => e.name === 'enrollment_revoked',
    )
    expect(revokedEvents).toHaveLength(1)
  })

  it('past_due leaves the enrollment alone (grace — mirrors legacy access mapping)', async () => {
    const { subscription } = await setupPaidWorld()
    await syncPaidEnrollment(subscription.stripeSubscriptionId)

    const result = await syncEnrollmentForSubscriptionUpdate({
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      status: 'past_due',
      cancelAtPeriodEnd: false,
      currentPeriodEnd: PERIOD_END,
    })

    expect(result.action).toBe('none')
    const rows = await allEnrollments()
    expect(rows[0]?.status).toBe('active')
    expect(rows[0]?.expiresAt).toBeNull()
  })
})

describe('integration: syncEnrollmentForSubscriptionDeleted', () => {
  beforeAll(setupTestDb)
  afterAll(teardownTestDb)
  beforeEach(teardownTestDb)

  it('revokes the paid enrollment on hard cancel and is idempotent', async () => {
    const { subscription } = await setupPaidWorld()
    await syncPaidEnrollment(subscription.stripeSubscriptionId)

    const first = await syncEnrollmentForSubscriptionDeleted(subscription.stripeSubscriptionId)
    const second = await syncEnrollmentForSubscriptionDeleted(subscription.stripeSubscriptionId)

    expect(first.action).toBe('revoked')
    expect(first.updated).toBe(1)
    expect(second.updated).toBe(0)
    const rows = await allEnrollments()
    expect(rows[0]?.status).toBe('revoked')
  })

  it('no-ops when no enrollment carries the subscription id', async () => {
    await setupPaidWorld()

    const result = await syncEnrollmentForSubscriptionDeleted('sub_never_seen')

    expect(result.updated).toBe(0)
  })
})

describe('expiry end-to-end: scheduled expiresAt is swept by the P1 expiry job', () => {
  beforeAll(setupTestDb)
  afterAll(teardownTestDb)
  beforeEach(teardownTestDb)

  it('cancel-at-period-end → sweep after period end flips the enrollment to expired', async () => {
    const { subscription } = await setupPaidWorld()
    await syncPaidEnrollment(subscription.stripeSubscriptionId)
    await syncEnrollmentForSubscriptionUpdate({
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      status: 'active',
      cancelAtPeriodEnd: true,
      currentPeriodEnd: PERIOD_END,
    })

    const { enrollmentExpirySweepJob } = await import('@/features/(shared)/scheduler/jobs')
    const afterPeriodEnd = new Date(PERIOD_END.getTime() + 60_000)
    const flipped = await enrollmentExpirySweepJob(afterPeriodEnd)

    expect(flipped).toBe(1)
    const [row] = await testDb
      .select()
      .from(enrollments)
      .where(eq(enrollments.stripeSubscriptionId, subscription.stripeSubscriptionId))
    expect(row?.status).toBe('expired')
  })
})

// Sanity: events written by this module satisfy the taxonomy (no EVENT_INVALID throws
// would have surfaced above); the events table never holds PII from this flow.
describe('event hygiene', () => {
  beforeAll(setupTestDb)
  afterAll(teardownTestDb)
  beforeEach(teardownTestDb)

  it('event properties contain ids only', async () => {
    const { subscription, user } = await setupPaidWorld()
    await syncEnrollmentForCheckoutCompleted(subscription.stripeSubscriptionId)

    for (const event of await testDb.query.events.findMany()) {
      expect(event.userId).toBe(user.id)
      expect(JSON.stringify(event.properties)).not.toContain('@') // no emails
    }
  })
})
