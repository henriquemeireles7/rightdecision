# Roadmap — Current Priorities

> Last verified: 2026-04-06
> Full document index: decisions/00-general/document.md
> Pipeline: d-meta → d-input → d-plan → d-tasks

## Current Phase
Foundation docs (1-9) complete. Business model expanded to two products. Now: restructure decisions/ → build Life Decisions landing page → build both MVPs → v1 launch.

## Two Tracks

### Track: Life Decisions (B2C — $197/year)
Course + Claude skills for personal life decisions.

| Priority | Milestone | Status |
|----------|-----------|--------|
| 1 | Restructure decisions/ folder (shared vs product-specific) | In progress |
| 2 | Build Life Decisions landing page (from doc 05 spec) | Not started |
| 2.5 | Write PRD from JTBD findings (doc 08) | COMPLETE |
| 3 | Build course player MVP | Not started |
| 4 | Design methodology → skills mapping (one skill per exercise) | Not started |
| 5 | Record first 3 course modules | Not started |
| 6 | Design free course funnel (simplified methodology) | Not started |
| 7 | V1 launch | Not started |

### Track: Business Decisions (B2B — $1,997/year)
Course + Claude skills + automation APIs for non-tech entrepreneurs.

| Priority | Milestone | Status |
|----------|-----------|--------|
| 1 | Write Business Decisions methodology doc | Not started |
| 2 | Write Business Decisions course outline | Not started |
| 3 | Build content automation pipeline (doc 08 spec) | Not started |
| 4 | Build automation APIs (posting, content generation) | Not started |
| 5 | Design Business Decisions landing page | Not started |
| 6 | Record Business Decisions course modules | Not started |
| 7 | "Vibe Coding for Non-Tech Creators" bonus course | Not started |

## Document Pipeline Status

### Shared Documents
- Docs 1-5: COMPLETE (business model, manifesto, methodology, course outline, landing page)
- Doc 6 (VSL): DEFERRED — needs podcast recordings first
- Docs 7-9: COMPLETE (social media setup, viral strategy, knowledge base)
- Doc 10 (Company Branding): Not started
- Doc 11 (Basic SEO/DR): Not started

### Life Decisions Documents (in decisions/lifedecisions/)
- 03-methodology: COMPLETE (moved from root) — updated 2026-04-06 with win-oriented reframing
- 04-course-outline: COMPLETE (moved from root) — updated 2026-04-06: exercises = AI skills, win-writing added
- 05-landing-page: COMPLETE (moved from root) — updated 2026-04-06: eternal self-help loop, three failure points
- 06-free-course-funnel: NOT STARTED
- 07-jobs-to-be-done: COMPLETE — JTBD analysis for Life Decisions software
- 08-prd: COMPLETE — PRD for Life Decisions V1. Two-app architecture, interactive onboarding, Wins Board V1, free mini-course. Decision primitive deferred.

### Business Decisions Documents (in decisions/businessdecisions/)
- 03-methodology: NOT STARTED
- 04-course-outline: NOT STARTED
- 05-landing-page: NOT STARTED
- 06-free-course-funnel: NOT STARTED

## Human Tasks
Things AI flagged but needs human action to unblock:
- [ ] Record podcast episodes (needed before VSL doc #6)
- [ ] Indy's origin story for manifesto (Section 10 gap)
- [ ] Set up social media accounts per doc #7 specs
- [ ] Railway PostgreSQL production database setup
- [ ] Stripe account configuration
- [ ] Domain registration for therightdecision.com
- [ ] Henry + Indy do Life Decisions exercises as example content (later)
- [ ] Choose Wins Board taxonomy — "Wins Board", "Victory Hall", or something else (brand-aligned naming)

## Open Questions (blocking future work)
1. Storage for video files (cloud vs local vs hybrid)
2. How non-tech B2B customers run the platform
3. Skill distribution mechanism (npm, git, MCP server)
4. Free course funnel design (what's free vs paid)
5. Wins Board mechanics — anonymity model, gamification without over-tracking, win categories
6. Daily content pipeline — podcast-to-blog-to-email, free users or paid, Little Hire retention mechanism
