# META-DOC: Landing Page Strategy

## Purpose
Define every section, every piece of copy, and the implementation specs for the sales page that converts visitors into $197/year subscribers. This document is what a developer and copywriter use to build the page.

## Scope
**This document IS:** The complete landing page — copy, structure, conversion sequence, and technical specs.
**This document is NOT:** The manifesto (doc #2, which feeds copy into this). Not a design mockup (DESIGN.md covers aesthetics). Not a traffic strategy (that's doc #7+).

## Primary reader
Henry (builds the page), future copywriters (refine the copy), AI agents (implement).

## Input documents
- `decisions/02-manifesto/document.md` — voice, hooks, objection map, seven angles, promise
- `decisions/01-business-model/document.md` — pricing, ICP, offer, value equation
- `decisions/04-course-outline/document.md` — module list, 3-act structure, ~23 hours
- `decisions/03-methodology/document.md` — the Decision Cycle, 8 phases
- `DESIGN.md` — Ethereal Warmth aesthetic, Instrument Serif + Sans, warm palette
- `decisions/human.md` — writing rules, voice, engagement techniques

## Research summary
**Layer 1:** High-converting sales pages follow: relevance → mechanism → confidence → action. Average conversion 2-6%, high performers 10%+. Curriculum breakdown and risk reversal near the price are standard.

**Layer 2:** 2026 trends: founder story as standalone section (not buried in testimonials), negative disqualification ("this is NOT for..."), mobile-first section prioritization, mid-page CTAs at every decision point.

**Layer 3:** For this ICP (women burned by self-help), trust signals matter more than urgency. Guarantee must be visible near price, not buried. Price anchoring starts in the problem section (what she's already spent), not at the offer.

## Sections

### SECTION 1: Hero
**Answers:** What is this? Who is it for? What do I do next?
**Done when:** A stranger understands the product in 5 seconds of scanning.
**Confidence:** 🟢 (promise lines exist in manifesto)

### SECTION 2: Problem + Price Anchoring
**Answers:** Her world in her words. What she's tried. What it cost her. Why it didn't work.
**Done when:** She thinks "this person knows exactly what I'm going through." Price anchoring planted: she's already spent $3K-5K on things that didn't work.
**Confidence:** 🟢 (VoC captured in manifesto input)

### SECTION 3: Mechanism (insight-first, not framework-first)
**Answers:** Why this is different. Lead with the INSIGHT ("you don't have an information problem, you have a decision problem"), then show the system.
**Done when:** She understands HOW it works without jargon.
**Confidence:** 🟡

### SECTION 4: Transformation
**Answers:** What does her life look like AFTER? The Tuesday. The specific changes. Before/after contrast.
**Done when:** She can see her future self using this product.
**Confidence:** 🟡

### SECTION 5: Curriculum
**Answers:** What does she get? Module by module. What she can DO after each act.
**Done when:** She scans module titles and thinks "that's exactly my problem."
**Confidence:** 🟢 (course outline is complete)

### SECTION 6: Founder Story
**Answers:** Who made this and why? Henry + Indy's specific moment. Why they're credible.
**Done when:** She trusts the founders more after reading than before.
**Confidence:** 🟢 (origin stories captured in raw.md)

### SECTION 7: Social Proof (launch version)
**Answers:** Does this work? What evidence exists?
**Done when:** She sees enough trust signals to reduce purchase anxiety. Launch version: founder results, beta signals, methodology validation. Post-launch: real testimonials.
**Confidence:** 🔴 (no customers yet)

### SECTION 8: Offer Stack + Risk Reversal
**Answers:** Everything included. Price. Guarantee (7-day money back). Comparison to alternatives.
**Done when:** $197/year feels like an obvious deal after seeing what therapy/coaching costs.
**Confidence:** 🟡

### SECTION 9: Disqualification
**Answers:** Who this is NOT for. Creates belonging for the people who stay.
**Done when:** The wrong buyers leave. The right buyers feel "this is for me."
**Confidence:** 🟡

### SECTION 10: FAQ (logistical only)
**Answers:** Practical questions: refund, time commitment, tech requirements, what happens after Year 1.
**Done when:** No unanswered logistical question remains.
**Confidence:** 🟢 (objection map in manifesto)

### SECTION 11: Final CTA
**Answers:** Last push. Urgency mechanism. Closing statement.
**Done when:** A ready buyer clicks. A hesitant buyer knows the guarantee exists.
**Confidence:** 🟡

### SECTION 12: Implementation Specs
**Answers:** Components, responsive strategy, Stripe integration, CTA placement map, mobile-first priorities, launch vs post-launch variants.
**Done when:** A developer can build the page from this section without asking questions.
**Confidence:** 🟢

## Quality checklist
- [ ] Hero communicates what/who/action in under 5 seconds
- [ ] Price anchoring appears BEFORE the offer (in the Problem section)
- [ ] Mechanism leads with insight, not framework
- [ ] Transformation section paints a specific Tuesday, not a vague promise
- [ ] Curriculum shows module titles that match her problems
- [ ] Founder story is standalone, not buried in social proof
- [ ] Guarantee is visible next to the price, not at the bottom
- [ ] "Not for" disqualification section exists
- [ ] CTA appears at minimum 4 times (hero, after mechanism, after offer, final)
- [ ] Implementation specs include mobile section prioritization
- [ ] Launch version addresses the zero-testimonials reality

## Reader journey
**After this document:** Build the page. Then write the VSL (doc #6) which is the video version of this page.
