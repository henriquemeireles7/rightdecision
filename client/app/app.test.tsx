import '@/platform/test/dom-preload'

import { afterEach, describe, expect, test } from 'bun:test'
import { cleanup, render } from '@testing-library/preact'
import { AppRoot } from './app'
import { setApiFetchForTests } from './lib/api'
import { catalogFixture, jsonFetch, setTestUrl } from './test-fixtures'

afterEach(() => {
  cleanup()
  setApiFetchForTests(null)
})

describe('component: AppRoot (route switch)', () => {
  test('deep link to /app/materials renders the Materials page in the shell', async () => {
    setTestUrl('/app/materials')
    setApiFetchForTests(jsonFetch({ 'GET /api/materials': { ok: true, data: { materials: [] } } }))
    const { findByRole } = render(<AppRoot />)
    expect(await findByRole('heading', { level: 1, name: 'Materials' })).toBeTruthy()
    expect(await findByRole('navigation', { name: 'Tab bar' })).toBeTruthy()
  })

  test('unknown /app path renders the not-found state with a way home', async () => {
    setTestUrl('/app/playbook')
    setApiFetchForTests(jsonFetch({}))
    const { findByText, findByRole } = render(<AppRoot />)
    expect(await findByText("That page isn't here")).toBeTruthy()
    expect(await findByRole('link', { name: 'Back to Home' })).toBeTruthy()
  })

  test('/app renders Home', async () => {
    setTestUrl('/app')
    setApiFetchForTests(
      jsonFetch({
        'GET /api/catalog': { ok: true, data: catalogFixture() },
        'GET /api/lives': { ok: true, data: { lives: [] } },
      }),
    )
    const { findByText } = render(<AppRoot />)
    expect(await findByText('Pick up where you left off')).toBeTruthy()
  })
})
