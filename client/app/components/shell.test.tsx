import '@/platform/test/dom-preload'

import { afterEach, describe, expect, test } from 'bun:test'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/preact'
import { setApiFetchForTests } from '../lib/api'
import { jsonFetch, setTestUrl } from '../test-fixtures'
import { Shell } from './shell'

afterEach(() => {
  cleanup()
  setApiFetchForTests(null)
})

const renderShell = (routeName: 'home' | 'playbook' | 'journal' | 'lives' | 'materials') =>
  render(
    <Shell route={routeName === 'home' ? { name: 'home' } : { name: routeName }}>
      <p>content</p>
    </Shell>,
  )

describe('component: Shell', () => {
  test('renders the Instrument Serif logo as a home link', () => {
    setTestUrl('/app')
    const { getAllByRole } = renderShell('home')
    const logo = getAllByRole('link', { name: 'Right Decision' })[0]
    expect(logo?.getAttribute('href')).toBe('/app')
    expect(logo?.className).toContain('font-display')
  })

  test('shows ONLY shipped waves — P6 ships Chat as a primary tab; never "Coming soon"', () => {
    setTestUrl('/app')
    const { queryByText, getAllByRole } = renderShell('home')
    const labels = getAllByRole('link').map((a) => a.textContent)
    for (const shipped of ['Home', 'Playbook', 'Journal', 'Chat', 'Lives', 'Materials']) {
      expect(labels).toContain(shipped)
    }
    expect(queryByText('Coming soon')).toBeNull()
  })

  test('mobile tab bar order is Home, Playbook, Journal, Chat, Lives, Materials (6 tabs)', () => {
    setTestUrl('/app')
    const { getByLabelText } = renderShell('home')
    const tabBar = getByLabelText('Tab bar')
    const labels = Array.from(tabBar.querySelectorAll('a')).map((a) => a.textContent)
    expect(labels).toEqual(['Home', 'Playbook', 'Journal', 'Chat', 'Lives', 'Materials'])
  })

  test('playbook page routes highlight Playbook; journal highlights Journal', () => {
    setTestUrl('/app/playbook/tpl-1/pg-1')
    const { getAllByRole } = render(
      <Shell route={{ name: 'playbook-page', templateId: 'tpl-1', pageId: 'pg-1' }}>
        <p>content</p>
      </Shell>,
    )
    const playbook = getAllByRole('link', { name: 'Playbook' })[0]
    expect(playbook?.getAttribute('aria-current')).toBe('page')
  })

  test('renders both a desktop nav and a mobile tab bar', () => {
    setTestUrl('/app')
    const { getByLabelText } = renderShell('home')
    expect(getByLabelText('Main')).toBeTruthy()
    expect(getByLabelText('Tab bar')).toBeTruthy()
  })

  test('active item carries aria-current and the gold class in BOTH navs', () => {
    setTestUrl('/app/lives')
    const { getAllByRole } = renderShell('lives')
    const liveLinks = getAllByRole('link', { name: 'Lives' })
    expect(liveLinks.length).toBe(2)
    for (const link of liveLinks) {
      expect(link.getAttribute('aria-current')).toBe('page')
      expect(link.className).toContain('text-gold')
    }
    for (const link of getAllByRole('link', { name: 'Home' })) {
      expect(link.getAttribute('aria-current')).toBeNull()
      expect(link.className).not.toContain('text-gold')
    }
  })

  test('lesson route highlights Home (lessons live under Home)', () => {
    setTestUrl('/app/lessons/abc')
    const { getAllByRole } = render(
      <Shell route={{ name: 'lesson', lessonId: 'abc' }}>
        <p>content</p>
      </Shell>,
    )
    const home = getAllByRole('link', { name: 'Home' })[0]
    expect(home?.getAttribute('aria-current')).toBe('page')
  })

  test('account menu opens with Manage billing and Log out', () => {
    setTestUrl('/app')
    const { getByRole } = renderShell('home')
    fireEvent.click(getByRole('button', { name: 'Account' }))
    expect(getByRole('menuitem', { name: 'Manage billing' })).toBeTruthy()
    expect(getByRole('menuitem', { name: 'Log out' })).toBeTruthy()
  })

  test('Manage billing fetches the portal URL and navigates there', async () => {
    setTestUrl('/app')
    setApiFetchForTests(
      jsonFetch({
        'POST /api/subscription/portal': {
          ok: true,
          data: { url: 'https://billing.stripe.com/x' },
        },
      }),
    )
    const { getByRole } = renderShell('home')
    fireEvent.click(getByRole('button', { name: 'Account' }))
    fireEvent.click(getByRole('menuitem', { name: 'Manage billing' }))
    await waitFor(() => expect(location.href).toContain('billing.stripe.com'))
  })

  test('Log out signs out then lands on /login', async () => {
    setTestUrl('/app')
    let signedOut = false
    setApiFetchForTests(
      jsonFetch({
        'POST /api/auth/sign-out': () => {
          signedOut = true
          return new Response('{}', { headers: { 'content-type': 'application/json' } })
        },
      }),
    )
    const { getByRole } = renderShell('home')
    fireEvent.click(getByRole('button', { name: 'Account' }))
    fireEvent.click(getByRole('menuitem', { name: 'Log out' }))
    await waitFor(() => expect(location.pathname).toBe('/login'))
    expect(signedOut).toBe(true)
  })

  test('tab bar links meet the 44px target via min-h-11', () => {
    setTestUrl('/app')
    const { getByLabelText } = renderShell('home')
    const tabBar = getByLabelText('Tab bar')
    for (const link of Array.from(tabBar.querySelectorAll('a'))) {
      expect(link.className).toContain('min-h-11')
    }
  })
})
