# player

## Purpose
Lesson player API (P3 members-area): lesson fetch with a SIGNED Stream playback token
(TD-6 self-signed JWT, zero Cloudflare API calls), monotonic lesson_progress upserts, and
the decision-prompt answer flow (ADR 1: answering completes the lesson — the decision
event and completedAt commit in ONE transaction or not at all).

## Critical Rules
- ALWAYS gate playback on requireEnrollment (route) AND canAccessLesson (service) —
  defense in depth; a signed token is access, treat issuing one like serving the bytes
- NEVER issue a playback token unless lesson.videoStatus='ready' AND streamVideoId is set —
  return VIDEO_NOT_READY otherwise (the DB column is webhook-driven; never call getVideo
  per playback)
- secondsWatched is MONOTONIC — upserts use GREATEST(existing, incoming); progress never
  decreases (out-of-order heartbeats must not rewind the resume position)
- answerDecisionPrompt is ONE transaction: lesson_progress.completedAt + promptAnswer +
  record('decision_prompt_answered', tx) commit together or roll back together (ADR 1)
- The decision event fires ONLY on first completion — re-answering updates promptAnswer
  but never double-counts "Decisions Made"
- record('lesson_started') is idempotent via lesson_progress existence: only the insert
  that CREATES the progress row records the event (onConflictDoNothing + returning)
- NEVER put the answer text in event properties — it lives in lesson_progress.promptAnswer
  (PII stays out of the spine)
- `deps` parameters on service functions are options injection for TESTS ONLY (forcing
  event failure to prove rollback) — production callers never pass them

## Imports (use from other modules)
```ts
import {
  getLesson,
  saveProgress,
  answerDecisionPrompt,
  upsertLessonProgress,
  programIdsForLesson,
} from '@/features/(life)/player/service'
import { playerRoutes } from '@/features/(life)/player/routes'
```

## Recipe: Enrollment-gated lesson route
```ts
routes.get(
  '/lessons/:lessonId',
  auth,
  zValidator('param', lessonParamSchema), // BEFORE requireEnrollment — invalid uuids 400, not 500
  requireEnrollment((c) => programIdsForLesson(c.req.param('lessonId'))),
  async (c) => {
    const result = await getLesson(c.get('user').id, c.req.param('lessonId'))
    if ('error' in result) return throwError(c, result.error)
    return success(c, result.data)
  },
)
```

## Verify
```sh
DATABASE_URL=postgresql://test:test@localhost:5432/test_b2 bun test "features/(life)/player"
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| routes.ts | createPlayerRoutes, playerRoutes |
| service.ts | programIdsForLesson, upsertLessonProgress, getLesson, saveProgress, answerDecisionPrompt |

## Internal Dependencies
- features/(shared)
- platform/auth
- platform/db
- platform/errors
- platform/events
- platform/server
- platform/types
- providers/video

<!-- Generated: 2026-06-12T23:31:24.936Z -->
