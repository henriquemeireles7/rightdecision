# META-DOC: Course Outline

## Purpose
Map the methodology (doc #3) into a teachable course structure. List every module and class with descriptions, learning outcomes, key concepts, and writing guidelines. This is the blueprint the content creator uses to write the actual course.

## Scope
**This document IS:** The course skeleton. Modules, classes, learning outcomes, exercises. Everything needed to START writing content.
**This document is NOT:** The course content itself (that's written separately from this outline). Not the methodology (doc #3). Not the landing page (doc #5).

## Primary reader
Content creators (Henry, Indy, AI agents writing course content).

## Input documents
- `decisions/03-methodology/document.md` — the 8-phase algorithm this course teaches
- `decisions/02-manifesto/document.md` — voice, tone, seven angles for framing
- `decisions/01-business-model/document.md` — pricing, ICP, offer structure

## Expert council
1. **ADDIE model** (Analyze, Design, Develop, Implement, Evaluate) — instructional design standard
2. **Bloom's taxonomy** — learning outcomes at the right cognitive level (apply/analyze, not just remember)
3. **Dan Pink** (Drive) — autonomy, mastery, purpose for motivation in self-paced learning
4. **Instructional design research** — completion rates, engagement curves, exercise design

## Research summary
**Layer 1:** Standard course design: modules → lessons → exercises → assessments. Learning outcomes must be actionable ("you can DO X" not "you understand X"). Consistent structure helps navigation but identical structure causes fatigue.

**Layer 2:** Self-paced course completion rates are 5-15% industry average. The "dead zone" hits at modules 3-4. Short-form content, natural pause points, and one throughline project improve completion. Manual-first, AI-second exercises build real skill vs passive prompting.

**Layer 3:** The methodology has 8 phases but 8 uniform modules is not pedagogically optimal. Phases group into ACTS: See Clearly (diagnosis), Decide (commitment), Move (execution). Acts create narrative arc and reduce perceived complexity.

**Adjacent wisdom:** Screenwriting three-act structure. Act I = setup (who am I, what do I want). Act II = confrontation (what's in the way, what do I commit to). Act III = resolution (execute, learn, transform). The course IS a transformation story, structured like one.

## Document-level failure modes
1. **Logical but not pedagogical.** Organizes the methodology correctly but not the learning. Process steps ≠ learning units.
2. **Uniform fatigue.** Identical module structure × 8 makes students skim by Module 3.
3. **Exercise = AI prompt only.** Outsources thinking to the tool. Students must do the work FIRST, then use AI to pressure-test.
4. **Dead zone at modules 3-4.** Engagement drops where effort increases. No re-engagement mechanism.
5. **No throughline.** Student learns each phase in isolation but can't execute the full loop. Needs ONE decision carried start to finish.

## Sections

### SECTION 1: Course Architecture
**Answers:** How is the course organized? Acts, modules, classes. The narrative arc. How long is it? What's the pacing?
**Done when:** A visual shows the full course structure at a glance: acts, modules, estimated time per module.
**Failure modes:**
- 8 uniform modules (should be 3 acts with variable-weight modules)
- No time estimates (students need to know how long each module takes)
- No "choose your decision" step before Module 1
**Max length:** 2 pages (diagram + explanation)
**Confidence:** 🟡 hypothesis

### SECTION 2: The Throughline
**Answers:** How does the student carry ONE decision from start to finish? What's the "spine" that connects all modules?
**Done when:** A clear instruction: "In Module 1 you choose your decision. Every exercise builds on it. By Module 8, it's resolved or in active execution."
**Failure modes:**
- No throughline: exercises are disconnected fragments
- Throughline is optional: must be mandatory, not suggested
- No guidance for choosing the right decision to work on during the course
**Max length:** 1 page
**Confidence:** 🟡 hypothesis

### SECTION 3: Module List
**Answers:** Every module with: title, brief description (2-3 sentences), which methodology phase it maps to, estimated time, position in the act structure.
**Done when:** Someone can read this list and understand the entire course journey in 5 minutes.
**Failure modes:**
- Descriptions are too vague ("learn about decisions")
- Missing time estimates
- No act grouping (just a flat numbered list)
**Max length:** 2-3 pages
**Confidence:** 🟢 validated (methodology phases are established)

### SECTION 4: Class-Level Detail (per module)
**Answers:** For EACH module, list every class/lesson with: title, brief description, learning outcome (actionable), key concepts introduced, exercise description (manual-first, AI-second), common mistakes.
**Done when:** A content writer can open any module section and write the full lesson without asking "what should this cover?"
**Failure modes:**
- Learning outcomes are knowledge-based ("understand X") instead of action-based ("write your state map")
- Exercises are AI-prompt-only (must include manual work first)
- No variety in delivery: every class is "read theory, do exercise" (should vary: case study, scenario, reflection, exercise)
- Key concepts introduced before exercises (should emerge FROM exercises)
**Max length:** 1-2 pages per module (biggest section of the document)
**Confidence:** 🟡 hypothesis

### SECTION 5: Exercise Design Principles
**Answers:** How are exercises structured across the course? Manual-first, AI-second rule. Self-checkpoints. Throughline connection.
**Done when:** A content creator knows the exercise philosophy and can design exercises that match it.
**Failure modes:**
- AI prompt IS the exercise (student outsources thinking)
- No fallback for when AI is unavailable
- Exercises don't build on the throughline decision
- No self-assessment mechanism ("can you answer X before moving on?")
**Max length:** 1 page
**Confidence:** 🟡 hypothesis

### SECTION 6: Onboarding + Conclusion Design
**Answers:** What happens before Module 1 (choose your decision, set expectations, skip the pitch) and after the last module (operational next steps, re-entry points, AI tool handoff).
**Done when:** Onboarding is <5 minutes and ends with the student having chosen their throughline decision. Conclusion is operational, not emotional.
**Failure modes:**
- Onboarding repeats the sales pitch (they already paid)
- Onboarding doesn't help them choose a decision (they arrive with vague "I'm stuck")
- Conclusion is a vague "keep going!" instead of specific re-entry instructions
**Max length:** 1-2 pages
**Confidence:** 🟡 hypothesis

### SECTION 7: Pacing + Completion Strategy
**Answers:** How do we fight the 5-15% industry completion rate? What engagement mechanisms exist? How do we handle the dead zone?
**Done when:** Specific tactics for re-engagement at the predicted drop-off points (post-Module 3).
**Failure modes:**
- No pacing guidance (student rushes through or stalls)
- No re-engagement (email triggers, progress nudges)
- Assumes motivation is constant (it's not — it drops after the novelty window)
**Max length:** 1 page
**Confidence:** 🔴 guess

## Quality checklist
- [ ] Course has a three-act structure, not 8 uniform modules
- [ ] Every module lists classes with actionable learning outcomes
- [ ] Student chooses a throughline decision before Module 1
- [ ] Exercises are manual-first, AI-second (never AI-only)
- [ ] Time estimates per module and total course duration
- [ ] Dead zone addressed with specific re-engagement tactics
- [ ] Onboarding is <5 minutes and skips the sales pitch
- [ ] Conclusion is operational (re-entry points, AI tool) not emotional
- [ ] Variety in class delivery (not every class is read→exercise)
- [ ] Self-checkpoints between acts ("can you answer X before continuing?")

## Reader journey
**After this document:** Content creators write the actual course content module by module. The AI platform implements the exercises as guided flows.
**Last section should bridge to:** "Open this outline when writing any module. Each class has its brief, learning outcome, and exercise spec. Write to the spec."

## Decision log
| Date | Decision | Why | Watch signal |
|---|---|---|---|
| 2026-04-04 | Three-act structure instead of 8 uniform modules | Adversarial review: "logical but not pedagogical" | If acts feel forced, flatten to modules |
| 2026-04-04 | Manual-first, AI-second exercises | Adversarial review: prompts alone outsource thinking | If students skip manual step, simplify it |
| 2026-04-04 | One throughline decision start to finish | Adversarial review: fragmented exercises don't teach the full loop | If students can't choose a decision, add more guidance |
| 2026-04-04 | Kill Module 0 as a full module, make it <5 min onboarding | Adversarial review: don't repitch after purchase | If students feel lost without context, expand slightly |
