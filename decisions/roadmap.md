# Roadmap — Current Priorities

> Last verified: 2026-04-07
> Full document index: decisions/00-general/document.md
> Pipeline: d-meta → d-input → d-plan → d-tasks

## Current Phase
Foundation docs (1-9) complete. Business model expanded to two products. Life Decisions is course-first (docs done, building landing page + course player). Business Decisions is software-first (content pipeline IS the MVP, course teaches the platform later). The content pipeline (doc 08) serves both tracks — it's the BD product AND the distribution engine for LD.

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
Software-first: the platform IS the product. Course teaches the platform later.
Content pipeline (doc 08) powers distribution for BOTH tracks.

**Write workflow (strategy docs):**

| Priority | Doc | Status | Why this order |
|----------|-----|--------|----------------|
| 1 | 07-jtbd — Jobs to Be Done | In progress | Understand the Drowning Builder's software needs |
| 2 | 08-prd — Platform MVP | Not started | Define BD platform from JTBD findings |
| 3 | 03-methodology — Business decision cycle | Not started | Needs platform context to map skills |
| 4 | 04-course-outline — Course | Not started | Course teaches the platform (platform must exist first) |
| 5 | 05-landing-page — Landing page | Not started | Needs product to be defined |
| 6 | 06-free-course-funnel | Not started | Post-launch |

**Code workflow (building the platform):**

| Priority | Milestone | Status | Serves |
|----------|-----------|--------|--------|
| 1 | Content pipeline MVP — manual walkthrough of doc 08 | Not started | Both (distribution) |
| 2 | Content pipeline automation — file watchers, OpusClip, metadata | Not started | Both (distribution) |
| 3 | Auto-posting scripts — platform APIs (TikTok, IG, etc.) | Not started | Both (distribution) |
| 4 | Analytics/monitoring — pipeline health, posting logs | Not started | Both (ops) |
| 5 | Client-facing packaging — multi-tenant, client decisions/ folders | Not started | BD only (product) |
| 6 | "Vibe Coding for Non-Tech Creators" bonus course | Not started | BD only (course) |

**Sequencing:** Write and code workflows run in parallel. JTBD + PRD inform later code stages (client packaging). Code pipeline doesn't wait for BD docs — it's specified in shared doc 08.

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
- 07-jtbd: IN PROGRESS — JTBD analysis for BD platform (software-first, using doc 08 as reference input)
- 08-prd: NOT STARTED — BD platform MVP (depends on JTBD)
- 03-methodology: NOT STARTED — business decision cycle (depends on platform clarity)
- 04-course-outline: NOT STARTED — course teaches the platform (depends on platform existing)
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
