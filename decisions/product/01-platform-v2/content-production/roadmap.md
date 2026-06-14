# Content Production (Project 0 — Founder/Human Track)

> Initiative: 01-platform-v2
> Domain: product
> Created: 2026-06-12
> Status: ready

**THIS IS A HUMAN TRACK, NOT A CODING PROJECT.** All deliverables below are human tasks
owned by the founders (Henry + Indy record). Execution is d-content/founder-owned — not
d-code. The only agent-side outputs are humantasks.md entries and d-content support
(scripts, clip review prep). This track runs PARALLEL to all software waves.

## Context

Platform V2 pivots Right Decision to a video-first members area entered through programs:
a monthly cohort-based free program (lead gen) and a paid full program ($197/year, instant
full access, monthly lives). Goal: a user joins a free cohort from an ad, watches the free
course + lives, upgrades, completes video lessons with decision prompts, fills a Life
Playbook, journals, and talks to an AI that knows their playbook — while the founder runs
everything from an admin panel. Constraint: solo founder + AI agents; dependency-ordered
waves; existing production users of the text course must not break mid-migration.

Software cannot move Engagement until videos exist (content + engagement is the documented
P0 bottleneck). Content production is a parallel human track with hard gates that block
specific software/launch milestones.

## Scope

In scope:
- Recording + uploading the free program videos (target 3-5 lessons).
- Recording ≥2 paid modules + publishing a monthly drop schedule for the remainder.
- Scheduling each month's live, with a fallback protocol for missed months.
- Feeding each recording into the distribution pipeline (Project 7) for clips → cohort fill.

Out of scope:
- Any software (admin panel = Project 2 is the upload path; distribution UI = Project 7).
- Playbook/Notebook template content (that is Project 5 seed data, founder-reviewed there).

## Deliverables (human tasks)

### 1. Gate A — Free program recorded + uploaded (BLOCKS COHORT 1)
- **What:** Free program fully recorded + uploaded (target 3-5 lessons). HUMAN TASK:
  Henry + Indy record; admin panel (Project 2) is the upload path.
- **Files:** MODIFY decisions/humantasks.md (add Gate A entry with owner + target date).
  No code files — videos land in Cloudflare Stream via the Project 2 admin panel.
- **Acceptance criteria:**
  - [ ] 3-5 free-program lessons recorded and uploaded via the admin panel
  - [ ] Every uploaded lesson reaches videoStatus='ready' and satisfies the publish
        invariant (captions + decision prompt) so it can be published
  - [ ] Cohort 1 is unblocked: free program watchable end-to-end in the members area

### 2. Gate B — Paid modules + published drop schedule (BLOCKS PAID CHECKOUT)
- **What:** ≥2 paid modules recorded + a published monthly drop schedule for the remainder
  — the honesty bridge for ADR 13's instant-access promise. HUMAN TASK.
- **Files:** MODIFY decisions/humantasks.md (Gate B entry). Drop schedule must be
  published (surfaces in Wave-2 checkout copy and the catalog's "drops on {date}" state —
  see Open Questions for canonical location).
- **Acceptance criteria:**
  - [ ] ≥2 paid modules recorded and uploaded
  - [ ] Monthly drop schedule for remaining content is published
  - [ ] Wave-2 checkout copy sells ONLY what exists at that moment (video + lives), with
        the published content roadmap for the rest — never the full promised library
  - [ ] Paid checkout is unblocked

### 3. Gate C — Monthly live scheduled + fallback protocol (BLOCKS EACH COHORT)
- **What:** That month's live scheduled before each cohort, with a fallback protocol —
  if a month is missed, it becomes a replay-month (pre-announced), never a silent skip.
  HUMAN TASK, recurring monthly.
- **Files:** MODIFY decisions/humantasks.md (recurring Gate C entry). Lives scheduled via
  the Project 2 admin panel (YouTube URL + time + program scope); cancellation is an
  explicit human act (lives.cancelledAt column per eng-schema.md).
- **Acceptance criteria:**
  - [ ] Each cohort's month has a live scheduled before the cohort starts
  - [ ] Fallback protocol documented: missed month = pre-announced replay-month, never a
        silent skip
  - [ ] Each live's recording is uploaded to Stream as a gated replay (ADR 3)

### 4. Distribution feed (cohort fill)
- **What:** Each recording goes through the existing distribution pipeline (Project 7 UI,
  or current CLI/skills until P7 ships) to produce clips for cohort fill. HUMAN TASK
  (founder approves clips).
- **Files:** none (pipeline exists; Project 7 adds the UI).
- **Acceptance criteria:**
  - [ ] Every free-program recording produces approved clips distributed to connected
        platforms

## Dependencies
- **Requires:** Project 2 (admin-panel) as the upload path. Until P2 ships, recording can
  proceed but uploads wait. Project 7 (distribution-admin) is the no-CLI clip path; the
  existing pipeline works via skills before then.
- **Produces:** Gate A unblocks cohort 1 (Wave 2 launch). Gate B unblocks paid checkout.
  Gate C unblocks each cohort. Clips feed cohort fill (success metric: ≥50 joiners per
  free cohort by cohort 3).

## Relevant Success Metrics & Kill Criteria
| Metric | Target | Branch if missed |
|--------|--------|------------------|
| Cohort 1 launch date | Within 6 weeks of Wave 2 ship | Re-scope content gate (this project) |
| Cohort fill | ≥50 joiners per free cohort by cohort 3 | Shift budget to organic (Project 7 clips) |
| Refund rate | <5% of paid joins | Pause checkout, fix expectation gap (Wave-2 copy rule) |

## Risks
- Content production stalls block every launch milestone regardless of software readiness:
  mitigation = hard gates with explicit owners (Henry + Indy) tracked in humantasks.md,
  and the kill-criteria branch "re-scope content gate" if cohort 1 slips past 6 weeks.
- Missed monthly live erodes the paid promise: mitigation = Gate C fallback protocol
  (pre-announced replay-month, never a silent skip).

## Relevant Decisions
| # | Decision | Choice | Why |
|---|----------|--------|-----|
| 3 | Lives | Unlisted YouTube Live embed for the live moment; recording uploaded to Stream as gated replay; ONE Lives section with upcoming/live/replay states | 90% of watch time is replays; zero live-infra risk |
| 13 | Paid program model | Annual subscription, instant full content access, monthly lives for all; "12-month program" = 12 monthly live cycles; free = monthly cohorts | Evergreen content, monthly community cadence, no cart ops |
| 7 | Course CMS | Courses/modules/lessons in Postgres + media in R2/Stream, edited via admin panel | Non-technical co-founder authors content; git is not her CMS |

## Open Questions
- Where does the "published monthly drop schedule" canonically live (a page in the members
  area catalog, the checkout page, both)? document.md requires it published and consumed by
  checkout copy and the catalog "drops on {date}" state, but does not name the surface.
- Where is the Gate C fallback "pre-announced" (email to cohort, lives page banner, both)?
  document.md specifies the protocol, not the channel.
- Brand voice: all recorded scripts/copy must pass decisions/voice.md (Indy Test) — assumed
  founder-owned since this is a human track; flagging because no explicit QA step is named.
