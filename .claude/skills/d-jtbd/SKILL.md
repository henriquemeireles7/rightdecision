---
name: d-jtbd
description: "Jobs-to-be-Done analysis before building features. Maps struggling moments, forces of progress, and underserved outcomes. Triggers: 'd-jtbd', 'jobs to be done', 'validate demand', 'what should we build', 'JTBD'."
---

# d-jtbd — Jobs-to-be-Done Analysis

## What this does
Produces a structured JTBD document that maps the exact jobs customers are hiring a solution
for — functional, emotional, and social. Run this BEFORE building any major feature to
validate demand and choose the right features. Every PRD feature must trace back to a finding here.

## Pipeline
**d-jtbd** → d-prd → d-tasks → d-code → d-review → /ship

## When to run
- Before any major feature or product area (e.g., "Life Decisions V1", "Business Decisions onboarding")
- When questioning whether a feature is worth building
- When pivoting or expanding scope

## Frameworks
- **Primary:** Moesta qualitative Switch framework (struggling moments, forces of progress, hiring/firing criteria)
- **Supplementary:** Ulwick outcome statements (job map decomposition, importance/satisfaction scoring)

## Context Loading
1. Read `decisions/company.md` — product, ICP, positioning
2. Read `decisions/lifedecisions.md` or `decisions/businessdecisions.md` — product context
3. Read any existing methodology docs (e.g., `decisions/lifedecisions/03-methodology/document.md`)
4. Read any prior JTBD docs for this product area
5. Read `decisions/voice.md` — understand the customer language

## Process

### Step 1: Identify the Product Area
Ask the user: What product area or feature set are we analyzing?
Examples: "Life Decisions V1", "Business Decisions automation APIs", "Wins Board"

### Step 2: Define Struggling Moments
**Question to explore:** What threshold crossing creates demand?

Identify 2-4 customer segments by struggling moment (not demographics):
- What specific discomfort just crossed the threshold?
- What made them go from "I should" to "I need to find a solution NOW"?
- What forms does the trigger take? (life event, accumulation, mirror moment, body signals)

For each segment, define:
- The struggling moment (situation, not person)
- The threshold state (intensity matters, not form)
- Product implications

### Step 3: Map Forces of Progress
For each segment, map the four forces:

| Force | Description | Product implication |
|-------|-------------|---------------------|
| **Push** (away from status quo) | What pain is pushing them to seek change? | |
| **Pull** (toward new solution) | What attracts them to our solution? | |
| **Anxiety** (fear of new) | What fears prevent them from switching? | |
| **Habit** (comfort of status quo) | What keeps them doing what they're doing? | |

**Critical:** Anxiety is often the biggest barrier. The product must structurally reduce it.

### Step 4: Define Jobs (Functional, Emotional, Social)

**Functional jobs:** What tasks are they trying to accomplish?
Format: "When [situation], I want to [action], so I can [outcome]."

**Emotional jobs:** How do they want to feel?
Format: "I want to feel [emotion] — not [current emotion]."

**Social jobs:** How do they want to be perceived?
Format: "I want to be seen as [identity] — not [current perception]."

### Step 5: Map the Job Chain
Walk through the customer journey phases:
1. **Awareness** — How do they realize they need a solution?
2. **Evaluation** — How do they compare solutions?
3. **Purchase** — What reduces purchase anxiety?
4. **Onboarding** — What's their first experience?
5. **Use** — How do they use the product daily/weekly?
6. **Resolution** — How do they know they're done?

For each phase: what's the job, what could go wrong, what's the product implication.

### Step 6: Generate Outcome Statements (Ulwick)
For each functional job, generate outcome statements:
"Minimize the [time/likelihood/effort] of [undesired outcome] when [circumstance]"

Rate each: Importance (1-10) × Satisfaction with current solutions (1-10)
**Opportunity = Importance + max(Importance - Satisfaction, 0)**
High opportunity = underserved outcomes = features to build.

### Step 7: Create "Don't Build" List
Features that CONTRADICT the jobs identified:
- If the emotional job is "doing the real work myself" → don't build AI that decides for them
- If the functional job is "minimize preparation time" → don't build dashboards/tracking
- Each item: what NOT to build, why it contradicts the job, JTBD reference

### Step 8: Rate Confidence
Every finding gets a confidence tag:
- 🟢 **validated** — confirmed by multiple sources or customer data
- 🟡 **hypothesis** — reasonable inference from founder experience
- 🔴 **guess** — speculative, needs customer validation

Pre-revenue products: almost everything is 🟡 or 🔴. That's OK — the JTBD makes hypotheses explicit.

## Output Format
Produce a structured document in `decisions/<product>/NN-jobs-to-be-done/document.md` with:
1. Overview + research context
2. Customer segments by struggling moment
3. Core jobs (functional, emotional, social)
4. Forces of progress (push, pull, anxiety, habit)
5. Hiring/firing criteria (what makes them choose us vs alternatives)
6. Job chain (awareness → resolution)
7. Outcome statements with opportunity scores
8. "Don't build" list
9. Success metrics + validation plan
10. PRD implications per section

**Every section ends with "PRD implications" — the product decisions this finding demands.**

## Interaction Style
This skill is INTERACTIVE. It asks the founder forcing questions:
- Provide 3-4 specific answer options (not just "describe your thinking")
- Use the founder's own language and examples
- Challenge assumptions: "You said X, but that contradicts Y — which is true?"
- Push for specificity: "Who exactly? When exactly? What happened right before?"

## Rules
- NEVER skip the confidence rating — every finding must be tagged
- NEVER present hypotheses as facts — all pre-revenue findings are hypotheses
- ALWAYS trace findings back to a source (founder experience, market research, assumption)
- ALWAYS end each section with PRD implications
- ALWAYS produce a "don't build" list — it's as important as what TO build
- The JTBD document is solution-agnostic — describe the JOB, not our product
- Use d-meta → d-input → d-docs pipeline internally for document structure
- After saving, auto-commit and push all changed files. These are non-code docs — they can't break anything.
