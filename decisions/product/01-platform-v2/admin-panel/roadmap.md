# Admin Panel (Project 2)

> Initiative: 01-platform-v2
> Domain: product
> Created: 2026-06-12
> Status: ready

## Context

Platform V2 pivots Right Decision to a video-first members area entered through programs
(free monthly cohorts + $197/year paid program with monthly lives). The founder + wife
author EVERYTHING through this admin panel — video upload, AI-generated module covers,
materials, lives scheduling, cohort management — without touching code (ADR 7: courses/
modules/lessons in Postgres + media in R2/Stream; markdown stays for blog/handbook/SEO
only; git is not the co-founder's CMS). Constraint: solo founder + AI agents; existing
production users must not break mid-migration.

This is Lane A of Wave 1-2 parallelization — "the elephant" (tus + course builder) per
eng-schema.md. It is also the upload path for Content Gates A/B/C (Project 0): content
production blocks on this panel shipping.

## Scope

In scope: /admin SPA (Preact, admin role):
- Course builder: courses→modules→lessons, video upload to Stream, AI cover generation
  with 4-option picker — the picker renders candidates ALONGSIDE existing covers so
  collection cohesion is judged in context — lesson decision prompt editor.
- Caption upload/auto-generate step in the lesson upload flow (publish gate: no captions,
  no publish — lessons publish invariant from eng-schema.md).
- Materials upload (R2 presigned PUT).
- Lives scheduling (YouTube URL + time + program scope, replay upload).
- Cohort management (auto first-Monday generation + manual override).
- Program content mapping (which courses/lives/materials each program includes).
- Migration of the existing features/(shared)/admin/ (analytics API) INTO features/(admin)/
  as its first module — one admin group, no orphan.

Out of scope: distribution UI (Project 7 — sequential after this, same features/(admin)/
group); playbook template editor (Project 5); member-facing UI (Project 3); any new
schema/providers (Project 1 ships all of it).

## Deliverables

### 1. features/(admin)/ group + CLAUDE.md scaffolding
- **What:** New admin feature group with nested CLAUDE.md files created BEFORE code (DX
  Convention 1); existing shared admin analytics API migrates in as the first module.
- **Files:**
  - CREATE features/(admin)/CLAUDE.md (group)
  - CREATE features/(admin)/course-builder/CLAUDE.md
  - CREATE features/(admin)/materials/CLAUDE.md
  - CREATE features/(admin)/lives/CLAUDE.md
  - CREATE features/(admin)/cohorts/CLAUDE.md
  - MODIFY features/(shared)/admin/ → migrated into features/(admin)/ (move, update
    imports; its CLAUDE.md noted as migrated)
- **Acceptance criteria:**
  - [ ] Every new folder has its CLAUDE.md before code
  - [ ] features/(shared)/admin/ no longer exists as an orphan; analytics API works from
        its new home (existing tests pass from new location)

### 2. Course builder (courses → modules → lessons)
- **What:** CRUD UI for the DB-backed course CMS: create courses, modules (with AI cover),
  lessons (with video upload + decision prompt editor + caption step). Publish gate
  enforced in UI and API: status='published' requires videoStatus='ready' AND
  captionsReady AND decisionPrompt IS NOT NULL.
- **Files:** CREATE features/(admin)/course-builder/ (components, API routes, tests);
  MODIFY platform/server/routes.ts (mount admin routes — trivial .route() chain, keep
  connected for AppRoutes inference).
- **Acceptance criteria:**
  - [ ] Create course → module → lesson end-to-end via UI
  - [ ] Lesson decision prompt editable (one prompt per lesson, ADR 1 / TD-3 column)
  - [ ] Publish blocked with CAPTIONS_REQUIRED / VIDEO_NOT_READY until invariant satisfied
        (tested)
  - [ ] Module reordering works (sortOrder, non-unique index per eng-schema.md)

### 3. AI cover generation with 4-option picker (ADR 18)
- **What:** Generate 4 cover candidates via providers/image-gen.ts (versioned master
  prompt, module subject = only variable); picker renders candidates ALONGSIDE existing
  covers so collection cohesion is judged in context; chosen cover uploaded to R2 via
  storage.ts; 2:3 module covers + 16:9 lesson thumbnails, fixed crops.
- **Files:** CREATE within features/(admin)/course-builder/ (picker component + API route
  + tests).
- **Acceptance criteria:**
  - [ ] Picker shows 4 candidates next to the module's existing sibling covers
  - [ ] Selecting a candidate stores it to R2 and sets coverImageKey
  - [ ] Generation failure surfaces COVER_GENERATION_FAILED with an actionable error state

### 4. Video upload flow (tus → Stream) with injected uploader
- **What:** Large-file uploads show progress %, retry-on-fail, and surfaced Stream encoding
  status. Upload component takes an INJECTED uploader interface — real tus-js-client in
  production, scripted fake drives progress/retry/failure states in tests; never real
  uploads in CI. tus resumable protocol (basic direct upload caps ~200MB); never proxy
  uploads through Hono. videoStatus driven by the P1 Stream webhook.
- **Files:** CREATE upload component + uploader interface within
  features/(admin)/course-builder/; MODIFY package.json (tus-js-client, admin bundle only).
- **Acceptance criteria:**
  - [ ] Upload shows progress %, supports retry-on-fail, surfaces encoding status
        ("processing" until Stream ready)
  - [ ] Tests drive progress/retry/failure via the scripted fake uploader — every upload
        failure state rendered (no real uploads in CI)

### 5. Materials upload
- **What:** Upload materials to R2 via presigned PUT (storage.getUploadUrl() from P1);
  attach to lessons (optional lessonId) and map to programs (program_materials).
- **Files:** CREATE features/(admin)/materials/ (components, routes, tests).
- **Acceptance criteria:**
  - [ ] Material uploaded direct-to-R2 (never proxied through Hono), attached to a lesson
        and mapped to a program

### 6. Lives scheduling
- **What:** Schedule a live: YouTube URL + time + program scope; upload replay to Stream
  (replayStreamVideoId/replayStatus); explicit cancellation (cancelledAt — a human act,
  Gate C); upcoming/live/replay derives from dates.
- **Files:** CREATE features/(admin)/lives/ (components, routes, tests).
- **Acceptance criteria:**
  - [ ] Live created with timestamptz scheduledAt, scoped to a program
  - [ ] Replay upload flow sets replayStreamVideoId; status reflects processing/ready
  - [ ] Cancellation is explicit and distinct from rescheduling

### 7. Cohort management
- **What:** View auto-created cohorts (first-Monday generation from the P1 scheduler) +
  manual override (create/edit a cohort with custom dates).
- **Files:** CREATE features/(admin)/cohorts/ (components, routes, tests).
- **Acceptance criteria:**
  - [ ] Next cohort auto-created appears in the UI; manual override creates a custom cohort
        without colliding with the auto-creation idempotency key

### 8. Program content mapping
- **What:** Map which courses/lives/materials each program includes (program_courses,
  program_materials, lives.programId).
- **Files:** within features/(admin)/ modules above (routes + UI + tests).
- **Acceptance criteria:**
  - [ ] Adding/removing a course from a program changes member access (verified through
        the P1 enrollment query in an integration test)

### 9. Pages wiring + design.md admin subsection
- **What:** pages/admin wiring (pages are max 20 lines — just wiring). Document new admin
  component patterns in design.md as a DISTINCT admin subsection (P3 owns member-area
  component sections; rebase before ship — DX Convention 2).
- **Files:** CREATE/MODIFY pages/admin/* (wiring only); MODIFY decisions/design.md
  (append admin subsection only); MODIFY platform/server/routes.ts (mount).
- **Acceptance criteria:**
  - [ ] /admin gated by admin role (role-based gating stays — 'pro' role is legacy but
        admin gating is NOT enrollment-based)
  - [ ] design.md updated in the same PR (Universal File Sync)

## Acceptance Criteria (project-level, from document.md)

- [ ] The NON-TECHNICAL co-founder completes the full flow unaided — create a module with
      AI cover, upload a lesson video, attach a material, schedule a live, see next cohort
      auto-created; all without code or help.
- [ ] Machine-verifiable proxy: integration tests cover each step of the flow + every
      upload failure state rendered.
- [ ] The co-founder walkthrough is an explicit human gate — MODIFY
      decisions/humantasks.md (add the walkthrough entry).

## Design Requirements (binding for this project)

- Admin design bar: same tokens as the rest of the app ("plain Stripe dashboard" polish),
  desktop-first, 100% interaction-state coverage — an unexplained spinner = a support call.
- Interaction states are scope, not polish: every screen ships loading (sand/linen
  skeletons, pinned aspect ratios — no CLS), empty (warm copy + primary action), error
  (what/why/how-to-fix), success. Lesson cards show "processing" until Stream playback is
  ready.
- Gold contrast rule: text on gold is ink (#1A1714) — white-on-gold is banned.
- /admin consumes the existing tokens in styles/global.css — never a forked token set.
- Reduced motion: non-essential transitions wrapped in
  `prefers-reduced-motion: no-preference`.

## Dependencies

- **Requires:** Project 1 complete (schema, providers/video.ts + image-gen.ts +
  storage.getUploadUrl(), platform/events/, api-client, SPA test harness, client build
  step, scheduler). Lane A may run parallel to Lanes B (P3) and C (P4) — file-disjoint
  except platform/server/routes.ts (trivial mount conflicts) and design.md (distinct
  subsections; rebase before ship).
- **Produces:** the content authoring path — unblocks Content Gates A/B/C (Project 0);
  features/(admin)/ group that Project 7 extends (P2 and P7 both touch features/(admin)/ —
  SEQUENTIAL, never parallel).

## DX Conventions (applying to this project)

- One worktree per project session, branch `p2-admin-panel`.
- CLAUDE.md first for every new folder; lanes never edit the same folder.
- Consume features/(shared)/api-client/ — never hand-roll fetch.
- P2 before P7 (same features/(admin)/ group).
- /admin SPA tests use the P1 SPA harness (happy-dom + @testing-library/preact).

## Risks

- Upload UX (large files): tus resumable protocol for Stream (basic direct upload caps
  ~200MB; tus also delivers the progress %/retry requirement), presigned PUT for R2;
  NEVER proxy uploads through Hono.
- Co-founder usability is the real acceptance bar: mitigation = explicit human walkthrough
  gate in humantasks.md + integration tests for every step and failure state.

## Relevant Decisions

| # | Decision | Choice | Why |
|---|----------|--------|-----|
| 7 | Course CMS | Courses/modules/lessons in Postgres + media in R2/Stream, edited via admin panel; markdown stays for blog/handbook/SEO only | Non-technical co-founder authors content; git is not her CMS |
| 18 | Cover Art System | Versioned master prompt in providers/image-gen.ts (module subject = only variable); palette-locked warm family (negative: purple/neon/blue-dominant); painterly editorial illustration, scene/object-based, NO human faces, NO text/typography in images (titles always live HTML below card); 2:3 module covers + 16:9 lesson thumbnails, fixed crops to R2 | Cohesion is a property of the collection; AI text/faces are slop risks |
| 2 | Video infrastructure | Cloudflare Stream (signed playback, HLS, watch telemetry) via providers/video.ts | Content protection + telemetry moat |
| 3 | Lives | Unlisted YouTube Live embed; recording uploaded to Stream as gated replay; ONE Lives section with upcoming/live/replay states | 90% of watch time is replays; zero live-infra risk |
| 1 | In-lesson interactivity | One decision prompt per video lesson; answering completes the lesson | Feeds "Decisions Made" north star |
| 5 | Members-area frontend | Preact client-rendered SPA on the existing Hono API | One framework, lean |

## Open Questions

- "Caption upload/auto-generate" — document.md does not specify the auto-generate
  mechanism (Cloudflare Stream's built-in caption generation vs. an external service).
  Stream offers generated captions; assume Stream-native unless the founder says
  otherwise. Do not invent a new provider without confirmation.
- Cohort "manual override" semantics: can an override delete/move an already-started
  cohort with enrollees? document.md only says "auto first-Monday generation + manual
  override". Assume create/edit future cohorts only; flag destructive edits for founder
  decision.
