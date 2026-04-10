# META-DOC: Product Requirements Document (Life Decisions)

## Purpose
Translate every JTBD finding into specific, buildable product requirements for Life Decisions V1. Every feature must trace back to a job, outcome, or force in the JTBD (doc 07). No traceability = no feature. This is the bridge between "what jobs exist" and "what we build."

## Scope
**This document IS:** A PRD for Life Decisions V1 ($197/year). Defines what's in, what's out, data model, user flows, technical constraints, and success metrics. Written for a solo developer (Henry) + AI agents to build from without asking clarifying questions.
**This document is NOT:** The JTBD analysis (that's doc 07 — this document CONSUMES it). Not the methodology (doc 03). Not the course outline (doc 04). Not the landing page spec (doc 05). Not a technical architecture doc (that's doc 09 — this document FEEDS it).
**Scope boundary:** Life Decisions B2C product only. Course platform + AI skills + decision primitive. No Business Decisions features, no paid traffic, no content automation.
**Research status:** Inherits JTBD confidence levels. All product decisions are hypotheses until validated by real users.

## Primary reader
Henry (to build it), AI agents (to implement features), Indy (to validate the user-facing experience matches the brand).

## Input documents
- `decisions/lifedecisions/07-jobs-to-be-done/document.md` — PRIMARY. Every feature traces here.
- `decisions/lifedecisions/03-methodology/document.md` — the 8-phase loop the product delivers
- `decisions/lifedecisions/04-course-outline/document.md` — course structure (3 acts, 9 modules)
- `decisions/lifedecisions/05-landing-page/document.md` — promises made to customers
- `decisions/lifedecisions.md` — product context, ICP, architecture
- `decisions/company.md` — positioning, personas, core thesis
- `decisions/coding.md` — tech stack and build rules
- `decisions/design.md` — visual design system

## Expert council
1. **Marty Cagan** (Inspired / Empowered) — product discovery, opportunity assessment, MVP scoping. The "what's the minimum that tests the hypothesis" lens. Best fit for a pre-revenue product where every feature must earn its place.
2. **Teresa Torres** (Continuous Discovery) — opportunity solution trees, assumption mapping. Connects JTBD outcomes to specific product decisions with explicit assumption tracking.
3. **Ryan Singer** (Shape Up) — appetite-based scoping, shaping before building. Forces the question: "how much time is this worth?" instead of "how long will this take?" Critical for solo developer.
4. **Julie Zhuo** (The Making of a Manager / Product Design) — user flow clarity, emotional design. Ensures the product FEELS like "doing the real work" (JTBD emotional job), not like another app.
5. **Des Traynor** (Intercom / JTBD-to-product) — translating jobs into features, the "job story" format for requirements. The bridge between abstract JTBD and concrete user stories.
6. **Eric Ries** (Lean Startup) — the skeptical builder voice. "What is the minimum experiment that tests whether users will actually fire their current solution for this one?" Every JTBD finding is tagged 🟡 or 🔴 — this voice challenges whether the product form itself is the right experiment.

## Document-level failure modes
1. **Feature factory.** Listing features without tracing each to a specific JTBD finding. If a feature can't point to a job, outcome, or force — it doesn't belong.
2. **JTBD-disconnected.** Beautiful PRD that ignores the JTBD analysis. Every section must reference specific JTBD sections and findings.
3. **Kitchen sink MVP.** Including everything for V1. The JTBD already scoped MVP (Section 9): course + skills + decision primitive + time-bounded phases. Wins Board is V2. Daily content is V2. Respect the boundary.
4. **Too abstract to build from.** "The user should feel empowered" is not a requirement. Requirements must be specific: screens, fields, states, transitions, error cases.
5. **Too detailed too early.** Pixel-level specs for a pre-revenue product. The PRD defines WHAT, not pixel-perfect HOW. Shape the work, don't spec the pixels.
6. **Missing the emotional job.** A PRD full of data models and API routes that forgets the product must feel like "doing the real work, not the practice." UX principles from JTBD Section 9 must live in every feature spec.
7. **No "don't build" enforcement.** The JTBD has a "don't build" list (dashboards, coaching, forums, streaks, AI-that-decides). The PRD must reference this list and explain why each deferred item is deferred.
8. **Solo developer blind spot.** Specs that assume a team of 5. This is Henry + AI agents. Every feature must be buildable by one person with AI assistance. Complexity budget is real.

## Sections

### SECTION 1: Product Overview + JTBD Traceability + Anxiety Architecture
**Answers:** What is Life Decisions V1? What job does it serve (traced to JTBD Section 3)? What is the MVP scope boundary (traced to JTBD Section 9)? What confidence level applies to each product decision? How does the product structurally reduce the "another course" anxiety (JTBD Section 4: Critical strength barrier)?
**Done when:** A developer reading this knows: the product name, the one-liner, the target user, the core job being served, what's in V1, what's deferred, and why. Every claim traces to a JTBD section. Includes an "Anxiety-Reduction Architecture" sub-section specifying how each of the 5 JTBD anxiety-reduction requirements (structural difference messaging, immediate action, social proof, money-back guarantee, progressive revelation) is addressed in V1.
**Failure modes:**
- Restating the JTBD instead of building on it
- Scope creep: including V2 items in V1
- Missing the confidence inheritance: treating product decisions as certain when JTBD findings are hypotheses
- Anxiety reduction as afterthought: buried in UX notes instead of first-class architecture
**Max length:** 3 pages

### SECTION 2: User Personas + Entry Points
**Answers:** Who uses this product? (Traced to JTBD Section 2 segments). How do they discover it? What is their state of mind at first interaction? What onboarding flow matches their struggling moment?
**Done when:** Each persona has: name, JTBD segment mapping, entry point (how they arrive), emotional state at entry, first action in the product, and success criteria for onboarding. The throughline selection flow is fully specified as a sub-flow: trigger, questions asked, decision recorded, state updated. This is the "immediate action" anxiety-reducer — user makes a REAL decision in Week 1.
**Failure modes:**
- Demographic personas instead of situation-based segments
- Generic onboarding: one flow for everyone
- Missing the anxiety state: these users are skeptical (JTBD Section 4)
**Max length:** 2 pages

### SECTION 3: Post-Purchase User Flows
**Answers:** What are the 3-5 critical user journeys through the product AFTER purchase? (Pre-purchase flows belong to the landing page spec, doc 05.) End-to-end flows from first login to outcome. Each flow maps to a JTBD job or outcome. Include: happy path, key decision points, what the user sees at each step, what data is created.
**Done when:** A developer can build each flow without asking questions. Each flow has: trigger, steps (numbered), screen/state at each step, data created/consumed, exit conditions, and JTBD trace. Payment flow (purchase → account creation → first screen) is specified as Flow 0.
**Failure modes:**
- Too many flows (>5 for MVP): scope creep
- Happy path only: no error/edge cases
- No JTBD trace: flow exists because "it seems useful" not because a job demands it
- Mixing user flows with system architecture
- Including pre-purchase flows that belong to doc 05 (landing page)
**Max length:** 4-5 pages

### SECTION 4: Feature Requirements (Prioritized)
**Answers:** What specific features does V1 include? Each feature: name, description, JTBD trace, priority (P0 = must ship / P1 = should ship / P2 = nice to have), acceptance criteria, and complexity estimate (S/M/L).
**Done when:** Every P0 feature is described with enough detail to build. Every feature traces to a JTBD finding. The "don't build" list from JTBD Section 9 is explicitly referenced and enforced. Total complexity fits a solo developer building over 4-6 weeks.
**Failure modes:**
- All P0: if everything is critical, nothing is
- Feature without JTBD trace: "cool idea" syndrome
- Missing acceptance criteria: "it should work well"
- Ignoring the "don't build" list
- Complexity explosion: features that need a team, not a solo dev
**Max length:** 5-6 pages

### SECTION 5: Data Model + Decision Primitive
**Answers:** What are the core entities? User, Decision, Phase, Exercise, Course Progress, Win. How do they relate? What is the "decision primitive" — the central object that everything orbits? (Traced to JTBD: one active decision, versioned, with evolution history). What data does each AI skill produce? How does the course content integrate?
**Done when:** Two deliverables: (A) An entity-relationship diagram (text-based) showing all entities and relationships, each entity with fields, constraints, and JTBD justification. (B) A decision primitive state machine: states, transitions, versioning rules, and what triggers each transition. These are different cognitive tasks — the ERD is structural, the state machine is behavioral.
**Failure modes:**
- Over-engineered: 20 tables for an MVP
- Under-engineered: no decision state tracking (the core value)
- Missing skill output: where does AI-generated content live?
- Course content mixed with user data
**Max length:** 3-4 pages

### SECTION 6: AI Skills Integration
**Answers:** How do AI skills work within the product? What is the skill execution model? How does the product track which skills the user has run? How does output from one skill inform the next? What is the boundary between course content (teaching) and skill execution (doing)?
**Done when:** The skill lifecycle is fully specified: discovery → installation → execution → output storage → cross-skill context. The boundary between "course teaches why" and "skill does the doing" is explicit (traced to JTBD Section 8). Each methodology phase maps to exactly one skill.
**Failure modes:**
- Skills as disconnected exercises (no context continuity)
- Skills replacing the course (JTBD says both modalities serve different jobs)
- No output storage spec: where do raw.md and document.md live?
- AI decides for the user (violates "don't build" list)
**Max length:** 3-4 pages

### SECTION 7: Course Platform Requirements
**Answers:** What does the course platform need to do? Sequential progression + reference navigation (JTBD: course-as-reference for Little Hire). Content types (video, text, exercises). Progress tracking. How does the platform enforce time-bounded phases? What is the minimum viable course experience?
**Done when:** The course platform is specified as a distinct product component. Content model defined. Navigation model defined (sequential + search + bookmarks). Time-bounded phase mechanics specified. A developer can build the course player without asking questions.
**Failure modes:**
- Building a full LMS: too much for V1
- Sequential only: JTBD says course must also work as reference
- No time-bounding: just a course with no methodology enforcement
- No content versioning path: V1 content can be static at launch, but must be versioned so future updates don't break user progress state (JTBD Little Hire: "evolving content" is a retention mechanism)
**Max length:** 3-4 pages

### SECTION 8: Non-Functional Requirements + Payment Flow
**Answers:** Performance, security, accessibility, mobile responsiveness, privacy. What are the hard constraints? What are the quality bars? Tech stack alignment with coding.md (Bun, Hono, Preact, Drizzle, PostgreSQL, Better Auth, Stripe). Plus: What does the payment flow look like? What does the user see after paying? What happens on payment failure? How is the 7-day money-back guarantee presented and operationalized (JTBD: anxiety-reducer)?
**Done when:** Each non-functional requirement has a measurable threshold. Privacy requirements are explicit (user's personal decision data is sensitive). Auth + payment integration points are named. Mobile-first or desktop-first is decided. Payment flow is specified end-to-end including guarantee mechanic.
**Failure modes:**
- Aspirational targets: "should be fast" instead of "< 2s page load"
- Missing privacy: decision data is deeply personal
- Tech stack deviation: specifying technologies not in coding.md
- Enterprise-grade requirements for a pre-revenue MVP
- Payment as afterthought: Stripe integration without specifying the user-facing experience
**Max length:** 3 pages

### SECTION 9: Success Metrics + Validation Plan
**Answers:** How do we know V1 is working? What metrics matter? (Traced to JTBD: Big Hire = acquisition, Little Hire = retention). What does "success" look like at 30/60/90 days post-launch? What assumptions are we testing? What signals would tell us to pivot?
**Done when:** 3-5 primary metrics defined with targets. Each metric traces to a JTBD finding. Includes "Churn Warning Signals" — each JTBD firing trigger (Section 4: "feels like another practice," "finished but nothing changed," "AI felt generic," "lost momentum") becomes a measurable leading indicator. The assumption registry from JTBD is inherited with specific product-level validation methods. A "kill criteria" section defines what would cause us to fundamentally rethink the product.
**Failure modes:**
- Vanity metrics: signups without engagement
- Missing retention metrics: only measuring acquisition
- No churn leading indicators: only measuring churn AFTER it happens instead of detecting firing triggers early
- No validation plan: measuring but not learning
- No kill criteria: continuing to build regardless of signals
**Max length:** 2-3 pages

### SECTION 10: MVP Scope + Deferred Items
**Answers:** The definitive V1 boundary. What ships. What doesn't. For each deferred item: why it's deferred, what signal would promote it to V1.1, and what JTBD finding it serves (so it doesn't get forgotten). The build sequence: what order to build things in for a solo developer.
**Done when:** A developer reading this section knows exactly what to build first, second, third. Build sequence expressed as a dependency graph (text-based): auth → payment → course unlock → skill execution → decision tracking. The Wins Board, daily content, gamification, and community are explicitly deferred with promotion criteria. Includes a "Re-engagement V1" sub-section: the minimal mechanics for recovering paused users in V1 (JTBD firing trigger #4), without Wins Board (V2).
**Failure modes:**
- Vague deferrals: "maybe later" without criteria
- Missing the build sequence: what order matters for a solo dev
- Scope creep through the back door: "optional" features that become expected
- No promotion criteria: deferred items stay deferred forever
**Max length:** 2-3 pages

## Quality checklist
- [ ] Every P0 feature traces to a specific JTBD finding (section + finding reference)
- [ ] The "don't build" list from JTBD Section 9 is explicitly enforced (dashboards, coaching, forums, streaks, AI-that-decides)
- [ ] The decision primitive is fully specified (states, transitions, versioning)
- [ ] AI skills integration respects the manual-thinking/AI-structuring boundary (JTBD Section 8)
- [ ] Course platform supports both sequential and reference navigation (JTBD: Big Hire + Little Hire)
- [ ] Time-bounded phases are specified as a product mechanic (JTBD top outcome)
- [ ] Onboarding maps to JTBD customer segments (not demographics)
- [ ] Emotional job ("doing the real work") is reflected in UX requirements, not just feature list
- [ ] Anxiety-reduction features are P0, not P2 (JTBD Section 4: anxiety is Critical strength)
- [ ] Total complexity is achievable by one developer + AI agents in 4-6 weeks
- [ ] Success metrics trace to JTBD Big Hire (acquisition) and Little Hire (retention)
- [ ] Privacy requirements address the sensitivity of personal decision data
- [ ] Tech stack matches coding.md (Bun, Hono, Preact, Drizzle, PostgreSQL, Better Auth, Stripe)
- [ ] MVP scope matches JTBD Section 9 scope decision (course + skills + decision primitive + time-bounded phases)
- [ ] Build sequence is realistic for a solo developer
- [ ] All five "must build" items from JTBD Section 9 are addressed: Wins Board (deferred with criteria), skills-as-exercises, course-as-reference, decision primitive, time-bounded phases
- [ ] Each JTBD firing trigger (Section 4) maps to a churn warning signal in success metrics
- [ ] Payment flow and money-back guarantee are fully specified (not just "uses Stripe")

## Assumptions registry
| Assumption | Confidence | Signal that proves it wrong |
|---|---|---|
| Course + skills + decision primitive is the right V1 scope | 🟡 hypothesis | Users only engage with one modality (course OR skills, never both) |
| Time-bounded phases improve completion vs self-paced | 🔴 guess | Users find time pressure stressful and drop off more |
| One active decision at a time is the right constraint | 🟡 hypothesis | Users have entangled decisions that require parallel work |
| AI skills can maintain context across sessions via file storage | 🟡 hypothesis | Users lose or delete their files, breaking context continuity |
| The decision primitive (versioned, evolution-tracked) adds value users perceive | 🔴 guess | Users don't check their decision evolution and find it overhead |
| Course-as-reference navigation is needed for V1 | 🟡 hypothesis | Users only go through the course sequentially and never return |
| 4-6 week build timeline is realistic for solo dev + AI | 🔴 guess | Unforeseen complexity in auth, payment, or skill integration |
| Desktop-first is correct (users run Claude on desktop) | 🟡 hypothesis | Mobile consumption of course content is the dominant pattern |

## Decision log
| Date | Decision | Why | Watch signal |
|---|---|---|---|
| 2026-04-06 | 10 sections, JTBD-traced | PRD is the product translation of the JTBD, not independent. | If sections feel repetitive with JTBD, they need to ADD product specificity |
| 2026-04-06 | Separate course + skills sections | JTBD Section 8: different jobs, different specs. | If implementation shows they're tightly coupled, merge |
| 2026-04-06 | Anxiety-reduction as first-class architecture | JTBD Section 4: anxiety is Critical strength. Not UX polish — structural. | If anxiety isn't the primary adoption barrier in practice |
| 2026-04-06 | 4-6 week build timeline as constraint | Forces ruthless prioritization. Can't be built in 6 weeks = not MVP. | If quality suffers, extend to 8 weeks |
| 2026-04-06 | Adversarial review applied | Added: anxiety architecture, churn signals, payment flow, re-engagement V1, must-build checklist, Lean Startup voice, dependency graph format, throughline spec | If the meta is over-specified for a pre-revenue product |
