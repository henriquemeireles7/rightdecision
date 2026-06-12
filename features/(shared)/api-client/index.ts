/**
 * The ONE fetch wrapper for every client surface (P2 admin SPA, P3 members SPA, P8 mobile).
 * Typed RPC via hono/client over AppRoutes + envelope handling:
 *   { ok: true, data }            → unwrap() resolves with `data` (type inferred from the route)
 *   { ok: false, code, message }  → unwrap() throws ApiError carrying the typed ErrorCode
 *   401                           → unauthorized callback (per-client option or global handler)
 * Browser-safe: only TYPE imports from platform — no server runtime code in the bundle.
 */
import type { Hono } from 'hono'
import { hc } from 'hono/client'
import type { ErrorCode } from '@/platform/errors'
import type { AppRoutes } from '@/platform/server/app'

export class ApiError extends Error {
  readonly code: ErrorCode
  readonly status: number
  readonly details: string | undefined

  constructor(code: ErrorCode, status: number, message: string, details?: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
  }
}

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Response | Promise<Response>

export type ApiClientOptions = {
  /** Transport override — tests pass mocks or `app.request`. Defaults to global fetch. */
  fetch?: FetchLike
  /** Fires on any 401 response. Falls back to the global setUnauthorizedHandler(). */
  onUnauthorized?: () => void
}

let globalUnauthorizedHandler: (() => void) | null = null

/** SPAs register a redirect-to-login handler ONCE at boot. Pass null to clear (tests). */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  globalUnauthorizedHandler = handler
}

/**
 * Fetch wrapper used by every client: session cookies (credentials: 'include'),
 * JSON Accept header, and the 401 unauthorized hook. Caller-provided init wins.
 */
export function createFetch(options: ApiClientOptions = {}): FetchLike {
  const base = options.fetch ?? globalThis.fetch
  return async (input, init) => {
    const headers = new Headers(init?.headers)
    if (!headers.has('Accept')) headers.set('Accept', 'application/json')
    const response = await base(input, {
      ...init,
      headers,
      credentials: init?.credentials ?? 'include',
    })
    if (response.status === 401) {
      const handler = options.onUnauthorized ?? globalUnauthorizedHandler
      handler?.()
    }
    return response
  }
}

/**
 * Typed RPC client. Defaults to AppRoutes (the server's chained route tree).
 * Route files must CHAIN handlers for their schema to reach the client types.
 */
// biome-ignore lint/suspicious/noExplicitAny: mirrors hono/client's own hc<T extends Hono<any, any, any>> constraint
export function createApiClient<T extends Hono<any, any, any> = AppRoutes>(
  baseUrl = '',
  options: ApiClientOptions = {},
) {
  return hc<T>(baseUrl, { fetch: createFetch(options) as typeof fetch })
}

/** Ready-to-use singleton for browser code — same-origin, session cookies included. */
export const api = createApiClient()

type JsonResponse = { status: number; json(): Promise<unknown> }

type ExtractData<J> = [Extract<J, { ok: true }>] extends [never]
  ? unknown
  : Extract<J, { ok: true }> extends { data: infer D }
    ? D
    : unknown

type DataOf<R extends JsonResponse> = ExtractData<Awaited<ReturnType<R['json']>>>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isErrorEnvelope(
  value: unknown,
): value is { ok: false; code: string; message: string; details?: string } {
  return (
    isRecord(value) &&
    value.ok === false &&
    typeof value.code === 'string' &&
    typeof value.message === 'string'
  )
}

function isSuccessEnvelope(value: unknown): value is { ok: true; data: unknown } {
  return isRecord(value) && value.ok === true && 'data' in value
}

/**
 * Resolve a client call to its `data` payload, or throw a typed ApiError.
 * Network failures surface as ApiError with code INTERNAL_ERROR and status 0.
 */
export async function unwrap<R extends JsonResponse>(call: R | Promise<R>): Promise<DataOf<R>> {
  let response: R
  try {
    response = await call
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network request failed'
    throw new ApiError('INTERNAL_ERROR', 0, message)
  }

  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new ApiError('INTERNAL_ERROR', response.status, 'Response was not valid JSON')
  }

  if (isErrorEnvelope(body)) {
    throw new ApiError(
      body.code as ErrorCode,
      response.status,
      body.message,
      typeof body.details === 'string' ? body.details : undefined,
    )
  }

  if (isSuccessEnvelope(body)) {
    return body.data as DataOf<R>
  }

  throw new ApiError('INTERNAL_ERROR', response.status, 'Unexpected response shape')
}
