# Funnel V2 (Project 4)

> Initiative: 01-platform-v2
> Domain: product
> Created: 2026-06-12
> Status: ready

## Context

Platform V2's go-to-market is cohort-based: a monthly free program (lead gen, always
running, ads pointed at the next start date — ADR 14 unlocks paid ads WITH guardrail) and
a paid program ($197/year, instant full access, monthly lives — ADR 13). Goal: a user
joins a free cohort from an ad, watches, upgrades to paid. Constraint: solo founder + AI
agents; the free cohort funnel (and its ad engine) must be able to go live before later
waves land; the live evergreen funnel and existing production users MUST NOT break until
cutover (feature-flagged with explicit rollback).

This is Lane C of Wave 2, parallel to P2 (admin) and P3 (members) after the P1 hard gate.
Wave-2 copy rule (T3 bridge): checkout copy sells ONLY what exists at that moment (video +
lives), with a published content roadmap for the rest — never the full promised library.

## Scope

In scope:
- Landing page variant for the free program with dynamic next-cohort date.
- Join flow: signup → enrollment into current/next cohort.
- Upgrade flow: checkout → paid enrollment (Stripe webhook → paid enrollment).
- Drip emails repointed to cohort lifecycle (welcome, starts-soon, day-N nudges, upgrade).
- Cron for cohort auto-creation + date rollover (job on the Project 1 scheduler).
- Cutover flag: V2_ENROLLMENT_CUTOVER.

Out of scope: members-area UI (P3), admin (P2), new Stripe products beyond wiring the
webhook to enrollments (existing yearly/monthly plans keep working — both price plans
kept, annual marketed first, T5), ad creative/spend (founder decision, ADR 14 guardrail:
ads only to free program; measure free→paid across 2-3 cohorts before scaling).

## Deliverables

### 1. CLAUDE.md scaffolding (before code)
- **Files:** CREATE features/(life)/join/CLAUDE.md
- **Acceptance criteria:**
  - [ ] CLAUDE.md exists before code

### 2. Free-program landing variant with dynamic cohort date
- **What:** Landing page variant for the free program showing the next cohort start date
  computed from data — ad URL → join page shows next start date without manual edits.
  Marketing stays SSR (ADR 5).
- **Files:** MODIFY landing/marketing pages (per existing pages/ + features conventions);
  CREATE features/(life)/join/ (date query + components + tests).
- **Acceptance criteria:**
  - [ ] Next-cohort date renders from the cohorts table; rolling over a month changes the
        page without code edits
  - [ ] Users see localized dates via Intl (stored timestamptz; no tz math at read time)

### 3. Join flow (signup → cohort enrollment)
- **What:** Signup creates a free enrollment into the current/next cohort (source=
  'signup'; cohortId bound for free users). Free re-enrollment into a later cohort UPDATEs
  cohortId (TD-2); cohort-join history goes to events as 'cohort_joined'. Pre-auth funnel
  events use anonymousId.
- **Files:** CREATE features/(life)/join/ (flow + routes + tests); MODIFY
  platform/server/routes.ts (mount).
- **Acceptance criteria:**
  - [ ] Joining enrolls into the right cohort (current if pre-start, else next)
  - [ ] Re-join updates cohortId on the existing enrollment row (one row per
        user×program) and records a 'cohort_joined' event
  - [ ] Funnel events recorded via platform/events/ (anonymousId pre-auth)

### 4. Upgrade flow (checkout → paid enrollment)
- **What:** Stripe webhook → paid enrollment (source='purchase', cohortId NULL =
  evergreen, stripeSubscriptionId set). Existing yearly/monthly Stripe plans keep working.
  Checkout copy follows the Wave-2 copy rule (sell only what exists + published roadmap —
  Gate B blocks paid checkout until ≥2 paid modules + published drop schedule exist).
- **Files:** MODIFY Stripe webhook handler (existing billing feature) to create paid
  enrollments; CREATE upgrade UI entry points in features/(life)/join/; tests.
  NOTE: invoke /stripe-best-practices before writing or reviewing this code (root
  CLAUDE.md rule).
- **Acceptance criteria:**
  - [ ] Paying creates a paid enrollment (evergreen, no cohort)
  - [ ] Existing yearly/monthly Stripe plans keep working (regression-tested)
  - [ ] Subscription expiry/cancellation reflected via the P1 enrollment expiry sweep
        (expiresAt) — verified end-to-end in a test

### 5. Drip emails repointed to cohort lifecycle
- **What:** Welcome, starts-soon, day-N nudges, upgrade emails keyed to cohort dates,
  sent via the P1 scheduler's processPendingDrips (the previously-dead function, now
  wired).
- **Files:** MODIFY existing email/drip feature (templates + scheduling logic); CREATE
  email templates per existing template conventions; tests.
- **Acceptance criteria:**
  - [ ] Each lifecycle email schedules from cohort dates and sends via the scheduler
  - [ ] Email copy passes decisions/voice.md (read voice.md before writing any user-facing
        copy)

### 6. Cohort auto-creation + date rollover (timezone rule)
- **What:** Cohort startsAt = first Monday of month at fixed local time in COHORT_TIMEZONE
  (IANA, env, default America/Sao_Paulo), stored timestamptz; jobs compare UTC instants —
  no tz math at read time. Pure date-math function with fixture tests:
  first-Monday-is-the-1st, first-Monday-is-the-7th, year boundary, DST-transition month.
  Auto-creation idempotent via cohorts_program_start_idx + onConflictDoNothing.
- **Files:** MODIFY features/(shared)/scheduler/ jobs (if P1 shipped the skeleton, this
  fills cohort lifecycle wiring — see Open Questions); tests.
- **Acceptance criteria:**
  - [ ] All four date-math fixtures pass
  - [ ] Double-fired auto-creation no-ops (idempotency test)

### 7. Cutover flag (V2_ENROLLMENT_CUTOVER)
- **What:** Env boolean gating the V2 enrollment funnel; rollback = flip in Railway +
  redeploy. The flag is read through a function (isV2CutoverEnabled() with a test
  override), NEVER a direct env constant at gate sites — env.ts parses once at import, so
  both flag states must be testable in one process. The markdown text course remains
  source of truth and fully functional until enrollment cutover completes.
- **Files:** CREATE isV2CutoverEnabled() (platform/, per P1 cutover seam); MODIFY funnel
  gate sites to read through it; tests covering BOTH states in the same suite.
- **Acceptance criteria:**
  - [ ] Both flag states covered in the same test suite
  - [ ] Flag off: existing evergreen funnel + text course behave exactly as today
        (regression-tested)
  - [ ] Rollback documented: flip env + redeploy (no flag framework)

## Acceptance Criteria (project-level, from document.md)

- [ ] Ad URL → join page shows next start date without manual edits
- [ ] Joining enrolls into the right cohort
- [ ] Paying creates paid enrollment
- [ ] Existing yearly/monthly Stripe plans keep working

## Design Requirements (binding for this project)

- Interaction states are scope, not polish: loading/empty/error/success on every screen.
- Gold contrast rule: text on gold is ink (#1A1714); white-on-gold banned.
- Reduced motion: countdowns static text per minute; non-essential transitions wrapped in
  `prefers-reduced-motion: no-preference`.
- Marketing pages keep their existing bundle budget (<50KB) — the SSR funnel must not
  pull in /app shell code.
- All user-facing copy passes decisions/voice.md.

## Dependencies

- **Requires:** Project 1 complete (enrollments schema, scheduler + processPendingDrips,
  events taxonomy with funnel/cohort events, COHORT_TIMEZONE + V2_ENROLLMENT_CUTOVER env,
  date-math conventions). Gate B (Content) blocks enabling paid checkout in production —
  not development. Lane C parallel to P2/P3 — file-disjoint except routes.ts mounts.
- **Produces:** the live cohort acquisition funnel — unblocks cohort 1 launch (with Gate
  A) and the ad engine (ADR 14, pending founder written confirmation). Success metrics it
  owns: free→paid ≥3% across cohorts 2-3 (<1.5%: stop ad spend, rework offer before
  cohort 4); cohort fill ≥50 joiners by cohort 3 (miss → shift budget to organic, P7
  clips); refund rate <5% (miss → pause checkout, fix expectation gap per Wave-2 copy
  rule).

## DX Conventions (applying to this project)

- One worktree per project session, branch `p4-funnel-v2`.
- CLAUDE.md first; lanes never edit the same folder; rebase routes.ts before ship.
- Consume features/(shared)/api-client/ for any client-side calls.
- Sequencing note (T2): if ads are unconfirmed by Wave 2, Project 7 moves directly after
  THIS project — it is the organic hedge for cohort fill.

## Risks

- Must not break the live evergreen funnel until cutover: mitigation = V2_ENROLLMENT_CUTOVER
  feature flag, read through a function, both states tested, explicit rollback step
  (flip + redeploy).
- Timezone/date bugs around cohort boundaries: mitigation = pure date-math function +
  the four mandated fixtures (1st-Monday, 7th-Monday, year boundary, DST month); UTC
  instant comparison only.
- Overselling at checkout (refund risk): mitigation = Wave-2 copy rule enforced — copy
  sells only what exists + published roadmap; Gate B blocks checkout until content exists.

## Relevant Decisions

| # | Decision | Choice | Why |
|---|----------|--------|-----|
| 4 | Free program shape | One platform; free users see full catalog with locks; enrollment (user×cohort) is the access primitive | Ambient upsell; one codebase |
| 13 | Paid program model | Annual subscription, instant full content access, monthly lives for all; "12-month program" = 12 monthly live cycles; free = monthly cohorts | Evergreen content, monthly community cadence, no cart ops |
| 14 | Paid ads | Unlock the no-ads decision WITH guardrail: ads only to free program; measure free→paid across 2-3 cohorts before scaling | Cohort deadlines need fill; conversion data needed |
| 15 | Sequencing | Waves: (1) foundation+admin (2) members area+funnel (3) playbook+journal (4) AI chat+interviews (5) Expo app | Free cohort + ads can start before later waves |
| 6 | Event spine | record()/track() in platform/events/; pre-auth funnel events supported (anonymousId) | Owned data feeds AI personalization |

## Open Questions

- Cohort auto-creation job boundary with P1: P1's scheduler scope lists "cohort
  auto-creation" as one of its jobs; this project's deliverables list "cohort
  auto-creation job on the Project 1 scheduler" and "cron for cohort auto-creation + date
  rollover". Assumed split: P1 ships the job + date math; P4 owns lifecycle wiring
  (rollover, drip repointing, landing integration). Confirm before starting to avoid
  double-building.
- "Date rollover" is not defined beyond the phrase — assumed: when a cohort's start
  passes, the landing/join flow targets the next auto-created cohort. Confirm if it
  implies anything about endsAt or cohort closure.
- Live cadence ("first Monday monthly" assumed) — founder must confirm before the cohort
  cron ships (config value; document.md Open Questions).
- Cohort-1 fill source: ads pending written confirmation; organic hedge = Project 7 clips +
  existing email list. Founder decides before Wave 2 ships.
- Ads unlock (ADR 14) changes a locked decision in company.md — founder to confirm in
  writing before first ad spend (does not block any code).
