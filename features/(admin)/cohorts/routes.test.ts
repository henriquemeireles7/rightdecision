import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { asUser, installTestAuth } from '@/features/(admin)/test-helpers'

installTestAuth()

import { createTestCohort, createTestProgram, createTestUser } from '@/platform/test/factories'
import { apiCall, assertError, assertSuccess } from '@/platform/test/helpers'
import { setupTestDb, teardownTestDb } from '@/platform/test/setup'

const { adminCohortsRoutes } = await import('./routes')
const app = adminCohortsRoutes

describe('integration: cohorts routes', () => {
  let adminId: string
  beforeAll(setupTestDb)
  afterAll(teardownTestDb)
  beforeEach(async () => {
    await teardownTestDb()
    const admin = await createTestUser({ role: 'admin' })
    adminId = admin!.id
  })

  it('gates: 401 without session, 403 for non-admin', async () => {
    assertError(await apiCall(app, 'GET', '/suggestions'), 'UNAUTHORIZED')
    assertError(
      await apiCall(app, 'GET', '/suggestions', undefined, asUser('u', 'free')),
      'FORBIDDEN',
    )
  })

  it('lists cohorts per program with when filter', async () => {
    const program = await createTestProgram()
    await createTestCohort(program!.id, { startsAt: new Date('2099-01-04T12:00:00Z') })

    const res = await apiCall(
      app,
      'GET',
      `/?programId=${program!.id}&when=upcoming`,
      undefined,
      asUser(adminId),
    )
    const data = assertSuccess(res) as { cohorts: unknown[] }
    expect(data.cohorts).toHaveLength(1)
  })

  it('creates a manual cohort and rejects idempotency-key collisions', async () => {
    const program = await createTestProgram()
    const body = {
      programId: program!.id,
      title: 'Manual',
      startsAt: '2099-02-01T12:00:00.000Z',
    }
    const first = await apiCall(app, 'POST', '/', body, asUser(adminId))
    expect(first.status).toBe(201)

    const clash = await apiCall(app, 'POST', '/', body, asUser(adminId))
    assertError(clash, 'VALIDATION_ERROR')
  })

  it('updates a future cohort', async () => {
    const program = await createTestProgram()
    const cohort = await createTestCohort(program!.id, {
      startsAt: new Date('2099-03-01T12:00:00Z'),
    })
    const res = await apiCall(
      app,
      'PATCH',
      `/${cohort!.id}`,
      { title: 'Overridden', startsAt: '2099-03-08T12:00:00.000Z' },
      asUser(adminId),
    )
    const data = assertSuccess(res) as { cohort: { title: string } }
    expect(data.cohort.title).toBe('Overridden')
  })

  it('returns first-Monday suggestions', async () => {
    const res = await apiCall(app, 'GET', '/suggestions?months=2', undefined, asUser(adminId))
    const data = assertSuccess(res) as { suggestions: Array<{ startsAt: string; title: string }> }
    expect(data.suggestions).toHaveLength(2)
    expect(data.suggestions[0]?.title).toMatch(/^Cohort \d{4}-\d{2}$/)
  })

  it('400s invalid input', async () => {
    expect((await apiCall(app, 'GET', '/', undefined, asUser(adminId))).status).toBe(400)
    expect((await apiCall(app, 'POST', '/', { title: 'x' }, asUser(adminId))).status).toBe(400)
    expect((await apiCall(app, 'PATCH', '/nope', { title: 'x' }, asUser(adminId))).status).toBe(400)
  })
})
