# lives-view

## Purpose
Member-facing Lives API (ADR 3: ONE Lives section): enrollment-scoped list via
lives.programId, per-row derived state (upcoming / live-now / replay-ready / cancelled —
derived from scheduledAt + replay fields + cancelledAt, never stored), and the gated
Stream replay playback token.

## Critical Rules
- State is DERIVED, never stored (TD-1): cancelled (cancelledAt set) → replay-ready
  (replayStatus='ready' AND replayStreamVideoId) → upcoming (now < scheduledAt) →
  live-now. Precedence in exactly that order.
- Cancelled lives are RETURNED with state 'cancelled' — never silently skipped (Gate C:
  cancellation is a human act the UI must render)
- Replay tokens require canAccessLive + replay-ready — VIDEO_NOT_READY for processing /
  missing replays; ENROLLMENT_REQUIRED without access
- record('live_viewed') fires when a live-now live is fetched; record('replay_watched')
  fires when a replay token is issued — never both for one request
- The list query scopes by ACTIVE enrollment join on lives.programId — there is no
  unscoped "all lives" read in this module
- `deps` parameters are options injection for TESTS ONLY — production callers never pass them

## Imports (use from other modules)
```ts
import { listLives, getLive, getLiveReplay, deriveLiveState } from '@/features/(life)/lives-view/service'
import { livesViewRoutes } from '@/features/(life)/lives-view/routes'
```

## Recipe: New derived-state consumer
```ts
// NEVER re-derive state inline — always go through deriveLiveState(live, now)
const state = deriveLiveState(live, new Date())
if (state === 'replay-ready') {
  /* token flow */
}
```

## Verify
```sh
DATABASE_URL=postgresql://test:test@localhost:5432/test_b2 bun test "features/(life)/lives-view"
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| routes.ts | createLivesViewRoutes, livesViewRoutes |
| service.ts | liveStates, LiveState, deriveLiveState, programIdForLive, listLives, getLive, getLiveReplay |

## Internal Dependencies
- features/(shared)
- platform/auth
- platform/db
- platform/errors
- platform/events
- platform/server
- platform/types
- providers/video

<!-- Generated: 2026-06-12T23:31:24.935Z -->
