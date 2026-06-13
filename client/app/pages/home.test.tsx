import '@/platform/test/dom-preload'

import { afterEach, describe, expect, test } from 'bun:test'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/preact'
import { setApiFetchForTests } from '../lib/api'
import {
  catalogFixture,
  errorEnvelope,
  jsonFetch,
  liveFixture,
  lockedProgram,
  setTestUrl,
  unlockedProgram,
} from '../test-fixtures'
import { HomePage } from './home'

afterEach(() => {
  cleanup()
  setApiFetchForTests(null)
})

const mockHome = (catalog: unknown, lives: unknown[] = []) =>
  setApiFetchForTests(
    jsonFetch({
      'GET /api/catalog': { ok: true, data: catalog },
      'GET /api/lives': { ok: true, data: { lives } },
    }),
  )

describe('page: Home', () => {
  test('loading state shows pinned-aspect skeletons (zero CLS)', () => {
    setApiFetchForTests(jsonFetch({})) // never resolves usefully — assert sync frame
    const { container } = render(<HomePage />)
    const pulses = container.querySelectorAll('[class*="motion-safe:animate-pulse"]')
    expect(pulses.length).toBeGreaterThan(0)
    expect(container.querySelector('[class*="aspect-video"]')).toBeTruthy()
  })

  test('error state explains and retries (refetches the catalog)', async () => {
    let calls = 0
    setApiFetchForTests(
      jsonFetch({
        'GET /api/catalog': () => {
          calls++
          return errorEnvelope('INTERNAL_ERROR', 500)
        },
        'GET /api/lives': { ok: true, data: { lives: [] } },
      }),
    )
    const { findByRole, getByRole } = render(<HomePage />)
    await findByRole('alert')
    fireEvent.click(getByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(calls).toBe(2))
  })

  test('rails render under real h2 headings, unlocked BEFORE locked', async () => {
    setTestUrl('/app')
    mockHome(catalogFixture())
    const { findAllByRole } = render(<HomePage />)
    const headings = await findAllByRole('heading', { level: 2 })
    const texts = headings.map((h) => h.textContent ?? '')
    const unlockedIdx = texts.findIndex((t) => t.includes('The One Decision'))
    const lockedIdx = texts.findIndex((t) => t.includes('The Full Program'))
    expect(unlockedIdx).toBeGreaterThanOrEqual(0)
    expect(lockedIdx).toBeGreaterThan(unlockedIdx)
  })

  test('continue-watching rail renders a 16:9 resume card linking to the lesson', async () => {
    setTestUrl('/app')
    mockHome(catalogFixture())
    const { findAllByRole, container } = render(<HomePage />)
    await findAllByRole('heading', { level: 2 })
    const resume = container.querySelector('a[href="/app/lessons/lesson-1"]')
    expect(resume).toBeTruthy()
    expect(resume?.querySelector('[class*="aspect-video"]')).toBeTruthy()
  })

  test('first viewport answers "what next": resume hero when continue-watching exists', async () => {
    setTestUrl('/app')
    mockHome(catalogFixture())
    const { findByText } = render(<HomePage />)
    expect(await findByText('Pick up where you left off')).toBeTruthy()
  })

  test('hero falls back to the next live when nothing is in progress', async () => {
    setTestUrl('/app')
    mockHome(catalogFixture({ continueWatching: [] }), [liveFixture('upcoming')])
    const { findByText } = render(<HomePage />)
    expect(await findByText('Next live session')).toBeTruthy()
  })

  test('hero falls back to "start here" with no progress and no lives', async () => {
    setTestUrl('/app')
    mockHome(catalogFixture({ continueWatching: [] }))
    const { findByText } = render(<HomePage />)
    expect(await findByText('Start here')).toBeTruthy()
  })

  test('locked cards keep full-color covers and the ink-on-cream pill', async () => {
    setTestUrl('/app')
    mockHome(catalogFixture())
    const { findAllByText } = render(<HomePage />)
    const pills = await findAllByText('Full program')
    const pill = pills[0] as HTMLElement
    expect(pill.className).toContain('bg-cream')
    expect(pill.className).toContain('text-ink')
    expect(pill.closest('button')?.innerHTML ?? '').not.toMatch(/grayscale|blur/)
  })

  test('tapping a locked card opens the preview sheet with the upgrade CTA', async () => {
    setTestUrl('/app')
    mockHome(catalogFixture())
    const { findByText, findByRole } = render(<HomePage />)
    fireEvent.click(await findByText('The Decision Audit'))
    const cta = await findByRole('link', { name: 'Unlock the full program' })
    expect(cta.getAttribute('href')).toBe('/api/checkout/redirect')
  })

  test('tapping an unlocked module opens the sheet with playable lesson links', async () => {
    setTestUrl('/app')
    mockHome(catalogFixture())
    const { findByText, container } = render(<HomePage />)
    fireEvent.click(await findByText('Seeing Clearly'))
    await waitFor(() =>
      expect(container.querySelector('a[href="/app/lessons/lesson-2"]')).toBeTruthy(),
    )
  })

  test('pre-start cohort: warm welcome, localized start date, first live — no rails', async () => {
    setTestUrl('/app')
    mockHome(
      catalogFixture({
        cohortStartsAt: '2027-03-01T00:00:00.000Z',
        continueWatching: [],
        programs: [
          unlockedProgram({ cohortStartsAt: '2027-03-01T00:00:00.000Z' }),
          lockedProgram(),
        ],
      }),
      [liveFixture('upcoming', { scheduledAt: '2027-03-08T18:00:00.000Z' })],
    )
    const { findByText, queryAllByRole, getByText } = render(<HomePage />)
    expect(await findByText(/You're in/)).toBeTruthy()
    expect(getByText(/March/)).toBeTruthy() // Intl-localized start date
    expect(getByText('Your first live session')).toBeTruthy()
    expect(queryAllByRole('list').length).toBe(0) // no empty rails in the pre-start room
  })

  test('empty catalog renders the warm empty state, not a dead end', async () => {
    mockHome(catalogFixture({ programs: [], continueWatching: [] }))
    const { findByText, getByRole } = render(<HomePage />)
    expect(await findByText('Your library is on its way')).toBeTruthy()
    expect(getByRole('link', { name: 'Email us' })).toBeTruthy()
  })
})
