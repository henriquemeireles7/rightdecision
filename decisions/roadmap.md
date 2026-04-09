# Roadmap — Current Priorities

> Last verified: 2026-04-08
> 5-year vision: decisions/00-general/5yearsroadmap.md
> Phase details: decisions/00-general/roadmap-phase1.md (and phase2-5)
> Pipeline: d-meta → d-input → d-plan → d-tasks

## The Cycle

This is how we build, every day:

```
Refine roadmap → Pick project → /office-hours → /plan-ceo-review → /d-tasks → /d-code → /ship → repeat
```

Each project is sized for one full cycle (~20 beads, one plan, one PR). Pick the next project from the current phase file. When done, update the roadmap with what you learned.

## Current Phase: PHASE 1 — GTM (Now → Month 12)

**Thesis:** The decision methodology works for real humans. The infobusiness model generates revenue.

**Targets:** $50K ARR | 250 LD + 3 BD clients | 1,000+ decision records

### What's Built (foundation)
Auth, Stripe checkout/webhooks, course hub (10 modules, free/paid gating, progress, bookmarks), 6-step onboarding, Wins Board V1 (4 life areas, rate limiting), landing page, full BD 7-step pipeline, website (blog, 10 concept pages, sitemap, SEO), email system, R2 storage, PostHog analytics.

### Next Projects (pick from here)

| # | Project | Track | Status | File Reference |
|---|---------|-------|--------|----------------|
| P1.1 | Merge Course UX Branch + QA | LD | Ready to merge | roadmap-phase1.md |
| P1.2 | Decision Graph Schema V1 | Shared | Not started | roadmap-phase1.md |
| P1.3 | Free Course Content + Funnel | LD | Not started | roadmap-phase1.md |
| P1.4 | Decision Record + Follow-Up System | LD | Not started | roadmap-phase1.md |
| P1.5 | Delight Features Pack 1 (Birthday, Streak, Score) | LD | Not started | roadmap-phase1.md |

Full Phase 1 has 12 projects. See `decisions/00-general/roadmap-phase1.md` for all details.

### How to Start a Project

1. Copy the project description from `roadmap-phase1.md`
2. Run `/office-hours` with that description as context
3. Run `/plan-ceo-review` on the resulting design doc
4. Run `/d-tasks` to create beads
5. Run `/d-code` to implement
6. Run `/ship` to deploy
7. Update this roadmap + phase file with COMPLETE status and learnings

## 6-Phase Arc (Decision OS)

| Phase | Name | Timeline | Key Milestone |
|-------|------|----------|---------------|
| **1** | **GTM** | **Now → M12** | **Free course live, 250 LD customers, 3 BD clients** |
| 2 | AI Platform + White-Label | M12 → M24 | Intelligent Decision Engine, self-serve BD, Stripe Connect |
| 3 | Developer Platform + Research | M24 → M36 | Decision Protocol, API, Marketplace, Research Institute |
| 4 | Own AI Model + BaaS | M36 → M48 | Decision Foundation Model, model-powered features |
| 5 | Own Hardware | M48 → M60+ | On-device model, custom silicon (horizon bet) |

## Decision Framework (5 Tests)

Every project must pass:
1. **Flywheel?** Does it generate structured decision data?
2. **Load-bearing?** Will this serve us in Phase 2+?
3. **Schema?** Does the Decision Graph support it?
4. **Anti-self-help?** Is this about action, not introspection?
5. **Dogfood?** Will Henry + Indy use this themselves?

## Document Pipeline Status

### Shared Documents
- Docs 1-5: COMPLETE (business model, manifesto, methodology, course outline, landing page)
- Doc 6 (VSL): DEFERRED (needs podcast recordings)
- Docs 7-9: COMPLETE (social media, viral strategy, knowledge base)
- Doc 10 (Company Branding): Not started
- Doc 11 (Website & SEO/GEO Strategy): COMPLETE

### Life Decisions Documents (decisions/lifedecisions/)
- 03-methodology: COMPLETE | 04-course-outline: COMPLETE | 05-landing-page: COMPLETE
- 06-free-course-funnel: NOT STARTED | 07-jtbd: COMPLETE | 08-prd: COMPLETE

### Business Decisions Documents (decisions/businessdecisions/)
- 07-jtbd: IN PROGRESS | 08-prd: NOT STARTED
- 03-06: NOT STARTED (depends on JTBD + PRD)

## Human Tasks
- [ ] Record podcast episodes (needed before VSL doc #6)
- [ ] Indy's origin story for manifesto (Section 10 gap)
- [ ] Set up social media accounts per doc #7 specs
- [ ] Railway PostgreSQL production database setup
- [ ] Stripe account configuration
- [ ] Domain registration for therightdecision.com
- [ ] Henry + Indy do Life Decisions exercises as example content
- [ ] Choose Wins Board taxonomy naming

## Key Strategic Decisions (locked)
- BD is a white-label platform (clients create their own Decision course)
- Cross-tenant anonymized data rights in BD ToS from day 1
- Stripe Connect in Phase 2, BaaS in Phase 4+ (after fundraise)
- Decision Protocol: build 3 reference implementations before expecting adoption
- Own model + own hardware is non-negotiable (full stack ownership)
