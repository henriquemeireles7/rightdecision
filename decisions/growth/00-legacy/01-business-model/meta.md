# META-DOC: Business Model v3

## Purpose
Define the two-product business model for The Right Decision: Life Decisions (B2C, $197/year) and Business Decisions (B2B, $1,997/year). Who we sell to, what we sell, at what price, through what channel, how money flows, and how the two products relate.

## Scope
**This document IS:** The operational business model for both products — personas, pricing, distribution, revenue, cross-sell, and the flywheel.
**This document is NOT:** A manifesto (doc #2). A course outline (doc #4). A pitch deck. Individual product architecture (see lifedecisions.md and businessdecisions.md).

## Primary reader
The founders (Henry + Indy) as operators. AI agents as implementers. Future investors as context.

## Input documents
- `decisions/01-business-model/input.md` — structured d-input from founder conversation (v3)
- `decisions/01-business-model/raw.md` — raw brain dump from conversation
- `decisions/01-business-model/legacy/document.md` — v2 business model (single product)
- `decisions/001-architecture.md` — tech stack, DSA architecture
- `decisions/lifedecisions.md` — Life Decisions product reference
- `decisions/businessdecisions.md` — Business Decisions product reference

## Expert council
1. **Alex Osterwalder** (Business Model Canvas) — structural completeness for multi-product model
2. **Ash Maurya** (Lean Canvas) — startup-focused, problem/solution for each product
3. **Alex Hormozi** ($100M Offers) — value equation per tier, pricing psychology for $197 vs $1,997
4. **Y Combinator** — one-liner discipline for two-product positioning
5. **Christensen/Moesta** (JTBD) — what job does each persona hire each product to do?
6. **Patrick Campbell** (ProfitWell) — multi-tier SaaS pricing, cross-sell mechanics

## Research summary
**Layer 1 (Established):** Multi-tier infobusiness models (course + high-ticket coaching is standard). Price anchoring between tiers drives conversions on both ends.

**Layer 2 (Trending):** AI-native product delivery via Claude skills/MCP is emerging (2025-2026). "Vibe coding" as a product category for non-tech founders. Agent-first platforms replacing SaaS dashboards.

**Layer 3 (First principles):** Two products sharing one methodology, one platform, one codebase. The B2B product IS the internal tooling, productized. Dogfooding at the strategy level.

## Document-level failure modes
1. **Two products that confuse the market.** If a stranger can't instantly understand the difference, the positioning has failed.
2. **Cannibalization between tiers.** If Life Decisions customers feel they need Business Decisions, or Business Decisions customers feel they're overpaying.
3. **Building B2B before B2C is validated.** Life Decisions must prove the methodology works before selling it as a business-building tool.
4. **Underpricing Business Decisions.** At $1,997/year with infrastructure costs per customer, margins could be thin.
5. **Over-scoping Business Decisions MVP.** The temptation to build "everything" before launching.

## Sections

### SECTION 1: One-Liner
**Answers:** What does Right Decision do in one sentence, covering both products?
**Done when:** A stranger reads it and can explain both products back.
**Max length:** 2-3 sentences

### SECTION 2: Customer + Problem (per persona)
**Answers:** Who are the three personas, what are their problems, what do they do today?
**Done when:** You can name 3 real humans per persona who match.
**Max length:** 1 page per persona

### SECTION 3: Solution + Mechanism (per product)
**Answers:** How does each product work? What's the delivery mechanism (skills, APIs)?
**Done when:** An engineer could build both MVPs from this section.
**Max length:** 2 pages per product

### SECTION 4: Offer + Value Equation (per tier)
**Answers:** What's included at each price, why is each a steal?
**Done when:** The Hormozi value equation scores >7 for both tiers.
**Max length:** 1 page per tier

### SECTION 5: Revenue Model + Cross-Sell
**Answers:** How do both revenue streams work? How do customers move between tiers?
**Done when:** Unit economics work for both products independently.
**Max length:** 2 pages

### SECTION 6: Distribution + Funnel
**Answers:** How do customers discover each product? Free course funnel mechanics.
**Done when:** Full funnel from impression to purchase for each tier.
**Max length:** 2 pages

### SECTION 7: The Flywheel
**Answers:** How does the system compound? B2B clients building the same funnel.
**Done when:** The flywheel diagram is self-explanatory.
**Max length:** 1 page

### SECTION 8: Open Questions + Validation Plan
**Answers:** What don't we know yet? Storage, multi-tenancy, skill distribution.
**Done when:** Each open question has a cheapest-test defined.
**Max length:** 1 page
