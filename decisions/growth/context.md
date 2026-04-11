# Growth Context — Capture Value as Money

> Last verified: 2026-04-09

## North Star

"Company runs 95% on agents, 5% founder taste decisions."

## Core Loop

```
Content → Leads → Conversion → Revenue → Reinvest in content → (repeat)
```

Every step should move toward automation. The goal isn't "do marketing" — it's "build a system that does marketing and improves itself."

## Value Capture Map

### Distribution — Generating Leads

What it does: content creation, SEO, social media, Substack, blog, entity building.

| Level | What It Looks Like |
|-------|-------------------|
| L1 Manual (0-19) | Founder writes all content, publishes manually |
| L2 Assisted (20-39) | d-content drafts, founder reviews and publishes |
| L3 Automated (40-59) | Content calendar scheduled, auto-publish to blog + Substack, founder spot-checks |
| L4 Self-Learning (60-79) | System tracks what content performs, adjusts topics/formats/cadence |
| L5 Self-Evolving (80-99) | System identifies audience gaps, creates targeted content, optimizes distribution autonomously |

### Conversion — Turning Leads into Money

What it does: free funnel, email sequences, landing page optimization, pricing experiments.

| Level | What It Looks Like |
|-------|-------------------|
| L1 Manual (0-19) | Manually creating landing pages, manually testing copy |
| L2 Assisted (20-39) | Skills help draft A/B variants, founder deploys tests |
| L3 Automated (40-59) | Automated scheduled tests, new variants against the winner |
| L4 Self-Learning (60-79) | System generates better hypotheses with each test, learns what converts |
| L5 Self-Evolving (80-99) | System tunes its own parameters to improve the hypothesis generation |

### Expansion — More Revenue Per User (ARPU)

What it does: BD upsell, usage-based pricing, new products, retention.

| Level | What It Looks Like |
|-------|-------------------|
| L1 Manual (0-19) | Single product, single price, manual upsell |
| L2 Assisted (20-39) | Skills identify expansion signals, founder acts on them |
| L3 Automated (40-59) | Usage-based pricing triggers, automatic tier upgrades |
| L4 Self-Learning (60-79) | System identifies what drives upgrades, optimizes expansion triggers |
| L5 Self-Evolving (80-99) | System creates, prices, and tests new offerings autonomously |

## Current State Assessment

| Category | Score | Level | Evidence |
|----------|-------|-------|----------|
| Distribution | 5 | L1 | 1 blog post live, 10 concept pages, no Substack, no social cadence |
| Conversion | 3 | L1 | Landing page exists, free funnel designed (doc 13) but not built |
| Expansion | 0 | L1 | Single LD product, no upsell path, no usage-based pricing |
| **Growth Average** | **3** | **L1** | |

## Bottleneck Map

### Distribution → What's blocking L2?
**Blocker:** No content cadence. d-content skill exists but no regular publishing workflow.
**Why:** Course content (product) has been prioritized over distribution content (growth).
**Real example:** 1 blog post in months. 10 concept pages written for SEO but no ongoing content.
**First-principles unblock:** d-content can draft. The missing piece is a publishing workflow: draft → voice.md review → publish to blog → cross-post to Substack.
**Project ideas:** "Content publish pipeline" — d-content → review → auto-publish. Target: 3 posts/week.

### Conversion → What's blocking L2?
**Blocker:** Free funnel not implemented. Design exists (doc 13) but code isn't built.
**Why:** Platform features prioritized over funnel.
**First-principles unblock:** Free funnel is the conversion mechanism. Without it, traffic has nowhere to go.
**Project ideas:** "Free funnel implementation" — 3-part free course → email capture → paywall.

## AI-Native Ops Patterns

The 80/20 of running growth with agents (first-principles, not tool catalogs):

**Pattern 1: Strategy-docs-as-code.** Every growth decision lives in decisions/. Agents read strategy before creating content. This means growth output is always aligned with company positioning. Nobody else does this.

**Pattern 2: Voice-as-constraint.** voice.md is a hard constraint, not a style guide. Content that fails voice review doesn't ship. This ensures AI-generated content passes as human because it's actually good, not because it's hidden.

**Pattern 3: Content traces to strategy.** Every piece of content traces back to a strategy document in decisions/. No orphan content. This means every blog post, social post, and email has strategic intent.

**Pattern 4: Multi-agent workflows.** d-strategy → d-content → d-review → publish. Each skill handles its specialty. The founder's role is taste decisions at each gate.

## References by Category

### Who's best at AI Distribution?
- **Polsia** — $4.5M ARR, 1 employee. AI "co-founder" runs marketing campaigns including ads, works overnight. L4-L5 distribution.
- **Austin Hay** — "Claude Code is creating a new class of elite marketers." Uses Claude Code for campaign execution.
- **Vibe Marketing** — emerging practice where AI handles campaign execution from creative to deployment. Companies cutting content costs 70-80%.

### Who's best at Conversion?
- **Duolingo** — free-to-paid conversion through engagement loops, not sales funnels. Their insight: make the free product so good that paid feels like the natural next step.

### Who's best at Expansion?
- **Notion** — free tier → team → enterprise expansion path. Usage-based growth within accounts.

## CEO Vision

Phase 1 growth is about proving organic demand. No paid ads until $50K ARR proves the product works. Content-led growth through blog, Substack, and social. Every piece of content is also potential course material (P8: documentation is product).

The goal is to reach L2 Distribution first (d-content producing regular content), then L2 Conversion (free funnel live). Expansion is a Phase 2+ concern.

## Anti-Killability

| Threat | Why We Survive |
|--------|---------------|
| AI-generated content penalized by Google | Diversified channels. Content quality matters, not AI detection. Our content passes voice.md. |
| Substack/LinkedIn limit AI content | Our content is human-reviewed, voice.md-compliant. It's good writing, not AI slop. |
| Competitor copies our content strategy | Strategy-docs-as-code is hard to copy without the full decisions/ + skills infrastructure. |
| Paid ads become mandatory for growth | Organic-first means we have a content moat. Ads amplify what already works. |
