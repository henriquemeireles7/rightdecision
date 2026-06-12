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

## Projects (suggested breakdown)

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
  Stream video id; cover image generated and stored to R2; 100% test coverage.
- **Risk:** schema mistakes here are migration debt everywhere — reviewed before coding.

### Project 2: admin-panel
- **Scope:** /admin SPA (Preact, admin role): course builder (courses→modules→lessons, video
  upload to Stream, AI cover generation with 4-option picker, lesson decision prompt editor),
  materials upload (R2), lives scheduling (YouTube URL + time + program scope, replay upload),
  cohort management (auto first-Monday generation + manual override), program content mapping
  (which courses/lives/materials each program includes).
- **Deliverables:** features/(admin)/ group: course-builder/, materials/, lives/, cohorts/;
  admin API routes; upload flows (direct-to-Stream/R2 presigned); pages/admin wiring.
- **Acceptance criteria:** founder can create a module with AI cover, upload a lesson video,
  attach a material, schedule a live, see next cohort auto-created; all without code.
- **Risk:** upload UX (large files) — use presigned/direct uploads, never proxy through Hono.

### Project 3: members-area
- **Scope:** /app SPA: Netflix-style catalog (program-aware rails, poster cards, lock states),
  lesson player (Stream playback + decision prompt + complete), materials library, Lives
  section (upcoming/live/replay), continue-watching, progress. Ethereal Warmth styling per
  decisions/design.md.
- **Deliverables:** features/(life)/catalog/, player/, lives-view/, materials-view/; app shell
  + router; watch-event ingestion to event spine.
- **Acceptance criteria:** free user sees locked paid content + their cohort's unlocked
  content; paid user watches a lesson, answers the decision prompt, progress persists; live
  page shows countdown→embed→replay lifecycle.
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
  structured fields), fill-in UX shaped like a book, progress, PDF export (satori), journaling
  (morning/evening prompts, streaks). Template content authored as seed data, editable in admin.
- **Deliverables:** features/(life)/playbook/, journal/; admin template editor;
  export endpoint; events for every save (Decision Graph rows).
- **Acceptance criteria:** free user fills Starter Notebook pages; paid user fills Playbook
  chapters; journal streak displays; export downloads branded PDF; every answer = structured row.
- **Risk:** template quality is course content — founder reviews seed templates before launch.

### Project 6: ai-layer
- **Scope:** AI chat ("talks like it read your playbook"): context assembly from structured
  rows, conversation persistence, interview mode (page-scoped Q&A → distilled fields →
  user confirmation), usage metering + plan budgets, model tiering.
- **Deliverables:** features/(life)/ai-chat/, interview/; providers/ai.ts v2 (chat +
  distillation); ai_usage enforcement middleware.
- **Acceptance criteria:** chat answer references user's actual playbook data; interview fills
  a page's fields after confirmation; budget ceiling returns graceful message; per-message
  usage rows written.
- **Risk:** prompt quality = product quality; voice.md compliance on all AI copy.

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
- **Scope:** Expo (React Native) app: login-only (no IAP), catalog, lesson player (Stream HLS),
  lives/replays, playbook fill-in, journal, AI chat. Shares Zod types + API client with web.
- **Deliverables:** apps/mobile/ Expo project; shared packages/api-client; EAS build config;
  store-readiness checklist (privacy labels, reader-app compliance).
- **Acceptance criteria:** TestFlight-ready build: login, watch lesson, answer prompt, journal
  entry, chat — all against production API.
- **Risk:** Apple review (reader-app rules) — no purchase references anywhere in-app.

## Open Questions
- Ads unlock (ADR 14) changes a locked decision in company.md — founder to confirm in writing
  before first ad spend (does not block any code).
- Playbook/Notebook naming (ADR 16) — founder may override copy before Project 5 ships.
- Live cadence ("first Monday monthly" assumed) — confirm before cohort cron ships (config value).
