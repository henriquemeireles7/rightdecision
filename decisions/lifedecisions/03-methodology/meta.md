# META-DOC: Methodology

## Purpose
Document the complete algorithm a person follows to go from "I'm stuck" to "I got results." The methodology is the product's intellectual engine. The course teaches it. The AI runs it. This document defines it with enough precision that an implementer (human or AI) can execute it without asking clarifying questions.

## Scope
**This document IS:** The deep framework. Every phase gets: explanation, exact questions, common mistakes, worked example, output, and transition criteria.
**This document is NOT:** A course outline (doc #4, which adapts this for teaching). Not sales copy (that's the manifesto). Not an architecture doc.
**Scope boundary:** This methodology works for constraint-resolution problems: career, relationships, finances, health decisions, business decisions. It does NOT replace professional help for clinical depression, addiction, trauma requiring EMDR/CBT, legal problems, or medical conditions. The document must state this explicitly.

## Primary reader
Henry + Indy (to validate and teach), AI agents (to implement in the platform), course designers (to build modules from).

## Input documents
- `decisions/01-business-model/input.md` — foundational framework (7-step Decision Cycle, seven angles, eight sins, principles)
- `decisions/02-manifesto/document.md` — voice, enemy framing, customer language
- `decisions/02-manifesto/input.md` — founder's raw thinking on how decisions work

## Expert council
1. **Eliyahu Goldratt** (Theory of Constraints) — constraint identification and resolution in systems. The "ONE thing in the way" comes from here.
2. **BJ Fogg** (Tiny Habits) — behavior = motivation × ability × prompt. The methodology uses this for the execution phase.
3. **Richard Rumelt** (Good Strategy Bad Strategy) — diagnosis before action, kernel of strategy. The dominant constraint IS the diagnosis.
4. **James Clear** (Atomic Habits) — habit stacking, identity-based habits, systems vs goals. Informs decomposition into habits.
5. **David Allen** (GTD) — capture, clarify, organize, reflect, engage. Informs the decomposition and execution phases.

## Document-level failure modes
1. **Too theoretical, not executable.** Reads like a philosophy paper, not a step-by-step guide. Every phase must end with a concrete output the person holds in their hands.
2. **Linear when life is not.** Assumes people march through phases in order. Must include dynamics: when to backtrack, pause, skip, or abandon the cycle.
3. **One-size-fits-all.** A 32-year-old considering a career change and a 48-year-old empty-nester need different emphasis. Must include intake logic ("start here if...").
4. **Ignores emotion.** Treats the person as a rational agent. Must acknowledge that grief, fear, shame, and exhaustion override rational processes, and provide guidance for each.
5. **No maintenance.** Resolving a constraint doesn't mean it stays resolved. Habits decay. Situations change. Must include a maintenance/regression protocol.

## Sections

### SECTION 1: Introduction — What This Is and Who It's For
**Answers:** Why does this methodology exist? What does it replace? What is it NOT for?
**Done when:** A stranger can read it and know if this is for them in 60 seconds. Includes explicit scope boundary (what problems this doesn't solve).
**Failure modes:**
- Too broad: "This is for anyone who wants a better life" (meaningless)
- Missing scope boundary: doesn't mention clinical conditions, creates liability
- Sounds like every other framework ("a revolutionary approach to personal development")
**Max length:** 1 page
**Confidence:** 🟢 validated

### SECTION 2: The Loop — How the Phases Connect
**Answers:** ASCII diagram of the full loop. Why it's a cycle, not a line. How cycles get faster with practice (skill accumulation). How the loop changes on second/third pass.
**Done when:** A visual shows all phases, their connections, and the cycle-back mechanism. Includes: where to enter if you're not at zero, when to backtrack, when to pause entirely.
**Failure modes:**
- Drawn as a straight line (implies linear, one-time process)
- No entry-point logic: forces everyone to start at Phase 1
- No backtracking rules: what happens when Phase 7 reveals Phase 4 was wrong?
**Max length:** 2 pages (diagram + explanation)
**Confidence:** 🟡 hypothesis

### SECTION 3: Phase 1 — Awareness + State Mapping
**Answers:** How do you realize something is wrong AND get honest about where you actually are? (Merged: awareness without assessment is shallow, assessment without awareness is premature.)
**Done when:** The person has a written, honest map of their current state across: finances, health, relationships, career, emotional state, energy, obligations. Not what they tell people. What's actually true.
**Failure modes:**
- Surface-level: "I feel stuck" without specifics
- Dishonest: the map shows what they want to be true, not what IS true
- Over-assessment: spending weeks on this phase instead of moving to Phase 2 (time-box to 1-3 days)
**Exact questions:** (to be developed in d-input)
**Max length:** 3-4 pages (explanation + questions + worked example + output template)
**Confidence:** 🟡 hypothesis

### SECTION 4: Phase 2 — Target State
**Answers:** Where do you want to be? Defined as observable conditions, not metrics. "Freedom to choose how I spend my time" with evidence criteria: "I can say no to any meeting without financial consequence."
**Done when:** Target state is specific enough that Phase 8 (Feedback) can measure against it. Uses "observable conditions with evidence criteria" format.
**Failure modes:**
- Too vague: "I want to feel happy" (unmeasurable)
- Metric-only: "$50K/month" without the condition it serves (the metric might not produce the desired state)
- Someone else's target: copying a vision from Instagram instead of diagnosing their own
**Max length:** 2-3 pages
**Confidence:** 🟡 hypothesis

### SECTION 5: Phase 3 — Dominant Constraint Identification
**Answers:** What is the ONE thing between current state and target state? The hardest phase. Selection criteria when constraints seem entangled or equal. Defense of "one at a time" approach.
**Done when:** One constraint is named, written down, and the person can articulate why THIS one, not the other candidates.
**Failure modes:**
- Picking the comfortable one (Sin #1: solving the second-biggest because the biggest is scary)
- Analysis paralysis: can't choose between two constraints (needs a tiebreaker rule)
- Entangled constraints treated as one: "my relationship AND my career" is two constraints, pick one
- Misidentified constraint: the most expensive failure, wastes an entire cycle
**Max length:** 3-4 pages (this is the critical phase — needs the most guidance)
**Confidence:** 🟡 hypothesis

### SECTION 6: Phase 4 — Decision Commitment
**Answers:** How do you commit to resolving the constraint? What makes a decision real vs a wish? The irreversibility spectrum.
**Done when:** Decision is named ("I will ___"), written, shared with at least one person, and has a deadline.
**Failure modes:**
- Decision without teeth: "I've decided to start thinking about..." (Sin #5)
- Commitment without sharing: decisions made silently are easy to abandon
- Confusing the decision with the goal: "I want to divorce" is a goal, "I will consult a lawyer by Friday" is a decision
**Max length:** 2-3 pages
**Confidence:** 🟢 validated (foundational framework covers this well)

### SECTION 7: Phase 5 — Decomposition
**Answers:** How to break the decision into objectives (measurable), tasks (time-bound), and habits (recurring). Prioritization and sequencing logic. How many habits simultaneously (1-2 max).
**Done when:** A written plan with: 3-5 objectives, each with tasks and deadlines, plus 1-2 supporting habits with triggers.
**Failure modes:**
- Decomposing without deciding first (Sin #5: productive theater)
- Too many simultaneous habits (research shows 1-2 max)
- No sequencing: all tasks treated as equal priority
- Objectives without metrics: "get better at finances" vs "save $500 by April 30"
**Max length:** 3-4 pages
**Confidence:** 🟡 hypothesis

### SECTION 8: Phase 6 — Execution
**Answers:** How to do the work sustainably. Daily cadence, minimum viable progress, what to do when you miss a day/week, how to distinguish "hard but working" from "not working." The emotion layer: what to do when grief/fear/shame override the rational plan.
**Done when:** Person has a daily rhythm and knows the difference between a bad day (keep going) and a bad strategy (backtrack to Phase 5).
**Failure modes:**
- Willpower-dependent: relies on motivation instead of systems
- No minimum viable progress defined: either all-or-nothing
- Ignores emotional states: grief, fear, and exhaustion are not execution failures, they're environment variables
- No distinction between "hard" and "wrong"
**Max length:** 3-4 pages (this is where 90% of methodologies fail — needs the most operational detail)
**Confidence:** 🔴 guess (execution guidance is the least tested part)

### SECTION 9: Phase 7 — Feedback + Re-evaluation
**Answers:** How to observe what reality tells you. When to adjust the plan vs when to adjust the goal vs when to restart the cycle. Checkpoint triggers: constraint resolved, progress stalled, major life event, persistent discomfort.
**Done when:** Person has a review cadence (weekly minimum) and a decision tree for what to do based on the feedback.
**Failure modes:**
- Never reviewing (executing blindly)
- Reviewing too often (daily self-assessment becomes anxiety)
- Confusing "hard" feedback with "wrong" feedback
- Not recognizing when Phase 4 (the decision itself) was wrong
**Max length:** 2-3 pages
**Confidence:** 🟡 hypothesis

### SECTION 10: Phase 8 — Resolution + Maintenance + New Cycle
**Answers:** How do you know the constraint is resolved? What maintenance looks like (habits to hold, regression signals to watch). How to transition to a new cycle without losing gains. Skill accumulation: the second cycle is faster because you've done it before.
**Done when:** Clear resolution criteria, a maintenance checklist, and the trigger to start a new cycle.
**Failure modes:**
- Premature resolution: declaring victory before the constraint is actually resolved
- No maintenance: resolved constraint regresses within 3 months
- Success-induced collapse: resolving one constraint creates new problems (promotion → stress)
- Not recognizing the person has changed: second cycle uses Phase 1 from the first cycle instead of reassessing
**Max length:** 2-3 pages
**Confidence:** 🔴 guess

### SECTION 11: Dynamics — When the Loop Breaks
**Answers:** What to do when life doesn't follow the algorithm. When to backtrack (Phase 7 reveals Phase 4 was wrong). When to pause entirely (major life event, health crisis). When the loop is the wrong tool (need professional help, not a decision framework). When to abandon a cycle mid-way.
**Done when:** A decision tree covers the 5 most common non-ideal conditions.
**Failure modes:**
- Too rigid: "never skip a phase" when sometimes skipping is correct
- Too flexible: "do whatever feels right" defeats the purpose of a methodology
- Doesn't mention external help: clinical conditions need professionals, not frameworks
**Max length:** 2 pages
**Confidence:** 🔴 guess

### SECTION 12: End-to-End Worked Example
**Answers:** One person going through ALL phases, from awareness to resolution. Same person throughout (no context-switching). Shows realistic messiness: backtracking, emotional interference, time gaps between phases.
**Done when:** A reader can trace the entire algorithm through one real (or realistic) life situation and see both the ideal path and the deviations.
**Failure modes:**
- Too clean: the example follows the algorithm perfectly (unrealistic, unhelpful)
- Wrong demographic: example person doesn't match the ICP
- Too long: becomes a novella instead of a reference
**Max length:** 3-4 pages
**Confidence:** 🟡 hypothesis

## Quality checklist
- [ ] A practitioner can follow the methodology from Phase 1 to Phase 8 without asking clarifying questions
- [ ] Every phase has exact questions to ask (not just descriptions of what to think about)
- [ ] Every phase has a concrete output the person holds in their hands (written state map, named constraint, decision statement, task list, etc.)
- [ ] The dynamics section covers: backtracking, pausing, abandoning, and recognizing when the loop is wrong
- [ ] Scope boundary explicitly names what problems this methodology does NOT solve
- [ ] Entry-point logic lets someone start at Phase 2 or 3 if they're past Phase 1
- [ ] Execution phase has operational detail: cadence, minimum viable progress, missed-day protocol
- [ ] Maintenance protocol prevents resolved constraints from regressing
- [ ] Worked example shows realistic messiness, not an idealized linear path
- [ ] The eight sins from the manifesto map to specific phases where they're most likely to occur

## Assumptions registry
| Assumption | Confidence | Signal that proves it wrong |
|---|---|---|
| One constraint at a time is optimal | 🟡 hypothesis | Users with entangled constraints can't pick one and stall at Phase 3 |
| The cycle restarts cleanly | 🔴 guess | Users report the second cycle feels nothing like the first |
| Self-assessment is reliable enough for State Mapping | 🔴 guess | Users consistently misidentify their dominant constraint |
| 9 phases is the right granularity | 🟡 hypothesis | Users lose the thread, can't remember which phase they're in |
| Execution can be sustained without external accountability | 🔴 guess | Drop-off after Week 2 exceeds 60% |
| The methodology works without the AI | 🟡 hypothesis | Manual users get stuck at decomposition (too complex without AI) |

## Reader journey
**After this document:** Course Outline (doc #4) adapts the methodology into teachable modules. The AI platform implements each phase as a guided flow.
**Last section should bridge to:** "This methodology is the engine. The course teaches you to run it. The AI runs it with you."

## Decision log
| Date | Decision | Why | Watch signal |
|---|---|---|---|
| 2026-04-04 | Merged Awareness + State Mapping into one phase | Adversarial review: they blur in practice | If users need them separate, split |
| 2026-04-04 | Added Dynamics section for non-ideal conditions | Adversarial review: "methodology for people who don't need one" without it | If dynamics section is never referenced, cut it |
| 2026-04-04 | Added Maintenance in Resolution phase | Adversarial review: no regression protocol | If users don't regress, simplify |
| 2026-04-04 | Explicit scope boundary (not for clinical conditions) | Adversarial review: liability gap | Non-negotiable |
| 2026-04-04 | One worked example person throughout (not per-phase) | Adversarial review: context-switching with multiple examples | If one example doesn't cover enough variation, add a second for Phase 5 |
| 2026-04-04 | 12 sections (8 phases + intro + loop + dynamics + worked example) | Covers the full algorithm + edge cases | If 12 is too many, merge loop + intro |
