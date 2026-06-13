import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { computeFirstMonday, nextMonthOf } from '@/features/(shared)/scheduler/date-math'
import { COHORT_START_HOUR } from '@/features/(shared)/scheduler/jobs'
import { env } from '@/platform/env'
import { createTestCohort, createTestProgram } from '@/platform/test/factories'
import { setupTestDb, teardownTestDb } from '@/platform/test/setup'
import { createCohort, listCohorts, suggestCohorts, updateCohort } from './service'

const MISSING_ID = '00000000-0000-0000-0000-000000000000'
const NOW = new Date('2026-06-12T12:00:00Z')
const FUTURE = new Date('2026-08-03T12:00:00Z')
const PAST = new Date('2026-05-04T12:00:00Z')

describe('integration: cohorts service', () => {
  beforeAll(setupTestDb)
  afterAll(teardownTestDb)
  beforeEach(async () => {
    await teardownTestDb()
  })

  it('lists upcoming and past cohorts derived from dates', async () => {
    const program = await createTestProgram()
    const past = await createTestCohort(program!.id, { startsAt: PAST })
    const future = await createTestCohort(program!.id, { startsAt: FUTURE })

    const upcoming = await listCohorts(program!.id, 'upcoming', NOW)
    if ('error' in upcoming) throw new Error(upcoming.error)
    expect(upcoming.cohorts.map((c) => c.id)).toEqual([future!.id])

    const pastResult = await listCohorts(program!.id, 'past', NOW)
    if ('error' in pastResult) throw new Error(pastResult.error)
    expect(pastResult.cohorts.map((c) => c.id)).toEqual([past!.id])

    const all = await listCohorts(program!.id, 'all', NOW)
    if ('error' in all) throw new Error(all.error)
    expect(all.cohorts).toHaveLength(2)

    expect(await listCohorts(MISSING_ID, 'all', NOW)).toEqual({ error: 'PROGRAM_NOT_FOUND' })
  })

  it('creates a manual cohort with custom dates', async () => {
    const program = await createTestProgram()
    const result = await createCohort({
      programId: program!.id,
      title: 'Special Cohort',
      startsAt: FUTURE,
      endsAt: new Date('2026-08-31T12:00:00Z'),
    })
    if ('error' in result) throw new Error(result.error)
    expect(result.cohort.title).toBe('Special Cohort')
    expect(result.cohort.startsAt.toISOString()).toBe(FUTURE.toISOString())
  })

  it('returns PROGRAM_NOT_FOUND for a missing program', async () => {
    expect(await createCohort({ programId: MISSING_ID, title: 'x', startsAt: FUTURE })).toEqual({
      error: 'PROGRAM_NOT_FOUND',
    })
  })

  it('refuses to collide with the cron idempotency key (programId, startsAt)', async () => {
    const program = await createTestProgram()
    await createTestCohort(program!.id, { startsAt: FUTURE })
    const result = await createCohort({ programId: program!.id, title: 'Clash', startsAt: FUTURE })
    expect(result).toMatchObject({ error: 'VALIDATION_ERROR' })
  })

  it('updates a future cohort (date override)', async () => {
    const program = await createTestProgram()
    const cohort = await createTestCohort(program!.id, { startsAt: FUTURE })
    const newStart = new Date('2026-08-10T12:00:00Z')

    const result = await updateCohort(cohort!.id, { startsAt: newStart, title: 'Moved' }, NOW)
    if ('error' in result) throw new Error(result.error)
    expect(result.cohort.startsAt.toISOString()).toBe(newStart.toISOString())
    expect(result.cohort.title).toBe('Moved')

    expect(await updateCohort(MISSING_ID, { title: 'x' }, NOW)).toEqual({
      error: 'COHORT_NOT_FOUND',
    })
  })

  it('refuses to edit an already-started cohort', async () => {
    const program = await createTestProgram()
    const cohort = await createTestCohort(program!.id, { startsAt: PAST })
    const result = await updateCohort(cohort!.id, { title: 'Too late' }, NOW)
    expect(result).toMatchObject({ error: 'VALIDATION_ERROR' })
  })

  it('refuses to move a cohort onto an existing (programId, startsAt)', async () => {
    const program = await createTestProgram()
    await createTestCohort(program!.id, { startsAt: FUTURE })
    const other = await createTestCohort(program!.id, {
      startsAt: new Date('2026-09-07T12:00:00Z'),
    })
    const result = await updateCohort(other!.id, { startsAt: FUTURE }, NOW)
    expect(result).toMatchObject({ error: 'VALIDATION_ERROR' })
  })

  it('suggests the same first-Monday instants the cron would create', async () => {
    const { suggestions } = suggestCohorts(3, NOW)
    expect(suggestions).toHaveLength(3)

    const { year, month } = nextMonthOf(NOW, env.COHORT_TIMEZONE)
    const expectedFirst = computeFirstMonday(year, month, env.COHORT_TIMEZONE, COHORT_START_HOUR)
    expect(suggestions[0]?.startsAt.toISOString()).toBe(expectedFirst.toISOString())
    expect(suggestions[0]?.title).toBe(`Cohort ${year}-${String(month).padStart(2, '0')}`)

    // strictly increasing months
    const instants = suggestions.map((s) => s.startsAt.getTime())
    expect([...instants].sort((a, b) => a - b)).toEqual(instants)
    expect(new Set(instants).size).toBe(3)
  })
})
