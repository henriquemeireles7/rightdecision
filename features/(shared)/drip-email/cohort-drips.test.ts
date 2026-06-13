import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { dripEmails } from '@/platform/db/schema'
import { createTestUser } from '@/platform/test/factories'
import { setupTestDb, teardownTestDb, testDb } from '@/platform/test/setup'
import { COHORT_DRIP_INDEXES, scheduleCohortDripSequence } from './cohort-drips'

const DAY_MS = 24 * 60 * 60 * 1000
const NOW = new Date('2026-06-12T15:00:00Z')
// First Monday of July 2026 at 9:00 São Paulo = 12:00 UTC
const STARTS_AT = new Date('2026-07-06T12:00:00Z')

async function user() {
  const u = await createTestUser()
  if (!u) throw new Error('failed to create test user')
  return u
}

async function allDrips() {
  return testDb.query.dripEmails.findMany({ orderBy: dripEmails.emailIndex })
}

describe('integration: scheduleCohortDripSequence', () => {
  beforeAll(setupTestDb)
  afterAll(teardownTestDb)
  beforeEach(teardownTestDb)

  it('schedules welcome now, starts-soon at T-1 day, upgrade nudge at start+3 days (defaults)', async () => {
    const u = await user()

    const scheduled = await scheduleCohortDripSequence({
      userId: u.id,
      cohortStartsAt: STARTS_AT,
      now: NOW,
    })

    expect(scheduled).toBe(3)
    const drips = await allDrips()
    expect(drips).toHaveLength(3)
    const byIndex = new Map(drips.map((d) => [d.emailIndex, d]))

    const welcome = byIndex.get(COHORT_DRIP_INDEXES.welcome)
    expect(welcome?.scheduledAt.getTime()).toBe(NOW.getTime())
    const startsSoon = byIndex.get(COHORT_DRIP_INDEXES.startsSoon)
    expect(startsSoon?.scheduledAt.getTime()).toBe(STARTS_AT.getTime() - 1 * DAY_MS)
    const nudge = byIndex.get(COHORT_DRIP_INDEXES.upgradeNudge)
    expect(nudge?.scheduledAt.getTime()).toBe(STARTS_AT.getTime() + 3 * DAY_MS)

    // Cohort drips carry the cohort-start instant in decisionText (documented reuse)
    for (const drip of drips) {
      expect(drip.decisionText).toBe(STARTS_AT.toISOString())
      expect(drip.status).toBe('pending')
    }
  })

  it('respects configurable day offsets', async () => {
    const u = await user()

    await scheduleCohortDripSequence({
      userId: u.id,
      cohortStartsAt: STARTS_AT,
      now: NOW,
      offsets: { startsSoonDaysBefore: 2, upgradeNudgeDaysAfter: 7 },
    })

    const drips = await allDrips()
    const byIndex = new Map(drips.map((d) => [d.emailIndex, d]))
    expect(byIndex.get(COHORT_DRIP_INDEXES.startsSoon)?.scheduledAt.getTime()).toBe(
      STARTS_AT.getTime() - 2 * DAY_MS,
    )
    expect(byIndex.get(COHORT_DRIP_INDEXES.upgradeNudge)?.scheduledAt.getTime()).toBe(
      STARTS_AT.getTime() + 7 * DAY_MS,
    )
  })

  it('joining a running cohort skips sends whose time already passed', async () => {
    const u = await user()
    const startedTwoDaysAgo = new Date(NOW.getTime() - 2 * DAY_MS)

    const scheduled = await scheduleCohortDripSequence({
      userId: u.id,
      cohortStartsAt: startedTwoDaysAgo,
      now: NOW,
    })

    // starts-soon (T-1 day) is in the past — only welcome + upgrade nudge
    expect(scheduled).toBe(2)
    const drips = await allDrips()
    const indexes = drips.map((d) => d.emailIndex).sort()
    expect(indexes).toEqual([COHORT_DRIP_INDEXES.welcome, COHORT_DRIP_INDEXES.upgradeNudge])
  })

  it('is deduped per (userId, emailIndex): re-join reschedules pending rows to the new cohort', async () => {
    const u = await user()
    await scheduleCohortDripSequence({ userId: u.id, cohortStartsAt: STARTS_AT, now: NOW })

    const laterCohort = new Date('2026-08-03T12:00:00Z')
    await scheduleCohortDripSequence({ userId: u.id, cohortStartsAt: laterCohort, now: NOW })

    const drips = await allDrips()
    expect(drips).toHaveLength(3) // no duplicates
    const byIndex = new Map(drips.map((d) => [d.emailIndex, d]))
    expect(byIndex.get(COHORT_DRIP_INDEXES.startsSoon)?.scheduledAt.getTime()).toBe(
      laterCohort.getTime() - 1 * DAY_MS,
    )
    expect(byIndex.get(COHORT_DRIP_INDEXES.startsSoon)?.decisionText).toBe(
      laterCohort.toISOString(),
    )
  })

  it('never reschedules or resends already-sent rows', async () => {
    const u = await user()
    await scheduleCohortDripSequence({ userId: u.id, cohortStartsAt: STARTS_AT, now: NOW })
    const sentAt = new Date('2026-06-12T16:00:00Z')
    await testDb.update(dripEmails).set({ status: 'sent', sentAt })

    const laterCohort = new Date('2026-08-03T12:00:00Z')
    const scheduled = await scheduleCohortDripSequence({
      userId: u.id,
      cohortStartsAt: laterCohort,
      now: NOW,
    })

    expect(scheduled).toBe(0)
    const drips = await allDrips()
    for (const drip of drips) {
      expect(drip.status).toBe('sent')
      expect(drip.decisionText).toBe(STARTS_AT.toISOString()) // untouched
    }
  })

  it('cohort indexes never collide with the free-intro namespace (0-2)', () => {
    for (const index of Object.values(COHORT_DRIP_INDEXES)) {
      expect(index).toBeGreaterThanOrEqual(100)
    }
  })
})
