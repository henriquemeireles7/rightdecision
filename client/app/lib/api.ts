/// <reference lib="dom" />
/**
 * The SPA's single api-client instance + the documented test seam: tests swap the
 * transport through the api-client's own ApiClientOptions.fetch option — never
 * mock.module (see client/app/CLAUDE.md "Test Seam").
 */
import { createApiClient, createFetch } from '@/features/(shared)/api-client'

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Response | Promise<Response>

let client = createApiClient()
let fetchOverride: FetchLike | null = null

export function getApi() {
  return client
}

/** Session-cookie fetch wrapper for the few untyped endpoints (better-auth sign-out). */
export function getApiFetch(): FetchLike {
  return createFetch(fetchOverride ? { fetch: fetchOverride } : {})
}

/** TESTS ONLY — inject a fetch-level mock; pass null to restore the real client. */
export function setApiFetchForTests(fetchImpl: FetchLike | null) {
  fetchOverride = fetchImpl
  client = fetchImpl ? createApiClient('', { fetch: fetchImpl }) : createApiClient()
}
