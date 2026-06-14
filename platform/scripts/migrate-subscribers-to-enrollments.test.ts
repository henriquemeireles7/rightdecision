import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { eq } from 'drizzle-orm'
import { enrollments, programs, subscriptions } from '@/platform/db/schema'
import { createTestSubscription, createTestUser } from '@/platform/test/factories'
import { setupTestDb, teardownTestDb, testDb } from '@/platform/test/setup'
import {
  ensurePaidProgram,
  formatMigrationReport,
  migrateSubscribersToEnrollments,
  PAID_PROGRAM_SLUG,
} from './migrate-subscribers-to-enrollments'

const DAY_MS = 24 * 60 * 60 * 1000

describe('integration: migrate-subscribers-to-enrollments', () => {
  beforeAll(setupTestDb)
  afterAll(teardownTestDb)
  beforeEach(teardownTestDb)

  test('enrolls active, past_due and trialing subscribers into the paid program', async () => {
    const active = await createTestUser()
    const pastDue = await createTestUser()
    const trialing = await createTestUser()
    await createTestSubscription(active!.id, { status: 'active' })
    await createTestSubscription(pastDue!.id, { status: 'past_due' })
    await createTestSubscription(trialing!.id, { status: 'trialing' })

    const report = await migrateSubscribersToEnrollments(testDb)

    expect(report.dryRun).toBe(false)
    expect(report.eligible).toBe(3)
    expect(report.enrolled).toBe(3)
    expect(report.programCreated).toBe(true)

    const program = await testDb.query.programs.findFirst({
      where: eq(programs.slug, PAID_PROGRAM_SLUG),
    })
    expect(program).toBeDefined()
    expect(program?.tier).toBe('paid')

    const rows = await testDb.select().from(enrollments)
    expect(rows).toHaveLength(3)
    for (const row of rows) {
      expect(row.programId).toBe(report.programId as string)
      expect(row.source).toBe('migration')
      expect(row.status).toBe('active')
      expect(row.cohortId).toBeNull()
      expect(row.stripeSubscriptionId).toMatch(/^sub_test_/)
    }
  })

  test('skips cancelled subscriptions and subscriptions outside the 30-day grace window', async () => {
    const cancelled = await createTestUser()
    const stale = await createTestUser()
    const withinGrace = await createTestUser()
    await createTestSubscription(cancelled!.id, { status: 'cancelled' })
    await createTestSubscription(stale!.id, {
      status: 'active',
      currentPeriodEnd: new Date(Date.now() - 45 * DAY_MS), // beyond grace
    })
    await createTestSubscription(withinGrace!.id, {
      status: 'active',
      currentPeriodEnd: new Date(Date.now() - 10 * DAY_MS), // lapsed but within grace
    })

    const report = await migrateSubscribersToEnrollments(testDb)

    expect(report.eligible).toBe(1)
    expect(report.enrolled).toBe(1)
    const rows = await testDb.select().from(enrollments)
    expect(rows).toHaveLength(1)
    expect(rows[0]?.userId).toBe(withinGrace!.id)
  })

  test('reports NULL-userId subscriptions and never enrolls them', async () => {
    const linked = await createTestUser()
    await createTestSubscription(linked!.id, { status: 'active' })
    // webhook-before-linkage row: subscription with no user attached
    const [orphan] = await testDb
      .insert(subscriptions)
      .values({
        userId: null,
        stripeCustomerId: 'cus_orphan',
        stripeSubscriptionId: 'sub_orphan',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * DAY_MS),
      })
      .returning()

    const report = await migrateSubscribersToEnrollments(testDb)

    expect(report.orphaned).toHaveLength(1)
    expect(report.orphaned[0]).toEqual({
      subscriptionId: orphan!.id,
      stripeSubscriptionId: 'sub_orphan',
      stripeCustomerId: 'cus_orphan',
      status: 'active',
    })
    const rows = await testDb.select().from(enrollments)
    expect(rows).toHaveLength(1)
    expect(rows[0]?.userId).toBe(linked!.id)
  })

  test('--dry-run writes nothing (no enrollments, no placeholder program)', async () => {
    const user = await createTestUser()
    await createTestSubscription(user!.id, { status: 'active' })

    const report = await migrateSubscribersToEnrollments(testDb, { dryRun: true })

    expect(report.dryRun).toBe(true)
    expect(report.eligible).toBe(1)
    expect(report.enrolled).toBe(1) // would-enroll count
    expect(await testDb.select().from(enrollments)).toHaveLength(0)
    expect(await testDb.select().from(programs)).toHaveLength(0)
  })

  test('dry-run reports already-enrolled users as skipped', async () => {
    const user = await createTestUser()
    await createTestSubscription(user!.id, { status: 'active' })
    await migrateSubscribersToEnrollments(testDb)

    const report = await migrateSubscribersToEnrollments(testDb, { dryRun: true })

    expect(report.enrolled).toBe(0)
    expect(report.skippedExisting).toBe(1)
  })

  test('running twice creates zero duplicate enrollments', async () => {
    const a = await createTestUser()
    const b = await createTestUser()
    await createTestSubscription(a!.id, { status: 'active' })
    await createTestSubscription(b!.id, { status: 'trialing' })

    const first = await migrateSubscribersToEnrollments(testDb)
    const second = await migrateSubscribersToEnrollments(testDb)

    expect(first.enrolled).toBe(2)
    expect(second.enrolled).toBe(0)
    expect(second.skippedExisting).toBe(2)
    expect(await testDb.select().from(enrollments)).toHaveLength(2)
  })

  test('a user with multiple eligible subscriptions gets exactly one enrollment', async () => {
    const user = await createTestUser()
    await createTestSubscription(user!.id, { status: 'active' })
    await createTestSubscription(user!.id, { status: 'trialing' })

    const report = await migrateSubscribersToEnrollments(testDb)

    expect(report.eligible).toBe(2)
    expect(report.enrolled).toBe(1)
    expect(await testDb.select().from(enrollments)).toHaveLength(1)
  })

  test('reuses an existing paid program found by slug instead of creating a placeholder', async () => {
    const [existing] = await testDb
      .insert(programs)
      .values({ slug: PAID_PROGRAM_SLUG, name: 'Life Decisions', tier: 'paid', status: 'active' })
      .returning()
    const user = await createTestUser()
    await createTestSubscription(user!.id, { status: 'active' })

    const report = await migrateSubscribersToEnrollments(testDb)

    expect(report.programCreated).toBe(false)
    expect(report.programId).toBe(existing!.id)
    expect(await testDb.select().from(programs)).toHaveLength(1)
  })

  test('ensurePaidProgram is idempotent', async () => {
    const first = await ensurePaidProgram(testDb)
    const second = await ensurePaidProgram(testDb)

    expect(first.created).toBe(true)
    expect(second.created).toBe(false)
    expect(second.id).toBe(first.id)
    expect(await testDb.select().from(programs)).toHaveLength(1)
  })

  test('formatMigrationReport surfaces orphans and counts', () => {
    const lines = formatMigrationReport({
      dryRun: true,
      eligible: 3,
      enrolled: 2,
      skippedExisting: 0,
      orphaned: [
        {
          subscriptionId: 'sub-row-id',
          stripeSubscriptionId: 'sub_orphan',
          stripeCustomerId: 'cus_orphan',
          status: 'active',
        },
      ],
      programId: null,
      programCreated: true,
    }).join('\n')

    expect(lines).toContain('DRY RUN')
    expect(lines).toContain('sub_orphan')
    expect(lines).toContain('cus_orphan')
    expect(lines).toContain('2')
  })
})
