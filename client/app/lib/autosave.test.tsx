import '@/platform/test/dom-preload'

import { afterEach, describe, expect, test } from 'bun:test'
import { act, cleanup, render, waitFor } from '@testing-library/preact'
import { manualScheduler } from '../test-fixtures'
import { AUTOSAVE_DELAY_MS, type AutosaveHandle, useAutosave } from './autosave'

afterEach(cleanup)

/** Probe exposing the hook's handle + visible state for assertions. */
function Probe({
  save,
  scheduler,
  handle,
}: {
  save: (value: string) => Promise<unknown>
  scheduler: ReturnType<typeof manualScheduler>
  handle: { current: AutosaveHandle | null }
}) {
  const autosave = useAutosave(save, { scheduler })
  handle.current = autosave
  return <output data-testid="state">{autosave.state.kind}</output>
}

function setup(save: (value: string) => Promise<unknown>) {
  const scheduler = manualScheduler()
  const handle: { current: AutosaveHandle | null } = { current: null }
  const utils = render(<Probe save={save} scheduler={scheduler} handle={handle} />)
  return { scheduler, handle, utils }
}

describe('hook: useAutosave', () => {
  test('debounces typing at 800ms — nothing saves until the timer fires', async () => {
    const saved: string[] = []
    const { scheduler, handle, utils } = setup(async (v) => saved.push(v))

    act(() => handle.current?.queue('d'))
    act(() => handle.current?.queue('de'))
    act(() => handle.current?.queue('decide'))
    expect(saved).toEqual([])
    expect(scheduler.delays.every((ms) => ms === AUTOSAVE_DELAY_MS)).toBe(true)
    // re-typing reset the debounce — exactly one timer is live
    expect(scheduler.pending()).toBe(1)

    act(() => scheduler.flush())
    await waitFor(() => expect(saved).toEqual(['decide']))
    await waitFor(() => expect(utils.getByTestId('state').textContent).toBe('saved'))
  })

  test('typing shows NO spinner state — pending is quiet until saved', () => {
    const { handle, utils } = setup(async () => {})
    act(() => handle.current?.queue('thinking'))
    expect(utils.getByTestId('state').textContent).toBe('pending')
  })

  test('blur flushes immediately without waiting for the debounce', async () => {
    const saved: string[] = []
    const { scheduler, handle } = setup(async (v) => saved.push(v))
    act(() => handle.current?.queue('said on blur'))
    act(() => handle.current?.flush())
    await waitFor(() => expect(saved).toEqual(['said on blur']))
    expect(scheduler.pending()).toBe(0)
  })

  test('failed save keeps the value and retry() re-sends it — never lost', async () => {
    const saved: string[] = []
    let fail = true
    const { handle, utils } = setup(async (v) => {
      if (fail) throw new Error('offline')
      saved.push(v)
    })

    act(() => handle.current?.queue('precious words'))
    act(() => handle.current?.flush())
    await waitFor(() => expect(utils.getByTestId('state').textContent).toBe('error'))
    expect(saved).toEqual([])

    fail = false
    act(() => handle.current?.retry())
    await waitFor(() => expect(saved).toEqual(['precious words']))
    await waitFor(() => expect(utils.getByTestId('state').textContent).toBe('saved'))
  })

  test('text typed WHILE a save is in flight is saved right after (nothing dropped)', async () => {
    const saved: string[] = []
    const releases: Array<() => void> = []
    const { handle } = setup(
      (v) =>
        new Promise<void>((resolve) => {
          releases.push(() => {
            saved.push(v)
            resolve()
          })
        }),
    )

    act(() => handle.current?.queue('first'))
    act(() => handle.current?.flush())
    act(() => handle.current?.queue('first and second'))
    act(() => releases.shift()?.()) // first save lands; the newer text saves right after
    await waitFor(() => expect(releases.length).toBe(1))
    act(() => releases.shift()?.())
    await waitFor(() => expect(saved).toEqual(['first', 'first and second']))
  })

  test('flush with nothing queued is a no-op (no empty saves)', async () => {
    const saved: string[] = []
    const { handle, utils } = setup(async (v) => saved.push(v))
    act(() => handle.current?.flush())
    await new Promise((r) => setTimeout(r, 0))
    expect(saved).toEqual([])
    expect(utils.getByTestId('state').textContent).toBe('idle')
  })
})
