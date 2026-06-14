# Mobile App (Project 8)

> Initiative: 01-platform-v2
> Domain: product
> Created: 2026-06-12
> Status: ready

---

## ⛔ START GATE (T1) — DO NOT START THIS PROJECT UNTIL BOTH ARE TRUE

1. **≥100 paid users**, AND
2. **a positive retention signal** (week-4 lesson completion holding).

Pre-revenue Expo work is the likeliest runway leak. No code, no scaffolding, no Expo
project until the gate opens. apps/mobile is excluded from `bun run check` until the gate
opens; it gets its own workflow then (DX Convention 5).

---

## Context

Platform V2 ends with a mobile companion: an Expo (React Native) app that is LOGIN-ONLY —
no IAP, all purchases on web (ADR 12, reader-app pattern: keep full margin; standard for
course platforms). It mirrors the member experience (catalog, player, lives, playbook,
journal, AI chat) against the production API, sharing Zod types + API client with web but
NEVER UI components (ADR 5: UI-sharing with RN is a trap). Wave 5 — last, after
everything else is production-usable.

## Scope

In scope: Expo (React Native) app:
- Login-only (no IAP, no purchase references anywhere in-app).
- Catalog, lesson player (Stream HLS), lives/replays, playbook fill-in, journal, AI chat.
- Shared packages/api-client (Zod types + API client + design tokens as typed constants).
- EAS build config; store-readiness checklist.

Out of scope: any purchases/IAP (ADR 12); UI component sharing with web (ADR 5); push
notifications, offline mode, or anything not listed (no new ideas — future-work.md is the
place).

## Deliverables

### 1. CLAUDE.md scaffolding (before code)
- **Files:**
  - CREATE apps/mobile/CLAUDE.md
  - CREATE packages/api-client/CLAUDE.md
- **Acceptance criteria:**
  - [ ] Each new folder has its CLAUDE.md before code

### 2. Shared packages/api-client
- **What:** Extract/share the typed API client (Zod types + throwError-coded error
  mapping + auth handling, from features/(shared)/api-client/) as a package both web and
  mobile consume — including design tokens exported as a typed constants module so
  palette/spacing stay single-source with web.
- **Files:** CREATE packages/api-client/ (client, types, tokens module, tests); MODIFY
  features/(shared)/api-client/ consumers if the shared package supersedes/wraps it;
  MODIFY styles/global.css token source only if needed to single-source tokens (never
  fork values).
- **Acceptance criteria:**
  - [ ] Web and mobile import the same types + client; zero duplicated type definitions
  - [ ] Design tokens (palette/spacing) consumed from the typed constants module on
        mobile, matching styles/global.css values

### 3. Expo app shell + auth
- **What:** Expo project, login-only against the production API (Better Auth).
- **Files:** CREATE apps/mobile/ (Expo project, screens, navigation, tests).
- **Acceptance criteria:**
  - [ ] Login works against production API
  - [ ] Zero purchase references anywhere in-app (Apple reader-app rule)

### 4. Member surfaces (catalog, player, lives, playbook, journal, chat)
- **What:** Mobile equivalents of the web member experience: catalog with lock states,
  lesson player (Stream HLS, signed playback), lives/replays, playbook fill-in, journal,
  AI chat — all via the shared API client. Locked content shows no purchase path (web is
  the only purchase surface).
- **Files:** CREATE within apps/mobile/ (per-surface screens + tests).
- **Acceptance criteria:**
  - [ ] Watch a lesson (Stream HLS via signed playback)
  - [ ] Answer the decision prompt; completion persists
  - [ ] Journal entry saves (entryDate computed client-side in the user's zone, sent
        explicitly — same contract as web)
  - [ ] Chat streams and persists per the SSE contract (drop = retriable, refetch
        conversation)
  - [ ] Mobile events ingest into the event spine with source='mobile'

### 5. EAS build + store readiness
- **What:** EAS build config; store-readiness checklist: privacy labels, reader-app
  compliance.
- **Files:** CREATE EAS config in apps/mobile/; CREATE store-readiness checklist
  (humantasks.md entries for store assets/review — human-owned items); CREATE the
  apps/mobile CI workflow (its own, separate from `bun run check`).
- **Acceptance criteria:**
  - [ ] TestFlight-ready build produced via EAS
  - [ ] Privacy labels drafted; reader-app compliance verified (no purchase references)

## Acceptance Criteria (project-level, from document.md)

- [ ] TestFlight-ready build: login, watch lesson, answer prompt, journal entry, chat —
      all against production API.

## Design Requirements (binding for this project)

- Palette/spacing single-sourced via the typed tokens module — Ethereal Warmth on mobile,
  no forked token values.
- Gold contrast rule applies: ink text on gold; white-on-gold banned.
- Reduced motion: respect the OS reduce-motion setting for non-essential transitions;
  no animated typing indicator in chat under reduced motion.
- Interaction states are scope, not polish: loading/empty/error/success on every screen.

## Dependencies

- **Requires:** START GATE OPEN (≥100 paid users + week-4 lesson completion holding) —
  verify against the events spine before any work. Projects 1-6 in production (API
  surface complete: catalog, player, lives, playbook, journal, chat). P1's
  features/(shared)/api-client/ as the extraction source.
- **Produces:** mobile companion app; packages/api-client shared package; mobile events
  (source='mobile') into the spine.

## DX Conventions (applying to this project)

- One worktree per project session, branch `p8-mobile-app`.
- CLAUDE.md first for apps/mobile/ and packages/api-client/.
- apps/mobile EXCLUDED from `bun run check` until the start gate opens; then it gets its
  own workflow (DX Convention 5).
- Share Zod types + API client with web, NEVER UI components (ADR 5).

## Risks

- Apple review (reader-app rules): mitigation = no purchase references anywhere in-app;
  store-readiness checklist with privacy labels; login-only posture (ADR 12).
- Runway leak from premature mobile work: mitigation = the START GATE is binding — both
  conditions verified before any code.

## Relevant Decisions

| # | Decision | Choice | Why |
|---|----------|--------|-----|
| 12 | Apple IAP | Mobile app is login-only; all purchases on web (reader-app pattern) | Keep full margin; standard for course platforms |
| 5 | Members-area frontend | Share Zod types + API client with mobile, never UI components | UI-sharing with RN is a trap |
| 15 | Sequencing | Wave 5 = Expo app, last | Free cohort + ads start long before mobile |

## Open Questions

- Relationship between features/(shared)/api-client/ (P1) and packages/api-client (P8):
  document.md lists both; eng-schema.md's scaffolding lists "apps/mobile/ +
  packages/api-client/ (post-gate)". Assumed: P8 extracts/promotes the P1 client into the
  shared package. Confirm move-vs-wrap before restructuring imports.
- "Week-4 lesson completion holding" has no numeric threshold — founder defines the bar
  when evaluating the gate; measure from the events spine.
- Android posture (EAS supports both; document.md mentions TestFlight + Apple review
  only) — assumed iOS-first; confirm whether an Android build is in scope.
