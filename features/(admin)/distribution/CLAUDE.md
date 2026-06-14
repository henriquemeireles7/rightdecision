# distribution

## Purpose
Admin SERVER glue for Project 7 — a thin layer over the EXISTING, battle-tested BD
video→clips→social pipeline so the founder ships clips from the /admin SPA without CLI/skills.
This module changes NOTHING in the pipeline. It only fills the three genuine gaps the existing
endpoints don't cover: (1) a presigned R2 PUT for video INGEST, (2) the clip APPROVAL-GATE
setter (`clips.approved` had no production writer — only tests set it), and (3) an AGGREGATED
run-detail read (run + clips + posts) so the status dashboard renders in one call. Everything
else (start run, transcribe, clip-select, clip-cut, metadata, distribute) is the existing
(business) pipeline, called unchanged.

## Critical Rules
- NEVER modify the (business) pipeline (transcribe/clip-select/clip-cut/metadata-generate/
  post-distribute/workflow). This module is READ + the approval setter ONLY. Distribution is
  still triggered by the existing POST /api/post-distribute — we only set `approved`.
- ALWAYS gate the chain: `.use(requireAuth).use(requirePermission('manage_content'))`. Admin
  gating is ROLE-based, never enrollment-based (eng-schema S7).
- The APPROVAL GATE is a hard invariant: a clip is distributable ONLY when `approved === true`.
  This module's setter is the ONLY way to flip it; clip-cut + post-distribute already enforce
  it downstream (CLIP_CUT_NO_APPROVED_CLIPS). The UI EXPLAINS the gate; the pipeline ENFORCES it.
- NEVER proxy video bytes through Hono — `requestVideoUploadUrl()` returns a presigned PUT and a
  server-generated key (`pipeline/<uuid>/<sanitized-name>`); the client PUTs direct to R2. The
  key shape must satisfy the transcribe service's validator (alphanumerics + `._-/`, no `..`,
  no leading `/`, supported extension) — keep the sanitizer in sync.
- NEVER invent error codes — reuse platform/errors.ts (NOT_FOUND for a missing run,
  POST_CLIP_NOT_FOUND for a missing clip, INTERNAL_ERROR for presign failures). Routes map
  service `{ error }` objects via throwError(c, result.error, result.details).
- ALWAYS keep the module CHAINED (one `new Hono<AppEnv>()....` expression) for AppRoutes type
  inference, and zValidator every body/param (`:id` as z.uuid()).
- NEVER return raw c.json() — success()/created()/throwError() only.

## Imports (use from other modules)
```ts
import { adminDistributionRoutes } from '@/features/(admin)/distribution/routes'
// platform/server/routes.ts mounts it (FOUNDER mounts — agents don't edit routes.ts):
//   .route('/api/admin/distribution', adminDistributionRoutes)
```

## Recipe: Aggregated read (run + clips + posts)
```ts
export async function getRunDetail(runId: string) {
  const run = await db.query.pipelineRuns.findFirst({ where: eq(pipelineRuns.id, runId) })
  if (!run) return { error: 'NOT_FOUND' as const }
  const runClips = await db.select().from(clips).where(eq(clips.pipelineRunId, runId))
  const runPosts = runClips.length
    ? await db.select().from(posts).where(inArray(posts.clipId, runClips.map((c) => c.id)))
    : []
  return { run, clips: runClips, posts: runPosts }
}
```

## Admin client patterns introduced (founder syncs design.md)
- Flow chooser: a two-option radio (short→clips→TikTok/IG/Shorts, long→YouTube) before upload —
  ink-on-gold selected pill, never white-on-gold.
- Per-clip approval row: explicit Approve / Reject buttons with pending + success state; the
  Distribute action stays DISABLED until ≥1 clip is approved (the gate, mirrored in the UI).
- Run status dashboard: a vertical step rail (transcribe→select→cut→metadata→distribute) with
  per-step done/active/failed chips; a failed step shows what/why/how-to-fix inline.

## Verify
```sh
source /tmp/test-env.sh && DATABASE_URL=postgresql://test:test@localhost:5432/test_b1 bun test "features/(admin)/distribution"
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| routes.ts | adminDistributionRoutes |
| service.ts | requestVideoUploadUrl, getRunDetail, setClipApproval |

## Internal Dependencies
- platform/auth
- platform/db
- platform/errors
- platform/server
- platform/types
- providers/errors
- providers/storage

<!-- Generated: 2026-06-13T02:53:44.063Z -->
