# client/app/lib

## Purpose
The /app SPA's data + utility layer: the single api-client instance and its test seam (api.ts),
typed data access via hono/client RPC + unwrap (data.ts), the four-state fetch hook
(use-query.ts), the watch-event heartbeat batcher (heartbeats.ts), autosave, the lazy hls.js
loader, and pure formatters (format.ts, media.ts). This is the ONLY place the SPA touches the
network.

## Critical Rules
- ALL API calls go through data.ts → the api-client (api.ts) — NEVER hand-roll fetch in pages.
- NEVER import server runtime (db, env, providers); platform imports must be `import type` or via
  the shared api-client. This bundle ships to the browser.
- NEVER define response types manually — they flow from AppRoutes through `unwrap()`.
- Tests swap the transport through the api-client's `ApiClientOptions.fetch` seam
  (`setApiFetchForTests`) — NEVER `mock.module` (see client/app/CLAUDE.md "Test Seam").
- Telemetry NEVER breaks UX — heartbeat send failures are swallowed and re-buffered; flush on
  pagehide goes through `navigator.sendBeacon`, not fetch.
- hls.js is loaded lazily via hls-loader.ts only on the lesson route — never import it statically.

## Imports (use from other modules)
```ts
import { fetchCatalog, fetchLives, type Catalog } from '@/client/app/lib/data'
import { useQuery } from '@/client/app/lib/use-query'
import { createHeartbeatBatcher } from '@/client/app/lib/heartbeats'
import { setApiFetchForTests } from '@/client/app/lib/api'
```

## Recipe: New data accessor
```ts
// In data.ts — one thin function per endpoint, types inferred from the RPC client:
export function fetchThing(id: string) {
  return unwrap(getApi().api.things[':id'].$get({ param: { id } }))
}
// Pages consume it through useQuery(() => fetchThing(id), [id]).
```

## Verify
```sh
bun test client/app/lib && bunx tsc --noEmit
```
