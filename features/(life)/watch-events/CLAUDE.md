# watch-events

## Purpose
Batched watch-event ingestion (eng-schema S5): the client buffers heartbeats (1/30s
cadence) and POSTs arrays. Each heartbeat is Zod-validated against the platform/events
taxonomy, track()ed best-effort to the spine, and the latest position per lesson is
folded into lesson_progress with a SINGLE monotonic upsert per lesson per batch.

## Critical Rules
- ALWAYS validate the batch against the taxonomy shape and reject invalid payloads with
  EVENT_INVALID (zValidator custom hook) — never the default zValidator 400 shape
- ALWAYS rate-limit the endpoint per user via checkRateLimit (mirrors free-intro /
  decision-routes usage) — RATE_LIMITED on excess
- Heartbeats are TELEMETRY: use track() (best-effort, swallow-and-log), never record() —
  a failed spine write must not fail the batch
- ONE lesson_progress upsert per lesson per batch — fold to max(secondsWatched) +
  max(occurredAt) in memory first; never upsert per heartbeat
- Heartbeats for unknown lesson ids are tracked-then-skipped in the fold (no FK crash,
  no error) — ingestion is forgiving, the read model is strict
- `deps` parameters are options injection for TESTS ONLY (call counting) — production
  callers never pass them

## Imports (use from other modules)
```ts
import { ingestWatchEvents, WATCH_EVENTS_MAX_BATCH } from '@/features/(life)/watch-events/service'
import { watchEventsRoutes } from '@/features/(life)/watch-events/routes'
```

## Recipe: Extend the accepted batch shape
```ts
// Add a field to heartbeatSchema ONLY if platform/events/taxonomy.ts already carries it —
// the taxonomy is the contract; this endpoint never invents event shapes.
const heartbeatSchema = z.object({
  lessonId: z.uuid(),
  secondsWatched: z.number().int().nonnegative(),
  occurredAt: z.coerce.date().optional(),
})
```

## Verify
```sh
DATABASE_URL=postgresql://test:test@localhost:5432/test_b2 bun test "features/(life)/watch-events"
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| routes.ts | WATCH_EVENTS_RATE_LIMIT_PER_MINUTE, createWatchEventsRoutes, watchEventsRoutes |
| service.ts | WATCH_EVENTS_MAX_BATCH, watchEventsBatchSchema, WatchHeartbeat, ingestWatchEvents |

## Internal Dependencies
- features/(life)
- platform/auth
- platform/db
- platform/errors
- platform/events
- platform/rate-limit
- platform/server
- platform/types

<!-- Generated: 2026-06-12T23:31:24.936Z -->
