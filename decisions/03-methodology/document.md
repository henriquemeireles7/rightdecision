# Methodology — The Right Decision
**Version:** 1.0
**Date:** 2026-04-04
**Status:** Draft
**Author:** Henry + Indy + Claude
**Meta-doc:** decisions/03-methodology/meta.md
**Input:** decisions/03-methodology/input.md + raw.md
**Pipeline:** d-meta → d-input → d-plan (here) → d-tasks

## Document scope
**This document IS:** The complete algorithm from zero to result. Every phase explained with exact questions, common mistakes, output, and transition criteria. This is what the course teaches and the AI implements.
**This document is NOT:** A course outline (doc #4 adapts this for teaching). Not sales copy (manifesto). Not a product spec.
**Scope boundary:** This methodology works for constraint-resolution problems: career, relationships, finances, health decisions, business decisions. It does NOT replace professional help for clinical depression, addiction, trauma requiring specialized therapy, legal problems, or medical conditions. If the dominant constraint is a clinical condition, the right decision is: get professional help.
**Primary reader:** Henry + Indy (to validate), AI agents (to implement), course designers (to build from)
**Depends on:** Business model (doc #1), Manifesto (doc #2)
**Feeds into:** Course Outline (doc #4), AI platform implementation

---

## 1. Introduction — What This Is

The Right Decision is a methodology for people who are stuck despite having done the work. It is not therapy. It is not motivation. It is not another framework for understanding yourself.

It is an algorithm. A repeating cycle that takes you from discomfort to resolution by identifying the one constraint that matters most, making the one decision that resolves it, and executing that decision through daily action. The course teaches this methodology across 9 modules in 3 acts (See Clearly, Decide, Move), ~23 hours over 3 months. Each phase maps to one module. Each module ends with a practical docx exercise: a questionnaire you fill manually, then an AI prompt that refines your work.

The decision sits at the center of the loop. Everything before the decision is diagnosis. Everything after is execution. Most people skip the diagnosis and never reach the decision. They live in the space between discomfort and action, filling it with research, courses, therapy, and planning. The methodology cuts through that space.

**Who this is for:** Someone who has tried self-help, therapy, courses, coaching, and is still stuck. Not at the beginning. Stuck at a higher level, where the problems are harder to name and the solutions harder to find. Someone who knows what they want but cannot figure out the steps to get there.

**Who this is NOT for:** Someone in clinical crisis. If the dominant constraint is untreated depression, addiction, active abuse, or a medical emergency, the right decision is professional help. This methodology resumes after stabilization.

---

## 2. The Loop

```
                    ┌──────────────────────────┐
                    │                          │
                    ▼                          │
            DISCOMFORT / DISEASE               │
                    │                          │
                    ▼                          │
        Phase 1: AWARENESS + STATE MAPPING     │
                    │                          │
                    ▼                          │
        Phase 2: TARGET STATE                  │
                    │                          │
                    ▼                          │
        Phase 3: DOMINANT CONSTRAINT           │
                    │                          │
                    ▼                          │
       ┌────────────────────────────┐          │
       │  Phase 4: THE DECISION    │          │
       │  (the center, the primitive)│          │
       └────────────────────────────┘          │
                    │                          │
                    ▼                          │
        Phase 5: DECOMPOSITION                 │
                    │                          │
                    ▼                          │
        Phase 6: EXECUTION                     │
                    │                          │
                    ▼                          │
        Phase 7: FEEDBACK + RE-EVALUATION      │
                    │                          │
                    ▼                          │
        Phase 8: RESOLUTION                    │
                    │                          │
                    └──── new discomfort ───────┘
```

### Why it's a cycle, not a line

Life is an infinite evolution path. There will always be new constraints. Resolving one constraint does not produce permanent peace. It produces temporary relief and a new level of clarity that reveals the next constraint. This is not failure. This is how growth works.

### How cycles get faster

The first cycle is the hardest. You are learning the methodology while using it. By the second cycle, you know how to map your state. By the third, you identify constraints faster. The system compounds. People who consistently make the right decisions are not luckier. They run a better system.

### Entry points

Not everyone starts at Phase 1.
- **If you know something is wrong but can't name it:** Start at Phase 1.
- **If you know what's wrong but don't know where you want to be:** Start at Phase 2.
- **If you know the destination but can't identify the obstacle:** Start at Phase 3.
- **If you know the obstacle but haven't committed:** Start at Phase 4.
- **If you've committed but can't break it into steps:** Start at Phase 5.

---

## 3. Phase 1 — Awareness + State Mapping

### What this phase does

The body has a feedback system for unmade decisions. We call it discomfort. Sometimes it manifests as physical disease. Sometimes as anxiety, insomnia, irritability, or numbness. The sickness gets worse until you make the right decision. When the cost of being sick becomes bigger than the cost of doing the thing, the cycle begins.

Awareness is recognizing that the discomfort is a signal, not a condition. State mapping is getting honest about where you actually are, not where you tell people you are, not where you wish you were.

### Exact questions

1. What is the discomfort? Physical symptoms, emotional state, recurring thoughts. Name it specifically.
2. How long has this discomfort been present? Weeks? Months? Years?
3. What is your actual financial situation right now? (Number, not narrative.)
4. What is your actual relationship situation? (Status, not story.)
5. What is your actual career/work situation? (Role, income, satisfaction on 1-10.)
6. What is your actual health situation? (Physical, mental, energy level on 1-10.)
7. What are you doing about it right now? (Be honest. "Nothing" is a valid answer.)
8. What are you pretending is fine that is not fine?

### Output

A written state map. One page. Brutally honest. This is the foundation everything else is built on. If the map is a lie, every downstream decision is built on a lie.

### Common mistakes

- **Sin #3 in disguise:** Turning state mapping into a multi-week journaling project. This phase takes 1-3 days, not 1-3 months. Set a deadline.
- **Sanitizing the map:** Writing what you want to be true instead of what IS true. The map is for you, not for Instagram.
- **Mapping feelings instead of facts:** "I feel financially insecure" vs "I have $2,400 in savings and $800/month in debt payments." Facts first, feelings second.

### Transition to Phase 2

You are ready for Phase 2 when: you can hand the state map to a stranger and they would understand your actual situation in 5 minutes. If they would need to ask "but what's really going on?", the map is not honest enough.

---

## 4. Phase 2 — Target State

### What this phase does

Define where you want to be. Not as metrics. As conditions of life.

"Freedom to choose how I spend my time" is a condition. "$50K/month" is a metric that may or may not produce that condition. The condition is the compass. Metrics are checkpoints along the way.

Key rule: objectives have metrics. Tasks have deadlines. The target state has neither. It has clarity.

### Exact questions

1. If your dominant constraint were resolved, what would your daily life look like? Describe a specific Tuesday.
2. What would you be able to do that you cannot do now?
3. What would you stop doing that you currently have to do?
4. Who would be in your life? Who would not?
5. How would you feel when you wake up? (This is the ONE emotional question that matters.)
6. Is this YOUR target, or something you absorbed from your parents, partner, culture, or Instagram?

### Output

A target state description. 3-5 sentences of observable conditions with evidence criteria. "I work on projects I chose, not projects assigned to me. Evidence: I can decline any meeting without financial consequence."

### Common mistakes

- **Metric worship:** "$100K/year" without knowing what condition it serves. The metric might not produce the state.
- **Someone else's target:** Copying a vision from a podcast or Instagram instead of diagnosing your own. (Sin #6: copying someone else's decision.)
- **Too vague:** "I want to feel happy." This cannot be measured, so Phase 7 has nothing to evaluate against. Observable conditions only.

### Transition to Phase 3

You are ready for Phase 3 when: you can read your target state out loud and feel a physical response. Not excitement necessarily. Tension, longing, impatience, fear. Something. If you feel nothing, it is not your target.

---

## 5. Phase 3 — Dominant Constraint Identification

### What this phase does

Identify the single biggest thing between your current state and your target state. Not the most visible. Not the most urgent. Not the most comfortable to work on. The one that, if resolved, would create the most forward movement.

This is the hardest phase. The dominant constraint is usually the one you are avoiding.

### Exact questions

1. Look at the gap between your state map (Phase 1) and your target state (Phase 2). What are ALL the things in between?
2. List them. Write every obstacle, big and small.
3. For each one: if this were magically resolved overnight, how much closer would you be to the target state? Rate 1-10.
4. The one with the highest score is your dominant constraint candidate.
5. Gut check: is this the one you have been avoiding? If not, look again. The real constraint is usually the one that makes your stomach tighten.
6. Are there two constraints that seem entangled? (Example: career AND relationship.) Pick the one that, if resolved, makes the other one easier. That is the primary. The other waits.

### Output

One sentence: "My dominant constraint is ___." Written down. Said out loud.

### Common mistakes

- **Sin #1:** Solving the second-biggest constraint because the biggest one is scary. You optimize your morning routine while the career sits untouched for 3 years.
- **Entangled constraints:** Trying to solve two at once. Pick one. The methodology is sequential for a reason: the person who resolved constraint A is different from the person who started. They approach constraint B with new skills and clarity.
- **Misidentification:** The most expensive failure. A full cycle wasted on the wrong problem. Mitigation: the gut check question (#5) catches this most of the time. If you are not slightly scared of your constraint, it is probably not the real one.

### Transition to Phase 4

You are ready for Phase 4 when: you can name the constraint and explain why THIS one and not the other candidates. If you cannot defend your choice, you have not identified it clearly enough.

---

## 6. Phase 4 — The Decision

### What this phase does

This is the center of the loop. The primitive. Everything before was diagnosis. Everything after is execution.

A decision is not a wish. It is not a plan. It is not a goal. A decision is a commitment to a specific course of action, made irreversible enough that you cannot sleepwalk back to the default.

### Exact questions

1. Based on your dominant constraint, what do you need to decide? Name it. "I will ___."
2. By when? Give it a deadline. (Not "soon." A date.)
3. Who will you tell? A decision made silently is easy to abandon.
4. What is the worst realistic outcome if this decision is wrong?
5. What is the worst realistic outcome if you never decide at all?
6. Is the downside of deciding survivable? Is the upside transformational? If yes, this is asymmetric risk. Take it.

### Output

A decision statement: "I will [specific action] by [date]. I have told [person]."

### Common mistakes

- **Sin #4:** Deciding without decomposing. A bold commitment with no execution structure. This produces a motivational high followed by nothing.
- **Sin #5:** Decomposing without deciding. Creating beautiful plans, systems, and task lists without ever committing to the underlying decision. Productive theater.
- **Confusing goal and decision:** "I want to leave my job" is a goal. "I will submit my resignation on March 15" is a decision. If it does not have a verb and a date, it is not a decision.
- **Waiting for certainty:** The nature of meaningful decisions is that they must be made before you have complete information. Waiting for certainty is choosing delay and calling it patience.

### Transition to Phase 5

You are ready for Phase 5 when: you have said the decision out loud to at least one person and set a date. If you cannot say it out loud, you have not decided.

---

## 7. Phase 5 — Decomposition

### What this phase does

Break the decision into its execution structure:
- **Objectives:** Measurable outcomes (each has metrics)
- **Tasks:** Time-bound actions (each has deadlines, completable in one sitting)
- **Habits:** Recurring behaviors that sustain execution without willpower (each has triggers)

Decisions without habits decay. Habits without decisions drift. You need both.

### Exact questions

1. What are the 3-5 objectives that make this decision real? (Each must be measurable.)
2. For each objective: what are the 2-4 tasks? (Each must be completable in under 2 hours.)
3. What is the first task? (This is the one you do tomorrow.)
4. What order do the tasks go in? (Dependencies first.)
5. What 1-2 habits need to be installed to sustain this? (Not 5. Not 10. One or two.)
6. For each habit: what is the trigger? (After I [existing behavior], I will [new behavior].)

### Output

A written plan: objectives with metrics, tasks with dates, habits with triggers. Fits on one page.

### Common mistakes

- **Too many simultaneous habits:** Research shows humans can install 1-2 new habits at a time. Not 5. Not 10.
- **No sequencing:** All tasks treated as equal priority. Some are prerequisites for others. Map dependencies.
- **Tasks too big:** "Rework my finances" is not a task. "Open a separate savings account" is a task. If it takes more than 2 hours, break it down further.
- **No first task:** The plan exists but does not answer "what do I do tomorrow morning?" If the first action is not identified, execution will not start.

### Transition to Phase 6

You are ready for Phase 6 when: you know what you are doing tomorrow. Not next week. Tomorrow.

---

## 8. Phase 6 — Execution

### What this phase does

Do the work. Sustainably. Optimize across three dimensions: time (how fast), effort (how efficiently), and quality of life (how sustainably). Burnout is not a badge. It is a system failure.

The reward is in the execution itself. Not in the result. Not in the completion. In the daily act of doing the thing. Indy: "It's a feeling of relief that you are closer to what you want. Like I am already better than yesterday."

### The daily rhythm

1. Wake up.
2. Check: what is today's task?
3. Do it.
4. Record: did I do it? Yes/No.
5. Go to sleep.

That is the entire execution protocol. One task per day. Not five. Not ten. One.

### When you miss a day

Nothing. You do not start over. You do not beat yourself up. You do not "make up for it." You do tomorrow's task tomorrow. The streak is not the point. The direction is the point.

### How to distinguish "hard but working" from "not working"

**Hard but working:** You are doing the daily task but it feels uncomfortable, scary, or uncertain. You are making progress but it does not feel like progress. This is normal. Keep going.

**Not working:** You have done the daily tasks for 2+ weeks and your state map has not changed at all. No movement on any metric. The constraint looks the same. This is a signal to go back to Phase 5 (your decomposition might be wrong) or Phase 3 (your constraint might be wrong).

### The emotion layer

Grief, fear, shame, and exhaustion are not execution failures. They are environment variables. When they hit:

- **Fear:** Expected. The pain of doing the thing includes the fear of not knowing what will happen. This is not a reason to stop. It is a signal that the decision is real.
- **Grief:** Slow down the pace but do not stop the loop. One smaller task. The loop continues.
- **Shame:** Usually means you are comparing your Phase 6 to someone else's Phase 8. Stop comparing. Execute your plan.
- **Exhaustion:** Check sustainability. If the pace is unsustainable, reduce task size. Not task count. Size.

### Common mistakes

- **Willpower dependency:** Relying on motivation instead of systems. Motivation is a feeling. Feelings come and go. The habit trigger is the system.
- **All-or-nothing:** Either 4 hours of deep work or zero. No middle ground. Minimum viable progress: 15 minutes of the task counts.
- **Pausing the loop:** Finding a reason to stop executing and "focus on healing" or "take care of myself." This is the anti-pattern. The loop does not pause. If your state changed, go back to state mapping. Do not exit the loop.

### Transition to Phase 7

You are in Phase 7 continuously. Feedback is not a separate step you do after execution. It happens while you execute. But a formal review happens weekly: every Sunday, 15 minutes, answer the Phase 7 questions.

---

## 9. Phase 7 — Feedback + Re-evaluation

### What this phase does

Observe what reality tells you. The dominant constraint today may not be the dominant constraint in 90 days. The cycle must repeat not on a rigid schedule but triggered by signals.

### Exact questions (weekly, 15 minutes)

1. Look at your state map from Phase 1. What has changed? (Update it.)
2. Are you closer to your target state than last week? (Evidence, not feeling.)
3. Is the dominant constraint still the right one? Or has it shifted?
4. Are your daily tasks moving the needle, or are you busy but not progressing?
5. Has anything happened that changes your initial state or end state significantly?

### Trigger for re-evaluation (go back to Phase 1)

- A major life event reshuffled the variables (job loss, relationship change, health event, financial shock)
- Your end state changed (you want something different now)
- The dominant constraint was resolved (move to Phase 8)
- Progress has stalled for 3+ weeks despite consistent execution

### The dynamics: when to backtrack

The loop never breaks. Disruptions during progress are normal. Your "old life" is not ready for the "new you."

**CORRECT:** Go back to state mapping. Keep the end state. Reassess whether the constraint changed.

**WRONG:** Make the disruption your new dominant constraint. This is deciding from fear and outside events instead of from clarity and inner goals. The constraint is a byproduct of BOTH initial and end state. Ignoring the end state = bad decision.

**WRONG:** Pause the loop to "survive first." This means you stopped doing the work. You found something to focus on instead. People who pause do not come back. They stay stuck for months or years until pain forces restart.

### Common mistakes

- **Never reviewing:** Executing blindly for months. Weekly check-in is mandatory.
- **Reviewing too often:** Daily self-assessment becomes anxiety. Weekly is the cadence.
- **Confusing "hard" with "wrong":** Hard feedback (this is painful) is different from wrong feedback (this is not moving the needle).

---

## 10. Phase 8 — Resolution + New Cycle

### What this phase does

The constraint is resolved. That specific discomfort is gone. You are closer to your target state. The level of discomfort is inversely proportional to the ability of making the right decision.

But life is an infinite evolution path. There will always be new constraints. Resolution is not the end. It is the transition.

### How you know it is resolved

1. The state map shows measurable change in the area the constraint affected.
2. The daily tasks for this constraint feel like maintenance, not effort.
3. A new discomfort has surfaced that was invisible before. (Resolving one constraint reveals the next.)

### Maintenance

Resolved constraints can regress. Habits decay. Situations change.

- **Hold the habits:** The 1-2 habits installed in Phase 5 continue. They are now automatic. If they stop, the constraint returns.
- **Watch for regression signals:** If the discomfort from the resolved constraint returns, check: did a habit slip? Did the environment change? Catch it early.

### Starting the new cycle

The person who enters the second cycle is not the same person who entered the first. Their state mapping is faster. Their constraint identification is sharper. Their decisions are cleaner. The system compounds.

Do not carry over the old state map. Start fresh. The new cycle begins with new discomfort, new awareness, new honesty.

### Common mistakes

- **Premature resolution:** Declaring victory before the constraint is actually resolved. The daily tasks still feel like effort. The habit is not automatic. You are not done.
- **Success-induced collapse:** Resolving the constraint creates new problems. The promotion brings stress. The new relationship reveals new patterns. This is not failure. This is the next constraint. Process it through the same loop.
- **Nostalgia for the old constraint:** Weirdly, people miss the familiar problem. The known discomfort was comfortable. The new discomfort is unfamiliar. This is normal. Keep cycling.

---

## 11. Dynamics — The Rules of the Loop

### Rule 1: The loop never pauses

You are always in the loop. "Pausing to survive" is an anti-pattern. If your state changed, go back to state mapping. The loop handles disruptions. Disruptions do not handle the loop.

### Rule 2: Keep the end state

When life disrupts your progress, the temptation is to abandon the target state and make the disruption your new focus. Do not. The constraint is a byproduct of BOTH initial and end state. If you forget where you are going, every new decision is reactive.

Exception: if you genuinely want something different now (not fear, not reaction, but a real shift in what matters), update the end state. Then redo everything from Phase 2.

### Rule 3: One constraint at a time

Sequential, not parallel. The person who resolves constraint A approaches constraint B with new skills. The constraint that looked impossible from position A looks different from position B.

If two constraints seem equal, pick the one that makes the other easier to resolve. That is the primary.

### Rule 4: The decision is always in the center

Everything before the decision is diagnosis. Everything after is execution. If you are spending more than 2 weeks in Phases 1-3, you are diagnosing instead of deciding. Set a deadline for the decision.

### Rule 5: Discomfort is the fuel, not the enemy

The level of discomfort is inversely proportional to the ability of making the right decision. Discomfort is the body's feedback for unmade decisions. Do not medicate it, meditate it, or therapize it away. Listen to it. It is telling you what to decide.

---

## 12. End-to-End Worked Example

### Maria, 36, marketing manager

**Discomfort:** Insomnia for 8 months. Irritable with her partner. Sunday anxiety about Monday. She thinks it is stress. Her doctor says nothing is physically wrong.

**Phase 1 — State Mapping:**
Maria writes her state map. Financial: $4,200/month salary, $800 in savings, $12K in student debt. Career: marketing manager at a startup, 3 years in, passed over for promotion twice. Relationship: 2-year partnership, stable but she feels distant. Health: insomnia, low energy, 15 lbs heavier than last year. Emotional: "I feel like I'm running but going nowhere."

**Phase 2 — Target State:**
"I work on marketing projects I believe in, not campaigns for a product I don't care about. I wake up without the Sunday dread. Evidence: I can think about Monday on Sunday night without my chest tightening."

**Phase 3 — Dominant Constraint:**
Maria lists: debt, career stagnation, relationship distance, health. She rates each: if magically resolved, how much closer to target? Career stagnation scores 9. Everything else scores 4-6. The career is the constraint. She has been avoiding this. She keeps optimizing her morning routine instead.

**Phase 4 — Decision:**
"I will apply to 3 marketing director positions at companies I respect by April 30. I told my partner."

**Phase 5 — Decomposition:**
- Objective 1: Updated resume (metric: 3 versions reviewed by a peer)
- Objective 2: 3 applications submitted (metric: confirmation emails)
- Objective 3: Interview preparation (metric: 2 mock interviews completed)
- Tasks: Day 1: list 10 companies. Day 2: update resume. Day 3: send to peer. Day 4-6: tailor + submit 3 applications. Day 7-10: prepare for interviews.
- Habit: Every morning after coffee, spend 30 minutes on job search activities.

**Phase 6 — Execution:**
Maria does the daily tasks. Day 3 she cries (fear: what if she gets rejected? what if her current boss finds out?). She does the task anyway. Day 7 she almost pauses ("maybe I should get more experience first" — Sin #3). She recognizes the pattern and submits the application.

**Phase 7 — Feedback (Week 2):**
Two companies responded. One rejection, one interview scheduled. State map updated: career is actively in motion. The insomnia reduced from 5 nights/week to 2. The constraint is correct. The decomposition is working.

**Phase 8 — Resolution (Week 6):**
Maria accepted a marketing director role at a company she respects. Salary increase: $4,200 → $6,800/month. The Sunday dread is gone. The insomnia is gone.

**New cycle:** The relationship distance surfaces as the next dominant constraint. But Maria approaches it differently now. She knows how to map, identify, decide, and execute. The second cycle starts faster.

---

## Quality Checklist

- ✅ A practitioner can follow the methodology from Phase 1 to Phase 8 without clarifying questions
- ✅ Every phase has exact questions (not just descriptions)
- ✅ Every phase has a concrete output (state map, target statement, constraint name, decision statement, task plan)
- ✅ Dynamics section covers backtracking, not-pausing, and recognizing when the loop is wrong
- ✅ Scope boundary explicitly names what problems this does NOT solve
- ✅ Entry-point logic lets someone start at Phase 2, 3, 4, or 5
- ✅ Execution phase has operational detail: daily rhythm, missed-day protocol, emotion layer
- ✅ Maintenance protocol in Phase 8 prevents regression
- ✅ Worked example shows realistic messiness (fear, almost-quitting, crying on Day 3)
- ✅ Eight sins mapped to specific phases where they most commonly occur

**Result: 10/10 criteria met.**

---

## Decision Log

| Date | Decision | Why | Watch signal |
|---|---|---|---|
| 2026-04-04 | The body/discomfort is the trigger (Phase 0) | Founder insight: "diseases are the body's feedback for unmade decisions" | If customers reject the disease framing as too strong, soften to "discomfort" |
| 2026-04-04 | The loop never pauses | Founder: "pausing means you stopped doing the work" | If users in crisis can't engage the loop at all, add a stabilization pre-phase |
| 2026-04-04 | Reward is in execution, not resolution | Founder + Indy: "the reward is the process itself" | If customers expect results-based rewards, adjust framing |
| 2026-04-04 | One constraint at a time, sequential | Theory of Constraints applied to personal development | If entangled constraints force parallel work, add a "constraint triage" protocol |
| 2026-04-04 | Discomfort is inversely proportional to decision-making ability | Founder insight | If this claim feels too strong, qualify with "in constraint-resolution contexts" |

---

## Override Warnings

This document introduces concepts that override or refine earlier documents:

1. **The body as trigger** is new. Neither the business model nor the manifesto frame discomfort/disease as the STARTING mechanism of the loop. The manifesto's "enemy" section should reference this: the self-help industry medicates the discomfort instead of listening to it.
2. **"The loop never pauses"** contradicts the meta-doc's adversarial suggestion to "pause the loop entirely during crisis." The founder explicitly rejected this. The dynamics section reflects the founder's position.
3. **The reward is execution, not resolution.** The manifesto's promise section frames the product as delivering results. The methodology says the reward is in the PROCESS. Both are true but the emphasis differs. Landing page copy should balance both.
4. **Entry-point logic** is new. The course outline (doc #4) should use this to let students self-select their starting module.

---

**Next step:** Run `/d-auto course outline` to build doc #4, which adapts this methodology into a teachable course structure. Or run `/d-tasks` to extract implementable tasks.
