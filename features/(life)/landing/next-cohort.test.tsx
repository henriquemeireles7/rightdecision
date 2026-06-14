import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { setV2CutoverOverrideForTests } from '@/platform/auth/enrollment'
import { FREE_PROGRAM_SLUG } from '@/platform/programs'
import { renderPage } from '@/platform/server/render'
import { createTestCohort, createTestProgram } from '@/platform/test/factories'
import { setupTestDb, teardownTestDb, testDb } from '@/platform/test/setup'
import { NextCohortNotice } from './components/next-cohort'
import { LandingPage } from './landing'
import { landingRoutes } from './routes'

const TIMEZONE = 'America/Sao_Paulo'
// First Monday of July 2026 at 9:00 São Paulo = 12:00 UTC
const STARTS_AT = new Date('2026-07-06T12:00:00Z')

async function getLanding() {
  const response = await landingRoutes.fetch(new Request('http://localhost/'))
  return { status: response.status, html: await response.text() }
}

describe('NextCohortNotice component', () => {
  it('renders the localizable instant in <time datetime> plus a server-formatted fallback', () => {
    const html = renderPage(<NextCohortNotice startsAt={STARTS_AT} timezone={TIMEZONE} />, {
      title: 't',
      description: 'd',
    })
    expect(html).toContain(`datetime="${STARTS_AT.toISOString()}"`)
    expect(html).toContain('July 6') // formatted in the cohort timezone
    expect(html).toContain('Next free cohort starts')
  })
})

describe('LandingPage cohort slot', () => {
  it('renders the notice only when a start date is provided (flag-gated by the route)', () => {
    const withDate = renderPage(
      <LandingPage variant="a" nextCohortStartsAt={STARTS_AT} cohortTimezone={TIMEZONE} />,
      { title: 't', description: 'd' },
    )
    const without = renderPage(<LandingPage variant="a" />, { title: 't', description: 'd' })
    expect(withDate).toContain('Next free cohort starts')
    expect(without).not.toContain('Next free cohort starts')
  })
})

describe('integration: landing route cohort data path (flag both states)', () => {
  beforeAll(setupTestDb)
  afterAll(() => {
    setV2CutoverOverrideForTests(undefined)
    return teardownTestDb()
  })
  beforeEach(teardownTestDb)
  afterEach(() => setV2CutoverOverrideForTests(undefined))

  it('flag OFF: landing renders exactly as today — no cohort fetch, no notice', async () => {
    setV2CutoverOverrideForTests(false)
    await createTestProgram({ slug: FREE_PROGRAM_SLUG })

    const { status, html } = await getLanding()

    expect(status).toBe(200)
    expect(html).not.toContain('Next free cohort starts')
    expect(await testDb.query.cohorts.findMany()).toHaveLength(0) // no create-on-read
  })

  it('flag ON: landing shows the next cohort date from the cohorts table', async () => {
    setV2CutoverOverrideForTests(true)
    const program = await createTestProgram({ slug: FREE_PROGRAM_SLUG })
    await createTestCohort(program?.id ?? '', { startsAt: STARTS_AT })

    const { status, html } = await getLanding()

    expect(status).toBe(200)
    expect(html).toContain('Next free cohort starts')
    expect(html).toContain(`datetime="${STARTS_AT.toISOString()}"`)
  })

  it('flag ON: rolling over to a later cohort changes the page without code edits', async () => {
    setV2CutoverOverrideForTests(true)
    const program = await createTestProgram({ slug: FREE_PROGRAM_SLUG })
    const later = new Date('2026-08-03T12:00:00Z')
    await createTestCohort(program?.id ?? '', { startsAt: later })

    const { html } = await getLanding()

    expect(html).toContain(`datetime="${later.toISOString()}"`)
  })

  it('flag ON but program missing: landing still renders, just without the notice', async () => {
    setV2CutoverOverrideForTests(true)

    const { status, html } = await getLanding()

    expect(status).toBe(200)
    expect(html).not.toContain('Next free cohort starts')
  })
})
