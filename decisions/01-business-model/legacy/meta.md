# META-DOC: Business Model

## Purpose
Define who Right Decision sells to, what we sell, at what price, through what channel, and how money flows. This document unblocks every other strategy document (manifesto, course outline, landing page, pitch deck).

## Scope
**This document IS:** The operational business model — one product, one customer, one revenue stream, one distribution strategy. Enough to execute from.
**This document is NOT:** A manifesto (doc #2). A course outline (doc #4). A pitch deck (doc #19). Financial projections beyond Year 1. A marketing plan.

## Primary reader
The founders (Henry + Indy) as operators. AI agents as implementers. Future investors as context.

## Input documents
- `decisions/001-architecture.md` — tech stack, DSA architecture, Railway deployment
- `DESIGN.md` — visual identity (Ethereal Warmth, Instrument Serif + Sans)
- Prior /office-hours sessions — ICP validation, BJ Fogg model, goal→decisions→actions taxonomy

## Expert council
1. **Alex Osterwalder** (Business Model Canvas) — structural completeness check. Ensure no block is missing.
2. **Ash Maurya** (Lean Canvas) — startup-focused. Problem and solution front and center, not partners.
3. **Alex Hormozi** ($100M Offers) — value equation: Value = (Dream Outcome x Likelihood) / (Time x Effort). Pricing psychology.
4. **Y Combinator** — one-liner discipline. If you can't say it in one sentence, you don't understand your business.
5. **Christensen/Moesta** (JTBD) — what job does the customer hire this product to do?

## Research summary
**Layer 1 (Established):** Business Model Canvas (9 blocks) and Lean Canvas (startup variant) are the standards. Hormozi's value equation is the infobusiness pricing framework. For course businesses, the unit economics are: CAC < LTV, payback period < 90 days.

**Layer 2 (Trending):** Course-to-SaaS hybrid is the 2026 model: teach the methodology, then productize it as AI. Vertical AI agents have 3-5x higher retention than horizontal tools. "Outcome as a Service" billing is replacing seat-based SaaS.

**Layer 3 (First principles):** A business model doc for a solo founder + AI needs to be OPERATIONAL: "What do I build this week, who do I sell it to, and how does money move?" Traditional canvases are too abstract.

**Adjacent wisdom:** Stand-up comedy — comedian tours (live methodology), records the special (course), the special sells future tours. The course IS the marketing for the platform.

## Document-level failure modes
1. **Too abstract — no specific numbers.** Says "millennial women" instead of naming 3 real people. Says "high value" instead of "$197/year."
2. **Built for investors, not operators.** Reads like a pitch deck instead of a build plan. Pretty slides, no actionable instructions.
3. **Assumes the customer segment without validating it.** The ICP is a hypothesis until 10 people have paid.
4. **Ignores Year 2.** Models acquisition but not retention. At $197/year, churn is the whole game.
5. **Two products pretending to be one.** Bundles course + AI without articulating why they belong together and what happens when someone finishes the course in month 2.

## Sections

### SECTION 1: One-Liner
**Answers:** What does Right Decision do in one sentence?
**Done when:** A stranger reads it and can explain the business back to you without a follow-up question.
**Failure modes:**
- Too vague: "We help people make better decisions" (what people? how? for what price?)
- Too long: More than 2 sentences means you don't understand your business yet
- Jargon: Uses terms like "goal decomposition" that civilians don't understand
**Max length:** 2-3 sentences
**Confidence:** 🟡 hypothesis

### SECTION 2: Customer + Problem (merged)
**Answers:** Who is the customer, what is their "hair on fire" problem, and what is the status quo they live with today?
**Done when:** You can name 3 real humans who match the ICP AND have confirmed the problem exists in their own words. At least 1 has said "I would pay for that."
**Failure modes:**
- Demographic instead of person: "Women 30-50" vs "Luana, 34, opened a hair salon but can't grow it"
- Problem is aspirational, not painful: "They want to grow" vs "They've spent $3K on courses and are still stuck"
- Status quo is missing: Must describe what the customer does TODAY, not what they wish they did
**Max length:** 1-2 pages
**Confidence:** 🟡 hypothesis (validated informally through friends, not through paying customers)

### SECTION 3: Solution + Mechanism
**Answers:** What do we sell and HOW does it work? The mechanism that makes this different from every other "get unstuck" product.
**Done when:** An engineer could build the MVP from this section. A customer could understand why this works differently.
**Failure modes:**
- Describes features instead of mechanism: "7 modules + AI prompts" vs "Goals→Decisions→Actions decomposition"
- No contrast with alternatives: Must explain why therapy/coaching/self-help DOESN'T work and why this DOES
- Conflates the course with the AI platform — they serve different BJ Fogg levers (motivation vs ability)
**Max length:** 2-3 pages
**Confidence:** 🟡 hypothesis

### SECTION 4: Offer + Value Equation (merged)
**Answers:** What's included, what's not, why is $197/year a steal, and how does the Hormozi value equation apply?
**Done when:** Someone reads the offer and thinks "that's obviously worth more than $197."
**Failure modes:**
- Lists features instead of outcomes: "7 modules" vs "Make the decision you've been avoiding for 2 years"
- Doesn't address objections: "Why yearly not monthly?" "Can I get a refund?" "What if the AI sucks?"
- No comparison anchor: Must contrast with alternatives ($200/hour coaching, $2K mastermind, free ChatGPT)
**Max length:** 2 pages
**Confidence:** 🔴 guess (price not validated with paying customers)

### SECTION 5: Revenue Model + Unit Economics (merged)
**Answers:** How does money flow? Pricing, billing, refund policy, CAC, LTV, payback period, path to $100K.
**Done when:** You can calculate: "To hit $100K, we need X customers, which requires Y impressions at Z% conversion."
**Failure modes:**
- Revenue without costs: Must include Stripe fees (~3%), infrastructure costs, content production time
- Conversion rates are made up: Use conservative estimates (1% landing→sale for cold, 5% for warm)
- Ignores churn: Must model Year 2 renewal rate and what drives it
**Max length:** 2 pages with actual math
**Confidence:** 🔴 guess (no revenue data yet)

### SECTION 6: Distribution + Funnel Math
**Answers:** How do customers find us? What's the funnel from awareness to purchase? What are the specific numbers?
**Done when:** You can trace: "[Platform] → [Content type] → [Landing page] → [Checkout] → [Purchase]" with conversion rates at each step.
**Failure modes:**
- "We'll use social media" without specifying which platform, what content, how often, or what reach exists today
- No distinction between Phase 1 (organic, Indy's socials) and Phase 2 (paid, after revenue validates)
- Doesn't calculate: How many followers/impressions does Indy need to generate 508 sales at $197?
**Max length:** 2 pages
**Confidence:** 🔴 guess (no distribution data yet)

### SECTION 7: Retention + Year 2
**Answers:** Why does someone renew? What does the product do in months 3-12 after the course is finished? What's the churn prediction?
**Done when:** You can articulate the Year 2 value proposition as clearly as the Year 1 value proposition.
**Failure modes:**
- "They'll keep using the AI" without defining what "using" means for someone who already completed their goals
- No community or ongoing value beyond the initial course content
- Ignores the fundamental tension: anti-dependency product that charges annually
**Max length:** 1-2 pages
**Confidence:** 🔴 guess

### SECTION 8: Team + Founder Roles
**Answers:** Who does what? What happens if one founder can't work? What's the decision-making structure?
**Done when:** A third party can tell who owns what. Handoff scenarios are addressed.
**Failure modes:**
- Vague: "We both do everything" — that fails at scale and during conflict
- Doesn't address: What if Indy stops creating content? What if Henry gets pulled into another project?
- No equity/compensation structure mentioned (even if deferred)
**Max length:** 1 page
**Confidence:** 🟢 validated (founders have discussed roles)

### SECTION 9: Competitive Positioning
**Answers:** Why Right Decision and not the 10,000 other "get unstuck" products? What's defensible?
**Done when:** A customer choosing between Right Decision and a competitor can articulate the difference in one sentence.
**Failure modes:**
- "We're better" without saying HOW — must name specific competitors and specific differences
- Moat is the founders' story (not scalable) vs the AI platform (scalable but not built yet)
- Ignores that most competitors are free (YouTube coaches, free ChatGPT)
**Max length:** 1-2 pages
**Confidence:** 🟡 hypothesis

### SECTION 10: Assumptions + Validation Plan
**Answers:** What do we think we know that might be wrong? What's the cheapest test for each assumption?
**Done when:** Every major claim in this document has a confidence tag AND a validation method.
**Failure modes:**
- Assumptions are hidden in prose instead of listed explicitly
- No validation timeline: "We'll test this eventually" vs "We'll test this in Week 1 by doing X"
- Confirmation bias: Only testing assumptions you think are true, not the ones you're afraid are false
**Max length:** 1 page (table format)
**Confidence:** 🟢 validated (this section is structural, not content-dependent)

## Quality checklist
- [ ] A stranger can read the one-liner and understand the business without a follow-up question
- [ ] The ICP names at least 3 real humans (not demographic categories) who confirmed the problem
- [ ] Revenue model shows specific math: X customers at $Y = $Z, requiring W impressions at V% conversion
- [ ] Unit economics include CAC, LTV, churn estimate, and Stripe/infra costs
- [ ] Every section has specific numbers, not vague claims ("high value," "many customers," "strong demand")
- [ ] The document explicitly states what Right Decision does NOT do and does NOT sell
- [ ] Year 2 retention has its own section with a clear value proposition for renewal
- [ ] Distribution plan calculates required reach/followers to hit $100K
- [ ] Assumptions are listed in a table with confidence levels and validation methods
- [ ] The Hormozi value equation is applied with specific scores, not just mentioned

## Assumptions registry
| Assumption | Confidence | Signal that proves it wrong |
|---|---|---|
| Millennial women 30-50 are the right ICP | hypothesis | First 50 customers skew male, younger, or older |
| $197/year is the right price point | guess | Conversion rate below 1% from warm traffic |
| Annual billing works (vs monthly) | guess | >50% of checkout abandonment at payment step |
| Organic distribution (Indy's socials) can generate 500+ sales | guess | <5K followers after 3 months of consistent posting |
| Course + AI platform belong in one product | hypothesis | Users complete course and never open the AI tool |
| The goal→decisions→actions framework is differentiated | hypothesis | Customer interviews show they can't distinguish it from other coaching |
| AI adds value vs human coaching for this ICP | guess | Users prefer WhatsApp with Indy over the AI tool |

## Adversarial review summary
Adversarial review (Claude subagent) flagged 9 issues. Key resolutions:
- **Retention section added** (was missing entirely — HIGH severity)
- **Funnel math required** in distribution section (was vague — HIGH severity)
- **Customer + Problem merged** (were redundant)
- **Value Equation + Offer merged** (were redundant)
- **Revenue + Unit Economics merged** (naturally connected)
- **Assumptions section added** with validation methods (was missing — HIGH severity)
- **Team section added** for founder risk (MEDIUM severity)
- **"Done when" criteria tightened** across all sections

## Reader journey
**After this document:** Write the Manifesto (doc #2) — the copy framework needs the business model as input.
**Last section should bridge to:** The assumptions registry feeds directly into the Manifesto's tone and claims. Whatever we can't validate yet, the Manifesto should be honest about.

## Decision log
| Date | Decision | Why | Watch signal |
|---|---|---|---|
| 2026-04-04 | One product (course + AI bundled), yearly subscription | Simplifies pricing, forces retention thinking | If churn > 50% Y1, reconsider unbundling |
| 2026-04-04 | Company name: Right Decision | Architecture doc uses this name | Update all references in codebase |
| 2026-04-04 | Wife (Indy) is co-founder handling distribution | She has the audience relationship and content skills | If content production stalls, need Plan B |
| 2026-04-04 | 10 sections (merged from original 10 based on adversarial review) | Reduced redundancy, added retention + validation | If sections still overlap during d-plan, merge further |
