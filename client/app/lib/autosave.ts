/// <reference lib="dom" />
/**
 * The playbook/journal autosave state machine (ADR 20): debounce while typing
 * (800ms), flush on blur, quiet states — NO spinner mid-typing, a failed save keeps
 * the value for a gentle manual retry (a member's words are never lost). The field
 * component owns the input value; this hook only ships copies of it to the API.
 */
import { useEffect, useRef, useState } from 'preact/hooks'
import { ApiError } from '@/features/(shared)/api-client'

export const AUTOSAVE_DELAY_MS = 800

export type AutosaveState =
  | { kind: 'idle' }
  | { kind: 'pending' } // dirty or in flight — renders NOTHING (quiet, no spinners)
  | { kind: 'saved' }
  | { kind: 'error'; error: ApiError }

/** Injectable timer seam so tests drive the debounce deterministically. */
export type Scheduler = {
  set: (fn: () => void, ms: number) => unknown
  clear: (id: unknown) => void
}

const windowScheduler: Scheduler = {
  set: (fn, ms) => window.setTimeout(fn, ms),
  clear: (id) => window.clearTimeout(id as number),
}

const toApiError = (err: unknown): ApiError =>
  err instanceof ApiError
    ? err
    : new ApiError('INTERNAL_ERROR', 0, err instanceof Error ? err.message : 'Save failed')

export type AutosaveHandle = {
  state: AutosaveState
  /** Call on every input — restarts the debounce with the latest value. */
  queue: (value: string) => void
  /** Call on blur — saves the queued value immediately. */
  flush: () => void
  /** Gentle inline retry after a failed save — re-sends the retained value. */
  retry: () => void
}

export function useAutosave(
  save: (value: string) => Promise<unknown>,
  options: { scheduler?: Scheduler } = {},
): AutosaveHandle {
  const scheduler = options.scheduler ?? windowScheduler
  const [state, setState] = useState<AutosaveState>({ kind: 'idle' })
  const pending = useRef<string | null>(null)
  const inflight = useRef(false)
  const timer = useRef<unknown>(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      if (timer.current !== null) scheduler.clear(timer.current)
    }
  }, [scheduler])

  const set = (next: AutosaveState) => {
    if (mounted.current) setState(next)
  }

  async function run(): Promise<void> {
    if (inflight.current) return
    inflight.current = true
    while (pending.current !== null) {
      const value = pending.current
      pending.current = null
      try {
        await save(value)
        if (pending.current === null) set({ kind: 'saved' })
      } catch (error) {
        // Retain the value — never lost; retry() re-sends it. Newer input wins.
        if (pending.current === null) pending.current = value
        set({ kind: 'error', error: toApiError(error) })
        break // no automatic retry loop — the inline retry is a human act
      }
    }
    inflight.current = false
  }

  const clearTimer = () => {
    if (timer.current !== null) {
      scheduler.clear(timer.current)
      timer.current = null
    }
  }

  const flush = () => {
    clearTimer()
    void run()
  }

  return {
    state,
    queue: (value: string) => {
      pending.current = value
      set({ kind: 'pending' })
      clearTimer()
      timer.current = scheduler.set(flush, AUTOSAVE_DELAY_MS)
    },
    flush,
    retry: flush,
  }
}
