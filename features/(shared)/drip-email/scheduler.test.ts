import { afterAll, beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test'

// mock.module BEFORE importing scheduler.ts — placeholder Resend keys must never be hit
// (same pattern as features/(shared)/scheduler/jobs.test.ts).
const mockSendEmail = mock(() => Promise.resolve())
mock.module('@/providers/email', () => ({ sendEmail: mockSendEmail }))

import { dripEmails } from '@/platform/db/schema'
import { env } from '@/platform/env'
import { createTestSubscription, createTestUser } from '@/platform/test/factories'
import { setupTestDb, teardownTestDb, testDb } from '@/platform/test/setup'
import { COHORT_DRIP_INDEXES } from './cohort-drips'

const { processPendingDrips } = await import('./scheduler')

const PAST = new Date(Date.now() - 60 * 60 * 1000)
const STARTS_AT_ISO = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()

async function user() {
  const u = await createTestUser()
  if (!u) throw new Error('failed to create test user')
  return u
}

async function createDrip(userId: string, overrides: Partial<typeof dripEmails.$inferInsert> = {}) {
  const [drip] = await testDb
    .insert(dripEmails)
    .values({
      userId,
      emailIndex: 0,
      decisionText: 'I will quit the job that is killing me.',
      scheduledAt: PAST,
      ...overrides,
    })
    .returning()
  if (!drip) throw new Error('failed to create test drip')
  return drip
}

function sentMessages() {
  return mockSendEmail.mock.calls as unknown as Array<
    [string, { subject: string; html: string; text: string }]
  >
}

function firstSentMessage() {
  const [first] = sentMessages()
  if (!first) throw new Error('expected at least one sent email')
  return first
}

describe('integration: processPendingDrips with cohort drips', () => {
  beforeAll(setupTestDb)
  afterAll(teardownTestDb)
  beforeEach(async () => {
    await teardownTestDb()
    mockSendEmail.mockClear()
  })

  it('sends the cohort welcome template for index 100 and marks it sent', async () => {
    const u = await user()
    await createDrip(u.id, {
      emailIndex: COHORT_DRIP_INDEXES.welcome,
      decisionText: STARTS_AT_ISO,
    })

    const sent = await processPendingDrips(env.PUBLIC_APP_URL)

    expect(sent).toBe(1)
    const [to, msg] = firstSentMessage()
    expect(to).toBe(u.email)
    expect(msg.subject).toBe("You're in")
    expect(msg.html).toContain(`${env.PUBLIC_APP_URL}/app`)
    const drips = await testDb.query.dripEmails.findMany()
    expect(drips[0]?.status).toBe('sent')
  })

  it('sends starts-soon and upgrade-nudge templates for their indexes', async () => {
    const u = await user()
    await createDrip(u.id, {
      emailIndex: COHORT_DRIP_INDEXES.startsSoon,
      decisionText: STARTS_AT_ISO,
    })
    await createDrip(u.id, {
      emailIndex: COHORT_DRIP_INDEXES.upgradeNudge,
      decisionText: STARTS_AT_ISO,
    })

    const sent = await processPendingDrips(env.PUBLIC_APP_URL)

    expect(sent).toBe(2)
    const subjects = sentMessages()
      .map(([, msg]) => msg.subject)
      .sort()
    expect(subjects).toEqual(['Tomorrow.', "What the free program can't do"].sort())
  })

  it('skips ONLY the upgrade nudge for paid users — welcome and starts-soon still send', async () => {
    const u = await user()
    await createTestSubscription(u.id) // active subscription = paid
    await createDrip(u.id, {
      emailIndex: COHORT_DRIP_INDEXES.welcome,
      decisionText: STARTS_AT_ISO,
    })
    await createDrip(u.id, {
      emailIndex: COHORT_DRIP_INDEXES.startsSoon,
      decisionText: STARTS_AT_ISO,
    })
    await createDrip(u.id, {
      emailIndex: COHORT_DRIP_INDEXES.upgradeNudge,
      decisionText: STARTS_AT_ISO,
    })

    const sent = await processPendingDrips(env.PUBLIC_APP_URL)

    expect(sent).toBe(2)
    const byIndex = new Map(
      (await testDb.query.dripEmails.findMany()).map((d) => [d.emailIndex, d.status]),
    )
    expect(byIndex.get(COHORT_DRIP_INDEXES.welcome)).toBe('sent')
    expect(byIndex.get(COHORT_DRIP_INDEXES.startsSoon)).toBe('sent')
    expect(byIndex.get(COHORT_DRIP_INDEXES.upgradeNudge)).toBe('skipped')
  })

  it('free-intro drips keep their behavior: old template, skipped entirely for paid users', async () => {
    const freeUser = await user()
    await createDrip(freeUser.id, { emailIndex: 0 })
    const paidUser = await user()
    await createTestSubscription(paidUser.id)
    await createDrip(paidUser.id, { emailIndex: 1 })

    const sent = await processPendingDrips(env.PUBLIC_APP_URL)

    expect(sent).toBe(1)
    const [to, msg] = firstSentMessage()
    expect(to).toBe(freeUser.email)
    expect(msg.subject).toBe('Did you act on your decision?')
    const paidDrip = (await testDb.query.dripEmails.findMany()).find(
      (d) => d.userId === paidUser.id,
    )
    expect(paidDrip?.status).toBe('skipped')
  })

  it('marks cohort drips with corrupt decisionText as skipped instead of retrying forever', async () => {
    const u = await user()
    await createDrip(u.id, {
      emailIndex: COHORT_DRIP_INDEXES.welcome,
      decisionText: 'not-a-date',
    })

    const sent = await processPendingDrips(env.PUBLIC_APP_URL)

    expect(sent).toBe(0)
    expect(mockSendEmail).not.toHaveBeenCalled()
    const drips = await testDb.query.dripEmails.findMany()
    expect(drips[0]?.status).toBe('skipped')
  })

  it('is idempotent — a second run sends nothing new', async () => {
    const u = await user()
    await createDrip(u.id, {
      emailIndex: COHORT_DRIP_INDEXES.welcome,
      decisionText: STARTS_AT_ISO,
    })

    const first = await processPendingDrips(env.PUBLIC_APP_URL)
    const second = await processPendingDrips(env.PUBLIC_APP_URL)

    expect(first).toBe(1)
    expect(second).toBe(0)
    expect(mockSendEmail).toHaveBeenCalledTimes(1)
  })
})
