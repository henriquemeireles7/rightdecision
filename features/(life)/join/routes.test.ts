import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { setV2CutoverOverrideForTests } from '@/platform/auth/enrollment'
import { FREE_PROGRAM_SLUG } from '@/platform/programs'
import { createTestCohort, createTestProgram, createTestUser } from '@/platform/test/factories'
import { apiCall, assertError, assertSuccess, stubAuth } from '@/platform/test/helpers'
import { setupTestDb, teardownTestDb, testDb } from '@/platform/test/setup'
import { createJoinRoutes, joinRoutes } from './routes'

const DAY_MS = 24 * 60 * 60 * 1000

async function authedApp() {
  const user = await createTestUser()
  if (!user) throw new Error('failed to create user')
  return { user, app: createJoinRoutes({ auth: stubAuth(user) }) }
}

describe('integration: join routes (cutover both states in one suite)', () => {
  beforeAll(setupTestDb)
  afterAll(() => {
    setV2CutoverOverrideForTests(undefined)
    return teardownTestDb()
  })
  beforeEach(teardownTestDb)
  afterEach(() => setV2CutoverOverrideForTests(undefined))

  describe('GET /next-cohort', () => {
    it('flag OFF: 404 — the evergreen funnel stays the only public surface', async () => {
      setV2CutoverOverrideForTests(false)
      await createTestProgram({ slug: FREE_PROGRAM_SLUG })

      const response = await apiCall(joinRoutes, 'GET', '/next-cohort')

      assertError(response, 'NOT_FOUND')
      expect(await testDb.query.cohorts.findMany()).toHaveLength(0) // no create-on-read pre-cutover
    })

    it('flag ON: returns the next cohort with startsAt as a raw ISO instant', async () => {
      setV2CutoverOverrideForTests(true)
      const program = await createTestProgram({ slug: FREE_PROGRAM_SLUG })
      const startsAt = new Date(Date.now() + 12 * DAY_MS)
      const cohort = await createTestCohort(program?.id ?? '', { startsAt })

      const response = await apiCall(joinRoutes, 'GET', '/next-cohort')

      const data = assertSuccess(response) as {
        programSlug: string
        cohortId: string
        startsAt: string
      }
      expect(data.programSlug).toBe(FREE_PROGRAM_SLUG)
      expect(data.cohortId).toBe(cohort?.id ?? '')
      expect(data.startsAt).toBe(startsAt.toISOString()) // instant, not a formatted string
    })

    it('flag ON with no cohort rows: creates one on read instead of 404ing the ad page', async () => {
      setV2CutoverOverrideForTests(true)
      await createTestProgram({ slug: FREE_PROGRAM_SLUG })

      const response = await apiCall(joinRoutes, 'GET', '/next-cohort')

      const data = assertSuccess(response) as { startsAt: string }
      expect(new Date(data.startsAt).getTime()).toBeGreaterThan(Date.now())
      expect(await testDb.query.cohorts.findMany()).toHaveLength(1)
    })

    it('flag ON: 404 PROGRAM_NOT_FOUND for an unknown program slug', async () => {
      setV2CutoverOverrideForTests(true)

      const response = await apiCall(joinRoutes, 'GET', '/next-cohort?program=nope')

      assertError(response, 'PROGRAM_NOT_FOUND')
    })

    it('flag ON: records cohort_page_viewed with the pre-auth anonymousId when provided', async () => {
      setV2CutoverOverrideForTests(true)
      await createTestProgram({ slug: FREE_PROGRAM_SLUG })

      await apiCall(joinRoutes, 'GET', '/next-cohort?anonymousId=anon-123')

      const events = await testDb.query.events.findMany()
      const viewed = events.find((e) => e.name === 'cohort_page_viewed')
      expect(viewed?.anonymousId).toBe('anon-123')
      expect(viewed?.userId).toBeNull()
    })

    it('flag ON without anonymousId: no funnel event, data still returned', async () => {
      setV2CutoverOverrideForTests(true)
      await createTestProgram({ slug: FREE_PROGRAM_SLUG })

      const response = await apiCall(joinRoutes, 'GET', '/next-cohort')

      assertSuccess(response)
      expect(await testDb.query.events.findMany()).toHaveLength(0)
    })
  })

  describe('POST /', () => {
    it('401 UNAUTHORIZED without a session (real requireAuth on the production routes)', async () => {
      setV2CutoverOverrideForTests(true)
      await createTestProgram({ slug: FREE_PROGRAM_SLUG })

      const response = await apiCall(joinRoutes, 'POST', '/', {})

      assertError(response, 'UNAUTHORIZED')
    })

    it('flag OFF: 404 even for an authenticated user — join flow does not exist pre-cutover', async () => {
      setV2CutoverOverrideForTests(false)
      await createTestProgram({ slug: FREE_PROGRAM_SLUG })
      const { app } = await authedApp()

      const response = await apiCall(app, 'POST', '/', {})

      assertError(response, 'NOT_FOUND')
      expect(await testDb.query.enrollments.findMany()).toHaveLength(0)
    })

    it('flag ON: enrolls the authenticated user into the right cohort', async () => {
      setV2CutoverOverrideForTests(true)
      const program = await createTestProgram({ slug: FREE_PROGRAM_SLUG })
      const cohort = await createTestCohort(program?.id ?? '', {
        startsAt: new Date(Date.now() + 10 * DAY_MS),
      })
      const { user, app } = await authedApp()

      const response = await apiCall(app, 'POST', '/', {})

      const data = assertSuccess(response) as {
        enrollmentId: string
        cohortId: string
        startsAt: string
      }
      expect(data.cohortId).toBe(cohort?.id ?? '')
      const rows = await testDb.query.enrollments.findMany()
      expect(rows).toHaveLength(1)
      expect(rows[0]?.userId).toBe(user.id)
      expect(rows[0]?.source).toBe('signup')
    })

    it('flag ON: 404 PROGRAM_NOT_FOUND for an unknown program', async () => {
      setV2CutoverOverrideForTests(true)
      const { app } = await authedApp()

      const response = await apiCall(app, 'POST', '/', { program: 'nope' })

      assertError(response, 'PROGRAM_NOT_FOUND')
    })
  })
})
