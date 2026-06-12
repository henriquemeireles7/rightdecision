# Platform V2 — Programs, Video Courses, Playbook, AI

> Domain: product
> Created: 2026-06-12
> Status: draft
> Maturity target: Engagement L1→L2, Data L1→L2 (see decisions/maturity.md)

## Context

Right Decision today is a text-based course platform: editorial reading room with decision
blocks, free intro funnel, Stripe subscriptions, blog/handbook content platform, and a
complete (but UI-less) video→clips→social distribution pipeline. Auth, billing, email, SEO,
and the design system are production-grade. Course content is mostly unwritten, telemetry is
fragmented (PostHog + a separate readingAnalytics table), and there is no video, no admin
panel, no mobile app.

The founder's V2 vision pivots delivery: a video-first "Netflix of courses" members area
(Ethereal Warmth skin, NOT dark), entered only through **programs** — a monthly cohort-based
free program (lead gen, always running, ads pointed at the next start date) and a paid full
program ($197/year, instant full access, monthly lives). Students fill a structured **Life
Playbook** (pre-made fill-in documents, not a free-form editor), do daily journaling, and can
be **interviewed by AI** instead of typing. All of it feeds a per-user structured context
store that powers personalized AI chat. The founder + wife author everything through an
**admin panel** (video upload, AI-generated module covers, materials, lives scheduling,
distribution flows). A future business program reuses the same platform.

Why now: the platform-building phase is done enough that content + engagement (the documented
P0 bottleneck) is what's left, and the founder is committing to the cohort/program go-to-market.
This initiative is the structural foundation for everything that follows — including the
Decision Graph data layer (currently 3/99) that the whole flywheel depends on.

## Goal

A user can join a free cohort from an ad, watch the free course + lives in a beautiful members
area, upgrade to the paid program, complete video lessons with decision prompts, fill their
Life Playbook (typing or AI interview), journal daily, and talk to an AI that knows their
playbook — while the founder runs everything (content, covers, materials, lives, cohorts,
distribution) from an admin panel without touching code.

## Constraint

Solo founder + AI agents; everything must ship in dependency-ordered waves so the free cohort
funnel (and its ad engine) can go live before later waves land. Existing production users of
the text course must not break mid-migration.

## Decision Log (ADRs — founder accepted CTO recommendations 2026-06-12)

| # | Decision | Choice | Why | Alternative rejected |
|---|----------|--------|-----|---------------------|
| 1 | In-lesson interactivity | Keep decision blocks: one decision prompt per video lesson; answering completes the lesson | Feeds "Decisions Made" north star; differentiates from passive members areas | Passive video + playbook-only input |
| 2 | Video infrastructure | Cloudflare Stream (signed playback, HLS, watch telemetry) via providers/video.ts | Content protection + telemetry moat; R2 already in stack | Vimeo/YouTube embeds (no gating, no data) |
| 3 | Lives | Unlisted YouTube Live embed for the live moment; recording uploaded to Stream as gated replay; ONE Lives section with upcoming/live/replay states | 90% of watch time is replays; zero live-infra risk | Native live streaming (cost+complexity) |
| 4 | Free program shape | One platform; free users see full catalog with locks; enrollment (user×cohort) is the access primitive | Ambient upsell; one codebase | Separate cohort microsites |
| 5 | Members-area frontend | Preact client-rendered app at /app on the existing Hono API; marketing stays SSR; share Zod types + API client with mobile, never UI components | One framework, lean; UI-sharing with RN is a trap | React/TanStack rewrite |
| 6 | Event spine | Append-only `events` table in Postgres as source of truth (typed taxonomy in providers/analytics.ts); same track() mirrors to PostHog; Stream + mobile events ingest here | Owned data feeds AI personalization; PostHog is a viewer | PostHog as sole store (vendor lock) |
| 7 | Course CMS | Courses/modules/lessons in Postgres + media in R2/Stream, edited via admin panel; markdown stays for blog/handbook/SEO only | Non-technical co-founder authors content; git is not her CMS | Admin-writes-markdown-to-git hybrid |
| 8 | Multi-tenancy | Not now; program/enrollment model provides the seams; add organization_id when first business client pays | Pre-revenue multi-tenant tax kills solo platforms | Nullable org_id columns today |
| 9 | AI personalization | Structured typed rows (playbook answers, journal, decisions, interview distillations); per-request context assembly; no vector DB | A user's playbook fits in a prompt; debuggable | Embeddings/RAG (premature) |
| 10 | AI cost control | ai_usage table, monthly token budget per plan, model tiering (small for interviews/suggestions, large for advice), graceful ceiling, COGS target ≤$2/user/mo | $197/yr ceiling demands metering | Unmetered with alerts |
| 11 | Interview v1 | Text chat interview that distills into document fields for user confirmation; voice via phone keyboard dictation; realtime voice = v2 | 10x cheaper, same data captured | Realtime voice day 1 |
| 12 | Apple IAP | Mobile app is login-only; all purchases on web (reader-app pattern) | Keep full margin; standard for course platforms | IAP at +30% price |
| 13 | Paid program model | Annual subscription, instant full content access, monthly lives for all; "12-month program" = 12 monthly live cycles; free = monthly cohorts | Evergreen content, monthly community cadence, no cart ops | Launch model (open/close carts) |
| 14 | Paid ads | Unlock the no-ads decision WITH guardrail: ads only to free program; measure free→paid across 2-3 cohorts before scaling | Cohort deadlines need fill; conversion data needed | Keep organic-only |
| 15 | Sequencing | Waves: (1) foundation+admin (2) members area+funnel (3) playbook+journal (4) AI chat+interviews (5) Expo app; each production-usable | Free cohort + ads can start before later waves | True one-shot landing |
| 16 | Naming | Paid doc set = "Life Playbook"; free doc set = "Starter Notebook" | Action-oriented (anti-self-help), short, scales to "Business Playbook" | "Personal Strategy Handbook" (too long) |
| 17 | Design | Netflix LAYOUT (poster cards, rails, cover images), Ethereal Warmth PALETTE (cream/gold) | Premium + distinct from dark BR members areas; design.md stays locked | Dark cinematic members area |
| 18 | Cover Art System | Versioned master prompt in providers/image-gen.ts (module subject = only variable); palette-locked to warm family (negative: purple/neon/blue-dominant); painterly editorial illustration, scene/object-based, NO human faces, NO text/typography in images (titles always live HTML below card, never overlaid); 2:3 module covers + 16:9 lesson thumbnails, fixed crops to R2 | Cohesion is a property of the collection; AI text/faces are slop risks; light covers need palette anchor to not dissolve into cream bg | Unconstrained per-module generation |
| 19 | Player canvas | Full-bleed ink (#1A1714) region around the video inside the cream app — a palette token used as component background, NOT dark mode | Video floating on cream reads as an embed, not a cinema; warm chrome returns when lesson ends | Video directly on cream |
| 20 | Playbook "book" UX | One page = one scrollable section in the 640px reading column, serif chapter heads + contents spine; autosave on blur with quiet "Saved" indicator; NO skeuomorphic page-flip | Book feeling comes from typography and structure; page-flip is banned decorative motion; explicit Save creates loss anxiety on reflective documents | Page-flip animation |

## Success Metrics & Kill Criteria

| Metric | Target | Branch if missed |
|--------|--------|------------------|
| Cohort 1 launch date | Within 6 weeks of Wave 2 ship | Re-scope content gate (see Project 0) |
| Activation | First decision within 48h of joining (north star) | Rework free course lesson 1 |
| Free→paid conversion | ≥3% across cohorts 2-3 | <1.5%: stop ad spend, rework offer before cohort 4 |
| Cohort fill | ≥50 joiners per free cohort by cohort 3 | Shift budget to organic (Project 7 clips) |
| Total COGS per active user | ≤$3/mo (AI ≤$2 + Stream/R2 ≤$1) | Tier video quality / tighten AI budgets |
| Refund rate | <5% of paid joins | Pause checkout, fix expectation gap (see Wave-2 copy rule) |

Wave-2 checkout copy sells ONLY what exists at that moment (video + lives), with a
published content roadmap for the rest — never the full promised library (T3 bridge).

## Content Gates (Project 0 — founder/human track, runs parallel to all waves)

Software cannot move Engagement until videos exist. Content production is a parallel
human track with hard gates:
- **Gate A (blocks cohort 1):** free program fully recorded + uploaded (target 3-5 lessons).
- **Gate B (blocks paid checkout):** ≥2 paid modules recorded + a published monthly drop
  schedule for the remainder (honesty bridge for ADR 13's instant-access promise).
- **Gate C (blocks each cohort):** that month's live scheduled with a fallback protocol —
  if a month is missed, it becomes a replay-month (pre-announced), never a silent skip.
- Owners: Henry + Indy record; admin panel (Project 2) is the upload path; the existing
  distribution pipeline (Project 7) turns each recording into clips for cohort fill.

## Migration of Existing Users (hard requirement, Constraint enforcement)

- Active subscribers are auto-enrolled into the paid program at cutover (script in
  Project 1; tested).
- Text-course progress, micro-decisions, journey, and wins remain accessible; existing
  userDecisions backfill into the events spine (free Decision Graph data).
- The markdown text course remains source of truth and fully functional until enrollment
  cutover completes; cutover is feature-flagged with an explicit rollback step.

## Design Requirements (apply to ALL UI projects — from design review)

1. **Interaction states are scope, not polish:** every screen ships loading (sand/linen
   skeletons with pinned aspect ratios — no CLS), empty (warm copy + a primary action),
   error (what/why/how-to-fix), and success states. Lesson cards show "processing" until
   Stream playback is ready.
2. **Gold contrast rule:** text on gold backgrounds is ink (#1A1714, ≈6.3:1) — white-on-gold
   (≈2.7:1, fails WCAG AA) is banned. (design.md's button spec self-contradicts; see Canon Sync.)
3. **Reduced motion is a primary path (~35% of ICP):** rails use CSS scroll-snap with a
   partial next-card peek + desktop arrows (no auto-scroll, no hover-zoom/expand); card
   hover = gold border + subtle shadow; countdowns are static text per minute; all
   non-essential transitions wrapped in `prefers-reduced-motion: no-preference`.
4. **Poster cards:** 1px linen border/surface edge (light covers must not dissolve into
   cream); 44px touch targets; rails are semantic lists under real h2 headings;
   `:focus-visible` gold ring extends to cards and player controls.
5. **/app consumes the existing tokens in styles/global.css** — never a forked token set.
   New component patterns (rail, poster, lock badge, player chrome, chat bubbles, interview
   confirm) get documented in design.md in the same PR (Universal File Sync).
6. **Admin design bar:** same tokens, "plain Stripe dashboard" polish, desktop-first,
   100% interaction-state coverage (an unexplained spinner = a support call).

## Projects (suggested breakdown)

Sequencing note (T2): if ads are unconfirmed by Wave 2, Project 7 (distribution-admin)
moves directly after Project 4 — it is the organic hedge for cohort fill.

### Project 1: foundation
- **Scope:** Schema + access control + providers for everything V2. Programs, cohorts,
  enrollments, courses(db), modules, lessons, lesson decision prompts, materials, lives,
  document templates, documents, journal entries, interviews, events, ai_usage. New
  providers: video.ts (Cloudflare Stream), image-gen.ts. Rework analytics.ts into the event
  spine (Postgres + PostHog mirror). Enrollment-based access middleware replacing
  role/subscription checks for V2 content.
- **Deliverables:** migrations; platform/db/schema.ts extended; platform/errors.ts +
  platform/env.ts updated; providers/video.ts, providers/image-gen.ts, providers/analytics.ts
  v2; features/(shared)/enrollment/ (grant/check/list); seed script for dev data.
- **Acceptance criteria:** all tables migrated on empty DB; enrollment check gates a lesson
  fetch; track() writes events row + PostHog mirror; signed playback URL generated for a
  Stream video id; cover image generated and stored to R2; account deletion cascades across
  ALL new tables (tested); existing-subscriber auto-enrollment script works; events schema
  is explicitly Decision Graph v1 — define which actions count toward "Decisions Made"
  (lesson prompts: yes; playbook saves: yes; journal entries: yes, tagged separately);
  100% test coverage.
- **Risk:** schema mistakes here are migration debt everywhere — HARD GATE: schema reviewed
  (eng review pass) before any dependent project codes against it (T4).

### Project 2: admin-panel
- **Scope:** /admin SPA (Preact, admin role): course builder (courses→modules→lessons, video
  upload to Stream, AI cover generation with 4-option picker — the picker renders candidates
  ALONGSIDE existing covers so collection cohesion is judged in context, lesson decision
  prompt editor), caption upload/auto-generate step in the lesson upload flow (publish gate:
  no captions, no publish), materials upload (R2), lives scheduling (YouTube URL + time +
  program scope, replay upload), cohort management (auto first-Monday generation + manual
  override), program content mapping (which courses/lives/materials each program includes).
  Large-file uploads show progress %, retry-on-fail, and surfaced Stream encoding status.
- **Deliverables:** features/(admin)/ group: course-builder/, materials/, lives/, cohorts/;
  admin API routes; upload flows (direct-to-Stream/R2 presigned); pages/admin wiring.
- **Acceptance criteria:** the NON-TECHNICAL co-founder completes the full flow unaided —
  create a module with AI cover, upload a lesson video, attach a material, schedule a live,
  see next cohort auto-created; all without code or help.
- **Risk:** upload UX (large files) — use presigned/direct uploads, never proxy through Hono.

### Project 3: members-area
- **Scope:** /app SPA: Netflix-style catalog (program-aware rails, poster cards, lock states),
  lesson player (Stream playback in ink canvas per ADR 19 + decision prompt + complete),
  materials library, Lives section (upcoming/live/replay), continue-watching, progress.
  Ethereal Warmth styling per decisions/design.md + Design Requirements above.
  **Lock-State UX:** free users see their unlocked content FIRST (locked rails below the
  fold, never above); locked cards keep full-color cover + ink-on-cream pill badge (never
  grayscale/blur); tapping a locked card opens a preview sheet (description, lesson list,
  upgrade CTA) — never a dead end; catalog distinguishes "exists, locked" from "drops on
  {date}" (only with a published date per Gate B).
- **Deliverables:** features/(life)/catalog/, player/, lives-view/, materials-view/; app shell
  + router with the IA spec: Home (rails: continue-watching, your program, lives, locked
  rails — Home answers "what do I do next" in the first viewport), Playbook, Journal, Chat —
  nav items appear only when their wave ships (no coming-soon items); mobile = bottom tab
  bar, desktop = top nav; watch-event ingestion to event spine; design.md component
  pattern updates.
- **Acceptance criteria:** free user sees locked paid content + their cohort's unlocked
  content per Lock-State UX; paid user watches a lesson (captions toggle available; every
  published lesson has a caption track), answers the decision prompt, progress persists;
  decision prompt = inline panel below the player (never a modal), unlocks at video end,
  single question + free-text commitment, sage-green quiet confirmation + visible "Decisions
  made" count; live page shows countdown→embed→replay lifecycle; pre-start cohort state
  shows welcome + start date + Starter Notebook unlocked + first live date (never an empty
  room); gold-contrast and reduced-motion rules verified.
- **Risk:** this page IS the product's perceived quality — design review required before ship.

### Project 4: funnel-v2
- **Scope:** Cohort-based acquisition: landing page variant for the free program with dynamic
  next-cohort date, join flow (signup→enrollment into current/next cohort), upgrade flow
  (checkout→paid enrollment), drip emails repointed to cohort lifecycle (welcome, starts-soon,
  day-N nudges, upgrade), cron for cohort auto-creation + date rollover.
- **Deliverables:** features/(life)/join/, cohort cron in features/(shared)/cohort-scheduler/,
  landing updates, email templates, Stripe webhook → paid enrollment.
- **Acceptance criteria:** ad URL → join page shows next start date without manual edits;
  joining enrolls into the right cohort; paying creates paid enrollment; existing yearly/monthly
  Stripe plans keep working.
- **Risk:** must not break the live evergreen funnel until cutover — feature-flag the switch.

### Project 5: playbook
- **Scope:** Life Playbook + Starter Notebook: template chapters/pages (instructions +
  structured fields), fill-in UX per ADR 20 (640px reading column, serif chapter heads,
  contents spine, autosave on blur), progress, PDF export (satori — WHITE background, ink
  text, gold only for rules/accents; cream wastes ink printed), journaling (morning/evening
  prompts; cumulative count "47 mornings journaled" — NO flame icons, NO broken-streak shame
  states; streak-guilt is hustle-culture, the brand's enemy). Empty pages are invitations:
  instruction prose (Indy register) + one example answer, never a bare form. Playbook shell
  carries the privacy reassurance line ("Only you and your AI see this"). Template content
  authored as seed data, editable in admin.
- **Deliverables:** features/(life)/playbook/, journal/; admin template editor;
  export endpoint; events for every save (Decision Graph rows); privacy policy update
  covering playbook/journal data class (most sensitive data the company holds).
- **Acceptance criteria:** free user fills Starter Notebook pages; paid user fills Playbook
  chapters; journal streak displays; export downloads branded PDF; every answer = structured row.
- **Risk:** template quality is course content — founder reviews seed templates before launch.

### Project 6: ai-layer
- **Scope:** AI chat ("talks like it read your playbook"): context assembly from structured
  rows, conversation persistence, interview mode (page-scoped Q&A → distilled fields →
  user confirmation), usage metering + plan budgets, model tiering. SAFETY: crisis/self-harm
  response policy (resource referral + boundary message, never advice), refusal boundaries,
  "not therapy" disclosure in onboarding and chat UI, AI data-handling disclosure
  (provider no-training posture documented).
- **Deliverables:** features/(life)/ai-chat/, interview/; providers/ai.ts v2 (chat +
  distillation); ai_usage enforcement middleware; safety system prompt + crisis-response
  copy (voice.md compliant; crisis message gets its own calm visual treatment, not
  alarm-red); "not therapy" disclosure as a persistent quiet line under the chat input
  (not a dismissable modal); aria-live="polite" streaming, no animated typing indicator
  under reduced motion; interview distillation renders proposed-vs-confirmed states
  (sand-tinted "suggested" fields the user explicitly accepts — the trust-critical
  moment of ADR 11).
- **Acceptance criteria:** chat answer references user's actual playbook data; interview fills
  a page's fields after confirmation; budget ceiling returns graceful message; per-message
  usage rows written; crisis-signal input returns resources and a boundary, never advice
  (tested with fixture inputs).
- **Risk:** prompt quality = product quality; voice.md compliance on all AI copy. The ICP
  will include people in crisis — safety copy is brand, legal, and human risk in one.

### Project 7: distribution-admin
- **Scope:** Admin UI over the existing BD pipeline: upload video → choose flow (short→clips→
  TikTok/IG/Shorts; long→YouTube) → review AI-selected clips → approve → distribute; status
  dashboard per run.
- **Deliverables:** features/(admin)/distribution/ wired to existing pipeline endpoints;
  approval gates per architecture.md step pattern.
- **Acceptance criteria:** founder uploads one video and ships approved clips to connected
  platforms without CLI/skills.
- **Risk:** pipeline is battle-tested; risk is only in the new UI wiring.

### Project 8: mobile-app
- **START GATE (T1):** do not start until ≥100 paid users AND a positive retention signal
  (week-4 lesson completion holding). Pre-revenue Expo work is the likeliest runway leak.
- **Scope:** Expo (React Native) app: login-only (no IAP), catalog, lesson player (Stream HLS),
  lives/replays, playbook fill-in, journal, AI chat. Shares Zod types + API client with web.
- **Deliverables:** apps/mobile/ Expo project; shared packages/api-client (including design
  tokens exported as a typed constants module so palette/spacing stay single-source with web);
  EAS build config; store-readiness checklist (privacy labels, reader-app compliance).
- **Acceptance criteria:** TestFlight-ready build: login, watch lesson, answer prompt, journal
  entry, chat — all against production API.
- **Risk:** Apple review (reader-app rules) — no purchase references anywhere in-app.

## Canon Sync (deliverable, per Contradiction Resolution rule)

Upon founder confirmation, update in the same PR as this initiative's acceptance:
- company.md → Three Product Tiers (delivery model: in-platform, not Claude-skills-on-user-machine)
- company.md → Locked Decisions table (ads row, ADR 14)
- company.md → Revenue Model wording (see usage-pricing open question below)
- decisions/product/context.md → current-state scores and bottleneck map
- design.md → resolve the internal contradiction: button spec says "gold bg, white text" but
  white-on-gold ≈2.7:1 fails the same file's 4.5:1 contrast mandate. Resolution shipped in
  code: ink (#1A1714) text on gold (Design Requirements rule 2); design.md must be amended
  to match (founder may instead choose a darker gold token).

## Open Questions
- Ads unlock (ADR 14) changes a locked decision in company.md — founder to confirm in writing
  before first ad spend (does not block any code).
- **Usage-based pricing contradiction:** company.md/maturity.md say pricing "MUST be directly
  correlated to decisions" (usage-based); V2 ships flat $197/yr + $19.70/mo (both kept, annual
  marketed first — T5). Founder must explicitly resolve: keep flat pricing and amend canon, or
  define a usage dimension later. Stale canon poisons future agent sessions.
- Playbook/Notebook naming (ADR 16) — founder may override copy before Project 5 ships.
- Live cadence ("first Monday monthly" assumed) — confirm before cohort cron ships (config value).
- Cohort-1 fill source: ads pending confirmation; organic hedge = Project 7 clips + existing
  email list. Decide before Wave 2 ships.
