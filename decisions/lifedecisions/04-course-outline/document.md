# Course Outline — The Right Decision
**Version:** 1.0
**Date:** 2026-04-04
**Status:** Draft
**Author:** Henry + Indy + Claude
**Meta-doc:** decisions/04-course-outline/meta.md
**Input:** decisions/04-course-outline/input.md
**Pipeline:** d-meta → d-input → d-plan (here) → d-tasks

## Document scope
**This document IS:** The course skeleton. Every module, every class, learning outcomes, exercise specs. The blueprint for content creation.
**This document is NOT:** The actual course content. Not the methodology (doc #3). Not the landing page (doc #5).
**Primary reader:** Content creators writing the course. AI agents generating content.
**Depends on:** Methodology (doc #3), Manifesto (doc #2), Business Model (doc #1)
**Feeds into:** Course content writing, AI platform exercise flows, Landing Page (doc #5)

---

## 1. Course Architecture

### Overview

```
THE RIGHT DECISION — COURSE
Total: ~23 hours | 3 months | 2 hours/week

┌──────────────────────────────────────────────────────┐
│  ONBOARDING (15 min)                                 │
│  Choose your decision. Set up your project folder.   │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ACT I: SEE CLEARLY (Month 1, ~8 hours)              │
│  ├── Module 1: The Wake-Up Call                      │
│  ├── Module 2: Where You Actually Are                │
│  ├── Module 3: Where You Want to Be                  │
│  │   └── [Checkpoint: Can you state your gap?]       │
│                                                      │
│  ACT II: DECIDE (Month 2, ~8 hours)                  │
│  ├── Module 4: The One Thing in the Way              │
│  ├── Module 5: The Decision                          │
│  ├── Module 6: The Plan                              │
│  │   └── [Checkpoint: Have you committed?]           │
│                                                      │
│  ACT III: MOVE (Month 3, ~8 hours)                   │
│  ├── Module 7: Doing the Thing                       │
│  ├── Module 8: What Reality Tells You                │
│  ├── Module 9: Resolution + The Next Loop            │
│  │   └── [Checkpoint: Has your state changed?]       │
│                                                      │
├──────────────────────────────────────────────────────┤
│  RESOURCES (always accessible)                       │
│  Glossary, all docx templates, AI prompt library     │
└──────────────────────────────────────────────────────┘
```

### Pacing
- **3 acts, 3 months, 3 modules per act = 9 modules**
- **2 hours per week = ~8 hours per act**
- **Each module: ~2.5 hours (3 theory classes + 1 practical class)**
- **Each class: 30-40 minutes**

---

## 2. The Throughline

Before Module 1, the student chooses ONE decision they will carry through the entire course. This is their throughline. Every exercise builds on it. By Module 9, it is either resolved or in active execution.

### How to choose the throughline decision

During onboarding, the student answers:
1. "What is the thing you've been avoiding for the longest?"
2. "If you could only change ONE thing in your life in the next 90 days, what would it be?"
3. "What decision, if you made it, would make everything else easier?"

The answer to these three questions is usually the same thing. That is their throughline.

**Rule:** The throughline must be a real decision, not an aspiration. "I want to be happier" is not a throughline. "I need to decide whether to leave my job" is.

---

## 3. Module List

### Onboarding (30 minutes — 2 classes)

**Title:** Welcome. Choose Your Decision.
**Description:** No pitch. No origin story (they already bought). Two classes: (1) how the course works + choose your throughline decision, (2) set up your AI workspace — install Claude Cowork, install The Right Decision skills, and see how AI-guided exercises work.
**Time:** 30 minutes (2 classes)
**Output:** A decision statement: "The decision I'm working on is ___." + Claude Cowork installed with skills ready.

| # | Class Title | Type | Duration | Description |
|---|---|---|---|---|
| 0.1 | Welcome. Choose Your Decision. | Orientation | 15 min | How the course works: 3 acts, 9 modules, 3 months, 2h/week. Every module ends with a practical exercise. You carry ONE decision from start to finish. Answer the three throughline questions. Write your decision statement. |
| 0.2 | Your AI Partner: Setting Up Skills | Setup | 15 min | What Claude Cowork is and why we use it. How to install The Right Decision skills (step-by-step walkthrough). Demo: what an AI-guided exercise looks like — you answer questions, the AI saves your work, here's the output. NOT a technical class — shows the FLOW, not the code. The AI doesn't decide for you. It asks better questions than you'd ask yourself, saves your answers, and creates a structured document from your thinking. Each module's practical class will use a specific skill. |

**Why this class matters:** Every practical exercise in the course uses a Claude skill. Without this setup, students can't do the AI-powered exercises. The class is deliberately non-technical — it shows the experience ("you'll talk to the AI, it asks questions, your answers become a document") not the infrastructure.

**Setup assets:** Step-by-step installation guide (with screenshots) for Claude Cowork + The Right Decision skills package.

---

### ACT I: SEE CLEARLY (Month 1, ~8 hours)

#### Module 1: The Wake-Up Call
**Methodology phase:** Awareness (the body as trigger)
**Description:** Why you're stuck. How discomfort is feedback for unmade decisions. Why "doing the work" hasn't worked. The self-help trap explained.
**Time:** ~2.5 hours (4 classes)
**Learning outcome:** You can name the specific discomfort driving you and recognize it as a signal, not a condition.
**Key concepts:** Discomfort as feedback, the dependency industry, the decision primitive.

| # | Class Title | Type | Duration | Description |
|---|---|---|---|---|
| 1.1 | The Trap You Don't Know You're In | Theory | 35 min | Why understanding doesn't produce change. The self-help industry's business model. The eight sins introduced. How "doing the work" becomes the obstacle. |
| 1.2 | Your Body Already Knows | Theory | 30 min | Discomfort as the body's feedback for unmade decisions. The cost of indecision: time, energy, compound opportunity. The inflection point where pain of inaction > pain of action. |
| 1.3 | The Decision Primitive | Theory | 30 min | Decisions as the atomic unit of change. Goals vs decisions vs actions. The full loop introduced (diagram). Why decisions sit at the center. |
| 1.4 | Practice: Name Your Discomfort | Practical | 35 min | Run the `/discomfort-map` skill. The skill asks you what hurts, how long, what you've tried, what hasn't worked. It challenges your honest assessment and surfaces what you're avoiding naming. Output: your discomfort map saved to your personal folder. |

**Skill:** `/discomfort-map` — 12 questions mapping your discomfort, with follow-ups that challenge vague or sanitized answers.

---

#### Module 2: Where You Actually Are
**Methodology phase:** State Mapping
**Description:** The honest assessment. Finances, career, relationships, health, emotional state. Not where you tell people you are. Where you actually are.
**Time:** ~2.5 hours (4 classes)
**Learning outcome:** You have a written state map with facts and numbers, not narratives.
**Key concepts:** State map, honest assessment, facts vs stories.

| # | Class Title | Type | Duration | Description |
|---|---|---|---|---|
| 2.1 | The Map vs The Territory | Theory | 30 min | Why self-assessment is unreliable and how to correct for it. The difference between facts ("$2,400 in savings") and narratives ("I'm doing okay financially"). Case study: Maria's honest vs dishonest state map. |
| 2.2 | The Five Domains | Theory | 30 min | How to assess: finances, career, relationships, health, emotional state. Specific metrics for each domain. What "honest" looks like in each. |
| 2.3 | What You're Pretending Is Fine | Theory | 30 min | The domains you skip are usually the ones that matter. How to identify what you've been avoiding. The fox and the grapes pattern: "I don't want what I believe I can't achieve." |
| 2.4 | Practice: Write Your State Map | Practical | 40 min | Run the `/state-map` skill. The skill covers all five domains with specific fact-based questions. It challenges sanitized answers and pushes for numbers. Output: your honest state map saved to your personal folder. |

**Skill:** `/state-map` — 25 questions across 5 domains (finances, career, relationships, health, emotional state). Detects vague answers, asks "what's the actual number?"

---

#### Module 3: Where You Want to Be
**Methodology phase:** Target State
**Description:** Define the destination as conditions, not metrics. Observable states with evidence criteria. YOUR target, not Instagram's.
**Time:** ~2.5 hours (4 classes)
**Learning outcome:** You have a 3-5 sentence target state with evidence criteria you can measure against.
**Key concepts:** Conditions vs metrics, observable evidence, the physical response test.

| # | Class Title | Type | Duration | Description |
|---|---|---|---|---|
| 3.1 | Conditions, Not Metrics | Theory | 30 min | Why "$50K/month" is a metric but "freedom to choose how I spend my time" is a condition. The metric might not produce the state. Target the condition. |
| 3.2 | The Tuesday Test | Theory | 30 min | "Describe a specific Tuesday in your target state." What do you do, who's around, what don't you have to do anymore. Making the abstract concrete. |
| 3.3 | Is This Yours? | Theory | 30 min | Distinguishing your target from absorbed expectations. Parents, partners, culture, Instagram. Sin #6: copying someone else's decision. The physical response test: read your target out loud, feel something or rewrite. |
| 3.4 | Practice: Define Your Target State | Practical | 40 min | Run the `/target-state` skill. The skill walks through the Tuesday test, evidence criteria, and the "is this mine?" filter. It challenges whether the target is truly yours or borrowed. Output: your target state saved to your personal folder. |

**Skill:** `/target-state` — 15 questions including the Tuesday test. Detects borrowed targets, pushes for evidence criteria.

**ACT I CHECKPOINT:** Before moving to Act II, answer: "I am at [state map summary]. I want to be at [target state]. The gap between them is [your words]." If you can say this clearly, proceed. If not, revisit Module 2 or 3.

---

### ACT II: DECIDE (Month 2, ~8 hours)

#### Module 4: The One Thing in the Way
**Methodology phase:** Dominant Constraint Identification
**Description:** The hardest module. Identify the single biggest constraint between here and there. Not the loudest, not the safest, the one that matters most.
**Time:** ~2.5 hours (4 classes)
**Learning outcome:** You can name your dominant constraint and defend why it's THIS one, not the other candidates.
**Key concepts:** Dominant constraint, constraint ranking, the gut check, entangled constraints.

| # | Class Title | Type | Duration | Description |
|---|---|---|---|---|
| 4.1 | Everything You've Been Avoiding | Theory | 35 min | Sin #1: solving the second-biggest constraint because the biggest one is scary. How to list ALL constraints and rank them honestly. The gut check: if you're not slightly scared, it's probably not the real one. |
| 4.2 | One at a Time | Theory | 30 min | Why sequential, not parallel. The person who resolves constraint A approaches B with new skills. When constraints seem entangled: pick the one that makes the other easier. |
| 4.3 | The Misidentification Trap | Theory | 30 min | The most expensive failure: a full cycle wasted on the wrong problem. How to validate your constraint before committing. Case study: Maria thought it was her relationship, it was her career. |
| 4.4 | Practice: Name Your Constraint | Practical | 35 min | Run the `/constraint-id` skill. List all constraints, rate each "if resolved, how much closer?", gut check, defend your choice. The skill stress-tests your identification: "Are you sure this is the one, or is the real one the one you didn't list?" Output: your named constraint saved to your personal folder. |

**Skill:** `/constraint-id` — Constraint listing, rating exercise, gut check, defense. Adversarial challenge of the choice.

---

#### Module 5: The Decision
**Methodology phase:** Decision Commitment
**Description:** The center of the loop. The primitive. Not a wish. Not a plan. A commitment with a date and a witness.
**Time:** ~2.5 hours (4 classes)
**Learning outcome:** You have a written decision statement with a verb, a date, and at least one person you've told.
**Key concepts:** Decision vs wish vs goal, asymmetric risk, irreversibility spectrum, the commitment act.

| # | Class Title | Type | Duration | Description |
|---|---|---|---|---|
| 5.1 | Decisions Are Not Goals | Theory | 30 min | "I want to leave my job" is a goal. "I will submit my resignation on March 15" is a decision. The anatomy of a real decision: verb + specific action + date. |
| 5.2 | The Risk You're Already Taking | Theory | 30 min | Every day you don't decide, you ARE deciding (Sin #8). The cost of the wrong decision is visible. The cost of no decision is invisible. Asymmetric risk: survivable downside, transformational upside. |
| 5.3 | Say It Out Loud | Theory | 30 min | Why decisions made silently die silently. The commitment act: write it, say it, tell someone. Making it irreversible enough that you can't sleepwalk back. Henry's story: "I just went to the computer and started doing things." |
| 5.4 | Practice: Commit | Practical | 40 min | Run the `/decision` skill. Write the decision statement, assess the risk, identify who to tell, set the date. The skill validates: is this specific enough? Is there a date? Have you told someone? Output: your decision statement saved to your personal folder. |

**Skill:** `/decision` — Decision statement, risk assessment, witness identification, deadline. Validates specificity and commitment level.

---

#### Module 6: The Plan
**Methodology phase:** Decomposition
**Description:** Break the decision into what you actually DO. Objectives, tasks, habits. The plan fits on one page.
**Time:** ~2.5 hours (4 classes)
**Learning outcome:** You have a one-page plan with objectives (measurable), tasks (daily, completable in 2 hours), and 1-2 habits (with triggers).
**Key concepts:** Objectives vs tasks vs habits, sequencing, minimum viable progress, the one-page plan.

| # | Class Title | Type | Duration | Description |
|---|---|---|---|---|
| 6.1 | Objectives, Tasks, Habits | Theory | 30 min | The three layers of execution. Objectives have metrics. Tasks have deadlines. Habits have triggers. Decisions without habits decay. Habits without decisions drift. You need all three. |
| 6.2 | The First Task | Theory | 30 min | The most important question: "What do I do tomorrow morning?" If the plan doesn't answer that, it's not a plan. It's a document. Tasks must be completable in under 2 hours. Sin #4: deciding without decomposing. Sin #5: decomposing without deciding. |
| 6.3 | One or Two Habits, Not Ten | Theory | 30 min | Research says 1-2 simultaneous habits max. Habit stacking: "After I [existing behavior], I will [new behavior]." The trigger is more important than the habit itself. |
| 6.4 | Practice: Build Your Plan | Practical | 40 min | Run the `/decompose` skill. List 3-5 objectives with metrics, sequence the tasks, define 1-2 habits with triggers, identify the first task. The skill checks: are tasks small enough? Are dependencies mapped? Is the first task identified? Output: your one-page plan saved to your personal folder. |

**Skill:** `/decompose` — Objectives, tasks, habits, sequencing, first-task identification. Validates plan completeness and task granularity.

**ACT II CHECKPOINT:** Before moving to Act III, answer: "My dominant constraint is ___. My decision is ___. My first task tomorrow is ___." If you can say all three, proceed.

---

### ACT III: MOVE (Month 3, ~8 hours)

#### Module 7: Doing the Thing
**Methodology phase:** Execution
**Description:** The daily rhythm. One task per day. Not motivation. Not willpower. Just the thing. What to do when emotions override the plan.
**Time:** ~2.5 hours (4 classes)
**Learning outcome:** You have a daily execution protocol and know the difference between "hard but working" and "not working."
**Key concepts:** Daily rhythm, minimum viable progress, the emotion layer, hard vs wrong.

| # | Class Title | Type | Duration | Description |
|---|---|---|---|---|
| 7.1 | Wake Up, Do the Thing, Go to Sleep | Theory | 30 min | The execution protocol is three steps. Check today's task, do it, record yes or no. The streak is not the point. The direction is the point. "The reward is the execution itself." |
| 7.2 | When You Miss a Day | Theory | 30 min | Nothing. Don't restart. Don't guilt. Do tomorrow's task tomorrow. Minimum viable progress: 15 minutes counts. All-or-nothing thinking prevents sustainable execution. |
| 7.3 | Fear, Grief, Shame, Exhaustion | Theory | 35 min | Emotions are not execution failures. They are environment variables. Fear = the decision is real. Grief = slow down, don't stop. Shame = you're comparing your Phase 6 to someone else's Phase 8. Exhaustion = reduce task size, not task count. |
| 7.4 | Practice: Your Execution Protocol | Practical | 35 min | Run the `/execute` skill. Define your daily rhythm, set your minimum viable progress, identify your likely emotional obstacle, write your "when X happens, I will Y" response. The skill creates a personalized accountability framework. Output: your execution protocol saved to your personal folder. |

**Skill:** `/execute` — Daily rhythm, MVP definition, emotional obstacle plan. Creates personalized accountability structure.

---

#### Module 8: What Reality Tells You
**Methodology phase:** Feedback + Re-evaluation
**Description:** The weekly review. Is the plan working? Is the constraint still right? When to adjust vs when to persist.
**Time:** ~2.5 hours (4 classes)
**Learning outcome:** You have a weekly review protocol and know when to adjust, persist, or backtrack.
**Key concepts:** Weekly review, hard vs wrong feedback, backtracking rules, the loop never pauses.

| # | Class Title | Type | Duration | Description |
|---|---|---|---|---|
| 8.1 | The 15-Minute Sunday | Theory | 30 min | The weekly review cadence. Five questions: what changed in your state map? Closer to target? Constraint still right? Tasks moving the needle? Anything major happen? |
| 8.2 | Hard vs Wrong | Theory | 30 min | Hard feedback: uncomfortable but progressing. Wrong feedback: 2+ weeks, no movement, something is off. Hard = keep going. Wrong = backtrack to Phase 5 or Phase 3. |
| 8.3 | When Life Interrupts | Theory | 35 min | The loop never pauses. Your "old life" isn't ready for the "new you." Disruptions during progress are normal. The WRONG move: make the disruption your new constraint (deciding from fear). The RIGHT move: go back to state mapping, keep the end state, reassess. |
| 8.4 | Practice: Your First Review + Win Check | Practical | 35 min | Run the `/review` skill. Run the 5 review questions on your actual progress, plus the win check: "What is ONE thing that improved this week because of your decision?" The skill analyzes your review and recommends: persist, adjust, or backtrack. Output: your review + win saved to your personal folder. |

**Skill:** `/review` — 6 questions (5 review + 1 win check), state map update, progress assessment. Recommends action based on review data.

---

#### Module 9: Resolution + The Next Loop
**Methodology phase:** Resolution + Maintenance + New Cycle
**Description:** How to know when the constraint is resolved. Maintenance to prevent regression. Starting the next cycle with accumulated skill.
**Time:** ~2.5 hours (4 classes)
**Learning outcome:** You know your resolution criteria, have a maintenance protocol, and can identify your next dominant constraint.
**Key concepts:** Resolution criteria, maintenance, skill accumulation, the infinite loop.

| # | Class Title | Type | Duration | Description |
|---|---|---|---|---|
| 9.1 | How You Know It's Done | Theory | 30 min | The constraint is resolved when: your state map changed measurably, daily tasks feel like maintenance not effort, and a new discomfort has surfaced. Premature resolution = declaring victory too early. |
| 9.2 | Holding the Line | Theory | 30 min | Resolved constraints can regress. The 1-2 habits you installed continue. Regression signals: if the old discomfort returns, check your habits. Maintenance is not optional. |
| 9.3 | The Second Cycle Is Faster | Theory | 30 min | You're not the same person who started. Your state mapping is faster, constraint ID is sharper, decisions are cleaner. The system compounds. Life is an infinite evolution path. New constraints always come. That is the game. |
| 9.4 | Practice: Close the Loop, Write Your Win, Open the Next | Practical | 40 min | Run the `/resolution` skill. Assess resolution criteria. Write your win story (what the constraint was, what you decided, what changed, what it cost, what you know now). Set maintenance habits. Identify the next discomfort. The skill validates resolution, celebrates the win, surfaces the next constraint, and sets up the next cycle. Output: your win story + next cycle setup saved to your personal folder. |

**Skill:** `/resolution` — Resolution check, win story (5 questions), maintenance protocol, next constraint identification. Validates completion, celebrates the win, and initiates next cycle.

**ACT III CHECKPOINT / COURSE COMPLETION:** "My constraint was ___. My decision was ___. Here's what changed in my state map: ___. My next dominant constraint is ___." If you can say all four, the course did its job.

---

### Resources (always accessible)

- **Glossary:** All Right Decision vocabulary with plain-English equivalents
- **Skills Reference:** All 9 skills listed with descriptions and what they produce
- **Re-entry Guide:** "Which module do I revisit for my second cycle?" (mapped to entry-point logic from methodology)
- **Course as Reference:** The course is designed to be revisited when life triggers recall. If something happens and you think "they said something about this in Module 4," come back. The content is navigable as a knowledge base, not just sequential.

---

## 4. Exercise Design Principles

### The skill IS the exercise

Every practical class (one per module) uses a Claude skill that guides the student through the exercise. Two assets per module:
1. **The class** (in the platform): teaches the concept, shows the skill flow, demonstrates expected output
2. **The skill** (installed in Claude Cowork): IS the exercise — asks questions, the student answers, AI saves structured output

There is no separate docx questionnaire step. The student's manual work is the THINKING — answering the skill's questions in their own words. The AI's work is the STRUCTURING — organizing answers into a coherent document.

### Thinking-first, structuring-second

The student does the thinking (answers questions, names constraints, makes the decision). The AI does the structuring (organizes answers, generates output documents, surfaces patterns). The AI never replaces the student's thinking. It structures it.

This is different from "manual-first, AI-second" — the student doesn't fill a worksheet first and then run AI. The exercise starts with the skill. The skill asks questions. The student's answers ARE the manual work.

### The "doing the work" flow

1. Watch the practical class (30-40 minutes) — learn the concept, see the skill demo
2. Run the module's skill in Claude Cowork (e.g., `/state-map`, `/constraint-id`, `/decision`)
3. The skill asks deep questions — the student answers in their own words
4. The skill saves raw answers to `raw.md` in the student's personal folder
5. The skill generates a structured `document.md` for that phase
6. The skill shows key insights in-chat and points to the full document for details
7. The student's personal folder accumulates a complete decision archive across all 9 modules

### Why skills and a personal folder

Each skill follows the same input → document pattern used throughout the Right Decision methodology. The student's personal folder becomes their decision archive. By Module 9, the folder contains: discomfort mapping, state map, target state, constraint ID, decision statement, one-page plan, execution protocol, weekly reviews, win story, and loop closure. This gives the AI persistent context across the full cycle — and sets up the next cycle with full history.

### Self-checkpoints

Between acts, the student answers a checkpoint question that summarizes what they've built so far. If they can't answer it, they revisit the relevant module. Checkpoints are NOT quizzes about theory. They are proof of work: "Can you state your gap? Have you committed? Has your state changed?"

---

## 5. Onboarding Design

**Duration:** 30 minutes (2 classes).
**DO:** Explain how the course works. Set up Claude Cowork + install skills. Choose the throughline decision.
**DO NOT:** Repeat the sales pitch. Tell the origin story. Explain why decisions matter (they already bought). Get technical about how skills work under the hood.

### Onboarding content

**Class 0.1 — Welcome. Choose Your Decision.** (15 minutes)
1. "Here's how this course works." (5 minutes)
   - 3 acts, 9 modules, 3 months, 2 hours/week
   - Every module ends with a practical exercise using a Claude skill
   - You carry ONE decision from start to finish
2. "Choose your decision." (10 minutes)
   - Answer the three throughline questions
   - Write your decision statement
   - This is the decision you'll work on for the next 3 months

**Class 0.2 — Your AI Partner: Setting Up Skills** (15 minutes)
1. "Install Claude Cowork" (5 minutes)
   - Step-by-step walkthrough with screenshots
   - Create a folder on your computer called "My Right Decision"
2. "Install The Right Decision skills" (5 minutes)
   - One-click installation (or step-by-step if manual)
   - Show the skills list: one per module exercise
3. "See it in action" (5 minutes)
   - Live demo: run a skill, answer questions, see the output
   - "This is what every practical class will feel like"
   - The AI doesn't decide for you — it asks better questions

---

## 6. Pacing + Completion Strategy

### The engagement curve

Typical self-paced completion rate: 5-15%. The drop-off point: Week 3-4 (end of Act I, start of Act II). This is where the methodology gets hard (you have to name your constraint and commit).

### Tactics

- **Weekly email nudges:** "Module 4 is where it gets real. The constraint you're avoiding is the one that matters."
- **Act completion celebrations:** "You finished Act I. You now know more about your situation than most people learn in years of therapy."
- **Folder progress visibility:** The personal decision folder becomes a visible artifact of progress. 3 documents = Act I done. 6 = Act II. 10 = complete (including win story).
- **Dead zone intervention (Week 4):** A specific email: "Most people quit here. The constraint they identified in Module 4 scared them. That fear IS the signal. Open the docx."

---

## 7. Course Summary Table

| Module | Act | Phase | Classes | Time | Practical Exercise |
|---|---|---|---|---|---|
| Onboarding | — | — | 2 | 30 min | Throughline decision + AI skills setup |
| 1: The Wake-Up Call | I | Awareness | 4 | 2.5h | Discomfort Mapping |
| 2: Where You Actually Are | I | State Mapping | 4 | 2.5h | State Map |
| 3: Where You Want to Be | I | Target State | 4 | 2.5h | Target State |
| 4: The One Thing in the Way | II | Dominant Constraint | 4 | 2.5h | Constraint ID |
| 5: The Decision | II | Decision | 4 | 2.5h | Decision Statement |
| 6: The Plan | II | Decomposition | 4 | 2.5h | One-Page Plan |
| 7: Doing the Thing | III | Execution | 4 | 2.5h | Execution Protocol |
| 8: What Reality Tells You | III | Feedback | 4 | 2.5h | Weekly Review |
| 9: Resolution + Next Loop | III | Resolution | 4 | 2.5h | Loop Closure + Next |
| **Total** | | | **38** | **~23.5h** | **10 documents** |

---

## Quality Checklist

- ✅ Three-act structure (See Clearly, Decide, Move)
- ✅ Every module lists classes with actionable learning outcomes
- ✅ Student chooses throughline decision in onboarding
- ✅ Exercises are thinking-first (student answers), structuring-second (AI organizes) — the skill IS the exercise
- ✅ Time estimates per module (~2.5h) and total (~23h + onboarding)
- ✅ Dead zone addressed with specific email at Week 4
- ✅ Onboarding is 15 minutes and skips the sales pitch
- ✅ Resources section for re-entry (not a conclusion module)
- ✅ Variety in theory classes (case studies, scenarios, concepts, stories)
- ✅ Self-checkpoints between acts (proof of work, not quizzes)

**Result: 10/10 criteria met.**

---

## Decision Log

| Date | Decision | Why | Watch signal |
|---|---|---|---|
| 2026-04-04 | 3 acts × 3 modules = 9 modules | Pedagogical grouping matches narrative arc | If students don't perceive the acts, flatten |
| 2026-04-04 | 4 classes per module (3 theory + 1 practical) | Hits ~2.5h per module, ~23h total | If too long, cut to 3 classes |
| 2026-04-04 | ~~Docx as exercise format~~ → Replaced 2026-04-06: Skill IS the exercise | Originally: portable decision archive. Now: skill interaction produces the archive directly. | N/A — superseded |
| 2026-04-04 | Manual-first, AI-second | Builds real skill, prevents outsourcing thinking | If manual step is skipped, simplify the questionnaire |
| 2026-04-06 | Exercise = AI skill (not docx + AI supplement) | JTBD: the exercise IS the skill interaction. Thinking is manual, structuring is AI. No separate docx step. | If students find pure-AI exercises less meaningful, add optional manual pre-step |
| 2026-04-06 | Added win-writing to Modules 8 and 9 | JTBD: win-oriented framing from methodology. Resolution = celebration. Win stories feed future Wins Board. | If students skip win-writing, make it shorter |
| 2026-04-06 | Course designed as reference, not just sequential | JTBD: Little Hire is "come back for information when life triggers recall." Course must be navigable. | If students never return, the content may not be dense enough |
| 2026-04-04 | No Module 0 or Module 10 (onboarding + resources instead) | Don't repitch. Don't pad. | If students feel lost, expand onboarding |
| 2026-04-04 | Week 4 dead-zone email | Predicted drop-off at Act I→II transition | If completion is <10%, add more interventions |

---

## Override Warnings

All earlier documents (business model, manifesto, methodology) have been updated to reflect:
- 9 modules across 3 acts
- ~23 hours over 3 months
- 8-phase methodology
- Docx questionnaire + AI prompt exercise format

Remaining for future docs:
- **Landing page (doc #5)** should reference the three-act structure and the skills-first exercise design.
- **VSL (doc #6)** should use the updated module count and duration.

**2026-04-06 update:** Exercise design rewritten from "docx questionnaire + AI prompt" to "skill IS the exercise." Win-writing added to Modules 8 and 9. Course-as-reference navigation added to Resources. All changes driven by JTBD analysis (doc #7).

---

**Next step:** Run `/d-auto landing page` to build doc #5, which sells this course. Or run `/d-tasks` to extract the content creation tasks from this outline (37 classes to write + 10 docx templates to create).
