# Roadmap — Phase 1: GTM (Now → Month 12)

> Thesis: The decision methodology works for real humans. The infobusiness model generates revenue.
> Flywheel stage: User decides → We see it works (qualitative)
> Revenue target: $50K ARR (250 LD + 3 BD clients)
> Data target: 1,000+ structured decision records

## What's Already Built

Current version: **v0.2.0.0** (2026-04-08). The foundation is solid and the course UX is premium.

**Platform (100% production-ready):** Auth (Better Auth with roles: free/pro/admin), Stripe checkout + webhooks (idempotency tracking), Resend email (13 branded templates), R2 storage, PostHog analytics (server + client), CI/CD, Railway deploy, customer portal, health endpoints.

**Life Decisions:**
- Landing page (SSR, Tailwind, 11 sections, 4 A/B headline variants, anti-self-help positioning)
- 6-step onboarding flow (anonymous sessions, A/B testing, email capture, subscription linking)
- Editorial course experience (markdown rendering with pull quotes + insight callouts + drop caps, book-metaphor design, 65ch reading width, Instrument Serif/Sans typography)
- Course dashboard (book-style table of contents with individual class titles)
- Mobile bottom nav (prev/next/bookmark/menu, 44px touch targets, full-screen menu overlay)
- Module landing pages (class list with completion status)
- Course listing page (multi-course architecture ready for 10+ courses)
- Journey page (vertical decision timeline — retention hook where the screenshot IS the marketing)
- Micro-decisions (in-class decision prompts, 5-minute edit window then locked forever)
- Share cards (server-side satori + resvg branded decision cards, 1200x630)
- Session memory (localStorage scroll position save/restore, 7-day expiry)
- Reading analytics (time spent, scroll depth, completion — fire-and-forget sendBeacon)
- Course progress tracking (sequential enforcement, bookmarks)
- Wins Board V1 (create wins, public feed, rate limiting 3/day, 4 life areas, anonymized timestamps)
- Paywall screen (personalized with throughline decision)
- Auth pages (forgot/reset password, verify email, purchase success)
- DB tables: `userDecisions`, `readingAnalytics`, `courseProgress`, `wins`, `subscriptions`

**Business Decisions:**
- Full 7-step podcast pipeline (transcribe → clip-select → clip-cut → metadata-generate → post-distribute → analytics-collect → insight-generate)
- Workflow orchestrator with state machine (17 states, approval gates)
- Pipeline config system (auto-approve, max clips, etc.)
- Social posting provider (real Upload-Post API with retry logic, not mocked)

**Website:**
- Homepage, blog system (markdown), concept pages (10 pages on decision-making topics), legal pages, sitemap, RSS, robots.txt
- SEO/GEO foundation: JSON-LD structured data (Organization, WebSite, Article, FAQPage, DefinedTerm, Product, Person, BreadcrumbList)
- 100% SSR, zero client JS

**Content:**
- 10 course modules (00-onboarding through 09-resolution) with decision prompts in 9 practice MDX files
- 1 blog post, 10 concept pages, legal docs, 2+ Claude skills (decide, target-state)
- Multi-course content structure (`content/courses/life-decisions/`)

**Testing:**
- ~50 test files across features, platform, providers
- 120+ tests (9 service test files, BD pipeline integration)
- 7 test factories

**Tech Debt:**
- Legacy `purchases` table (kept for migration reference, `subscriptions` is the active table)
- 17 E2E test flow stubs in tests/flows/e2e.test.ts
- Auth pages have zero tests

---

## What's Been Completed

### P1.1: Course UX Upgrade ✅ COMPLETE
**Completed:** 2026-04-08 (PR #24, squash-merged as v0.2.0.0)
**What shipped:** Full 10-Star Editorial Course Experience — markdown rendering, editorial design, bottom nav, dashboard redesign, journey page, micro-decisions, share cards, session memory, reading analytics, multi-course architecture, module landing pages, decision capture routes.

### P1.0: Social Posting Provider ✅ COMPLETE
**What shipped:** Upload-Post API integration is real (not mocked). Has retry logic with exponential backoff, 100% test coverage.

---

## How to Use This File

Each project below builds ON what exists. They're sized for one full cycle:
```
Copy project description → /office-hours → /plan-ceo-review → /d-tasks → /d-code → /ship
```

Pick by priority. When done, mark COMPLETE and note what you learned.

---

## P1.2: Decision Graph Schema V1
**Status:** Not started
**Priority:** 1 (highest-leverage technical decision)
**Track:** Shared
**Builds on:** platform/db/schema.ts (userDecisions + readingAnalytics + courseProgress + wins tables)

**What:** Design and implement the Decision Graph data structure. This is NOT just a new table. It's the core representation that everything else builds on. Nodes (decisions) + edges (connections between decisions) + outcome annotations + temporal metadata + consent flags. Must work with PostgreSQL (recursive CTEs for graph queries, not Neo4j). Integrate with existing data: each win in the Wins Board becomes a node, each micro-decision from the course links to a decision node, each userDecision record maps to a graph node.

**Why in the 5-year vision:** The Decision Graph IS the filesystem of the Decision OS. It determines what the AI model can learn in Phase 4. What Collective Intelligence can detect in Phase 2. What the Decision API exposes in Phase 3. The schema must represent: a single decision, connections between decisions, outcomes at multiple time horizons, anonymized patterns across users, and consent flags for model training.

**What success looks like:** A schema that Henry + Indy can run their own real decisions through. Existing wins map to decision nodes. Micro-decisions and userDecisions link to graph nodes. Graph queries return "decisions related to this one" and "outcomes for similar decisions."

**Key decisions for /office-hours:**
- Graph in PostgreSQL (recursive CTEs, JSONB adjacency lists) vs. adding a graph layer?
- Core node types: Decision, Action, Outcome, Reflection?
- Edge types: leads-to, blocks, enables, informed-by?
- How do existing wins, userDecisions, and micro-decisions map to graph nodes?
- Anonymization at the schema level: how?
- What's the V1 minimum vs. what Phase 2 extends?

---

## P1.3: Free Course Content + Funnel
**Status:** Not started
**Priority:** 2 (the narrowest wedge)
**Track:** Life Decisions
**Builds on:** content/courses/life-decisions/ (10 modules exist), features/(life)/course/access.ts (free/paid gating), features/(shared)/email/ (13 templates + reminders exist)

**What:** Create the free course content (simplified methodology, modules 0-1 are already free). Design the free-to-paid conversion funnel: free course → email drip → paywall → checkout. Build the email drip sequence using the existing email provider (Resend — 13 templates already built). Add conversion analytics (PostHog funnels — already integrated). Optimize the landing page CTA to point to free course first, not checkout. Leverage existing reminders (inactivity, module completion, abandoned onboarding) as drip foundation.

**Why in the 5-year vision:** One person through the free methodology, transformed. That's the proof point. The free course also captures email addresses (already collected in onboarding step 6) and generates the first decision data. The conversion funnel is the revenue engine. Every email in the drip sequence is a decision prompt that builds the deciding habit.

**What success looks like:** 10 people complete the free course. Email drip sequence running (5-7 emails). Free-to-paid conversion > 5%. At least 1 documented transformation story.

**Key decisions for /office-hours:**
- How much of the methodology is free? (Currently modules 0-1, is that enough?)
- Email drip: how many emails? What's the cadence? What's the hook per email?
- Landing page: lead with free course or anti-self-help positioning first?
- How does the free course funnel connect to the onboarding flow (6 steps already built)?

---

## P1.4: Decision Record + Follow-Up System
**Status:** Not started
**Priority:** 3 (first data for the flywheel)
**Track:** Life Decisions
**Builds on:** features/(life)/wins/ (win creation exists), features/(life)/course/decisions.ts (micro-decisions exist), features/(shared)/email/ (Resend ready), platform/db/schema.ts

**What:** Build the Decision Record feature: at the end of each course exercise, capture a structured decision (decision text, category, sub-decisions, first action, deadline). Generate a signed decision statement. Start the follow-up loop: 7-day email asking "Did you act?", 30-day outcome check, 90-day reflection. Each response updates the Decision Graph. The micro-decisions already capture in-class decisions — this extends them into full Decision Records with follow-up.

**Why in the 5-year vision:** Every Decision Record is a node in the Decision Graph. The follow-up loop generates outcome data automatically. Outcomes feed Collective Intelligence in Phase 2. The follow-through rate becomes the key metric for methodology effectiveness. Without this, you have a course. With this, you have a decision engine.

**What success looks like:** Decision Records being created from course exercises. Follow-up emails firing on schedule. 60%+ follow-up response rate. Outcome data flowing into the database.

**Key decisions for /office-hours:**
- Decision Record schema: what fields exactly? How does it connect to the Decision Graph?
- Follow-up cadence: 7-day, 30-day, 90-day? Or adaptive based on decision type?
- How does the Decision Record extend micro-decisions (already built)?
- Do users create Decision Records only from the course, or also standalone?
- The Decision Letter feature (write to future self): bundle here or separate project?

---

## P1.5: Delight Features Pack 1 (Birthday, Streak, Score)
**Status:** Not started
**Priority:** 4 (makes the product feel alive)
**Track:** Life Decisions
**Builds on:** features/(life)/wins/ (win data exists), features/(life)/course/decisions.ts (micro-decisions), features/(shared)/email/ (Resend ready), providers/analytics.ts (PostHog ready)

**What:** Three delight features that transform the product from functional to lovable:
1. **Decision Birthday** — Anniversary notifications via email of past decisions. "One year ago you decided to leave your job. Here's what happened since." Links to outcome data. Shareable via existing share card infrastructure.
2. **Decision Streak** — Track deciding frequency (not just wins). "You've made 14 decisions this month. Your average is 8. Your follow-through is 91%."
3. **Anti-Self-Help Score** — Action ratio: time doing vs. time thinking. "Your Action Ratio is 2.5x. Top 15% of all users."

**Why in the 5-year vision:** Decision Birthday is the single most shareable feature. When a user posts "One year ago I decided X" on social media, that's free marketing AND social proof. The Streak builds the deciding muscle (the methodology's core claim). The Score reinforces anti-self-help positioning by measuring ACTION, not reflection.

**What success looks like:** Users receiving Decision Birthday emails. Streak visible in dashboard. Score generating engagement. At least one social share of a Decision Birthday.

**Key decisions for /office-hours:**
- Birthday: email + in-app notification, or email only?
- Streak: what counts as a "decision"? Just Decision Records, or also wins + micro-decisions?
- Score: how is it calculated? What data feeds it? (readingAnalytics + userDecisions + wins)
- Where do these live in the UI? Dashboard? Journey page? Separate page?

---

## P1.6: Content Pipeline → Real Platforms
**Status:** Partially complete (provider done, real posting untested end-to-end)
**Priority:** 5 (BD revenue depends on real posting)
**Track:** Business Decisions
**Builds on:** Full 7-step pipeline (working), providers/social-posting.ts (real Upload-Post API integration with retry logic)

**What:** The social posting provider is already real (not mocked) with Upload-Post API integration. What's needed: Wave 1 — actually post to LinkedIn + YouTube via Upload-Post, verify real end-to-end flow. Wave 2: X/Twitter. Wave 3: TikTok + Instagram (with fallback to Buffer/Later if API approval denied). Connect the analytics-collect step to real engagement data. Implement dry-run mode (log instead of post) for safe testing.

**Why in the 5-year vision:** The BD value prop is "we handle your content distribution." The provider is built but never tested with real posts. Real posting proves the pipeline works end-to-end. The analytics data from real posts becomes the first BD-side input for content intelligence in Phase 2. Henry + Indy dogfooding with real posts creates the case study for selling to BD clients.

**What success looks like:** One podcast episode posted to 2+ real platforms. Analytics collecting real engagement data. Dry-run mode tested and working. Henry + Indy using it weekly.

**Key decisions for /office-hours:**
- Upload-Post API: what profiles are set up? Which platforms are ready?
- LinkedIn + YouTube API approval via Upload-Post: requirements?
- Dry-run mode: config flag in workflow config, or environment-based?
- How does real analytics data differ from what analytics-collect expects?

---

## P1.7: SEO + Blog Engine Expansion
**Status:** Not started
**Priority:** 6 (compounds over time, start early)
**Track:** Shared
**Builds on:** features/(shared)/website/ (blog system + 10 concept pages + sitemap + RSS + JSON-LD exist)

**What:** Expand from 1 blog post and 10 concept pages to a full content engine. Write 10+ new blog posts targeting the 4 keyword clusters from doc 11 (SEO/GEO strategy). Add category/tag system to blog. Add internal linking between concept pages, blog posts, and the course. Set up Substack-style email newsletter (weekly decision prompt + curated win stories from the Wins Board). RSS feed already exists.

**Why in the 5-year vision:** SEO compounds. Every blog post about decision-making positions you as the authority. The concept pages already rank for decision-related terms. Internal linking between concepts → blog → course creates a content web that Google loves. The newsletter becomes a weekly decision prompt that builds the deciding habit, driving course engagement and win creation.

**What success looks like:** 10+ new posts published. Ranking for 2+ target keywords. Newsletter with 500+ subscribers. Internal link network between all content types.

**Key decisions for /office-hours:**
- Which keyword cluster to prioritize? (doc 11 has 4 clusters)
- Newsletter: Substack, Resend, or custom?
- Blog categories: match the 4 life areas (health, relationships, career, money)?
- Content repurposing: blog → social snippets → email → course references?

---

## P1.8: E2E Test Coverage + Tech Debt Sprint
**Status:** Not started
**Priority:** 7 (quality gate before external users)
**Track:** Shared (Infrastructure)
**Builds on:** tests/flows/e2e.test.ts (17 flow stubs), auth pages (zero tests), ~50 existing test files

**What:** Wire up the 17 E2E test flow stubs that already exist in tests/flows/e2e.test.ts (5 main flows: Payment→Account→Dashboard, Course Consumption, AI Skill Marking, Win Writing, Free→Paid Upgrade, plus 6 edge cases). Add tests for auth pages (forgot-password, reset-password, verify-email, purchase-success). Migrate from legacy `purchases` table to `subscriptions` table (purchases is kept for reference but should be dropped). Clean up any remaining tech debt.

**Why in the 5-year vision:** You can't invite external users to a product with 17 untested E2E flows. The `purchases` → `subscriptions` migration unblocks annual vs. monthly pricing, trials, and cancellation grace periods. This is the quality gate between "Henry and Indy use it" and "real people pay for it."

**What success looks like:** All 17 E2E flows passing. Auth pages tested. Legacy `purchases` table dropped. Zero known broken paths.

**Key decisions for /office-hours:**
- Which E2E flows are critical path (test first) vs. edge cases (test later)?
- Subscriptions migration: backward-compatible or clean break?
- What billing states need to work for launch? (active, cancelled, past-due?)
- Test database: use the existing local PostgreSQL setup from CLAUDE.md?

---

## P1.9: BD Strategy Docs + First Client Prep
**Status:** In progress (07-jtbd started)
**Priority:** 8 (parallel with BD coding)
**Track:** Business Decisions (writing workflow)
**Builds on:** decisions/businessdecisions/ (07-jtbd in progress)

**What:** Complete BD strategy documents: 07-jtbd (JTBD analysis for white-label platform), 08-prd (BD platform MVP PRD, updated for white-label model), course outline (teaches clients to create their own Decision course). Design the BD sales process: who are the first 3 clients? How do they find us? What's the onboarding? Prepare cross-tenant anonymized data rights language for BD ToS.

**Why in the 5-year vision:** BD is a white-label platform. These docs define what BD clients get. The JTBD analysis reveals what "Drowning Builders" actually need in a white-label context. The ToS data rights clause is what makes the network intelligence moat possible. Without the right ToS from day 1, every BD client's data is siloed and useless for model training.

**What success looks like:** All BD strategy docs complete. White-label model clearly articulated. ToS language reviewed. 3 potential first clients identified.

**Key decisions for /office-hours:**
- How does white-label change the JTBD findings?
- What's the minimum white-label that a client can sell with?
- Exact ToS language for cross-tenant anonymized data sharing?
- Sales channel: network, content marketing, cold outreach?

---

## P1.10: Decision Letter + Decision Autopsy
**Status:** Not started
**Priority:** 9 (delight features, after core works)
**Track:** Life Decisions
**Builds on:** Decision Record (P1.4), features/(shared)/email/ (Resend ready), share cards (already built)

**What:** Two features that make the Decision OS feel deeply human:
1. **Decision Letter** — At decision moment, write a letter to your future self. Sealed. Delivered 90 days later via email with a prompt to reflect on what happened. The letter creates a natural 90-day outcome checkpoint.
2. **Decision Autopsy** — For decisions that didn't work out. Structured analysis: "What did I know? What did I miss? What would I do differently?" Not blame. Not regret. Analysis. Generates the richest learning data in the system.

**Why in the 5-year vision:** The Letter auto-generates 90-day outcome data (the user reflects when they receive it). The Autopsy generates failure-mode data that no other platform has. Together they feed the Decision Graph with the deepest, most honest data points. Both strengthen the anti-self-help positioning: we don't avoid failure, we learn from it structurally.

**What success looks like:** 50+ Letters created. 70%+ opened at 90 days. 20+ Autopsies completed. Users reporting the Autopsy changed how they think about failure.

**Key decisions for /office-hours:**
- Letter delivery: email only or also in-app?
- Autopsy: fixed structured questions or adaptive?
- How do Letter + Autopsy connect to the Decision Graph schema?
- Can Letters be shared (anonymized) on the Wins Board?

---

## P1.11: Legal + Data Consent Framework
**Status:** Not started
**Priority:** HARD GATE (must complete before Phase 2)
**Track:** Shared (Infrastructure)
**Builds on:** content/legal/ (privacy.md + terms.md exist, rendered at /privacy and /terms)

**What:** Update Terms of Service and Privacy Policy for Decision Graph data collection. Build GDPR/CCPA compliant consent flow (users opt-in to anonymized data usage for model training). Write BD Terms of Service with cross-tenant anonymized data rights. Get legal review.

**Why in the 5-year vision:** The data flywheel doesn't work without legal consent. The white-label model doesn't work without cross-tenant data rights. The Decision Research Institute can't publish without proper governance. This is the foundation that makes Phases 2-5 possible.

**What success looks like:** All legal docs reviewed. Consent flow implemented. BD ToS includes data sharing clause. GDPR/CCPA verified.

**Key decisions for /office-hours:**
- Lawyer selection (AI/tech-focused)
- Consent UX: banner, modal, or integrated into onboarding?
- BD data rights: exact language?
- International: EU users from day 1?

---

## P1.12: Admin Dashboard + Analytics UI
**Status:** Not started
**Priority:** 10 (operational tooling)
**Track:** Shared
**Builds on:** features/(shared)/admin/ (GET /admin/analytics/onboarding API exists, zero UI), providers/analytics.ts (PostHog events flowing)

**What:** Build admin dashboard UI for the existing analytics API endpoint. Visualize: onboarding completion funnel, course progress by module, micro-decision completion rate, win creation rate, subscription conversion rate, reading analytics (time spent, scroll depth), BD pipeline health. Add operational tools: user lookup, subscription management, content moderation queue for wins.

**Why in the 5-year vision:** You can't improve what you can't measure. The analytics API already exists but there's no way to see the data without SQL queries. An admin dashboard lets Henry see what's working and what's broken in real-time. The moderation queue ensures wins quality as the community grows. This becomes the operational layer of the Decision OS.

**What success looks like:** Dashboard showing key metrics. Moderation queue functional. Henry checks it daily.

**Key decisions for /office-hours:**
- Dashboard framework: SSR pages (matching website pattern) or SPA?
- Which metrics matter most for Phase 1 vs. Phase 2?
- Moderation: approve/reject UI or just flagging?
- Access: admin role only (already exists in auth)?
