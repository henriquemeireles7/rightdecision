# api-client

## Purpose
The ONE fetch wrapper for every client surface. Typed RPC over `hc<AppRoutes>` (hono/client) plus
envelope handling: `{ ok: true, data }` unwraps to `data`, `{ ok: false, error }` becomes a typed
`ApiError` carrying the `ErrorCode` from platform/errors.ts. SPAs (P2 admin, P3 members) and
mobile (P8) consume this — they NEVER hand-roll fetch.

## Critical Rules
- NEVER hand-roll `fetch()` in SPA/mobile code — import `api` (or `createApiClient`) + `unwrap` from here
- NEVER define response types manually — types flow from `AppRoutes` (hono/client RPC) and the
  success envelope; `unwrap` infers `data` from the route's `json()` type
- ALWAYS chain route definitions in new route files (`new Hono().get(...).post(...)`) — statement-style
  registration (`routes.get(...)` on separate lines) produces a blank schema and kills RPC typing
- ALWAYS send cookies: the wrapper defaults `credentials: 'include'` (Better Auth session cookies)
- NEVER swallow error envelopes — `unwrap` throws `ApiError`; catch it and branch on `err.code`
- 401 responses fire the unauthorized callback (per-client option or `setUnauthorizedHandler`) —
  SPAs register a redirect-to-login handler ONCE at boot
- This module is bundled for the browser — import ONLY types from platform (`import type`), never
  runtime server code (db, env, providers)

## Imports (use from other modules)
```ts
import { api, createApiClient, unwrap, ApiError, setUnauthorizedHandler } from '@/features/(shared)/api-client'
```

## Recipe: Typed API call from a SPA component
```ts
import { api, unwrap, ApiError } from '@/features/(shared)/api-client'

// route file must be CHAINED for this to typecheck:
//   export const winsRoutes = new Hono<AppEnv>().get('/feed', ...).post('/', ...)
try {
  const data = await unwrap(api.api.wins.feed.$get({ query: { limit: '10' } }))
  // data is inferred from the route's success(c, ...) payload — no manual types
} catch (err) {
  if (err instanceof ApiError && err.code === 'RATE_LIMITED') {
    // typed error code from platform/errors.ts
  }
}
```

## Verify
```sh
bun test "features/(shared)/api-client" && bunx tsc --noEmit
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| index.ts | ApiError, ApiClientOptions, setUnauthorizedHandler, createFetch, createApiClient, api, unwrap |

## Internal Dependencies
- platform/errors
- platform/server

<!-- Generated: 2026-06-12T22:38:50.330Z -->
