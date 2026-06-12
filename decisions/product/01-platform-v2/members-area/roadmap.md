# Members Area (Project 3)

> Initiative: 01-platform-v2
> Domain: product
> Created: 2026-06-12
> Status: ready

## Context

Platform V2's centerpiece: a video-first "Netflix of courses" members area — Netflix
LAYOUT (poster cards, rails, cover images) with the Ethereal Warmth PALETTE (cream/gold),
explicitly NOT dark (ADR 17). Users enter only through programs: free users see the full
catalog with locks (ADR 4 — ambient upsell, one codebase); paid users get instant full
access + monthly lives. Goal: a user watches the free course + lives in a beautiful
members area, upgrades, completes video lessons with decision prompts. Constraint: solo
founder + AI agents; dependency-ordered waves; existing text-course users must not break
mid-migration (the markdown text course stays fully functional until enrollment cutover).

This page IS the product's perceived quality. It is Lane B of Wave 2, parallel to P2
(admin) and P4 (funnel) after the P1 hard gate.

## Scope

In scope: /app SPA (Preact client-rendered, ADR 5) on the existing Hono API:
- Netflix-style catalog: program-aware rails, poster cards, lock states.
- Lesson player: Stream playback in ink canvas (ADR 19) + decision prompt + complete.
- Materials library.
- Lives section: upcoming/live/replay (ONE section, ADR 3).
- Continue-watching, progress.
- Watch-event ingestion to the event spine.
- Ethereal Warmth styling per decisions/design.md + the Design Requirements below.

**Lock-State UX (load-bearing, from design review):** free users see their unlocked
content FIRST (locked rails below the fold, never above); locked cards keep full-color
cover + ink-on-cream pill badge (never grayscale/blur); tapping a locked card opens a
preview sheet (description, lesson list, upgrade CTA) — never a dead end; catalog
distinguishes "exists, locked" from "drops on {date}" (only with a published date per
Gate B).

Out of scope: join/upgrade/checkout flows (P4); playbook + journal UI (P5); AI chat (P6);
admin (P2); marketing pages (stay SSR, unchanged). Never share UI components with mobile —
only Zod types + API client (ADR 5).

## Deliverables

### 1. CLAUDE.md scaffolding (before code)
- **Files:**
  - CREATE features/(life)/catalog/CLAUDE.md
  - CREATE features/(life)/player/CLAUDE.md
  - CREATE features/(life)/lives-view/CLAUDE.md
  - CREATE features/(life)/materials-view/CLAUDE.md
- **Acceptance criteria:**
  - [ ] Each folder's CLAUDE.md exists before its code

### 2. App shell + router (IA spec)
- **What:** /app shell with the IA spec: Home (rails: continue-watching, your program,
  lives, locked rails — Home answers "what do I do next" in the first viewport), Playbook,
  Journal, Chat — nav items appear ONLY when their wave ships (no coming-soon items).
  Mobile = bottom tab bar, desktop = top nav. Shell SSR route consumes the P1 content-hash
  manifest. /app/* routes mount BEFORE the '/' catch-alls (authPageRoutes, websiteRoutes)
  in routes.ts or deep links 404 into marketing.
- **Files:** CREATE /app shell + router (within features/(life)/ + pages wiring per
  existing conventions); MODIFY platform/server/routes.ts (mount /app/* before '/'
  catch-alls); MODIFY pages/ (wiring only, max 20 lines).
- **Acceptance criteria:**
  - [ ] Deep link to an /app route loads the SPA (no 404 into marketing)
  - [ ] Nav shows only shipped waves (this project ships Home/catalog surfaces only)
  - [ ] Bottom tab bar on mobile, top nav on desktop

### 3. Catalog (rails + poster cards + lock states)
- **What:** Program-aware rails honoring the Lock-State UX above. Rails use CSS
  scroll-snap with a partial next-card peek + desktop arrows (no auto-scroll, no
  hover-zoom/expand); card hover = gold border + subtle shadow. Poster cards: 1px
  linen border/surface edge (light covers must not dissolve into cream); 44px touch
  targets; rails are semantic lists under real h2 headings; `:focus-visible` gold ring
  on cards.
- **Files:** CREATE features/(life)/catalog/ (components, API routes, tests).
- **Acceptance criteria:**
  - [ ] Free user: unlocked content first, locked rails below the fold
  - [ ] Locked card = full-color cover + ink-on-cream pill badge (no grayscale/blur)
  - [ ] Locked card tap opens preview sheet (description, lesson list, upgrade CTA)
  - [ ] "Exists, locked" vs "drops on {date}" rendered distinctly (date state only when a
        published date exists)
  - [ ] Lesson cards show "processing" until Stream playback is ready
  - [ ] Loading/empty/error/success states on every screen (sand/linen skeletons, pinned
        aspect ratios — no CLS)

### 4. Lesson player (ink canvas + decision prompt)
- **What:** Stream playback inside a full-bleed ink (#1A1714) region around the video
  within the cream app — a palette token used as component background, NOT dark mode
  (ADR 19); warm chrome returns when the lesson ends. Decision prompt = inline panel
  below the player (never a modal), unlocks at video end, single question + free-text
  commitment, sage-green quiet confirmation + visible "Decisions made" count. Captions
  toggle available; every published lesson has a caption track. Answering the prompt
  completes the lesson (ADR 1) and records a decision event.
- **Files:** CREATE features/(life)/player/ (components, routes, tests). Player chunk
  (hls.js) lazy-loaded on the lesson route ONLY.
- **Acceptance criteria:**
  - [ ] Paid user watches a lesson (signed playback URL), captions toggle works
  - [ ] Prompt unlocks at video end; answer persists; progress persists
  - [ ] Answer writes a decision event (isDecision=true, decisionKind='lesson_prompt')
        via platform/events/ record()
  - [ ] Sage-green quiet confirmation + "Decisions made" count visible
  - [ ] `:focus-visible` gold ring on player controls

### 5. Lives section
- **What:** ONE Lives section with upcoming/live/replay states (ADR 3): countdown →
  unlisted YouTube Live embed → gated Stream replay. Countdowns are static text per
  minute (no animated ticking — reduced-motion rule).
- **Files:** CREATE features/(life)/lives-view/ (components, routes, tests).
- **Acceptance criteria:**
  - [ ] Live page shows countdown → embed → replay lifecycle
  - [ ] Replay playback gated by enrollment
  - [ ] Cancelled lives render the cancelled state (never a silent skip)

### 6. Materials library
- **What:** Member-facing list/download of materials mapped to the user's program(s).
- **Files:** CREATE features/(life)/materials-view/ (components, routes, tests).
- **Acceptance criteria:**
  - [ ] Enrolled user sees and downloads their program's materials; access gated by
        enrollment

### 7. Watch-event ingestion
- **What:** Batched client buffer POSTing event arrays, Zod-validated against the P1
  taxonomy, rate-limited like other public endpoints. Heartbeat cadence 1/30s
  (eng-schema S5). Continue-watching/progress derive from these events.
- **Files:** CREATE ingestion endpoint + client buffer (within features/(life)/player/ or
  catalog/ per CLAUDE.md recipes); MODIFY platform/server/routes.ts (mount).
- **Acceptance criteria:**
  - [ ] Client batches and flushes watch events; invalid payloads rejected with
        EVENT_INVALID
  - [ ] Endpoint rate-limited
  - [ ] Continue-watching rail reflects watch progress

### 8. Pre-start cohort state
- **What:** Free user whose cohort hasn't started sees welcome + start date + Starter
  Notebook unlocked + first live date — never an empty room.
- **Files:** within features/(life)/catalog/ (state logic + components + tests).
- **Acceptance criteria:**
  - [ ] Pre-start free user sees welcome, start date, Starter Notebook entry point, first
        live date (note: Starter Notebook fill-in UX itself is P5; this renders the
        unlocked entry state)

### 9. design.md component patterns + code.md budget (Universal File Sync)
- **What:** New component patterns (rail, poster, lock badge, player chrome) documented in
  design.md in the same PR; P3 owns member-area component sections (P2 appends a distinct
  admin subsection — rebase before ship). Bundle budgets per-surface: /app shell ≤100KB
  gzipped, player chunk lazy-loaded on lesson route only, marketing pages unchanged —
  code.md budget table amended (Canon Sync: the flat 50KB budget is arithmetically
  incompatible with an HLS player, hls.js ≈70KB gzipped).
- **Files:** MODIFY decisions/design.md (member-area component sections); MODIFY
  decisions/code.md (Performance Budget table).
- **Acceptance criteria:**
  - [ ] design.md documents rail/poster/lock-badge/player-chrome patterns in the same PR
  - [ ] harden-check bundle assertion passes: /app shell ≤100KB gzipped; player chunk not
        in the shell bundle; marketing budgets unchanged

## Acceptance Criteria (project-level, from document.md)

- [ ] Free user sees locked paid content + their cohort's unlocked content per Lock-State
      UX
- [ ] Paid user watches a lesson (captions toggle; every published lesson has a caption
      track), answers the decision prompt, progress persists
- [ ] Decision prompt = inline panel below the player (never a modal), unlocks at video
      end, single question + free-text commitment, sage-green quiet confirmation +
      visible "Decisions made" count
- [ ] Live page shows countdown→embed→replay lifecycle
- [ ] Pre-start cohort state shows welcome + start date + Starter Notebook unlocked +
      first live date (never an empty room)
- [ ] Gold-contrast and reduced-motion rules verified

## Design Requirements (binding for this project — from design review)

1. Interaction states are scope, not polish: loading (sand/linen skeletons, pinned aspect
   ratios — no CLS), empty (warm copy + a primary action), error (what/why/how-to-fix),
   success — on EVERY screen. "Processing" on lesson cards until Stream ready.
2. Gold contrast rule: text on gold backgrounds is ink (#1A1714, ≈6.3:1) — white-on-gold
   (≈2.7:1, fails WCAG AA) is banned.
3. Reduced motion is a primary path (~35% of ICP): scroll-snap rails with partial
   next-card peek + desktop arrows (no auto-scroll, no hover-zoom/expand); card hover =
   gold border + subtle shadow; countdowns static text per minute; all non-essential
   transitions wrapped in `prefers-reduced-motion: no-preference`.
4. Poster cards: 1px linen border/surface edge; 44px touch targets; semantic lists under
   real h2 headings; `:focus-visible` gold ring on cards and player controls.
5. /app consumes the existing tokens in styles/global.css — never a forked token set.
   New component patterns documented in design.md in the same PR.

## Dependencies

- **Requires:** Project 1 complete (schema, enrollment middleware + queries,
  providers/video.ts signed playback, platform/events/ taxonomy, api-client, SPA test
  harness, client build step + manifest, seed states for every UI state). Content from
  Project 2/Gate A to be watchable in production (seed data suffices for development).
  Lane B parallel to P2/P4 — file-disjoint except routes.ts mounts and design.md sections.
- **Produces:** the member experience consumed by P4 (upgrade CTA targets), P5/P6 (nav
  slots appear when their waves ship), P8 (mobile mirrors this via shared types +
  api-client, never UI components).

## DX Conventions (applying to this project)

- One worktree per project session, branch `p3-members-area`.
- CLAUDE.md first; lanes never edit the same folder.
- routes.ts: /app/* mounts before '/' catch-alls; expect trivial .route() rebase against
  Lanes A/C before ship.
- design.md: P3 owns member-area component sections; rebase before ship.
- Consume features/(shared)/api-client/ — never hand-roll fetch.
- Tests: P1 SPA harness (happy-dom + @testing-library/preact).

## Risks

- This page IS the product's perceived quality: mitigation = design review required
  before ship (explicit gate).
- Bundle bloat from the player: mitigation = hls.js lazy-loaded on lesson route only;
  harden-check gzipped budget assertion fails the build.
- Deep-link 404s: mitigation = mount-order rule encoded in routes.ts + a test that
  fetches an /app deep link.

## Relevant Decisions

| # | Decision | Choice | Why |
|---|----------|--------|-----|
| 1 | In-lesson interactivity | One decision prompt per video lesson; answering completes the lesson | Feeds "Decisions Made" north star; differentiates from passive members areas |
| 3 | Lives | Unlisted YouTube Live embed for the live moment; recording uploaded to Stream as gated replay; ONE Lives section with upcoming/live/replay states | 90% of watch time is replays; zero live-infra risk |
| 4 | Free program shape | One platform; free users see full catalog with locks; enrollment (user×cohort) is the access primitive | Ambient upsell; one codebase |
| 5 | Members-area frontend | Preact client-rendered app at /app on the existing Hono API; marketing stays SSR; share Zod types + API client with mobile, never UI components | One framework, lean; UI-sharing with RN is a trap |
| 17 | Design | Netflix LAYOUT (poster cards, rails, cover images), Ethereal Warmth PALETTE (cream/gold) | Premium + distinct from dark BR members areas; design.md stays locked |
| 19 | Player canvas | Full-bleed ink (#1A1714) region around the video inside the cream app — a palette token used as component background, NOT dark mode | Video floating on cream reads as an embed, not a cinema |

## Open Questions

- ~~Progress model~~ RESOLVED by aggregator: eng-schema.md table 20 (lesson_progress) is the
  read model — upsert(userId, lessonId) with secondsWatched/lastWatchedAt/completedAt;
  continue-watching rail = one query on index(userId, lastWatchedAt); completedAt set when
  the decision prompt is answered. Heartbeats still flow to the events spine for analytics.
- "Your program" rail contents for a paid user with full catalog access vs. free user —
  the IA spec lists the rails but not their exact query semantics. Derive from enrollment
  + program_courses; flag for design review if ambiguous in practice.
