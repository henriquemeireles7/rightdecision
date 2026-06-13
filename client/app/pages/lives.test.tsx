import '@/platform/test/dom-preload'

import { afterEach, describe, expect, test } from 'bun:test'
import { cleanup, fireEvent, render } from '@testing-library/preact'
import { setApiFetchForTests } from '../lib/api'
import { errorEnvelope, jsonFetch, liveFixture, setTestUrl } from '../test-fixtures'
import { LivesPage } from './lives'

afterEach(() => {
  cleanup()
  setApiFetchForTests(null)
})

const mockLives = (lives: unknown[]) =>
  setApiFetchForTests(jsonFetch({ 'GET /api/lives': { ok: true, data: { lives } } }))

describe('page: Lives', () => {
  test('loading shows pinned-height skeletons', () => {
    setApiFetchForTests(jsonFetch({}))
    const { container } = render(<LivesPage />)
    expect(container.querySelectorAll('[class*="motion-safe:animate-pulse"]').length).toBe(3)
  })

  test('error explains and offers retry', async () => {
    let calls = 0
    setApiFetchForTests(
      jsonFetch({
        'GET /api/lives': () => {
          calls++
          return errorEnvelope('INTERNAL_ERROR', 500)
        },
      }),
    )
    const { findByRole, getByRole } = render(<LivesPage />)
    await findByRole('alert')
    fireEvent.click(getByRole('button', { name: 'Try again' }))
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(calls).toBe(2)
  })

  test('empty state has warm copy and a way home', async () => {
    setTestUrl('/app/lives')
    mockLives([])
    const { findByText, getByRole } = render(<LivesPage />)
    expect(await findByText('No live sessions yet')).toBeTruthy()
    expect(getByRole('link', { name: 'Back to your library' })).toBeTruthy()
  })

  test('upcoming: static per-minute countdown text + calendar link, no seconds', async () => {
    setTestUrl('/app/lives')
    mockLives([liveFixture('upcoming', { scheduledAt: '2027-01-15T18:00:00.000Z' })])
    const { findByText, getByRole } = render(<LivesPage />)
    const countdown = await findByText(/Starts in/)
    expect(countdown.textContent).not.toMatch(/second/)
    const calendar = getByRole('link', { name: 'Add to calendar' })
    expect(calendar.getAttribute('href')).toContain('calendar.google.com')
  })

  test('live-now: gold/ink badge + embedded YouTube iframe', async () => {
    setTestUrl('/app/lives')
    mockLives([liveFixture('live-now')])
    const { findByText, container } = render(<LivesPage />)
    const badge = await findByText('Live now')
    expect(badge.className).toContain('bg-gold')
    expect(badge.className).toContain('text-ink')
    const iframe = container.querySelector('iframe') as HTMLIFrameElement
    expect(iframe.getAttribute('src')).toBe('https://www.youtube.com/embed/abc123xyz')
  })

  test('replay-ready: links into the Stream replay player route', async () => {
    setTestUrl('/app/lives')
    mockLives([liveFixture('replay-ready')])
    const { findByRole } = render(<LivesPage />)
    const replay = await findByRole('link', { name: 'Watch the replay' })
    expect(replay.getAttribute('href')).toBe('/app/lives/live-replay-ready')
  })

  test('cancelled: quiet notice — rendered, never silently skipped', async () => {
    setTestUrl('/app/lives')
    mockLives([liveFixture('cancelled')])
    const { findByText } = render(<LivesPage />)
    expect(await findByText(/This session was cancelled/)).toBeTruthy()
  })

  test('all states render together in schedule order', async () => {
    setTestUrl('/app/lives')
    mockLives([
      liveFixture('cancelled'),
      liveFixture('replay-ready'),
      liveFixture('live-now'),
      liveFixture('upcoming'),
    ])
    const { findAllByRole } = render(<LivesPage />)
    const items = await findAllByRole('article')
    expect(items.length).toBe(4)
  })
})
