import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { COHORT_DRIP_INDEXES } from '@/features/(shared)/drip-email/cohort-drips'
import { computeFirstMonday, nextMonthOf } from '@/features/(shared)/scheduler/date-math'
import { COHORT_START_HOUR } from '@/features/(shared)/scheduler/jobs'
import { env } from '@/platform/env'
import { createTestCohort, createTestProgram, createTestUser } from '@/platform/test/factories'
import { setupTestDb, teardownTestDb, testDb } from '@/platform/test/setup'
import { getNextCohort, JOIN_GRACE_DAYS, joinFreeCohort } from './service'

const DAY_MS = 24 * 60 * 60 * 1000
// 2026-06-12 is past June's first Monday (June 1) — create-on-read targets July 6.
const NOW = new Date('2026-06-12T15:00:00Z')

async function freeProgram() {
  const program = await createTestProgram()
  if (!program) throw new Error('failed to create program')
  return program
}

async function user() {
  const u = await createTestUser()
  if (!u) throw new Error('failed to create user')
  return u
}

describe('integration: getNextCohort', () => {
  beforeAll(setupTestDb)
  afterAll(teardownTestDb)
  beforeEach(teardownTestDb)

  it('returns the earliest upcoming cohort when the scheduler already created rows', async () => {
    const program = await freeProgram()
    await createTestCohort(program.id, { startsAt: new Date(NOW.getTime() + 30 * DAY_MS) })
    const sooner = await createTestCohort(program.id, {
      startsAt: new Date(NOW.getTime() + 10 * DAY_MS),
    })
    await createTestCohort(program.id, { startsAt: new Date(NOW.getTime() - 10 * DAY_MS) }) // past

    const next = await getNextCohort(program.slug, NOW)

    expect(next?.cohort.id).toBe(sooner?.id ?? '')
  })

  it('creates the next first-Monday cohort on read when none exists (never 404 the ad page)', async () => {
    const program = await freeProgram()

    const next = await getNextCohort(program.slug, NOW)

    const { year, month } = nextMonthOf(NOW, env.COHORT_TIMEZONE)
    const expected = computeFirstMonday(year, month, env.COHORT_TIMEZONE, COHORT_START_HOUR)
    expect(next?.cohort.startsAt.toISOString()).toBe(expected.toISOString())
    expect(await testDb.query.cohorts.findMany()).toHaveLength(1)
  })

  it("uses the CURRENT month's first Monday when it is still ahead", async () => {
    const program = await freeProgram()
    const beforeFirstMonday = new Date('2026-07-01T00:00:00Z') // July 2026 first Monday = July 6

    const next = await getNextCohort(program.slug, beforeFirstMonday)

    const expected = computeFirstMonday(2026, 7, env.COHORT_TIMEZONE, COHORT_START_HOUR)
    expect(next?.cohort.startsAt.toISOString()).toBe(expected.toISOString())
  })

  it('create-on-read is idempotent — two reads produce one row', async () => {
    const program = await freeProgram()

    const first = await getNextCohort(program.slug, NOW)
    const second = await getNextCohort(program.slug, NOW)

    expect(first?.cohort.id).toBe(second?.cohort.id ?? '')
    expect(await testDb.query.cohorts.findMany()).toHaveLength(1)
  })

  it('returns null only for an unknown program', async () => {
    expect(await getNextCohort('no-such-program', NOW)).toBeNull()
  })
})

describe('integration: joinFreeCohort (the ≤7-day rule)', () => {
  beforeAll(setupTestDb)
  afterAll(teardownTestDb)
  beforeEach(teardownTestDb)

  it('joins a cohort that started within the grace window (3 days ago)', async () => {
    const program = await freeProgram()
    const running = await createTestCohort(program.id, {
      startsAt: new Date(NOW.getTime() - 3 * DAY_MS),
    })
    const u = await user()

    const result = await joinFreeCohort(u.id, program.slug, NOW)

    expect(result?.cohort.id).toBe(running?.id ?? '')
    expect(result?.enrollment).toMatchObject({
      userId: u.id,
      programId: program.id,
      cohortId: running?.id,
      source: 'signup',
      status: 'active',
    })
  })

  it('boundary: a cohort that started exactly JOIN_GRACE_DAYS ago still counts', async () => {
    const program = await freeProgram()
    const boundary = await createTestCohort(program.id, {
      startsAt: new Date(NOW.getTime() - JOIN_GRACE_DAYS * DAY_MS),
    })
    const u = await user()

    const result = await joinFreeCohort(u.id, program.slug, NOW)

    expect(result?.cohort.id).toBe(boundary?.id ?? '')
  })

  it('a cohort that started more than 7 days ago is closed — joins the next upcoming instead', async () => {
    const program = await freeProgram()
    await createTestCohort(program.id, { startsAt: new Date(NOW.getTime() - 8 * DAY_MS) })
    const upcoming = await createTestCohort(program.id, {
      startsAt: new Date(NOW.getTime() + 20 * DAY_MS),
    })
    const u = await user()

    const result = await joinFreeCohort(u.id, program.slug, NOW)

    expect(result?.cohort.id).toBe(upcoming?.id ?? '')
  })

  it('with only a stale cohort and nothing upcoming, creates the next cohort on read', async () => {
    const program = await freeProgram()
    await createTestCohort(program.id, { startsAt: new Date(NOW.getTime() - 40 * DAY_MS) })
    const u = await user()

    const result = await joinFreeCohort(u.id, program.slug, NOW)

    const { year, month } = nextMonthOf(NOW, env.COHORT_TIMEZONE)
    const expected = computeFirstMonday(year, month, env.COHORT_TIMEZONE, COHORT_START_HOUR)
    expect(result?.cohort.startsAt.toISOString()).toBe(expected.toISOString())
  })

  it('records cohort_joined + enrollment_created on first join', async () => {
    const program = await freeProgram()
    const cohort = await createTestCohort(program.id, {
      startsAt: new Date(NOW.getTime() + 10 * DAY_MS),
    })
    const u = await user()

    await joinFreeCohort(u.id, program.slug, NOW)

    const events = await testDb.query.events.findMany()
    const names = events.map((e) => e.name).sort()
    expect(names).toEqual(['cohort_joined', 'enrollment_created'])
    const joined = events.find((e) => e.name === 'cohort_joined')
    expect(joined?.properties).toEqual({ programId: program.id, cohortId: cohort?.id })
    expect(joined?.userId).toBe(u.id)
  })

  it('re-join UPDATEs cohortId on the same row (TD-2) and records cohort_joined again, not enrollment_created', async () => {
    const program = await freeProgram()
    await createTestCohort(program.id, { startsAt: new Date(NOW.getTime() - 3 * DAY_MS) })
    const u = await user()
    const first = await joinFreeCohort(u.id, program.slug, NOW)

    const later = new Date(NOW.getTime() + 30 * DAY_MS)
    const nextCohort = await createTestCohort(program.id, {
      startsAt: new Date(later.getTime() + 5 * DAY_MS),
    })
    const second = await joinFreeCohort(u.id, program.slug, later)

    expect(second?.enrollment.id).toBe(first?.enrollment.id ?? '')
    expect(second?.enrollment.cohortId).toBe(nextCohort?.id ?? null)
    expect(await testDb.query.enrollments.findMany()).toHaveLength(1)
    const names = (await testDb.query.events.findMany()).map((e) => e.name)
    expect(names.filter((n) => n === 'cohort_joined')).toHaveLength(2)
    expect(names.filter((n) => n === 'enrollment_created')).toHaveLength(1)
  })

  it('schedules the cohort drip sequence on join', async () => {
    const program = await freeProgram()
    await createTestCohort(program.id, { startsAt: new Date(NOW.getTime() + 10 * DAY_MS) })
    const u = await user()

    await joinFreeCohort(u.id, program.slug, NOW)

    const drips = await testDb.query.dripEmails.findMany()
    const indexes = drips.map((d) => d.emailIndex).sort()
    expect(indexes).toEqual([
      COHORT_DRIP_INDEXES.welcome,
      COHORT_DRIP_INDEXES.startsSoon,
      COHORT_DRIP_INDEXES.upgradeNudge,
    ])
  })

  it('returns null for an unknown program', async () => {
    const u = await user()
    expect(await joinFreeCohort(u.id, 'no-such-program', NOW)).toBeNull()
  })
})
