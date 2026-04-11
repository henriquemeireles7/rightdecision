# META-DOC: Jobs-to-be-Done (Life Decisions Software)

## Purpose
Map the exact jobs our customers are hiring a solution for — functional, emotional, and social. This document feeds directly into the PRD: every feature requirement must trace back to a job or underserved outcome documented here. No traceability = no feature.

## Scope
**This document IS:** A JTBD analysis using Moesta's qualitative Switch framework as the primary lens, with Ulwick's structured job mapping and outcome statements as supplementary rigor. Applied specifically to the Life Decisions product ($197/year course + Claude skills).
**This document is NOT:** A PRD (that's the next document). Not the methodology itself (that's doc 03). Not marketing copy. Not a user research plan.
**Scope boundary:** Life Decisions B2C product only. Business Decisions B2B has its own JTBD (separate document later).
**Research status:** ALL findings are hypotheses. We are pre-revenue with no customer interviews. Every section must carry explicit confidence tags. The PRD inherits these confidence levels — speculation must not be treated as validated insight.

## Primary reader
Henry (to build the right software), Indy (to validate the customer understanding), AI agents (to implement features mapped to jobs).

## Input documents
- `decisions/lifedecisions.md` — product context, ICP, architecture
- `decisions/company.md` — positioning, personas, core thesis
- `decisions/lifedecisions/03-methodology/document.md` — the methodology the product delivers
- `decisions/02-manifesto/document.md` — enemy framing, customer language
- `decisions/voice.md` — how we talk to customers

## Expert council
1. **Bob Moesta** (Switch / Demand-Side JTBD) — primary framework. Forces of progress, hiring/firing, switch interviews. The qualitative depth for understanding why people switch. Best fit for pre-revenue, no customer data.
2. **Tony Ulwick** (Outcome-Driven Innovation) — supplementary structure. Job mapping, outcome statements, opportunity scoring. Provides the systematic decomposition framework.
3. **Clayton Christensen** (original JTBD theory) — "milkshake" reframing of competition. Non-obvious competitors for the same job. The strategic lens.
4. **BJ Fogg** (Tiny Habits / Behavior Design) — the behavioral gap between wanting and doing. Our customers are "stuck" — JTBD tells us what they want, Fogg explains why they repeatedly fail to act. Critical for a product that fights habit and identity.
5. **Indi Young** (Mental Model Mapping) — deep empathy research for the actual ICP. Mental model mapping captures the customer's thought process and emotional sequence, not just the job they articulate. Essential for understanding women 30-50 who've "done the work."

## Document-level failure modes
1. **Demographics disguised as jobs.** "Women 30-50 want..." is persona thinking, not JTBD. Jobs must be situation-based: "When someone has been circling a decision for 3+ months..."
2. **Too abstract.** "Make better life decisions" is a mission statement, not a job. Must reach actionable altitude: specific enough to design features against.
3. **Functional only.** Missing emotional/social jobs means missing the real purchase triggers. "Feel confident" and "avoid looking indecisive" often outweigh "get a structured process."
4. **Solution-contaminated.** Job statements that reference our product ("use Claude skills to...") are tasks, not jobs. Jobs exist independent of our solution.
5. **No connection to product.** A beautiful JTBD analysis that doesn't map to what we build is academic exercise. Every section must end with implications for the PRD.
6. **Ignoring non-consumption.** The biggest competitor is "do nothing." Must document why doing nothing is so sticky.
7. **Franken-framework.** Mixing Moesta and Ulwick without acknowledging their tensions. Moesta is primary (qualitative, contextual). Ulwick is supplementary (structure, measurement). Don't bolt quantitative rigor onto qualitative insights without reconciliation.
8. **Treating hypotheses as facts.** Pre-revenue = everything is a guess. The template must force explicit confidence marking. The PRD must inherit these uncertainty levels.

## Sections

### SECTION 1: Overview — Research Context
**Answers:** What is this document? What JTBD methodology did we use (and why)? What is the research status (hypothesis vs validated)? How do findings feed into the PRD?
**Done when:** A reader knows the method, scope, confidence level, and how to use this document's findings. Explicitly states: "All findings are hypotheses until validated by customer research."
**Failure modes:**
- Methodology lecture: explaining JTBD theory instead of applying it
- No "so what": doesn't explain how findings connect to product decisions
- Missing confidence framing: reader assumes findings are validated
**Max length:** 1 page
**Confidence:** 🟢 validated

### SECTION 2: Customer Segments by Struggling Moment
**Answers:** Who are our customers, segmented by the situation that triggers the need — not demographics. What "struggling moments" create demand? What progress are they trying to make? What's the specific event (not general dissatisfaction) that moves them from passive to active?
**Done when:** 2-4 situation-based segments are named, each with: specific trigger event, what progress looks like, current workarounds, and why workarounds fail. Each segment should feel like a person you could point to, not a marketing abstraction.
**Failure modes:**
- Demographic segmentation: "Women 30-50" instead of "People who've been circling a decision for 3+ months after a specific life event"
- Too many segments: more than 4 means we haven't found the pattern
- Missing the struggling moment: no specific trigger, just general dissatisfaction
- Persona contamination: forcing JTBD segments to match existing personas instead of letting jobs define segments
**Max length:** 2-3 pages
**Confidence:** 🟡 hypothesis

### SECTION 3: Main Job Statements + Job Hierarchy
**Answers:** The 1-3 core jobs our customers are hiring a solution for. Each stated in Moesta's job story format: "When [situation], I want to [motivation], so I can [outcome]." Each job has functional, emotional, and social dimensions documented together (not in a separate section). Plus the hierarchy: Big Hire (the transformation — what drives acquisition) vs Little Hire (the daily use — what drives retention).
**Done when:** Jobs are solution-agnostic, stable over time, at the right altitude (not too abstract, not too granular). Each has all three dimensions. Big Hire and Little Hire are explicitly distinguished with what product decisions each drives.
**Failure modes:**
- Solution-specific: "When I'm stuck, I want a Claude skill..." — that's our product, not the job
- Too high: "I want a better life" (every product claims this)
- Too low: "I want to fill out a worksheet" (that's a task within our solution)
- Missing hierarchy: only documenting the Big Hire (transformation) without the Little Hire (daily engagement)
- Emotional/social as afterthought: functional job gets a paragraph, emotional gets a bullet
**Max length:** 2-3 pages
**Confidence:** 🟡 hypothesis

### SECTION 4: Forces of Progress + Switching Timeline
**Answers:** The four forces acting on every potential customer: Push (pain with current situation), Pull (attraction of our solution), Anxiety (fear of trying something new), Habit (comfort with current coping). Which forces dominate? What's the strategic implication? Plus: the switching timeline from first thought → passive looking → active looking → deciding → consuming. What specific events move someone between stages? What are the hiring triggers and firing triggers?
**Done when:** Each force has 3-5 specific items with evidence rationale. Hiring triggers and firing triggers are documented independently (they are NOT inverses). Net assessment determines product strategy. Timeline shows the journey with specific event transitions.
**Failure modes:**
- Only documenting Push and Pull (the flattering forces) while ignoring Anxiety and Habit
- Generic forces: "they're frustrated" without specifics
- No strategic implication: forces documented but not connected to what we build
- Underestimating Habit: "doing nothing" is always stronger than teams expect
- Assuming hiring/firing symmetry: "they hire for structure, fire for lack of structure"
- No timeline: treating the switch as a single moment instead of a journey
**Max length:** 3-4 pages
**Confidence:** 🟡 hypothesis

### SECTION 5: Competitive Landscape (by Job, Not Category)
**Answers:** What solutions are customers currently "hiring" for the same jobs? Include: therapy, coaching, self-help books, journaling, productivity tools, talking to friends, doing nothing. For anti-self-help positioning: specifically WHY they fire the self-help category (the "self-help graveyard" — solutions they've tried and abandoned). What job did those previous solutions fail at?
**Done when:** 5-8 alternatives mapped, including "do nothing." Each has: what job it addresses, what it does well, where it fails, and why customers fire it. "Do nothing" gets equal treatment — why it's sticky, what it costs, and what breaks the habit. The self-help graveyard section explains category-level fatigue.
**Failure modes:**
- Category-only competition: only listing other decision frameworks
- Missing "do nothing": the most common competitor, always the stickiest
- Missing the graveyard: not understanding why customers have fired previous self-help solutions (this IS our positioning)
- No firing reasons: just listing alternatives without why they fail
- Flattering self-assessment: our product beats everything (unrealistic and unhelpful)
**Max length:** 3-4 pages
**Confidence:** 🟡 hypothesis

### SECTION 6: Job Map
**Answers:** How does the main job decompose into steps? Using Ulwick's 8-step framework adapted through Moesta's qualitative lens: Define, Locate, Prepare, Confirm, Execute, Monitor, Modify, Conclude. What is the customer doing at each step today? What solutions do they use? Where is the friction? Which steps are psychologically hardest (not just functionally hardest)?
**Done when:** Each relevant step has: what the customer does, what solution they currently use, functional friction, emotional weight, and time typically spent. Steps that don't apply are explicitly marked as N/A with reasoning.
**Failure modes:**
- Forcing all 8 steps when some don't apply
- Too generic: steps that could apply to any job, not specifically to life decisions
- No current-solution mapping: steps without "what they do today" are useless for product design
- Missing emotional weight: some steps are psychologically harder than others (e.g., Confirm may be where all the anxiety lives)
- Our methodology mapped as the job map: the job map is the CUSTOMER's process, not our methodology's phases
**Max length:** 3-4 pages
**Confidence:** 🟡 hypothesis

### SECTION 7: Outcome Statements
**Answers:** What does success look like at each job map step? Using Ulwick's format adapted for qualitative use: "Minimize the time it takes to...", "Minimize the likelihood of...", "Increase the likelihood of..." Prioritized by hypothesized importance and current satisfaction.
**Done when:** 5-8 outcome statements per relevant job step. Each is solution-agnostic, single-metric, directional. Underserved outcomes (high importance, low satisfaction) are flagged as primary product opportunities. Includes a simple importance/satisfaction assessment even if qualitative (High/Med/Low).
**Failure modes:**
- Feature-disguised-as-outcome: "Minimize the time to open the app" is a feature, not an outcome
- Too many per step: more than 8 means wrong altitude
- No prioritization: all outcomes treated as equal
- Unmeasurable: "Increase happiness" (can't evaluate even conceptually)
- Quantitative precision without data: assigning numbers without actual research
**Max length:** 4-5 pages
**Confidence:** 🔴 guess (first time applying this rigor without customer data)

### SECTION 8: Two Modalities — Learning Job vs Doing Job
**Answers:** The course and the AI skills serve fundamentally different jobs. The course is a "teach me" job (consumption chain: find → evaluate → learn → integrate). The AI skill is a "do it with me" job (consumption chain: set up → engage → process → output → reflect). Where is manual process the VALUE (reflection, clarity, ownership)? Where is manual process FRICTION (analysis, organization, synthesis)? This distinction determines where AI should and shouldn't appear.
**Done when:** Each modality has its own mini-job-map, its own success criteria, and its own competitive set. The manual-vs-AI boundary is drawn with clear reasoning: "manual here because X, AI here because Y."
**Failure modes:**
- Treating course and skills as one product with one job
- Not distinguishing where manual is pedagogically valuable vs where it's just friction
- AI everywhere: assuming AI should assist every step (undermines manual-first philosophy)
- AI nowhere: assuming manual-first means no AI assistance (misses the product differentiator)
**Max length:** 2-3 pages
**Confidence:** 🔴 guess

### SECTION 9: Implications for PRD
**Answers:** The "so what" section. What are the top underserved outcomes we must address in MVP? What emotional/social jobs must the UX honor? What anxiety must V1 reduce? What features are demanded by the JTBD analysis? What features we think we need but JTBD says are irrelevant? What should we explicitly NOT build?
**Done when:** A product designer reading this section has: (1) A prioritized list of top 5 outcomes to address, each traced to a specific job/section. (2) UX principles derived from emotional/social jobs. (3) Anxiety-reduction requirements for V1. (4) A "don't build" list with reasoning. (5) For each recommendation: in-scope for MVP or deferred, and why.
**Failure modes:**
- Academic: interesting analysis that doesn't translate to features
- Feature laundry list: listing features without tracing to specific jobs/outcomes
- Missing the "don't build" list: only additive recommendations
- No prioritization: everything is equally important (nothing is)
- No MVP scoping: treating the full vision as V1
- Wish list without tradeoffs: no hard choices made
**Max length:** 3-4 pages
**Confidence:** 🟡 hypothesis

## Quality checklist
- [ ] Every job statement is solution-agnostic (no mention of our product, Claude, skills, or specific technology)
- [ ] Functional, emotional, and social jobs are documented together for each main job (not siloed)
- [ ] Customer segments are defined by struggling moment, not demographics
- [ ] "Do nothing" is analyzed as a full competitor with hiring/firing criteria
- [ ] Self-help graveyard is documented (why they fire the category, not just individual products)
- [ ] Forces of Progress include Anxiety and Habit (not just Push and Pull)
- [ ] Big Hire vs Little Hire hierarchy is explicit
- [ ] Two modalities (course vs AI skills) have separate job analysis
- [ ] Manual-vs-AI boundary is drawn with reasoning
- [ ] Every section ends with implications for what we build
- [ ] Outcome statements follow direction + metric + object format
- [ ] Hiring and firing criteria are documented independently (not as inverses)
- [ ] All findings are marked with confidence tags (🟢 validated / 🟡 hypothesis / 🔴 guess)
- [ ] Section 9 has a prioritized top-5, a "don't build" list, and MVP scoping
- [ ] The document could be understood by someone who doesn't know our product

## Assumptions registry
| Assumption | Confidence | Signal that proves it wrong |
|---|---|---|
| Situation-based segments will map roughly to existing personas | 🟡 hypothesis | JTBD analysis reveals segments that cross-cut both personas or a 3rd segment emerges |
| Emotional jobs (feel confident, avoid regret) are stronger purchase drivers than functional | 🟡 hypothesis | Users articulate purely functional hiring criteria in interviews |
| "Do nothing" is the dominant competitor | 🟡 hypothesis | Users are actively switching FROM a specific competing product |
| Anxiety about "another course I won't finish" is the top adoption barrier | 🔴 guess | Users cite price, trust, or relevance as primary barriers |
| Course and AI skills serve genuinely different jobs (not just different delivery of same job) | 🟡 hypothesis | User interviews show they think of course + skills as one unified experience |
| Manual-first reduces anxiety (feels like ownership, not homework) | 🔴 guess | Users want AI-first and see manual steps as unnecessary friction |
| Big Hire (transformation) drives acquisition, Little Hire (daily use) drives retention | 🟡 hypothesis | Users churn because the Big Hire promise fades, not because daily use fails |
| The self-help graveyard creates category-level anxiety that we must specifically address | 🟡 hypothesis | Our anti-self-help positioning is sufficient to overcome category fatigue |

## Reader journey
**After this document:** PRD (doc 08) translates JTBD findings into specific product requirements, features, and success metrics. Every PRD feature traces back to a job or underserved outcome in this document.
**Last section should bridge to:** "These are the jobs. The PRD defines what we build to serve them."

## Decision log
| Date | Decision | Why | Watch signal |
|---|---|---|---|
| 2026-04-06 | Moesta primary, Ulwick supplementary | Pre-revenue, no customer data. Moesta's qualitative approach fits. Ulwick's quantitative ODI requires survey data we don't have. | When we have 100+ users, revisit with Ulwick's opportunity scoring |
| 2026-04-06 | Merged Forces + Hiring/Firing into one section | Adversarial review: Push IS the trigger, Anxiety IS the firing risk. Separate sections produce duplicated insights. | If the merged section exceeds 4 pages, consider splitting |
| 2026-04-06 | Folded emotional/social jobs into main job statements | Adversarial review: separate emotional section creates duplication with outcome statements. Three dimensions belong together. | If emotional analysis feels shallow within Section 3, break it out |
| 2026-04-06 | Added Two Modalities section | Course (teach me) and AI skills (do it with me) are different jobs with different success criteria and different competition | If users don't distinguish between modalities, merge back |
| 2026-04-06 | Added BJ Fogg + Indi Young to expert council, removed Des Traynor | Fogg adds behavioral gap lens (critical for "stuck" customers). Young adds mental model mapping for the actual ICP. Traynor is derivative of Christensen/Moesta. | If behavioral lens dominates at expense of JTBD structure, rebalance |
| 2026-04-06 | 9 sections, narrative-ordered | Adversarial review: reordered for reading flow (who → what job → why now → what else → how today → what success → modalities → what to build) instead of framework checklist | If readers skip to Section 9 every time, the narrative order isn't earning attention |
