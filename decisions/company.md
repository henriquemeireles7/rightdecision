# Company — The Right Decision

> Last verified: 2026-04-09
> Deep dive: decisions/ops/00-legacy/01-business-model/input.md, decisions/ops/00-legacy/02-manifesto/document.md

## Core Principles

> Canonical source for: company principles. See decisions/maturity.md for full definitions + "Applied" examples.

1. **Decision is the primitive** — Every meaningful change begins with a decision, not information.
2. **Maturity level is how we evolve** — Every initiative must move at least one category up a maturity level.
3. **Agent-as-execution** — Agents do the work. Humans set direction and make taste decisions.
4. **Company-as-code** — Strategy, ops, and methodology are codified in decisions/ and executable through skills.
5. **One-person-company** — Solo founder + AI agents. No employees until agents can't do the job.
6. **Strategy-before-code** — Every piece of code traces back to a strategy document.
7. **Zero recurring errors** — Every failure produces a prevention artifact. The system gets smarter.
8. **Documentation is product** — Every doc is a future product asset. Strategy docs become course content.
9. **Taste is the moat** — AI commoditizes execution. Founder judgment is the real defensibility.
10. **Boil the lake, flag the ocean** — Always do the complete thing when marginal cost is minutes.
11. **Data flywheel is the organizing principle** — Every product decision asks: does this generate structured decision data?
12. **Ship the learning, not the feature** — Optimize for learning velocity, not feature completeness.

## What We Are

The Right Decision is an infobusiness + software company. US-registered LLC. Solo developer (Henry) + AI agents + content partner (Indy). Three product tiers under one brand, delivered through AI-powered Claude skills and automation APIs.

## Company North Star

**"Decisions Made"** — the single metric that connects product, growth, and revenue. More decisions = more engagement = better intelligence = more value = more revenue. See decisions/maturity.md for the full core loop.

## Core Thesis

The decision is the primitive. Every meaningful change in a human life begins with a decision, not with information, motivation, or a plan. The main cause behind not making decisions is complexity — AI helps you have clarity. We deliver transformation through action, not introspection.

## What We Are NOT

- Not a therapy replacement or mental health service
- Not a life coaching practice (no 1-on-1 sessions, no dependency)
- Not a traditional SaaS with dashboards and buttons
- Not a marketing agency (we teach, not do-it-for-you)
- Not competing with Claude/AI tools — we build ON them
- Not a no-code website builder
- Not "self-help" — we are anti-self-help. The enemy is the dependency industry.

## Three Product Tiers

> Canonical source for: product tiers, pricing, ICP personas.

### Free Tier (Lead Generation)
3-part intro course: Module 0 + Module 1 free. Email capture at Level 2. Decision blocks compound on prior answers. Funnel: free → email → paywall → paid.

### Life Decisions ($197/year or $19.70/month)
Course + Claude skills for personal life decisions. User runs skills on their own computer. No API needed — docs and skills only.

**What it includes:**
- Course: 3 acts (See Clearly, Decide, Move), 9 modules, ~23 hours
- One Claude skill per methodology exercise — the skill IS the exercise
- Micro-decisions: in-class decision prompts (5-min edit window, then locked)
- Your Journey: timeline of all decisions made (retention hook + screenshot IS the marketing)
- Skills architecture: skill asks deep questions → user answers → saves raw.md → generates document.md
- Multi-course architecture: courses.json registry. Currently "life-decisions" only.

**ICP — "The Stuck Achiever":** Woman, 30-50. Has done the work (therapy, courses, books). Objectively ahead of peers. Stuck at a higher level. Disguises indecision as research.

**ICP — "The Overthinker":** Man, 25-40. Overthinks career/business moves. Consumes content obsessively but never starts. Analysis paralysis disguised as preparation.

### Business Decisions ($1,997/year)
Course + Claude skills + automation APIs for non-tech entrepreneurs. "Vibe coding for non-tech creators/founders."

**What it includes:**
- Business-specific course (same decision cycle, applied to business building)
- One Claude skill per business exercise (business model, manifesto, methodology, course design, distribution)
- Automation APIs: content pipeline, social media posting, analytics
- Client gets their own decisions/ folder structure (modeled after ours)
- Our strategy documents as example/template content
- Bonus: "Vibe Coding for Non-Tech Creators/Founders" (Claude Code course)

**ICP — "The Drowning Builder":** Non-tech entrepreneur, 28-45. Has idea/early business. Drowns in planning instead of executing. Needs the methodology AND the platform.

**Agent-first design:** APIs + Claude skills compose the platform. Users interact via Claude Code. No web dashboard required for core workflow. We don't compete with Claude — we provide methodology + skills + APIs that work WITH Claude.

## Team

- **Henry** — Technical founder. Builds the platform, automation, and AI skills. Multiple companies, exits.
- **Indy** — Content and brand. Face and voice of The Right Decision. The Indy Test: "Would Indy say this to a friend at the kitchen table?"

## Stage

Pre-revenue. JTBD analysis complete for Life Decisions. Building both MVPs and course content simultaneously. Henry and Indy are the first Business Decisions customers (dogfooding).

## Positioning

Anti-self-help. Life transformation through action, not introspection. The enemy is the dependency industry — the business model that profits from understanding without action.

Differentiator: "Everything else teaches you to understand why you're stuck. We teach you to decide and do — and we give you AI tools that make it effortless."

Win-oriented, not healing-oriented: the methodology tracks victories, not healing progress. Resolution is celebrated, not just assessed.

## The Flywheel

Free course (lead gen) → Full course with AI skills → Business Decisions clients build the SAME funnel for their audience using our platform. Our docs ARE the company — sharing them is intentional (proof the system works, course content for B2B, radical transparency).

## Revenue Model

Usage-based pricing tied to decisions made. More decisions = more engagement = more revenue. The business model IS the product mechanic.

- Free tier: unlimited browsing, first 3 decisions free
- Life Decisions: $197/year for unlimited decisions + full course
- Business Decisions: $1,997/year for platform + skills + APIs

## Locked Decisions

| Decision | Date | Rationale | Revisit Trigger |
|----------|------|-----------|-----------------|
| $197/year LD price | 2026-03 | Anti-self-help positioning. Low enough to be impulse, high enough to filter tire-kickers. | If conversion <5% after 1000 visitors |
| $1,997/year BD price | 2026-03 | Infrastructure cost per client + premium positioning. 10x LD. | After first 5 BD clients give feedback |
| No paid ads until organic proves PMF | 2026-03 | Organic demand validates the product. Ads scale what works. | $50K ARR sustained 3 months |
| Cross-tenant anonymized data rights in BD ToS | 2026-03 | Flywheel requires aggregate data. Day 1 legal setup prevents later fights. | Never (non-negotiable) |
| Stripe Connect in Phase 2 | 2026-03 | BD clients need payments. Too early now. | First BD client wants to charge |
| No employees until agents can't do the job | 2026-04 | P5: one-person-company. Hiring is a last resort. | Revenue >$500K AND clear agent bottleneck |

## Non-Negotiable End State

Own model + own hardware. Full stack ownership. The infobusiness is GTM for a vertical AI company. 5-phase arc: (1) GTM → (2) AI Platform → (3) Developer Platform → (4) Own Model → (5) Own Hardware.
