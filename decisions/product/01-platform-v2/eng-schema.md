# Platform V2 — Schema Gate Artifact (T4)

> Produced by eng review 2026-06-12. Project 1 codes against THIS document.
> Conventions: uuid defaultRandom PK, createdAt/updatedAt, text enums (not pg enums),
> FK cascade via references(..., { onDelete: 'cascade' }), named indexes.
> CONVENTION CHANGE: all new scheduling timestamps are `timestamp(..., { withTimezone: true })`
> (timestamptz). Amend platform/db/CLAUDE.md: "scheduling timestamps are timestamptz."
> EXCEPTION: events table has no updatedAt (append-only) — amend db/CLAUDE.md same PR.

## 19 Tables

```
programs ──< cohorts                    programs ──< program_courses >── courses ──< modules ──< lessons
   │                                    programs ──< program_materials >── materials (optional lessonId)
   │                                    programs ──< lives
   └──< enrollments >── users           programs ──< document_templates ──< documents ──< document_answers
                                        users ──< journal_entries / conversations ──< conversation_messages
                                        users ──< interviews / events / ai_usage
```

1. **programs** — slug text unique notNull, name, description, tier enum ['free','paid'] notNull,
   status enum ['draft','active','archived'] default 'draft', coverImageKey text. No org_id (ADR 8).
2. **cohorts** — programId FK cascade, title, startsAt timestamptz notNull, endsAt timestamptz.
   uniqueIndex('cohorts_program_start_idx').on(programId, startsAt) — cron idempotency key
   (double-fired auto-creation no-ops via onConflictDoNothing). NO status enum — upcoming/running
   derives from dates (TD-1: derived state can't drift).
3. **enrollments** (the access primitive) — userId FK cascade notNull, programId FK notNull,
   cohortId FK NULLABLE (paid = evergreen no cohort; free = cohort-bound), status enum
   ['active','expired','revoked'] notNull default 'active', source enum
   ['signup','purchase','admin','migration'] notNull, stripeSubscriptionId text nullable,
   startedAt notNull defaultNow, expiresAt timestamptz nullable.
   uniqueIndex(userId, programId) — one row per user per program; free re-enrollment into a later
   cohort UPDATEs cohortId (TD-2; cohort-join history goes to events as 'cohort_joined').
   index(userId, status) for the hot access check.
4. **program_courses** — programId FK cascade, courseId FK cascade, sortOrder int notNull,
   uniqueIndex(programId, courseId).
5. **courses** — slug unique, title, description, coverImageKey, status enum
   ['draft','published','archived']. DB-backed (ADR 7); content/courses.json untouched.
6. **modules** — courseId FK cascade, title, description, coverImageKey (2:3, ADR 18),
   sortOrder int notNull, status draft/published. index(courseId, sortOrder) (NOT unique —
   reordering with unique requires two-phase updates).
7. **lessons** — moduleId FK cascade, title, description, sortOrder, streamVideoId text nullable,
   videoStatus enum ['none','uploading','processing','ready','error'] notNull default 'none'
   (driven by Stream webhook; idempotent), durationSeconds int, thumbnailKey text (16:9 R2),
   captionsReady boolean notNull default false, decisionPrompt text nullable (TD-3: exactly one
   per lesson = column not table), status enum ['draft','published'].
   PUBLISH INVARIANT (service code + test): status='published' requires videoStatus='ready'
   AND captionsReady AND decisionPrompt IS NOT NULL. index(moduleId, sortOrder).
8. **materials** — title, description, fileKey text notNull (R2), fileSizeBytes int,
   mimeType text, lessonId FK nullable.
9. **program_materials** — programId FK cascade, materialId FK cascade,
   uniqueIndex(programId, materialId).
10. **lives** — programId FK cascade, title, description, scheduledAt timestamptz notNull,
    youtubeUrl text nullable, replayStreamVideoId text nullable, replayStatus enum
    ['none','processing','ready'] default 'none', cancelledAt timestamptz nullable (Gate C:
    cancellation is a human act — explicit column; upcoming/live/replay derives from dates).
    index(programId, scheduledAt).
11. **document_templates** — programId FK cascade (Playbook→paid, Starter Notebook→free),
    slug, title, sortOrder, version int notNull default 1, schema jsonb $type<TemplateSchema>
    (chapters→pages→fields with STABLE STRING FIELD IDS; Zod-validated on every admin write,
    type inferred). Field ids immutable once published; admin adds/deprecates, never renames.
    status draft/published. (TD-4: structure = jsonb authorship doc; answers = relational rows.)
12. **documents** — userId FK cascade, templateId FK, templateVersion int notNull (pinned at
    instantiation), status enum ['empty','in_progress','complete'], uniqueIndex(userId, templateId).
13. **document_answers** — documentId FK cascade, fieldId text notNull, value text notNull,
    source enum ['typed','interview'] notNull default 'typed', confirmedAt timestamptz nullable
    (interview answers unconfirmed until accepted — ADR 11 trust moment as a column),
    uniqueIndex(documentId, fieldId) — autosave-on-blur upserts against this index.
    THIS TABLE IS ADR 9's "structured typed rows".
14. **journal_entries** — userId FK cascade, entryDate DATE notNull (calendar-day computed
    CLIENT-side in user's zone, sent explicitly — never derived server-side from UTC now),
    kind enum ['morning','evening'] notNull, prompt text, content text notNull,
    uniqueIndex(userId, entryDate, kind). No streak columns.
15. **interviews** — userId FK cascade, documentId FK, pageId text notNull, conversationId FK,
    distilledFields jsonb nullable, status enum
    ['active','distilling','awaiting_confirmation','confirmed','abandoned'].
    Confirmation writes document_answers with source='interview'.
16. **conversations** — userId FK cascade, kind enum ['chat','interview'], title text nullable.
17. **conversation_messages** — conversationId FK cascade, role enum ['user','assistant'],
    content text notNull, createdAt. Append-only rows (chat is append-heavy + partially read;
    per-message usage rows need a message id).
18. **events** (the spine) —
    - userId FK cascade NULLABLE + anonymousId text nullable (pre-auth funnel events)
    - name text notNull — taxonomy = Zod discriminated union at write boundary, NOT pg enum (TD-5)
    - properties jsonb notNull default {}
    - source enum ['app','stream_player','mobile','backfill'] notNull default 'app'
    - isDecision boolean notNull default false + decisionKind text nullable
      ('lesson_prompt'|'playbook'|'journal') — "Decisions Made" = one indexed count
    - sourceRef text nullable + PARTIAL uniqueIndex(sourceRef) WHERE sourceRef IS NOT NULL —
      backfill idempotency (sourceRef='user_decisions:<uuid>'; script re-runnable)
    - occurredAt timestamptz notNull defaultNow (event time; backfill sets original createdAt)
      + createdAt (ingest time). NO updatedAt (append-only exception).
    - Indexes: (userId, occurredAt), (name, occurredAt), partial (userId, occurredAt) WHERE is_decision.
19. **ai_usage** — userId FK cascade, conversationId FK nullable, messageId FK nullable,
    kind enum ['chat','interview','distill','suggestion','cover_gen'], model text notNull,
    inputTokens/outputTokens int notNull, createdAt. Budget check = sum() over (userId, createdAt)
    index for current month; NO materialized counter until measurably slow.
20. **lesson_progress** — userId FK cascade, lessonId FK cascade, secondsWatched int notNull
    default 0, durationSeconds int (denormalized at write for % math), completedAt timestamptz
    nullable (set when decision prompt answered — ADR 1: answering completes the lesson),
    promptAnswer text nullable (the user's decision-prompt answer text — events properties
    are PII-free by design, so the answer needed a relational home; added in migration 0009
    during P3 implementation), lastWatchedAt timestamptz notNull,
    uniqueIndex(userId, lessonId); index(userId, lastWatchedAt) — continue-watching is one query.

**Program slug constants:** PAID_PROGRAM_SLUG ('life-decisions-paid') + FREE_PROGRAM_SLUG live
in platform/programs.ts (platform root is the only layer both features and scripts may import).
    [Aggregator addition post-roadmap: deriving resume position from append-only heartbeat
    events means scanning the spine per catalog render; an upsert row is the explicit answer.
    Heartbeats still flow to events for analytics; this table is the READ model. The existing
    courseProgress table remains the text course's, untouched.]

**Account deletion:** every user-keyed table cascades from users.id; Project 1 cascade test
enumerates all 19. GDPR trade: deleting a user deletes their events rows (PostHog mirror retains
anonymized aggregates — acceptable, arguably required).

## Event spine placement + double-write contract (M3/M4)

- Taxonomy + `record()`/`track()` live in **platform/events/** (NOT providers/analytics.ts —
  providers are thin external wrappers; features can't import features; platform is the only
  layer importable by all features that may import db + providers).
- providers/analytics.ts stays the dumb PostHog wrapper, called by platform/events as the mirror.
- **record(event, tx?)** — decision-bearing events: Postgres insert awaited, participates in
  caller's transaction; PostHog mirror fires only AFTER commit, fire-and-forget, logged, never
  retried. Divergence acceptable in one direction only: Postgres ≥ PostHog.
- **track()** — telemetry-grade (heartbeats): best-effort insert, swallow-and-log.

## Scheduler (M2)

features/(shared)/scheduler/ — in-process ticker (1-min setInterval in app.ts; single Railway
instance, no leader election). Idempotent jobs: processPendingDrips (wires the existing DEAD
function — drip emails are currently scheduled and never sent, live bug), cohort auto-creation
(idempotent via cohorts_program_start_idx), enrollment expiry sweep. Deploy restarts catch up
on next tick.

## Uploads (M5)

- Stream: tus resumable protocol (direct creator upload) — basic direct-upload caps ~200MB;
  tus also delivers admin progress %/retry requirements. tus-js-client in admin bundle.
- R2: add `getUploadUrl()` presigned-PUT helper to providers/storage.ts (currently GET-only).
- TD-8: image-gen.ts returns bytes; admin feature uploads to R2 via storage.ts (providers
  never import providers).

## Playback (TD-6)

Stream playback via self-signed JWTs using jose (already a dependency) + Stream signing key —
no Cloudflare API call per playback. Fixture-key tests.

## Client bundle (M6)

Per-surface budgets (amend code.md in Canon Sync): marketing pages 0KB/<50KB unchanged;
/app shell ≤100KB gzipped; player chunk (hls.js/Stream embed) lazy-loaded on lesson route only.
New build step: `bun build --target browser` with content-hash + manifest consumed by /app
shell SSR route. ROUTING: /app/* catch-all must mount BEFORE the '/' catch-alls in
platform/server/routes.ts (authPageRoutes, websiteRoutes) or deep links 404.

## Cohort timezone (M7)

startsAt computed as first Monday of month at fixed local time in COHORT_TIMEZONE (IANA, env,
default America/Sao_Paulo), stored timestamptz; cron compares UTC instants — no tz math at read
time; users see localized dates via Intl. Fixture tests: first-Monday-is-the-1st,
first-Monday-is-the-7th, year boundary, DST-transition month.

## Migration script (M8)

platform/scripts/ script (NEVER a Drizzle migration): selects subscriptions status in
(active, past_due, trialing) and periodEnd within grace; NULL userId rows reported, not
enrolled (subscriptions.userId is nullable — webhook-before-linkage rows exist); idempotent
via enrollments(userId, programId) unique + onConflictDoNothing; supports --dry-run.

## Access control (S1/S2)

Middleware in platform/auth/enrollment.ts (sibling of requireAuth/requirePermission);
business queries (canAccessLesson join through program_courses) in features/(shared)/enrollment/.
Cache strategy: NONE — one indexed query, <1k users; request-scoped memoization only;
revocation latency beats 1ms. No Redis.

## AI chat streaming (S3)

Hono streamSSE on Bun; Railway passes streams; ~2-min deploys sever SSE — assistant message
persisted only on completion; client treats stream drop as retriable, refetches conversation.
Nothing in V2 trips monolith-split criteria (video encoding offloaded to Stream).

## Stream webhook (S4)

video.ready webhook verifies Webhook-Signature HMAC; handler idempotent (sets
lessons.videoStatus='ready' by streamVideoId; re-delivery no-ops).

## Watch events (S5)

Ingestion endpoint batched (client buffers, POSTs arrays), Zod-validated against taxonomy,
rate-limited like other public endpoints. Heartbeat cadence 1/30s.

## Cutover flag (S6)

V2_ENROLLMENT_CUTOVER boolean in env.ts; rollback = flip in Railway + redeploy. No flag framework.

## env.ts additions

```
CLOUDFLARE_ACCOUNT_ID                z.string().min(1)
CLOUDFLARE_STREAM_API_TOKEN          z.string().min(1)
CLOUDFLARE_STREAM_SIGNING_KEY_ID     z.string().min(1)
CLOUDFLARE_STREAM_SIGNING_KEY_JWK    z.string().min(1)   // base64 JWK for jose self-signing
CLOUDFLARE_STREAM_WEBHOOK_SECRET     z.string().min(1)
CLOUDFLARE_STREAM_CUSTOMER_CODE      z.string().min(1)   // playback/embed domain
IMAGE_GEN_API_KEY                    z.string().min(1)   // capability-named, vendor-agnostic
COHORT_TIMEZONE                      z.string().default('America/Sao_Paulo')
V2_ENROLLMENT_CUTOVER                z.coerce.boolean().default(false)
AI_MONTHLY_TOKEN_BUDGET_PAID         z.coerce.number()   // declare now, Project 6 reads
AI_MONTHLY_TOKEN_BUDGET_FREE         z.coerce.number()
```
(Stream vars optional in schema like R2_* — runtime ProviderError when absent — so dev/CI
run without Cloudflare secrets.)

## errors.ts additions

```
ENROLLMENT_REQUIRED 403 · PROGRAM_NOT_FOUND 404 · COHORT_NOT_FOUND 404 · LESSON_NOT_FOUND 404
MODULE_NOT_FOUND 404 · VIDEO_NOT_READY 409 · CAPTIONS_REQUIRED 422 · VIDEO_UPLOAD_FAILED 502
STREAM_WEBHOOK_INVALID 401 · COVER_GENERATION_FAILED 502 · TEMPLATE_NOT_FOUND 404
DOCUMENT_NOT_FOUND 404 · ANSWER_FIELD_INVALID 400 · JOURNAL_DUPLICATE 409
CONVERSATION_NOT_FOUND 404 · INTERVIEW_INVALID_STATE 409 · AI_BUDGET_EXCEEDED 429 · EVENT_INVALID 400
```

## Parallelization

P1 sequential (hard gate). Then Lane A: P2 admin (the elephant — tus + course builder),
Lane B: P3 members area, Lane C: P4 funnel (share only P1 schema). P2 and P7 both touch
features/(admin)/ — sequential. P5→P6 sequential (interviews write document_answers).
P8 start-gated (T1).

## Legacy note (S7)

users.role 'pro' + permissions.ts pro row become legacy once enrollments gate content
(don't migrate the enum; document as legacy in Canon Sync; admin gating stays role-based).

## TemplateSchema field-type vocabulary v1 (DX SF2 — P5 codes against this)

```ts
type TemplateField = {
  id: string            // stable, immutable once published
  label: string
  kind: 'short_text' | 'long_text' | 'select' | 'multi_select' | 'date' | 'scale_1_10'
  required: boolean
  placeholder?: string
  options?: string[]    // select/multi_select only
  exampleAnswer?: string // empty-page invitation copy
}
// chapters → pages → fields; page carries instruction prose (Indy register)
```
Adding a kind later = additive union change + Zod bump; never repurpose an existing kind.

## Nested CLAUDE.md scaffolding (DX MF7 — Build Order step 1)

NEW: platform/events/, features/(shared)/scheduler/, enrollment/, api-client/,
features/(admin)/ (group) + course-builder/, materials/, lives/, cohorts/, distribution/,
features/(life)/catalog/, player/, lives-view/, materials-view/, join/, playbook/, journal/,
ai-chat/, interview/, apps/mobile/ + packages/api-client/ (post-gate).

UPDATED: platform/db/ (timestamptz + events exception), platform/ (env + cutover seam),
platform/server/ (mount order + manifest), platform/auth/ (enrollment middleware + legacy
pro), providers/ (video, image-gen, getUploadUrl, skipIf pattern), platform/scripts/
(enrollment script + seed entrypoint), root CLAUDE.md (Seven Files + commands),
features/(shared)/admin/ (migrated into (admin) group).
