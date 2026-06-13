import '@/platform/test/dom-preload'

import { afterEach, describe, expect, test } from 'bun:test'
import { act, cleanup, fireEvent, render } from '@testing-library/preact'
import { Link, navigate, parseRoute, useRoute } from './router'
import { setTestUrl } from './test-fixtures'

afterEach(cleanup)

describe('unit: parseRoute', () => {
  test('/app is home', () => {
    expect(parseRoute('/app')).toEqual({ name: 'home' })
    expect(parseRoute('/app/')).toEqual({ name: 'home' })
  })

  test('/app/lessons/:id is the lesson route', () => {
    expect(parseRoute('/app/lessons/abc-123')).toEqual({ name: 'lesson', lessonId: 'abc-123' })
  })

  test('/app/lives is the lives list', () => {
    expect(parseRoute('/app/lives')).toEqual({ name: 'lives' })
  })

  test('/app/lives/:id is the live replay route', () => {
    expect(parseRoute('/app/lives/live-1')).toEqual({ name: 'live', liveId: 'live-1' })
  })

  test('/app/materials is the materials route', () => {
    expect(parseRoute('/app/materials')).toEqual({ name: 'materials' })
  })

  test('unknown paths are not-found (never silently home)', () => {
    expect(parseRoute('/app/playbook')).toEqual({ name: 'not-found' })
    expect(parseRoute('/app/lessons')).toEqual({ name: 'not-found' })
    expect(parseRoute('/app/lessons/a/b')).toEqual({ name: 'not-found' })
  })
})

function RouteProbe() {
  const route = useRoute()
  return <output>{JSON.stringify(route)}</output>
}

describe('component: router navigation', () => {
  test('useRoute reflects navigate() updates', () => {
    setTestUrl('/app')
    const { getByRole } = render(<RouteProbe />)
    expect(getByRole('status').textContent).toContain('"home"')
    act(() => navigate('/app/materials'))
    expect(getByRole('status').textContent).toContain('"materials"')
  })

  test('useRoute responds to popstate (back button)', () => {
    setTestUrl('/app')
    const { getByRole } = render(<RouteProbe />)
    act(() => navigate('/app/lives'))
    expect(getByRole('status').textContent).toContain('"lives"')
    act(() => {
      history.pushState(null, '', '/app')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    expect(getByRole('status').textContent).toContain('"home"')
  })

  test('Link renders an anchor and navigates client-side on click', () => {
    setTestUrl('/app')
    const { getByRole } = render(
      <div>
        <Link href="/app/lives">Lives</Link>
        <RouteProbe />
      </div>,
    )
    const anchor = getByRole('link', { name: 'Lives' })
    expect(anchor.getAttribute('href')).toBe('/app/lives')
    fireEvent.click(anchor)
    expect(location.pathname).toBe('/app/lives')
    expect(getByRole('status').textContent).toContain('"lives"')
  })
})
