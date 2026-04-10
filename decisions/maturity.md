# Maturity — The Company Operating System

> Last verified: 2026-04-09

## Company North Star

**"Decisions Made"** — the single metric that connects everything.

```
User decides → engagement increases → data captured → intelligence improves →
better decisions → more users → network effects → more decisions → (repeat)
```

More decisions = more engagement = better intelligence = more value = more revenue. Pricing is usage-based, correlated to decisions made. This means the business model IS the product mechanic: making the product better makes us more money, automatically.

## Core Principles

1. **Decision is the primitive** — Every meaningful change begins with a decision, not information. Applied: product methodology, Decision Graph, course structure.
2. **Maturity level is how we evolve** — Every initiative must move at least one category up a maturity level. Applied: strategy prioritization, bottleneck resolution, project scoring.
3. **Agent-as-execution** — Agents do the work. Humans set direction and make taste decisions. Applied: skills, hooks, automation, content pipeline.
4. **Company-as-code** — Strategy, operations, and methodology are codified in decisions/ and executable through skills. Documentation IS the product. Applied: decisions/ folder, CLAUDE.md files, skills as BD product.
5. **One-person-company** — Solo founder + AI agents. No employees until agents can't do the job. Hiring is a last resort, not a milestone. Applied: architecture choices, automation-first, BD white-label model.
6. **Strategy-before-code** — Every piece of code traces back to a strategy document. No implementation without a decision trail. Applied: d-strategy → d-roadmap → d-code, initiative docs become course content.
7. **Zero recurring errors** — Every failure produces a prevention artifact. The system gets smarter from every failure. Applied: d-harness error feedback loop, health.md incident log, hook enforcement, learnings.jsonl.
8. **Documentation is product** — Every doc is a future product asset. Strategy docs become course content. Skills become BD product. The handbook becomes the methodology. Applied: decisions/ → course classes, skills → BD product.
9. **Taste is the moat** — AI commoditizes execution. Founder judgment about what to build, how it should feel, and what to say no to is the real defensibility. Applied: voice.md (Indy Test), design.md (Ethereal Warmth), 5 Tests, CEO review.
10. **Boil the lake, flag the ocean** — AI makes completeness near-free. Always do the complete thing when marginal cost is minutes. Distinguish lakes (doable 100%) from oceans (multi-quarter rewrites). Boil lakes. Flag oceans. Applied: d-code completion audit, d-review thoroughness.
11. **Data flywheel is the organizing principle** — Every product decision asks: does this generate structured decision data? Features that don't feed the flywheel are distractions. Applied: Decision Graph, 5 Tests (#1 is "Flywheel?"), cross-tenant data rights in BD ToS, path to own model.
12. **Ship the learning, not the feature** — Phase 1 goal isn't a perfect product, it's learning what works. Every shipped feature is a hypothesis test. Optimize for learning velocity, not feature completeness. Applied: free funnel, MVP scope, PostHog analytics, phase triggers based on learnings.

## Universal Maturity Levels

Every category in every domain evolves through the same 5 levels. This is the universal pattern.

| Level | Name | Score | Pattern | Founder Role | System Role |
|-------|------|-------|---------|-------------|-------------|
| L1 | Manual | 0-19 | Founder does the work | Executor | Tool |
| L2 | Assisted | 20-39 | Skills help, founder reviews | Reviewer | Assistant |
| L3 | Automated | 40-59 | Scheduled execution, founder spot-checks | Supervisor | Worker |
| L4 | Self-Learning | 60-79 | Analytics loop, better hypotheses each cycle | Strategist | Learner |
| L5 | Self-Evolving | 80-99 | AI tunes its own parameters | Direction-setter | Autonomous |

### Universal Prerequisites

You cannot reach a level without its prerequisites. These are hard gates, not suggestions.

| Level | Requires | Impossible Without |
|-------|----------|--------------------|
| L2 | A skill for the task | Can't be assisted without a skill |
| L3 | Scheduling/cron + L2 stable quality | Can't automate what isn't reliably assisted |
| L4 | Analytics + A/B testing + feedback loop | Can't self-learn without data on what works |
| L5 | Recursive self-improvement capability | Can't self-evolve without the ability to modify its own harness |

### How to Read a Score

- Score = how autonomous is the system in this category
- The score within a level shows progress toward the next level
- Example: L2 score 35 = almost ready for L3, just needs scheduling to be stable
- Area score = average of its categories. Company score = average of all 10 categories.

## Three Domains

### Product (Generate Value)
What the user gets. Features, UX, content, engagement.

Categories (ordered by flywheel depth):
1. **Engagement Layer** — make users make MORE decisions. Exercises, micro-decisions, course flow, retention hooks.
2. **Data Layer** — capture decisions as structured data. Decision Graph, analytics, user journey tracking.
3. **Network Layer** — cross-user patterns. Decision Twins, collective intelligence, social proof, community effects.
4. **Intelligence Layer** — meta-layer that makes all layers more robust. Own model, personalized recommendations, predictive insights.

### Growth (Capture Value as Money)
Turn product value into revenue. Content, distribution, conversion, expansion.

Categories:
5. **Distribution** — generating leads. Content creation, SEO, social, Substack, blog.
6. **Conversion** — turning leads into money. Free funnel, email sequences, pricing, A/B testing.
7. **Expansion** — more revenue per user (ARPU). BD upsell, usage-based pricing, new products.

### Harness (Self-Evolving AI System)
The AI development methodology that runs the company.

Categories:
8. **Self-Learning** — system improves from errors. Prevention artifacts, learnings, hook enforcement.
9. **Self-Growth** — system does growth work autonomously. Content pipeline, distribution, analytics.
10. **Self-Product** — system builds product autonomously. Strategy-to-shipped, completion audit, quality review.

## The Decision Filter

Every initiative must answer:
1. **Which category does this target?** (one of the 10)
2. **What is the current score?** (read from health.md)
3. **What score do we expect after?** (projected improvement)
4. **What maturity level does this move us to?** (or further within the current level)

Initiatives that don't target a specific category are not initiatives. They're distractions.

## How Maturity Connects to Business Model

Usage-based pricing tied to decisions made:
- More decisions per user = more engagement = higher retention = more revenue per user
- More users making decisions = more data = better intelligence = better product = more users
- The product gets exponentially better with more engagement/data/users
- Our pricing MUST be directly correlated to decisions, because then making more decisions means making more money

This is not a SaaS metrics game. This is a flywheel where the product mechanic (making decisions) IS the revenue mechanic.
