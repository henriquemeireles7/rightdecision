import '@/platform/test/dom-preload'

import { afterEach, describe, expect, test } from 'bun:test'
import { cleanup, fireEvent, render } from '@testing-library/preact'
import { useState } from 'preact/hooks'

/**
 * Canonical SPA component test — THE pattern P2/P3 copy.
 *
 * 1. `import '@/platform/test/dom-preload'` is the FIRST import — it registers the
 *    happy-dom global DOM (no-op if the bunfig.toml [test] preload already ran it).
 * 2. Render with @testing-library/preact, query by role, fire events, assert.
 * 3. ALWAYS `afterEach(cleanup)` — bun test has no global afterEach, so
 *    testing-library's auto-cleanup does not register itself.
 */

function Counter({ label }: { label: string }) {
  const [count, setCount] = useState(0)
  return (
    <button type="button" onClick={() => setCount((c) => c + 1)}>
      {label}: {count}
    </button>
  )
}

afterEach(cleanup)

describe('component: Counter (canonical SPA test example)', () => {
  test('renders initial state', () => {
    const { getByRole } = render(<Counter label="clicks" />)
    expect(getByRole('button').textContent).toBe('clicks: 0')
  })

  test('updates on interaction', () => {
    const { getByRole } = render(<Counter label="clicks" />)
    const button = getByRole('button')
    fireEvent.click(button)
    fireEvent.click(button)
    expect(button.textContent).toBe('clicks: 2')
  })
})
