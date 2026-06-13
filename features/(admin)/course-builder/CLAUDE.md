# course-builder

## Purpose
Admin CRUD for the DB-backed course CMS (ADR 7): courses → modules → lessons, the tus video
upload flow, the Stream webhook, captions, the publish gate, and AI cover generation (ADR 18).
This is the content authoring path that unblocks Content Gates A/B/C.

## Critical Rules
- PUBLISH INVARIANT (eng-schema table 7): `status='published'` requires `videoStatus='ready'`
  AND `captionsReady` AND `decisionPrompt IS NOT NULL`. Enforced in `publishLesson()` —
  VIDEO_NOT_READY / CAPTIONS_REQUIRED / VALIDATION_ERROR(decision prompt) respectively.
  Also enforced on UPDATE: a published lesson can never have its decisionPrompt nulled.
- NEVER proxy video bytes through Hono — `requestLessonUploadUrl()` returns a one-time tus
  URL from `createTusUploadUrl()`; the admin client uploads straight to Cloudflare.
- The Stream webhook handler MUST be idempotent — re-delivery of video.ready no-ops
  (`updated: false`); it matches lessons by `streamVideoId` AND lives by
  `replayStreamVideoId` (replay uploads flow through the same webhook).
- NEVER trust a webhook without `verifyWebhookSignature()` → STREAM_WEBHOOK_INVALID (401).
- Cover generation NEVER persists on generate — `generateCoverCandidates()` returns 4
  R2 candidate keys; only `pickCover()` writes coverImageKey/thumbnailKey.
- Aspects are fixed (ADR 18): module/course covers 2:3, lesson thumbnails 16:9. The module
  subject is the ONLY prompt variable — never accept custom prompts.
- record('lesson_published') and record('cover_generated') fire in the SAME transaction as
  the domain write, with the admin's userId. Publishing an already-published lesson no-ops
  (no duplicate event).
- Reordering writes sortOrder = array index in one pass (index is NOT unique — no two-phase
  dance). Reject id sets that don't exactly match the parent's children.

## Imports (use from other modules)
```ts
import { adminCourseBuilderRoutes } from '@/features/(admin)/course-builder/routes'
import { streamWebhookRoutes } from '@/features/(admin)/course-builder/webhook-routes'
```

## Recipe: New lesson lifecycle service
```ts
export async function doLessonThing(lessonId: string): Promise<{ lesson: Lesson } | ServiceError> {
  const lesson = await db.query.lessons.findFirst({ where: eq(lessons.id, lessonId) })
  if (!lesson) return { error: 'LESSON_NOT_FOUND' }
  // guard invariants → write → return row
}
```

## Verify
```sh
source /tmp/test-env.sh && DATABASE_URL=postgresql://test:test@localhost:5432/test_b1 bun test "features/(admin)/course-builder"
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| covers.ts | CoverTargetKind, CoverTarget, generateCoverCandidates, pickCover |
| routes.ts | adminCourseBuilderRoutes |
| service.ts | createCourse, listCourses, getCourse, updateCourse, archiveCourse, createModule, updateModule, reorderModules, createLesson, updateLesson, reorderLessons, requestLessonUploadUrl, triggerCaptionGeneration, setCaptionsReady, publishLesson |
| webhook-routes.ts | streamWebhookRoutes |
| webhook.ts | handleStreamWebhook |

## Internal Dependencies
- platform/auth
- platform/db
- platform/errors
- platform/events
- platform/server
- platform/types
- providers/errors
- providers/image-gen
- providers/storage
- providers/video

<!-- Generated: 2026-06-12T23:31:24.934Z -->
