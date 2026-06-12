# Distribution Admin (Project 7)

> Initiative: 01-platform-v2
> Domain: product
> Created: 2026-06-12
> Status: ready

## Context

Right Decision already has a complete (but UI-less) video→clips→social distribution
pipeline. Platform V2's cohort funnel needs cohort fill (≥50 joiners per free cohort by
cohort 3); clips from each recording are the organic engine — and the explicit organic
hedge if paid ads (ADR 14) are unconfirmed. This project puts an admin UI over the
existing battle-tested pipeline so the founder ships clips without CLI/skills.

Sequencing (T2): default position is after Wave 2 lanes; if ads are unconfirmed by
Wave 2, this project moves DIRECTLY after Project 4 — it is the organic hedge for cohort
fill. Content Gate flow: every Project 0 recording feeds this pipeline for clips.

## Scope

In scope: Admin UI over the existing BD pipeline:
- Upload video → choose flow (short→clips→TikTok/IG/Shorts; long→YouTube).
- Review AI-selected clips → approve → distribute.
- Status dashboard per run.

Out of scope: any changes to the pipeline itself (it is battle-tested; risk is only in
the new UI wiring); course video upload (P2 course builder); new schema or providers.

## Deliverables

### 1. CLAUDE.md scaffolding (before code)
- **Files:** CREATE features/(admin)/distribution/CLAUDE.md
- **Acceptance criteria:**
  - [ ] CLAUDE.md exists before code

### 2. Upload + flow chooser
- **What:** Upload a video and choose the flow: short→clips→TikTok/IG/Shorts, or
  long→YouTube. Wired to existing pipeline endpoints.
- **Files:** CREATE features/(admin)/distribution/ (components, routes wiring to existing
  pipeline endpoints, tests); MODIFY platform/server/routes.ts (mount); MODIFY pages/admin
  wiring.
- **Acceptance criteria:**
  - [ ] Upload starts a pipeline run with the chosen flow
  - [ ] Upload shows progress + failure states (admin design bar: an unexplained spinner
        = a support call)

### 3. Clip review + approval gates
- **What:** Review AI-selected clips, approve, distribute — approval gates per
  architecture.md's step pattern.
- **Files:** within features/(admin)/distribution/ (review UI + approval actions + tests).
  Read decisions/architecture.md for the step pattern before building.
- **Acceptance criteria:**
  - [ ] AI-selected clips render for review; approve/reject per clip
  - [ ] Nothing distributes without explicit approval (gate tested)
  - [ ] Approved clips distribute to connected platforms

### 4. Status dashboard per run
- **What:** Per-run status view across the pipeline steps.
- **Files:** within features/(admin)/distribution/ (dashboard + tests).
- **Acceptance criteria:**
  - [ ] Each run shows step-level status including failures with what/why/how-to-fix

## Acceptance Criteria (project-level, from document.md)

- [ ] Founder uploads one video and ships approved clips to connected platforms without
      CLI/skills.

## Design Requirements (binding for this project)

- Admin design bar: same tokens ("plain Stripe dashboard" polish), desktop-first, 100%
  interaction-state coverage.
- Interaction states are scope, not polish: loading/empty/error/success on every screen.
- Gold contrast rule: ink on gold; white-on-gold banned.
- Uses existing tokens in styles/global.css; any new admin component patterns appended to
  design.md's admin subsection in the same PR.

## Dependencies

- **Requires:** Project 2 complete — P2 and P7 both touch features/(admin)/ and are
  SEQUENTIAL, never parallel (DX Convention 3). Project 1 (api-client, SPA harness).
  The existing distribution pipeline (already in production, UI-less).
- **Produces:** the no-CLI clip path for Project 0 (every recording → approved clips →
  cohort fill); the organic hedge if ads are unconfirmed (T2 reorder: directly after P4)
  or if cohort fill misses (<50 joiners by cohort 3 → shift budget to organic per kill
  criteria).

## DX Conventions (applying to this project)

- One worktree per project session, branch `p7-distribution-admin`.
- CLAUDE.md first; lanes never edit the same folder.
- NEVER run parallel with P2 (same features/(admin)/ group).
- Consume features/(shared)/api-client/; SPA harness for component tests.

## Risks

- Pipeline is battle-tested; risk is only in the new UI wiring: mitigation = wire to
  existing endpoints, change nothing in the pipeline; integration tests per step +
  approval gate.

## Relevant Decisions

| # | Decision | Choice | Why |
|---|----------|--------|-----|
| 14 | Paid ads | Ads only to free program; measure free→paid across 2-3 cohorts before scaling | This project is the organic hedge if ads are unconfirmed |
| 15 | Sequencing | Waves, each production-usable; T2: P7 moves directly after P4 if ads unconfirmed by Wave 2 | Cohort fill cannot wait on an ads decision |

## Open Questions

- The exact existing pipeline endpoints/entry points are not enumerated in document.md —
  locate them in the codebase (the "complete but UI-less video→clips→social distribution
  pipeline") and read decisions/architecture.md's step pattern before wiring; do not
  redesign the pipeline.
- Whether distribution runs should record events in the spine (taxonomy reserved waves
  1-4 user events; admin/distribution events not mentioned) — default: no new event
  names; confirm if the founder wants run telemetry.
