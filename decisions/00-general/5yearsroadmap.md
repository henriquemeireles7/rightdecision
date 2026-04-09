# The Right Decision — 5-Year Vision & Project Roadmap

> Last verified: 2026-04-08
> Raw source: decisions/00-general/raw-5yearsroadmap.md
> CEO plan: ~/.gstack/projects/henriquemeireles7-getzeny/ceo-plans/2026-04-08-5year-roadmap-10x.md

## What This Is

This is the master roadmap for The Right Decision. It is organized as **projects**, not tasks. Each project is sized to run through one full development cycle:

```
Pick project → /office-hours → /plan-ceo-review → /d-tasks → /d-code → /ship → repeat
```

A project is roughly: 5-6 premises, ~20 beads, one plan, one PR. Something you can start and finish in a focused session.

Phase 1 has the most projects (we're here now). Later phases have fewer, more conceptual projects that will be refined as we get closer.

## Company Mission

**Help every human make the one decision that actually matters, and act on it.**

## The Decision OS

The Right Decision is not an infobusiness. It is a **Decision Operating System.** Every product is a surface on the OS:

| OS Layer | What It Is | Phase |
|----------|-----------|-------|
| **Kernel** | The methodology ("deciding is the primitive") | 1 |
| **User Layer** | Course (onboarding), Skills (OS primitives), Decision Graph (personal history) | 1 |
| **Social Layer** | Decision Network, Wins Board, Anonymous Decision Twins, Decision Birthday | 1-2 |
| **Developer Layer** | Decision Protocol (open standard), Decision API, Decision Marketplace | 3 |
| **Intelligence Layer** | Own AI model, Collective Decision Intelligence, Decision Research Institute | 3-4 |
| **Financial Layer** | Stripe Connect (platform cut), Banking-as-a-Service | 2-4+ |
| **Runtime Layer** | On-device model, custom silicon | 4-5 |

## The Data Flywheel

```
User decides → Decision Graph captures it → Network patterns emerge →
Model improves → Better decisions → More users → (repeat)
```

Every project accelerates this flywheel. Every design decision asks: "Does this generate structured decision data?"

## 6-Phase Arc

| Phase | Name | Timeline | Revenue Target | Data Target |
|-------|------|----------|---------------|-------------|
| 1 | GTM: Prove the Methodology | Now → Month 12 | $50K ARR | 1,000+ decision records |
| 2 | AI Platform + White-Label | Month 12 → 24 | $500K ARR | 100K+ records |
| 3 | Developer Platform + Research | Month 24 → 36 | $5M ARR | 1M+ records |
| 4 | Own AI Model + BaaS | Month 36 → 48 | $20M ARR | 10M+ records |
| 5 | Own Hardware | Month 48 → 60+ | $50M+ ARR | 1B+ records |

## What's Already Built

The foundation is solid. Auth + payments + course hub + onboarding + wins board + full BD pipeline + website/blog/concepts + 10 course modules all working. See `roadmap-phase1.md` header for the full inventory.

## Current Phase: PHASE 1

**Next 3-5 projects to pick from** (in priority order):

1. **Merge Course UX Branch + QA** — Massive course upgrade (markdown rendering, book metaphor, bottom nav, journey page, micro-decisions, share cards, decision capture) sitting on `courses-ux-upgrade` branch. Merge it. [roadmap-phase1.md #P1.1]

2. **Decision Graph Schema V1** — The highest-leverage technical decision. Graph data structure in PostgreSQL that everything builds on. Nodes + edges + outcomes + anonymization. Maps to existing wins and course progress. [roadmap-phase1.md #P1.2]

3. **Free Course Content + Funnel** — Free-to-paid conversion funnel: free course → email drip → paywall → checkout. Uses existing onboarding flow + email provider. The narrowest wedge. [roadmap-phase1.md #P1.3]

4. **Decision Record + Follow-Up System** — Structured decision capture from course exercises. 7/30/90 day follow-up email loop. First data for the flywheel. [roadmap-phase1.md #P1.4]

5. **Delight Features Pack 1** — Decision Birthday (anniversary notifications), Decision Streak (deciding frequency), Anti-Self-Help Score (action ratio). Makes the product feel alive. [roadmap-phase1.md #P1.5]

See `decisions/00-general/roadmap-phase1.md` for all 12 projects with full details.

## Phase Files

| File | Projects | Status |
|------|----------|--------|
| roadmap-phase1.md | ~12 projects | Detailed (ready to pick from) |
| roadmap-phase2.md | ~8 projects | Outlined (will refine when Phase 1 nears completion) |
| roadmap-phase3.md | ~6 projects | Conceptual (will refine in Phase 2) |
| roadmap-phase4.md | ~4 projects | Vision (will refine in Phase 3) |
| roadmap-phase5.md | ~3 projects | Horizon bet (will refine in Phase 4) |

## The Workflow

This roadmap is a living document. The fundamental daily cycle:

1. **Refine** — Review the roadmap, update project descriptions based on what we learned
2. **Pick** — Choose the next project from the current phase
3. **Design** — Run `/office-hours` on the project description to produce a design doc
4. **Review** — Run `/plan-ceo-review` for 10x thinking, `/plan-eng-review` for architecture
5. **Build** — Run `/d-tasks` to create beads, `/d-code` to implement, `/d-review` to verify
6. **Ship** — Run `/ship` to create PR, merge, deploy
7. **Learn** — Update the roadmap with what we learned. Refine next projects.

Every completed project teaches us something that makes the next project better. The roadmap improves continuously.

## Decision Framework (5 Tests)

Every project and feature must pass:

1. **Flywheel?** Does it generate structured decision data?
2. **Load-bearing?** Will this serve us in Phase 2+?
3. **Schema?** Does the Decision Graph support it?
4. **Anti-self-help?** Is this about action, not introspection?
5. **Dogfood?** Will Henry + Indy use this themselves?

## Key Strategic Decisions (locked)

- Cross-tenant anonymized data rights baked into BD Terms of Service from day 1
- BD is a white-label platform (clients create their own Decision course, sell to their audience)
- Financial layer split: Stripe Connect in Phase 2, BaaS in Phase 4+ (after fundraise)
- Decision Protocol: build 3 reference implementations before expecting third-party adoption
- Phase 1 BD = clients set up their own with our online course. Phase 2 BD = self-serve white-label
- Own model + own hardware is non-negotiable (full stack ownership is the vision)
