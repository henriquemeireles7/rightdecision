/**
 * Minimal fetch-state hook — every page renders the four states from this:
 * loading (skeleton) / error (what-why-how + retry) / ready (incl. empty).
 */
import { useEffect, useState } from 'preact/hooks'
import { ApiError } from '@/features/(shared)/api-client'

export type QueryState<T> =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | { status: 'ready'; data: T }

const toApiError = (err: unknown): ApiError =>
  err instanceof ApiError
    ? err
    : new ApiError('INTERNAL_ERROR', 0, err instanceof Error ? err.message : 'Request failed')

export function useQuery<T>(fetcher: () => Promise<T>, deps: ReadonlyArray<unknown>) {
  const [state, setState] = useState<QueryState<T>>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })
    fetcher()
      .then((data) => {
        if (!cancelled) setState({ status: 'ready', data })
      })
      .catch((err: unknown) => {
        if (!cancelled) setState({ status: 'error', error: toApiError(err) })
      })
    return () => {
      cancelled = true
    }
  }, [...deps, attempt])

  return { state, retry: () => setAttempt((n) => n + 1) }
}
