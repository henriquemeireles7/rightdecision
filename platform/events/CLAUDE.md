# events

## Purpose
The event spine (ADR 6): typed event taxonomy + the `record()`/`track()` double-write contract.
Postgres `events` table is the source of truth (insert awaited, in the caller's transaction when
given); providers/analytics.ts (PostHog) is a dumb mirror fired AFTER successful insert/commit,
fire-and-forget, never retried. Divergence is allowed in one direction only: Postgres ≥ PostHog.
This is Decision Graph v1 — which actions count as "Decisions Made" is defined HERE, in the
taxonomy, not by callers.

## Critical Rules
- NEVER let callers set isDecision/decisionKind — they are baked into the taxonomy and ignored if passed
- NEVER fire the PostHog mirror before the Postgres insert succeeds (and, with a tx, before commit) — a mirrored-then-rolled-back event violates Postgres ≥ PostHog
- NEVER retry a failed PostHog mirror — swallow and log; a missed mirror is the allowed divergence direction
- NEVER put answer/journal/chat text in event properties — ids and enums only (PII stays in its own table)
- ALWAYS use `record(event, tx)` for decision-bearing events so they commit/roll back with the caller's transaction; `track()` is best-effort telemetry (heartbeats) that swallows-and-logs every failure
- ALWAYS reserve new event names in taxonomy.ts upfront (like errors.ts reserves codes) — adding a name is an additive union change; never rename or repurpose one
- events rows are append-only — never UPDATE or DELETE them in production code
- Use `sourceRef` for idempotent backfills (`'user_decisions:<uuid>'`) — duplicate inserts no-op on the partial unique index and do NOT re-mirror

## Imports (use from other modules)
```ts
import { record, track, EventInvalidError } from '@/platform/events'
import { eventSchema, eventNames, decisionTaxonomy } from '@/platform/events/taxonomy'
import type { EventEnvelope } from '@/platform/events'
import type { EventInput, EventName, DecisionKind, EventSource } from '@/platform/events/taxonomy'
```

## Recipe: Record a decision-bearing event inside a transaction
```ts
await db.transaction(async (tx) => {
  // ... domain writes ...
  await record(
    { name: 'decision_prompt_answered', properties: { lessonId }, userId },
    tx, // insert joins this tx; PostHog mirror fires only after commit
  )
})

// Telemetry (no tx, never throws):
await track({ name: 'watch_heartbeat', properties: { lessonId, secondsWatched: 30 }, userId })

// Backfill (idempotent, original event time):
await record({
  name: 'legacy_decision_backfilled',
  properties: { classId, blockId, courseSlug, decisionType },
  userId,
  source: 'backfill',
  occurredAt: legacyRow.createdAt,
  sourceRef: `user_decisions:${legacyRow.id}`,
})
```

## Verify
```sh
DATABASE_URL=postgresql://test:test@localhost:5432/test bun test platform/events/
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| index.ts | EventInvalidError, DbOrTx, EventEnvelope, record, track |
| taxonomy.ts | decisionKinds, DecisionKind, eventSources, EventSource, eventSchema, EventInput, EventName, eventNames, decisionTaxonomy, decisionMeta |

## Internal Dependencies
- platform/db
- platform/errors
- providers/analytics

<!-- Generated: 2026-06-12T22:38:50.393Z -->
