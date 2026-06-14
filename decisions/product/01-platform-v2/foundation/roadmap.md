# Foundation (Project 1)

> Initiative: 01-platform-v2
> Domain: product
> Created: 2026-06-12
> Status: ready

**SCHEMA GATE ARTIFACT (BINDING):** `decisions/product/01-platform-v2/eng-schema.md` is the
reviewed schema (20 tables). This project codes against eng-schema.md VERBATIM; deviations
require re-review. Where this roadmap and eng-schema.md could be read differently,
eng-schema.md wins.

## Context

Platform V2 pivots Right Decision to a video-first members area entered through programs:
a monthly cohort-based free program (lead gen) and a paid full program ($197/year, instant
full access, monthly lives). Students fill a structured Life Playbook, journal daily, can be
interviewed by AI, and talk to an AI that knows their playbook. The founder runs everything
from an admin panel. Constraint: solo founder + AI agents; everything ships in
dependency-ordered waves so the free cohort funnel can go live before later waves land;
existing production users of the text course must not break mid-migration.

This project is the hard gate before all other lanes: schema + access control + providers +
event spine + scheduler + client tooling for everything V2. Schema mistakes here are
migration debt everywhere. It also fixes three live production bugs found in review:
(1) drip emails are scheduled but never sent — processPendingDrips() has zero callers;
(2) `bun run db:seed` points at platform/scripts/seed.ts which does not exist;
(3) render.tsx skip-link is white-on-gold (WCAG fail — fixed here or alongside the spec per
Canon Sync; see Open Questions).

## Scope

In scope: 20 tables (lesson_progress read-model added post-roadmap — see eng-schema.md table 20) (programs, cohorts, enrollments, program_courses, courses(db), modules,
lessons (decision prompt = column), materials, program_materials, lives, document_templates,
documents, document_answers, journal_entries, interviews, conversations,
conversation_messages, events, ai_usage); providers/video.ts (Cloudflare Stream),
providers/image-gen.ts; storage.ts getUploadUrl(); platform/events/ (typed taxonomy +
record()/track() per ADR 6); features/(shared)/scheduler/ (in-process 1-min ticker);
enrollment middleware + business queries; features/(shared)/api-client/; SPA test harness;
existing-subscriber auto-enrollment script; client build step; seed script.

Out of scope: any UI (P2/P3/P4), playbook/journal features (P5), AI chat (P6), template
content authoring, mobile (P8). No enrollment cache (one indexed query; request-scoped
memoization only; no Redis — eng-schema S1/S2). No org_id / multi-tenancy (ADR 8). No vector
DB (ADR 9). No flag framework (cutover is one env boolean, eng-schema S6).

## Deliverables

### 1. Nested CLAUDE.md scaffolding (Build Order step 1 — before any code)
- **What:** Every new folder gets its CLAUDE.md before code (DX Convention 1; eng-schema
  DX MF7 list).
- **Files:**
  - CREATE platform/events/CLAUDE.md
  - CREATE features/(shared)/scheduler/CLAUDE.md
  - CREATE features/(shared)/enrollment/CLAUDE.md
  - CREATE features/(shared)/api-client/CLAUDE.md
  - MODIFY platform/db/CLAUDE.md (scheduling timestamps are timestamptz; events table
    append-only / no updatedAt exception — same PR as the migrations)
  - MODIFY platform/CLAUDE.md (env + cutover seam)
  - MODIFY platform/server/CLAUDE.md (mount order + manifest)
  - MODIFY platform/auth/CLAUDE.md (enrollment middleware + legacy pro role)
  - MODIFY providers/CLAUDE.md (video, image-gen, getUploadUrl, skipIf test pattern)
  - MODIFY platform/scripts/CLAUDE.md (enrollment script + seed entrypoint)
  - MODIFY CLAUDE.md (root — Seven Files: analytics entry points to platform/events/
    taxonomy; commands: client build + client:dev)
- **Acceptance criteria:**
  - [ ] Each new folder has a CLAUDE.md (purpose, critical rules, imports, recipe, verify)
        created before its code
  - [ ] platform/db/CLAUDE.md documents the timestamptz convention and the events
        append-only exception in the same PR as the migration

### 2. Schema: 20 tables migrated (verbatim from eng-schema.md, incl. lesson_progress)
- **What:** Extend the Drizzle schema with all 19 tables exactly as specified in
  eng-schema.md, including enums-as-text, FK cascades, named indexes, unique indexes, and
  the conventions header (uuid defaultRandom PK, createdAt/updatedAt, timestamptz for all
  new scheduling timestamps, events has NO updatedAt).
- **Files:** MODIFY platform/db/schema.ts; CREATE generated Drizzle migration files.
- **Key constraints to encode (quoting eng-schema.md):**
  - cohorts: `uniqueIndex('cohorts_program_start_idx').on(programId, startsAt)` — cron
    idempotency key; NO status enum (upcoming/running derives from dates, TD-1)
  - enrollments: cohortId NULLABLE (paid = evergreen no cohort; free = cohort-bound);
    `uniqueIndex(userId, programId)` — one row per user per program; free re-enrollment
    UPDATEs cohortId (TD-2; cohort-join history goes to events as 'cohort_joined');
    `index(userId, status)` for the hot access check
  - lessons: decisionPrompt text nullable (TD-3: exactly one per lesson = column not
    table); videoStatus enum ['none','uploading','processing','ready','error'];
    captionsReady boolean default false; PUBLISH INVARIANT (service code + test):
    status='published' requires videoStatus='ready' AND captionsReady AND decisionPrompt
    IS NOT NULL
  - modules: index(courseId, sortOrder) NOT unique (reordering with unique requires
    two-phase updates)
  - lives: cancelledAt timestamptz nullable (Gate C: cancellation is a human act —
    explicit column); upcoming/live/replay derives from dates
  - document_templates: schema jsonb $type<TemplateSchema> with STABLE STRING FIELD IDS,
    Zod-validated on every admin write; field ids immutable once published (TD-4)
  - documents: templateVersion pinned at instantiation; uniqueIndex(userId, templateId)
  - document_answers: uniqueIndex(documentId, fieldId) — autosave-on-blur upserts; source
    enum ['typed','interview']; confirmedAt nullable (ADR 11 trust moment as a column).
    THIS TABLE IS ADR 9's "structured typed rows"
  - journal_entries: entryDate DATE computed CLIENT-side in user's zone, sent explicitly —
    never derived server-side from UTC now; uniqueIndex(userId, entryDate, kind); NO
    streak columns
  - events: userId nullable + anonymousId (pre-auth funnel); name = Zod discriminated
    union at write boundary NOT pg enum (TD-5); isDecision boolean + decisionKind
    ('lesson_prompt'|'playbook'|'journal'); sourceRef + PARTIAL uniqueIndex(sourceRef)
    WHERE sourceRef IS NOT NULL (backfill idempotency, sourceRef='user_decisions:<uuid>');
    occurredAt (event time) + createdAt (ingest time); NO updatedAt; indexes
    (userId, occurredAt), (name, occurredAt), partial (userId, occurredAt) WHERE is_decision
  - ai_usage: budget check = sum() over (userId, createdAt) index for current month; NO
    materialized counter until measurably slow
- **Acceptance criteria:**
  - [ ] All 19 tables migrate on an empty DB
  - [ ] Account deletion cascades across ALL new user-keyed tables — cascade test
        enumerates all 19 (eng-schema: every user-keyed table cascades from users.id)
  - [ ] Publish invariant enforced in service code with a test
  - [ ] No type defined manually — inferred from Zod/Drizzle

### 3. Errors + env (full lists from eng-schema.md)
- **What:** All new error codes and env vars declared now (Build Order steps 3-4); later
  projects only consume them.
- **Files:** MODIFY platform/errors.ts; MODIFY platform/env.ts.
- **errors.ts additions (verbatim):**
  ```
  ENROLLMENT_REQUIRED 403 · PROGRAM_NOT_FOUND 404 · COHORT_NOT_FOUND 404 · LESSON_NOT_FOUND 404
  MODULE_NOT_FOUND 404 · VIDEO_NOT_READY 409 · CAPTIONS_REQUIRED 422 · VIDEO_UPLOAD_FAILED 502
  STREAM_WEBHOOK_INVALID 401 · COVER_GENERATION_FAILED 502 · TEMPLATE_NOT_FOUND 404
  DOCUMENT_NOT_FOUND 404 · ANSWER_FIELD_INVALID 400 · JOURNAL_DUPLICATE 409
  CONVERSATION_NOT_FOUND 404 · INTERVIEW_INVALID_STATE 409 · AI_BUDGET_EXCEEDED 429 · EVENT_INVALID 400
  ```
- **env.ts additions (verbatim):**
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
  Stream vars are OPTIONAL in the schema like R2_* — runtime ProviderError when absent —
  so dev/CI run without Cloudflare secrets. AI_MONTHLY_TOKEN_BUDGET_* get env.ts defaults
  so CI/local boot without new placeholders.
- **Acceptance criteria:**
  - [ ] App boots locally and in CI with zero new env placeholders
  - [ ] Calling a Stream-backed provider without Stream vars throws ProviderError at
        runtime (tested)

### 4. providers/video.ts (Cloudflare Stream)
- **What:** tus upload URL creation, self-signed JWT playback via jose (already a
  dependency) + Stream signing key — no Cloudflare API call per playback (TD-6) — and
  HMAC-verified video.ready webhook handling. Webhook handler idempotent: sets
  lessons.videoStatus='ready' by streamVideoId; re-delivery no-ops (eng-schema S4).
- **Files:** CREATE providers/video.ts + providers/video.test.ts; MODIFY
  platform/server/routes.ts (webhook route mount).
- **Acceptance criteria:**
  - [ ] Signed playback URL generated for a Stream video id (fixture-key tests)
  - [ ] Webhook signature verified via Webhook-Signature HMAC; invalid signature →
        STREAM_WEBHOOK_INVALID 401
  - [ ] Webhook re-delivery is a no-op (tested)
  - [ ] Unit tests = mocked fetch + fixture JWK/HMAC; integration tests follow
        storage.integration.test.ts's describe.skipIf pattern, skipping when CLOUDFLARE_*
        absent

### 5. providers/image-gen.ts + storage.ts getUploadUrl()
- **What:** image-gen.ts returns bytes; callers upload to R2 via storage.ts (TD-8:
  providers never import providers). Carries the versioned master cover prompt per ADR 18
  (module subject = only variable; palette-locked warm family; negative: purple/neon/
  blue-dominant; painterly editorial illustration, scene/object-based, NO human faces, NO
  text/typography in images; 2:3 module covers + 16:9 lesson thumbnails, fixed crops).
  storage.ts gains getUploadUrl() presigned-PUT (currently GET-only).
- **Files:** CREATE providers/image-gen.ts + providers/image-gen.test.ts; MODIFY
  providers/storage.ts + its test.
- **Acceptance criteria:**
  - [ ] Cover image generated and stored to R2 (integration test, describe.skipIf when
        IMAGE_GEN_API_KEY absent; unit tests use fixture bytes)
  - [ ] getUploadUrl() returns a presigned PUT URL (tested per existing storage patterns)

### 6. platform/events/ — event spine (ADR 6, eng-schema M3/M4)
- **What:** Typed taxonomy + record()/track(). Taxonomy declares the COMPLETE V2
  event-name union for waves 1-4 UPFRONT — names reserved like errors.ts does for codes;
  later projects only fill properties schemas. providers/analytics.ts stays the dumb
  PostHog wrapper, called by platform/events as the mirror.
  Double-write contract: record(event, tx?) for decision-bearing events — Postgres insert
  awaited inside the caller's transaction; PostHog mirror fires only AFTER commit,
  fire-and-forget, logged, never retried; divergence allowed in one direction only
  (Postgres ≥ PostHog). track() = best-effort telemetry (heartbeats): swallow-and-log.
- **Files:** CREATE platform/events/ (CLAUDE.md, taxonomy + record/track modules +
  colocated tests). MODIFY nothing in providers/analytics.ts beyond what mirroring needs.
- **Acceptance criteria:**
  - [ ] track() writes an events row + PostHog mirror
  - [ ] record() participates in the caller's transaction; a rolled-back transaction
        produces no PostHog mirror call (tested)
  - [ ] Events schema is explicitly Decision Graph v1: which actions count toward
        "Decisions Made" is defined in the taxonomy — lesson prompts: yes; playbook
        saves: yes; journal entries: yes, tagged separately (isDecision + decisionKind)
  - [ ] Invalid event name/properties → EVENT_INVALID 400 at the write boundary

### 7. features/(shared)/scheduler/ — in-process ticker (eng-schema M2)
- **What:** 1-min setInterval ticker in app.ts (single Railway instance, no leader
  election) running idempotent jobs: processPendingDrips (wires the existing DEAD
  function — live production bug), cohort auto-creation (idempotent via
  cohorts_program_start_idx + onConflictDoNothing), enrollment expiry sweep. Deploy
  restarts catch up on next tick. Jobs = exported functions taking now: Date; tick(now)
  is the tested unit; setInterval in app.ts is 3 lines of wiring.
- **Files:** CREATE features/(shared)/scheduler/ (CLAUDE.md, tick + jobs + tests);
  MODIFY app.ts (3-line wiring).
- **Acceptance criteria:**
  - [ ] processPendingDrips has a caller; previously scheduled drip emails send
  - [ ] Idempotency test for every job = call twice, assert no-op
  - [ ] Cohort auto-creation uses first-Monday date math in COHORT_TIMEZONE, stored
        timestamptz, compared as UTC instants (eng-schema M7); pure date-math function
        with fixture tests: first-Monday-is-the-1st, first-Monday-is-the-7th, year
        boundary, DST-transition month
  - [ ] Expiry sweep flips expired enrollments to status='expired'

### 8. Enrollment access control (eng-schema S1/S2)
- **What:** Middleware in platform/auth/enrollment.ts (sibling of
  requireAuth/requirePermission); business queries (canAccessLesson join through
  program_courses) in features/(shared)/enrollment/. Cache strategy: NONE — one indexed
  query, <1k users; request-scoped memoization only; revocation latency beats 1ms. No
  Redis.
- **Files:** CREATE platform/auth/enrollment.ts + test; CREATE
  features/(shared)/enrollment/ (CLAUDE.md, queries + tests).
- **Acceptance criteria:**
  - [ ] Enrollment check gates a lesson fetch (no active enrollment →
        ENROLLMENT_REQUIRED 403; tested)
  - [ ] Request-scoped memoization verified (one query per request for repeated checks)

### 9. features/(shared)/api-client/ — typed fetch wrapper
- **What:** Typed fetch wrapper over hono/client RPC with throwError-coded error mapping +
  auth handling; P2/P3/P8 consume it, never hand-roll fetch.
- **Files:** CREATE features/(shared)/api-client/ (CLAUDE.md, client + tests).
- **Acceptance criteria:**
  - [ ] Error responses map to typed error codes from platform/errors.ts (tested)
  - [ ] Auth handling covered by tests

### 10. SPA test harness
- **What:** happy-dom via bun test preload (bunfig.toml) + @testing-library/preact with
  one canonical example component test.
- **Files:** MODIFY bunfig.toml; CREATE one canonical example component test (location per
  harness conventions); MODIFY package.json (deps).
- **Acceptance criteria:**
  - [ ] `bun test` runs DOM component tests without a browser; the canonical example
        passes and demonstrates the pattern

### 11. Existing-subscriber auto-enrollment script + events backfill (eng-schema M8)
- **What:** Script in platform/scripts/ (NEVER a Drizzle migration) auto-enrolling active
  subscribers into the paid program at cutover: selects subscriptions status in (active,
  past_due, trialing) and periodEnd within grace; NULL-userId subscription rows REPORTED,
  not enrolled (webhook-before-linkage rows exist); idempotent via
  enrollments(userId, programId) unique + onConflictDoNothing; supports --dry-run.
  Plus: existing userDecisions backfill into the events spine (free Decision Graph data) —
  re-runnable via sourceRef='user_decisions:<uuid>' partial unique index; backfill sets
  occurredAt to original createdAt; source='backfill'.
- **Files:** CREATE platform/scripts/enroll-existing-subscribers.ts (or per scripts
  naming convention) + test; CREATE backfill script for userDecisions → events + test.
- **Acceptance criteria:**
  - [ ] Run twice = zero duplicate enrollments (tested)
  - [ ] --dry-run makes no writes
  - [ ] NULL-userId subscription rows reported, not enrolled
  - [ ] userDecisions backfill is idempotent (re-run = no duplicate events)

### 12. Client build step + bundle budget
- **What:** `bun build --target browser` with content-hash manifest consumed by the /app
  shell SSR route; wired into `bun run check` + ci.yml; gzipped bundle-budget assertion
  folded into harden-check.ts; `client:dev` watch script wired into `bun run dev`.
- **Files:** MODIFY package.json (scripts); MODIFY .github/workflows/ci.yml; MODIFY
  harden-check.ts (bundle-budget assertion); CREATE build script/manifest plumbing as
  needed under platform/server/ (manifest consumption).
- **Acceptance criteria:**
  - [ ] `bun run check` fails when the gzipped bundle exceeds budget
  - [ ] Content-hash manifest produced and consumable by an SSR route
  - [ ] `bun run dev` runs the client watch alongside the server

### 13. Seed script (fixes dead db:seed)
- **What:** Seed script for dev data; REPOINT the dead `db:seed` entrypoint (currently
  points at platform/scripts/seed.ts which does not exist).
- **Files:** CREATE platform/scripts/seed.ts; MODIFY package.json if the entrypoint path
  changes.
- **Seed-state enumeration (every UI-relevant state, verbatim from document.md):**
  - admin user
  - paid user (evergreen enrollment)
  - free user mid-cohort
  - free user pre-start
  - expired free enrollment
  - lessons in every videoStatus ('none','uploading','processing','ready','error')
  - a published lesson (captions + prompt, satisfying the publish invariant) and a draft one
  - lives in upcoming/replay/cancelled states
  - published template + one filled + one empty document
  - journal entries
  - a conversation with messages
  - an ai_usage row near the budget ceiling
- **Acceptance criteria:**
  - [ ] `bun run db:seed` works against a fresh local DB and produces every state above

## Acceptance Criteria (project-level, from document.md)

- [ ] All tables migrated on empty DB
- [ ] Enrollment check gates a lesson fetch
- [ ] track() writes events row + PostHog mirror
- [ ] Signed playback URL generated for a Stream video id
- [ ] Cover image generated and stored to R2
- [ ] Account deletion cascades across ALL new tables (tested, all 19 enumerated)
- [ ] Existing-subscriber auto-enrollment script works (idempotent, --dry-run, NULL-userId
      reporting)
- [ ] Events schema is explicitly Decision Graph v1 with "Decisions Made" actions defined
      (lesson prompts: yes; playbook saves: yes; journal entries: yes, tagged separately)
- [ ] Seed produces every UI-relevant state (full enumeration above)
- [ ] 100% test coverage

## Dependencies

- **Requires:** eng-schema.md (the reviewed schema gate artifact — binding). Nothing else;
  P1 is Wave 1 and the hard gate before all lanes (DX Convention 3, eng-schema
  Parallelization).
- **Produces:** the 19-table schema; enrollment access primitive + middleware;
  providers/video.ts, image-gen.ts, storage.getUploadUrl(); platform/events/ taxonomy +
  record()/track(); scheduler; api-client; SPA test harness; client build pipeline; seed
  data; migration + backfill scripts. Consumed by P2 (admin), P3 (members), P4 (funnel),
  P5 (playbook), P6 (AI), P7 (distribution UI), P8 (mobile).

## DX Conventions (applying to this project)

- CLAUDE.md first for every new folder (Build Order step 1); lanes never edit the same
  folder.
- One worktree per project session, branch `p1-foundation`.
- P1 is sequential and a hard gate — no parallel lane starts until it ships.
- SSE seam declared now for P6: providers/ai.ts will expose chat as AsyncIterable<chunk>
  (no P1 code, but nothing in P1 may preclude it).
- Mobile (P8) excluded from `bun run check` until its start gate opens.

## Risks

- Schema mistakes here are migration debt everywhere: mitigation = HARD GATE — schema
  already reviewed (eng review pass, eng-schema.md); code against it verbatim; deviations
  require re-review (T4).
- Migration script touches production billing data: mitigation = --dry-run, idempotency
  test (run twice = zero duplicates), NULL-userId rows reported not enrolled, never a
  Drizzle migration.
- Scheduler on a single instance: mitigation = idempotent jobs (call twice = no-op);
  deploy restarts catch up on next tick; cohort auto-creation idempotent via
  cohorts_program_start_idx.

## Relevant Decisions

| # | Decision | Choice | Why |
|---|----------|--------|-----|
| 2 | Video infrastructure | Cloudflare Stream (signed playback, HLS, watch telemetry) via providers/video.ts | Content protection + telemetry moat; R2 already in stack |
| 6 | Event spine | Append-only `events` table in Postgres as source of truth; typed taxonomy + record()/track() in platform/events/ (providers/analytics.ts stays the dumb PostHog mirror). Double-write contract: record() awaits the Postgres insert inside the caller's transaction for decision-bearing events; PostHog mirror fires only after commit, fire-and-forget, never retried — divergence allowed in one direction only (Postgres ≥ PostHog). track() = best-effort telemetry | Owned data feeds AI personalization; PostHog is a viewer; mirror-before-commit would show events that rolled back |
| 8 | Multi-tenancy | Not now; program/enrollment model provides the seams; add organization_id when first business client pays | Pre-revenue multi-tenant tax kills solo platforms |
| 9 | AI personalization | Structured typed rows (playbook answers, journal, decisions, interview distillations); per-request context assembly; no vector DB | A user's playbook fits in a prompt; debuggable |
| 10 | AI cost control | ai_usage table, monthly token budget per plan, model tiering, graceful ceiling, COGS target ≤$2/user/mo | $197/yr ceiling demands metering |
| 15 | Sequencing | Waves: (1) foundation+admin (2) members area+funnel (3) playbook+journal (4) AI chat+interviews (5) Expo app; each production-usable | Free cohort + ads can start before later waves |
| 18 | Cover Art System | Versioned master prompt in providers/image-gen.ts (module subject = only variable); palette-locked warm family; NO human faces, NO text in images; 2:3 covers + 16:9 thumbnails, fixed crops to R2 | Cohesion is a property of the collection; AI text/faces are slop risks |

## Open Questions

- The render.tsx:45 skip-link white-on-gold fix is listed under Canon Sync ("fix the
  existing instance alongside the spec") and as a live bug "fix in P1". Assumed: the
  one-line code fix ships in P1; the design.md amendment ships with Canon Sync. Confirm if
  the founder wants both gated on his gold-token decision.
- Cohort auto-creation job appears in both P1 scope (scheduler jobs list) and P4
  deliverables ("cohort auto-creation job on the Project 1 scheduler"). Assumed: P1 ships
  the job + date math + idempotency; P4 owns cohort lifecycle wiring (rollover, drip
  repointing). Confirm boundary before P4 starts.
- Live cadence ("first Monday monthly" assumed) — founder to confirm before the cohort
  cron ships (config value; document.md Open Questions).
