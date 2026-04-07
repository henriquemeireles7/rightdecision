# Decision Documents — General Index

> **Status:** ACTIVE
> **Purpose:** Index of all strategy documents and the methodology for producing them.

---

## Methodology: Meta → Draft → Document

Every strategy document follows a three-phase creation process:

### 1. Meta (Think about thinking)

Before writing anything, Henry and Claude define *what* the document needs to answer and *why* it matters. This phase produces the document's scope, key questions, and success criteria. The meta phase prevents wasted effort — if we can't articulate what a document needs to resolve, we're not ready to write it.

### 2. Draft (Get it wrong fast)

Henry writes the first draft with Claude. The goal is completeness over polish — capture every decision, constraint, and trade-off. Drafts are intentionally rough. They use `[DECISION NEEDED]` and `[ASSUMPTION]` flags to mark open questions. A draft that surfaces 10 hard questions is more valuable than a polished document that hides them.

### 3. Document (Make it executable)

The draft becomes a spec that an implementer can execute from. Every ambiguity gets resolved, every decision gets made, every instruction gets specific enough that someone (human or AI agent) can build from it without asking clarifying questions. The document is the single source of truth — if it's not in the document, it doesn't exist.

**Why this works:** The separation forces clear thinking before action. Meta catches bad ideas before we invest in drafting. Draft catches missing decisions before we invest in polishing. Document catches ambiguity before we invest in building. Each phase is cheap compared to discovering the problem downstream.

---

## Knowledge Base Rules

This file (`general.md`) is the **living summary** of the entire decisions/ knowledge base. It gets updated as new documents or raw material are added. Same pattern as SPEC.md in DSA.

**Three mutation tiers:**
1. **`general.md`** = living, always updated. AI reads this first for full context.
2. **`*/document.md`** = static once written. Only changes if Henry explicitly asks.
3. **Raw material** (`input.md`, `raw.md`, podcast transcripts) = immutable. New files are added, never edited.

**Current status (2026-04-06):**
- Docs 1-5: COMPLETE (business model v2, manifesto, methodology, course outline, landing page)
- Doc 6 (VSL): DEFERRED — needs podcast recordings first
- Docs 7-9: COMPLETE (social media setup, short-video viral strategy, knowledge base strategy)
- **Business model expanded to v3:** Two products (Life Decisions + Business Decisions). Input captured, document pending d-plan.
- **Folder restructured:** Product-specific docs moved into `lifedecisions/` and `businessdecisions/` subfolders.
- **JTBD complete (2026-04-06):** Jobs-to-be-Done analysis for Life Decisions software (doc #7)
- **Next:** Write PRD from JTBD → build Life Decisions landing page → build both MVPs → record first podcast → v1 launch

**Key decisions (2026-04-06 restructure):**
- Two products: Life Decisions ($197/yr) + Business Decisions ($1,997/yr)
- Three personas: Stuck Achiever, Overthinker, Drowning Builder
- Skills as product: one Claude skill per methodology exercise
- Agent-first architecture for Business Decisions (APIs + skills, not SaaS dashboard)
- Free course funnel for lead generation on both products
- Wins Board replaces traditional community (anonymous victories, win-oriented retention)
- Exercise = AI skill interaction (thinking-first, structuring-second — no separate docx step)
- `lifedecisions.md` and `businessdecisions.md` replace `ops.md` as universal reference files
- Product-specific docs (methodology, course, landing page) split into product subfolders

---

## Document Index

### Shared Documents (decisions/ root)

| # | Document | Location | Description |
|---|----------|----------|-------------|
| 1 | Business Model | `01-business-model/` | Two products, three personas, pricing, distribution, revenue model. v3 in progress. |
| 2 | Manifesto | `02-manifesto/` | Copy framework — The Right Decision as the primitive, seven angles, mechanism, principles. |
| 6 | Video Sales Letter | TBD | **DEFERRED** — needs podcast recordings first. |

### Life Decisions Documents (decisions/lifedecisions/)

| # | Document | Location | Description |
|---|----------|----------|-------------|
| 3 | Methodology | `lifedecisions/03-methodology/` | Life-specific decision methodology. Each step maps to a Claude skill. |
| 4 | Course Outline | `lifedecisions/04-course-outline/` | 3 acts, 9 modules, AI skills intro class, ~23.5 hours. |
| 5 | Landing Page | `lifedecisions/05-landing-page/` | Life Decisions sales page — copy, structure, implementation specs. |
| 6L | Free Course Funnel | `lifedecisions/06-free-course-funnel/` | NOT STARTED — simplified methodology as lead gen. |

### Business Decisions Documents (decisions/businessdecisions/)

| # | Document | Location | Description |
|---|----------|----------|-------------|
| 3B | Methodology | `businessdecisions/03-methodology/` | NOT STARTED — business-specific decision methodology. |
| 4B | Course Outline | `businessdecisions/04-course-outline/` | NOT STARTED — business course + vibe coding bonus. |
| 5B | Landing Page | `businessdecisions/05-landing-page/` | NOT STARTED — Business Decisions sales page. |
| 6B | Free Course Funnel | `businessdecisions/06-free-course-funnel/` | NOT STARTED — business simplified methodology as lead gen. |

### Week 2 — Distribution 1: Organic

| # | Document | Description |
|---|----------|-------------|
| 7 | Social Media Setup | 13-account registry (3 TikTok, 3 Instagram, 3 Facebook, 3 X, 1 YouTube), bios, visual identity, posting templates per platform, podcast distribution cadence (2/day → live transition). |
| 8 | Short-Video Viral Strategy | Automated pipeline — OpusClip integration, AI-generated content, dark channel concept, folder-based automation, auto-posting workflows. Not human labor. |
| 9 | Knowledge Base Strategy | Self-compounding knowledge architecture — general.md as living summary, static document archives, podcast transcript taxonomy, AI self-learning loop (future). |
| 10 | Company Branding Strategy | Startup directory submissions — Crunchbase, AngelList, Product Hunt, LinkedIn company page. |
| 11 | Basic SEO/DR Strategy | Core backlinks acquisition plan, outreach targets, directory submissions, domain authority baseline. |
| 12 | Website Strategy | Site structure, key pages, tech stack, GEO optimization for AI answers. |
| 13 | Blog Strategy | Content calendar, keyword targets (SEO + GEO), article templates, internal linking. |

### Week 3 — Product 2: Software MVP

| # | Document | Description |
|---|----------|-------------|
| 14 | Jobs-to-Be-Done | What the user hires the software to do — core user flow, key screens, high-level architecture. |
| 15 | Product Requirements | MVP scope — what's in, what's out, data model, integrations, tech stack. |
| 16 | Software Development | Technical blueprint — backend, frontend, API, database schema, auth, deployment pipeline. |
| 17 | Software Hardening | Performance targets, security checklist, error handling, accessibility, mobile responsiveness. |
| 18 | Launch Strategy | Product Hunt plan, startup directories, press outreach, launch day timeline, follow-up sequence. |
| 19 | Pitch Deck | 10-12 slides — market, problem, solution, traction, team, model, ask. |
| 20 | Acceleration Program Strategy | Relevant programs mapped (YC, Techstars, regional), deadlines, requirements, draft answers. |

### Week 4 — Distribution 2: Paid (CACMaxxxing)

| # | Document | Description |
|---|----------|-------------|
| 21 | Paid Traffic Strategy | Platform selection, daily budget, audience targeting, campaign structure, keep vs. kill metrics. |
| 22 | Ad Creative Playbook | Script templates per format, hook formulas, visual guidelines, testing framework. |
| 23 | Funnel Optimization | Landing page variants, A/B test plan, tracking setup, conversion benchmarks. |
| 24 | Retargeting Strategy | Who to retarget, with what message, on what timeline — warm audience sequences. |
| 25 | Paid Distribution Dashboard | Daily/weekly/monthly metrics, morning check routine, kill criteria for ad sets. |

### Week 5 — Product 3: LTV (LTVMaxxxing)

| # | Document | Description |
|---|----------|-------------|
| 26 | User Engagement Strategy | Engaged user definition, tracking actions, disengagement detection, intervention playbook. |
| 27 | Onboarding Optimization | First 7 days experience — emails, in-app guidance, first win target. |
| 28 | Help Center + Docs | Structure, key articles, FAQ, troubleshooting — everything for self-service support. |
| 29 | Client Results Tracking | How we measure client results, what data we collect, how results become testimonials. |
| 30 | Community Strategy | Platform, structure, rituals, moderation — if community component exists. |

### Week 6 — Distribution 3: Free Channels (LowerCACMaxxing)

| # | Document | Description |
|---|----------|-------------|
| 31 | Referral Program | Mechanics, incentive structure, product integration, tracking. |
| 32 | Affiliate Program | Commission structure, onboarding, creative assets, tracking platform, payout terms. |
| 33 | Clipper Strategy | Recruiting clippers for long-to-short video, compensation model, quality guidelines. |
| 34 | Influencer Partnership | Outreach targets, pitch templates, deal structures, follow-up cadence. |
| 35 | Partnership & Cross-Promo | Overlapping-audience creators/courses/products, co-marketing playbook. |

### Week 7 — Distribution 4: Relaunch (LaunchMaxxxxing)

| # | Document | Description |
|---|----------|-------------|
| 36 | Relaunch Strategy | Second launch with different angle — what's new, what's the hook, untapped audiences. |
| 37 | New Assets Plan | Content for relaunch — new VSL angle, new ads, new landing page, updated pitch deck. |
| 38 | PR & Media Outreach | Press list, pitch templates, story angles, podcast guest targets. |
| 39 | Product Hunt Relaunch | Full PH playbook — timing, community activation, asset prep. |
| 40 | Post-Launch Optimization | Post-launch week — follow-up sequences, momentum maintenance, traffic conversion. |

### Weeks 8–12 — Automation Sprints

| # | Document | Description |
|---|----------|-------------|
| 41 | Content Automation | Short-video pipeline — AI-assisted editing, auto-captioning, batch scheduling. |
| 42 | Support Automation | AI chatbot for tier-1, help center refinement, automated email responses. |
| 43 | Sales Automation | Email sequences — onboarding, re-engagement, upsell, abandoned cart. |
| 44 | Distribution Automation | Automated blog posting, social scheduling, ad alerts, affiliate dashboards. |
| 45 | Review + Q3 Planning | What worked, what didn't, what to double down on — Q3 plan with real data. |
