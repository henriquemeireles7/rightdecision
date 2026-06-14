# lives

## Purpose
Admin scheduling for monthly lives (ADR 3): YouTube URL + time + program scope, replay upload
to Stream, explicit cancellation. Upcoming/live/replay state DERIVES from dates — no status
enum (TD-1).

## Critical Rules
- NEVER delete a live — cancellation is a human act recorded as `cancelledAt` (Gate C).
  Cancelling twice keeps the ORIGINAL cancelledAt (idempotent).
- Cancellation is DISTINCT from rescheduling: a cancelled live cannot be updated or have a
  replay attached — un-cancelling is not a thing; schedule a new live.
- Replay upload is tus direct-to-Stream (`requestReplayUploadUrl()`); it sets
  `replayStreamVideoId` + `replayStatus='processing'`. The Stream webhook
  (course-builder/webhook.ts) flips replayStatus to 'ready' — NEVER set 'ready' here.
- `scheduledAt` is timestamptz — accept ISO datetimes, compare as UTC instants.
- upcoming/past list filters derive from `scheduledAt` vs now — never store derived state.

## Imports (use from other modules)
```ts
import { adminLivesRoutes } from '@/features/(admin)/lives/routes'
```

## Recipe: Replay flow
```ts
// 1. POST /:id/replay-upload-url { uploadLengthBytes } → { uploadUrl, streamVideoId }
// 2. Admin client tus-uploads the recording direct to Cloudflare
// 3. Stream webhook (video.ready) flips replayStatus 'processing' → 'ready'
```

## Verify
```sh
source /tmp/test-env.sh && DATABASE_URL=postgresql://test:test@localhost:5432/test_b1 bun test "features/(admin)/lives"
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| routes.ts | adminLivesRoutes |
| service.ts | LivesWhen, scheduleLive, listLives, updateLive, cancelLive, requestReplayUploadUrl |

## Internal Dependencies
- platform/auth
- platform/db
- platform/errors
- platform/server
- platform/types
- providers/errors
- providers/video

<!-- Generated: 2026-06-12T23:31:24.935Z -->
