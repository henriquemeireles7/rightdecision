# Jobs-to-be-Done — Life Decisions Software
**Version:** 1.0
**Date:** 2026-04-06
**Status:** Draft
**Author:** Henry + Claude
**Meta-doc:** decisions/lifedecisions/07-jobs-to-be-done/meta.md
**Input:** decisions/lifedecisions/07-jobs-to-be-done/input.md + raw.md
**Pipeline:** d-meta → d-input → d-plan (here)

## Document scope
**This document IS:** A JTBD analysis mapping the exact jobs Life Decisions customers are hiring a solution for — functional, emotional, and social. Every feature in the PRD must trace back to a job or underserved outcome documented here.
**This document is NOT:** A PRD (that's doc 08). Not the methodology (that's doc 03). Not marketing copy.
**Primary framework:** Moesta (qualitative/switch-driven) as primary lens. Ulwick (outcome statements, job map) as supplementary structure.
**Scope boundary:** Life Decisions B2C product only ($197/year). Business Decisions has its own JTBD.
**Research status:** ⚠️ ALL findings are hypotheses. Pre-revenue, no customer interviews. Confidence tags on every section.
**Primary reader:** Henry (build decisions), Indy (validate customer understanding), AI agents (implement features)
**Depends on:** Methodology (doc #3), Manifesto (doc #2), Business Model (doc #1)
**Feeds into:** PRD (doc #8) — every PRD feature must trace to a finding here

---

## 1. Overview — Research Context

This document uses Jobs-to-be-Done methodology to understand what progress our customers are trying to make — independent of our product. We chose Moesta's qualitative Switch framework as the primary lens because we're pre-revenue with no customer data. Ulwick's structured job mapping provides the decomposition framework for Sections 6-7.

**How to read this document:**
- Every section ends with "PRD implications" — the product decisions this finding demands
- Confidence tags: 🟢 validated (confirmed by multiple sources) | 🟡 hypothesis (reasonable inference from founder experience) | 🟡 hypothesis (all current findings)  | 🔴 guess (speculative, needs customer validation)
- When findings contradict existing docs, this document notes the contradiction and the recommended resolution

**How findings feed into the PRD:**
- Underserved outcomes (Section 7) → feature requirements
- Emotional/social jobs (Section 3) → UX principles
- Forces of progress (Section 4) → onboarding and conversion design
- Hiring/firing criteria (Section 4) → success metrics and churn prevention
- "Don't build" list (Section 9) → explicit scope boundaries

**Confidence:** 🟢 validated (this section is structural, not a finding)

---

## 2. Customer Segments by Struggling Moment

JTBD segments customers by the situation that creates demand, not by demographics. Two personas (Stuck Achiever, Overthinker) were defined in the business model. Here we re-segment by struggling moment — the specific threshold crossing that moves someone from "I should do something" to "I need to find a solution NOW."

### The Universal Trigger: The Discomfort Threshold

There is no universal trigger event. Every person is different. What matters is the THRESHOLD: the moment when the discomfort of staying stuck exceeds the discomfort of making the decision. The form of the trigger (life event, accumulation, mirror moment, body signals) is irrelevant. The intensity is everything.

This has a critical product implication: we cannot design for a specific trigger event. We must design for the THRESHOLD STATE — the person who has crossed it, regardless of what pushed them over.

### Segment 1: "The Eternal Self-Improver"
**Struggling moment:** Has completed multiple self-help programs (courses, books, coaching). Each time she felt improvement. Each time a life event revealed she's still in the same place. She just fired her latest solution and is looking for the next one. The threshold crossed: she's starting to suspect the PATTERN is the problem, not the individual solutions.

**What progress looks like:** Breaking the cycle itself. Not "getting better at understanding myself" (she's already great at that). Making ONE actual decision and executing it.

**Current workarounds:** Therapy (weekly), journaling (daily), online courses (2-3/year), self-help books (5-10/year), talking to friends.

**Why workarounds fail:** They are the cycle. Each workaround feels like progress because she's consuming and processing. But no decision is being made. She does the PRACTICE instead of the WORK. The practice feels productive — that's what makes it sticky.

**Confidence:** 🟡 hypothesis

### Segment 2: "The Threshold Crosser"
**Struggling moment:** A specific discomfort (insomnia, anxiety, relationship tension, career stagnation) has been building for months or years. It just crossed the threshold — the cost of staying sick/stuck is now bigger than the cost of doing the thing. The body's feedback system forced the issue.

**What progress looks like:** The specific discomfort is gone. Not "I feel better" but "the insomnia stopped" or "I changed jobs" or "I had the conversation." Observable, measurable change.

**Current workarounds:** Medicating the symptoms (sleeping pills, anxiety meds, alcohol, distraction). Processing the symptoms (therapy, meditation). Neither addresses the unmade decision causing the symptoms.

**Why workarounds fail:** They treat the discomfort as the problem instead of as feedback. The discomfort is the body telling you a decision is waiting. Medicating or meditating it away removes the signal without addressing the cause.

**Confidence:** 🟡 hypothesis

### Segment 3: "The Quiet Shrinker"
**Struggling moment:** Has been shrinking goals to fit comfort zone for years. The fox and the grapes — she doesn't want what she believes she can't achieve. The threshold crossing: something makes the resignation visible. A friend achieves what she gave up on. A birthday forces reflection. The gap between "where I am" and "where I wanted to be 5 years ago" becomes undeniable.

**What progress looks like:** Re-expanding ambition. Naming what she actually wants instead of what she's settled for. The target state exercise (Phase 2) is the unlock — it forces her to describe conditions of life, not shrunken goals.

**Current workarounds:** Gratitude practice ("I should be grateful for what I have"), comparison deflection ("everyone has their own path"), lifestyle optimization (optimizing the container instead of changing the contents).

**Why workarounds fail:** They've reframed resignation as maturity. The workaround IS the problem: it makes staying small feel like wisdom.

**Confidence:** 🔴 guess

### PRD implications
- **Onboarding must identify which segment the user is in** — not to route them differently, but to validate their specific pain. "You've tried everything and you're still here" (Segment 1). "Your body has been telling you something" (Segment 2). "What did you want 5 years ago that you've stopped wanting?" (Segment 3).
- **The throughline selection (from course onboarding) is the segment-identification moment.** The three onboarding questions already do this: "What have you been avoiding?" surfaces the constraint regardless of which segment triggered the search.
- **Copy must speak to ALL three segments** — landing page problem section already does this (manifesto Section 3).

---

## 3. Main Job Statements + Job Hierarchy

### Main Job Statement

**"When I've been going in circles on a decision that matters — and I've already tried understanding why I'm stuck — I want a structured process that forces me to actually decide and do, so I can stop being stuck and see real change in my life."**

This is the core functional job. It is:
- **Solution-agnostic:** No mention of courses, AI, skills, or our product
- **Situation-specific:** "Going in circles" + "already tried understanding" = our ICP, not everyone
- **At the right altitude:** Specific enough to design against, general enough to be stable over time
- **Stable:** This job existed before our product and will exist after it

### Three Dimensions

**Functional:** Get from "stuck on a decision" to "decision made and being executed" through a structured, repeatable process. Not a one-time breakthrough — a system that works for every subsequent decision.

**Emotional:** Feel like I'm finally doing the real work, not the practice. Feel relief that the circling has stopped. Feel the specific pride of having decided — not the generic pride of "self-improvement." Avoid feeling like this is another cycle of the eternal self-help loop.

**Social:** Be perceived as someone who acts, not someone who processes. Avoid being perceived as "still stuck" by the people who watch me try thing after thing. Eventually: be someone whose decisions inspire others (this is the Wins Board aspiration — the social job becomes a feature).

### Job Hierarchy: Big Hire vs Little Hire

**Big Hire (drives acquisition):**
"Break out of the eternal self-help loop by making the ONE decision that matters and executing it."

This is the transformation promise. It's why someone pays $197. The Big Hire is about CHANGE — observable, specific, life-level change.

**Little Hire (drives retention):**
"Come back for information when life triggers a need."

The Little Hire is NOT daily app engagement. It's episodic: something happens in life → the user remembers "they said something about this in Module 4" → she returns to the course content. The course is a living knowledge base that evolves over time.

Three mechanisms serve the Little Hire:
1. **Course as reference:** Dense content users return to when life events trigger recall
2. **Evolving content:** Skills and classes update over time — the product isn't static
3. **Wins Board:** Seeing others' victories creates a pull back into the platform (see Section 9)
4. **Daily content:** Podcast-to-blog-to-email as a daily touchpoint for all users

**Confidence:** 🟡 hypothesis

### PRD implications
- **The Big Hire determines the landing page promise** — already aligned with manifesto ("stop preparing, start deciding")
- **The Little Hire determines the retention architecture** — course must be navigable as a reference (not just sequential), content must update, Wins Board is the engagement loop
- **Emotional job drives UX:** Every interaction must feel like "doing the real work" not "doing another practice." This means: no fluffy onboarding, no inspirational quotes, no dashboards. Direct, honest, decision-forcing.
- **Social job is the Wins Board** — the aspiration to be seen as someone who acts becomes a product feature

---

## 4. Forces of Progress + Switching Timeline

### Push: Pain with Current Situation

| Push factor | Strength | Evidence |
|---|---|---|
| Accumulated discomfort: insomnia, anxiety, irritability, numbness | High | Methodology doc: "the body has a feedback system for unmade decisions" |
| Comparison to peers: "my friends have been married, with children, with money" | High | Manifesto VoC: exact customer language |
| The eternal self-help loop: realizing the PATTERN is broken, not just the current solution | High | Founder insight: "they fire the old one when they find the next one — the cycle never ends" |
| Goal shrinkage: waking up to how much they've compromised over the years | Medium | Manifesto: "she kept getting smaller and smaller" |
| Exhaustion with self-improvement: "I'm tired of trying to fix myself" | Medium | Manifesto emotional state map |

### Pull: Attraction of New Solution

| Pull factor | Strength | Evidence |
|---|---|---|
| Anti-self-help positioning: "this is NOT another course/book/practice" | High | Resonates specifically because she's exhausted with the category |
| Structured, finite process: "one decision, not a journey" | High | Counter to the open-ended nature of therapy, coaching, meditation |
| AI-powered personalization: "for YOUR life, not generic frameworks" | Medium | Differentiator vs books and courses |
| Specificity: "not a better life — one named decision with a date" | Medium | Counter to vague promises |
| Decision-as-primitive framing: intellectual resonance | Medium | "I've never heard anyone frame it this way" |

### Anxiety: Fear of New Solution

| Anxiety factor | Strength | Evidence |
|---|---|---|
| "Is this just the next cycle of the self-help loop?" | **Critical** | Founder insight: the eternal loop means EVERY new solution triggers this anxiety |
| "What if I pay $197 and it's another course I don't finish?" | High | Standard course anxiety, amplified by the graveyard of past courses |
| "What if it tells me to do something I'm not ready for?" | Medium | The methodology IS scary — naming the dominant constraint is confronting |
| "What if AI can't understand my unique situation?" | Medium | Skepticism about AI-powered self-help |
| "What if my friends think it's another self-help thing?" | Low-Medium | Social perception, especially for Segment 1 |

### Habit: Comfort with Current Coping

| Habit factor | Strength | Evidence |
|---|---|---|
| "Doing the work" disguise: therapy + journaling + courses FEEL productive | **Critical** | The coping mechanism is invisible because it looks like self-improvement |
| Resignation-as-maturity: "maybe this is just how my life is" | High | The strongest habit — it reframes inaction as acceptance |
| Sunk cost of current solutions: "I've been with my therapist for 2 years" | Medium | Switching cost is emotional, not financial |
| Comfort of known discomfort: the familiar problem is less scary than the unknown solution | Medium | "People who pause don't come back — they stay stuck for months/years" |

### Net Assessment

**Push + Pull > Anxiety + Habit** is NOT guaranteed. The critical barrier is anxiety ("another cycle of the same loop"), amplified by habit ("I'm already doing the work"). Both are at Critical strength.

**Strategic implication for the product:**
1. **Anxiety reduction is more important than feature additions for V1.** Money-back guarantee, small first step, "this is NOT another course" framing, showing HOW it's structurally different (three mechanisms).
2. **The "doing the work" disguise must be named explicitly.** The landing page must call out: "you're confusing consuming with deciding." This is already in the manifesto (Sin #3) but must be the primary conversion message.
3. **The Wins Board is the ultimate anxiety reducer** — real people, real decisions, real results. Social proof from people in the same loop.

### Hiring Triggers (what causes them to buy)

1. **A life event that breaks the resignation:** Job loss, relationship crisis, health scare, milestone birthday. The event itself doesn't cause the hire — it reveals that the current coping isn't working.
2. **Pattern recognition:** "Wait, this is the THIRD time I've done this exact cycle." The moment she sees the eternal loop. Not dissatisfaction with one solution — recognition that the PATTERN is the problem.
3. **Encountering the anti-self-help message:** "Everything else teaches you to understand. We teach you to decide and do." This line resonates specifically because she's been understanding without doing for years.

### Firing Triggers (what would cause them to leave)

These are NOT the inverse of hiring triggers:
1. **"I feel like I'm doing another practice."** If the exercises feel like journaling with extra steps, she fires us. The methodology must feel fundamentally different — decision-forcing, not insight-generating.
2. **"I finished the course but nothing changed."** If the throughline decision wasn't real, or she never crossed from Phase 4 to Phase 5, the same "completion without transformation" pattern repeats.
3. **"The AI felt generic."** If the skills ask the same questions regardless of her situation. The personalization must be real — based on her previous answers, her state map, her constraint.
4. **"I lost momentum and couldn't restart."** If the product has no mechanism to re-engage after a pause. The "loop never pauses" principle from the methodology must be embedded in the product.

### Switching Timeline

```
FIRST THOUGHT (months/years before purchase)
"Something needs to change"
    │
    ▼
PASSIVE LOOKING (weeks/months)
Scrolling Instagram, seeing self-help content, not ready to act
    │  ← Trigger: life event, accumulation, mirror moment
    ▼
ACTIVE LOOKING (days/weeks)
"How to make a big life decision" — Googling, reading reviews, comparing
    │  ← Trigger: encountering anti-self-help message, pattern recognition
    ▼
DECIDING (hours/days)
Landing page. "Is this different?" Reading wins. Checking price.
    │  ← Trigger: anxiety overcome by social proof + $197 low risk
    ▼
CONSUMING (3 months)
Course + skills. Throughline decision chosen. Methodology applied.
    │  ← Trigger: first constraint resolved, or course completed
    ▼
EVALUATING
"Did this actually change something?" State map comparison.
```

**Confidence:** 🟡 hypothesis (forces), 🔴 guess (switching timeline details)

### PRD implications
- **V1 must aggressively reduce anxiety.** Not as a "nice to have" — as a core architectural requirement. The Wins Board, money-back guarantee, "try Module 1 free" option, and structural-difference messaging are anxiety-reduction features.
- **The firing trigger "I feel like another practice" is the most dangerous.** Every product decision must be filtered through: "does this feel like a practice or like doing the real work?"
- **Re-engagement mechanism is critical.** When users pause, the product must pull them back without guilt. The Wins Board + daily content + evolving course content serve this.

---

## 5. Competitive Landscape (by Job, Not Category)

### The Job: "Get unstuck from a decision I've been circling"

| Competitor | What job it addresses | What it does well | Where it fails | Why they fire it |
|---|---|---|---|---|
| **Therapy** ($150-300/session) | "Understand why I'm stuck" | Deep emotional processing, safe space, professional guidance | Points backward (understanding past), not forward (deciding future). Never asks "what will you DO?" | They don't fire it — they keep it AND add our product. Therapy doesn't compete for the same job. |
| **Life coaching** ($200-500/hr) | "Tell me what to do" | External perspective, accountability, action-orientation | Creates dependency (Sin #2). The coach diagnoses. When coaching stops, she reverts. | They fire when they realize the coach's diagnosis doesn't stick — it wasn't THEIR decision. |
| **Online courses** ($47-997) | "Teach me a framework to apply" | Information, structure, sense of progress | Generic — teaches frameworks without applying to HER situation. Completion ≠ transformation. | They fire when a life event reveals they're still stuck despite "completing" the course. |
| **Self-help books** ($15-30) | "Give me insight about my situation" | Cheap, accessible, feels intellectually productive | Consumed, underlined, forgotten. Sophisticated procrastination (Sin #3). | They don't fire books — they collect them. The bookshelf IS the graveyard. |
| **Free ChatGPT** | "Help me think through this decision" | Free, immediate, private, no judgment | No methodology, no context continuity, no constraint identification. Generic answers to specific problems. | They fire when the conversation goes in circles and produces no decision. |
| **Meditation/spirituality** | "Find peace with my situation" | Calm, centering, community | Calm mind ≠ changed life. "One thing is a calm mind, another is results." | They fire when they realize peace without progress is just comfortable stagnation. |

### The Dominant Competitor: "Doing Nothing" (disguised as "Doing the Work")

This is not a row in a table. This is the primary competitor and it deserves full treatment.

**What it looks like:** She has a therapist (weekly). She journals (daily). She reads books (monthly). She takes online courses (2-3/year). She talks to friends about her situation (constantly). From the outside — and from the inside — she is "doing the work."

**Why it's sticky:** It IS productive. She IS processing. She IS understanding herself better. The disguise is perfect: the activity looks like progress, feels like progress, and is praised by her social circle as progress. "Oh, you're in therapy? Good for you." "Oh, you're taking that course? That's so healthy."

**What it costs:** Years. She has been "doing the work" for 2, 3, 5, 10 years. Her state map has barely changed. But the FEELING of progress is uninterrupted because she's always consuming something new. The cost is invisible: it's the decisions she didn't make, the life events that happened TO her instead of being chosen BY her.

**What breaks the habit:** Pattern recognition. The moment she sees the eternal self-help loop — not as "I picked the wrong solution" but as "THE PATTERN of picking solutions IS the problem." This is the hiring trigger for our product.

**Why we must name it explicitly:** If our product doesn't distinguish itself from "doing the work," we become part of the loop. The landing page must say: "You're not lazy. You're not broken. You're doing everything except the one thing that matters: deciding."

### The Self-Help Graveyard

The graveyard is not about individual solutions that failed. It's about the CYCLE:

1. **Start with enthusiasm** → the new solution feels different, energizing, hopeful
2. **Do the practice** → days, weeks, months of engagement. Real effort.
3. **Feel improvement** → genuine sense that things are changing
4. **Life event reveals the truth** → the improvement was in understanding, not in decisions. The situation hasn't actually changed.
5. **Fire and replace** → the old solution gets filed under "that was helpful but not enough." The new solution promises what the old one didn't deliver.
6. **Repeat.**

The graveyard creates category-level anxiety: "Is ANY solution going to work, or am I just going to do this forever?" This is the highest barrier to adoption.

**Confidence:** 🟡 hypothesis

### PRD implications
- **We are NOT competing with therapy, coaching, or books.** We're competing with the PATTERN of consuming them without deciding. The product must make this distinction visible.
- **"Doing nothing" must be called out by name in onboarding.** "You've been doing the work. But have you been making decisions?" This is the moment of recognition that converts.
- **The graveyard anxiety must be reduced, not ignored.** Three mechanisms: (1) structural difference messaging ("here's why this isn't another course"), (2) Wins Board (real people who broke the loop), (3) immediate action (make a real decision in Module 1, not in Module 9).

---

## 6. Job Map

How does the customer currently get the main job done — "get unstuck from a decision I've been circling" — step by step? This maps the CUSTOMER's process, not our methodology.

### Step 1: Define — "Realize something needs to change"

**What she does:** Notices discomfort. Insomnia. Irritability. Comparing to friends. Vague sense of "this isn't right."
**Current solution:** Ignores it. Or normalizes it: "everyone feels this way." Or processes it: starts therapy.
**Friction:** The discomfort is diffuse — she can't name what's wrong. She feels stuck but can't say stuck where.
**Emotional weight:** Low-medium. The discomfort is present but managed through coping.
**Time spent:** Months to years (the threshold crossing is slow).

### Step 2: Locate — "Find information and options"

**What she does:** Googles "how to make a big life decision." Reads books. Asks friends. Starts courses. Listens to podcasts.
**Current solution:** Self-help ecosystem — books, podcasts, courses, Instagram accounts.
**Friction:** TOO MUCH information. Every source has a different framework. None are specific to her situation.
**Emotional weight:** Medium. Feels productive but overwhelming. The paradox of choice applies to solutions too.
**Time spent:** Weeks to months.

### Step 3: Prepare — "Get ready to act"

**What she does:** This is where the eternal loop lives. She journals about the decision. Does therapy sessions about it. Takes courses about decision-making or the specific area (career, relationships, finances). Makes lists of pros and cons.
**Current solution:** Therapy + journaling + courses.
**Friction:** Preparation becomes the activity. She is PREPARING instead of DECIDING. The preparation feels productive, which makes it self-reinforcing. There's no signal that says "you're prepared enough, now decide."
**Emotional weight:** **HIGH.** This is the most emotionally loaded step because the preparation IS the avoidance mechanism. She doesn't know she's avoiding. She thinks she's getting ready.
**Time spent:** Months to YEARS. This is the trap.

### Step 4: Confirm — "Validate readiness and choice"

**What she does:** Asks her therapist if she's ready. Asks friends for their opinion. Looks for signs, synchronicities, permission.
**Current solution:** Social validation + professional validation.
**Friction:** Seeking confirmation is outsourcing the diagnosis (Sin #2). No external source can confirm a personal decision. The validation never feels sufficient.
**Emotional weight:** High. Anxiety peaks here. "What if I'm wrong?" She wants certainty that doesn't exist.
**Time spent:** Days to weeks (but often loops back to Step 3).

### Step 5: Execute — "Make the decision and act"

**What she does:** Eventually either decides (rarely, and usually forced by an external deadline) or defaults (the situation decides for her).
**Current solution:** No current solution addresses this step. Therapy doesn't tell her what to decide. Courses teach frameworks but don't force the decision. Coaching tries but creates dependency.
**Friction:** **THIS IS THE GAP.** No current solution bridges from "I understand my options" to "I have decided and I am doing it." The gap between understanding and deciding is the entire market opportunity.
**Emotional weight:** **HIGHEST.** This is where fear peaks. The decision is scary. The commitment is real. The irreversibility is felt.
**Time spent:** Minutes (the decision itself) to never (the default).

### Step 6: Monitor — "Track whether the decision is working"

**What she does:** Informally checks: "Do I feel better? Is this working?" No structured review.
**Current solution:** Gut feeling. Conversations with friends/therapist.
**Friction:** No framework for distinguishing "hard but working" from "wrong." Every discomfort after deciding feels like evidence the decision was wrong.
**Emotional weight:** Medium-high. Post-decision anxiety. "Did I do the right thing?"
**Time spent:** Ongoing (if she made a decision at all).

### Step 7: Modify — "Adjust based on what's happening"

**What she does:** Either abandons the decision ("it wasn't working") or doubles down without adjustment.
**Current solution:** None. There's no "decision adjustment framework" in the self-help ecosystem.
**Friction:** Binary thinking: either the decision was right (continue exactly) or wrong (abandon). No middle ground for intelligent adjustment.
**Emotional weight:** Medium. Adjustment feels like admitting the decision was wrong.
**Time spent:** N/A for most people (they either stick or abandon).

### Step 8: Conclude — "Know it's done and move to what's next"

**What she does:** Rarely reaches this step. When she does, the conclusion is accidental — she realizes the problem went away without a clear moment of resolution.
**Current solution:** None.
**Friction:** No clear "done" criteria. The discomfort fades gradually but there's no moment of "the constraint is resolved." Without that moment, she doesn't know to start the next cycle.
**Emotional weight:** Potential for high positive emotion (relief, pride) — but unrealized because the step is invisible.
**Time spent:** Never (for most), or indefinite (no clear endpoint).

**Confidence:** 🟡 hypothesis

### PRD implications
- **The product's primary value is in Steps 3-5** — the Prepare→Confirm→Execute gap. This is where all current solutions fail. The methodology (constraint identification + forced decision + AI decomposition) directly addresses these three steps.
- **Step 3 is where we lose people if we're not careful.** If the course feels like more preparation, we become part of the trap. Every module must push toward a DECISION, not toward more understanding.
- **Step 8 must be made explicit in the product.** The methodology has Phase 8 (Resolution). The product must make this moment visible and celebrated — the Wins Board IS Step 8 made into a product feature.

---

## 7. Outcome Statements

Prioritized by hypothesized importance (I) and current satisfaction (S). Opportunity = I + max(I-S, 0). Outcomes with Opportunity ≥ 7 are flagged as underserved.

### Step 1: Define (Realize something needs to change)

| Outcome | I | S | Opp | |
|---|---|---|---|---|
| Minimize the time it takes to identify what specifically is wrong | H | M | 5 | |
| Increase the likelihood of seeing the discomfort as a signal, not a condition | H | L | **8** | ⚡ |
| Minimize the likelihood of normalizing a situation that needs to change | H | L | **8** | ⚡ |

### Step 3: Prepare (Get ready to act)

| Outcome | I | S | Opp | |
|---|---|---|---|---|
| Minimize the time spent preparing before actually deciding | **H** | **L** | **9** | ⚡⚡ |
| Increase the likelihood of recognizing when preparation becomes avoidance | **H** | **L** | **9** | ⚡⚡ |
| Minimize the likelihood of doing the practice instead of the work | **H** | **L** | **9** | ⚡⚡ |

### Step 4: Confirm (Validate readiness)

| Outcome | I | S | Opp | |
|---|---|---|---|---|
| Minimize the need for external validation before deciding | H | L | **8** | ⚡ |
| Increase the likelihood of distinguishing between genuine unreadiness and avoidance | H | L | **8** | ⚡ |

### Step 5: Execute (Make the decision and act)

| Outcome | I | S | Opp | |
|---|---|---|---|---|
| Minimize the gap between understanding options and making a commitment | **H** | **L** | **9** | ⚡⚡ |
| Increase the likelihood that the decision is specific enough to execute (verb + date) | H | L | **8** | ⚡ |
| Minimize the likelihood of deciding without a structure to follow through | H | M | 5 | |
| Increase the likelihood that daily actions connect back to the named decision | H | L | **8** | ⚡ |

### Step 6: Monitor (Track whether it's working)

| Outcome | I | S | Opp | |
|---|---|---|---|---|
| Increase the likelihood of distinguishing "hard but working" from "wrong direction" | H | L | **8** | ⚡ |
| Minimize the time it takes to know if the decision needs adjusting | M | L | 6 | |

### Step 8: Conclude (Know it's done)

| Outcome | I | S | Opp | |
|---|---|---|---|---|
| Increase the likelihood of recognizing when a constraint is actually resolved | H | L | **8** | ⚡ |
| Increase the likelihood of celebrating the win (not just moving on) | M | L | 6 | |
| Minimize the time between resolving one constraint and identifying the next | M | M | 3 | |

### Top 5 Underserved Outcomes (Opportunity ≥ 9)

1. **Minimize the time spent preparing before actually deciding** (Step 3, Opp 9)
2. **Increase the likelihood of recognizing when preparation becomes avoidance** (Step 3, Opp 9)
3. **Minimize the likelihood of doing the practice instead of the work** (Step 3, Opp 9)
4. **Minimize the gap between understanding options and making a commitment** (Step 5, Opp 9)

All four cluster around the Prepare→Execute transition. This IS our product. Everything else is important but secondary.

**Confidence:** 🔴 guess (no actual survey data — importance and satisfaction are hypothesized from founder experience)

### PRD implications
- **The top 4 outcomes are all about breaking the Prepare→Execute gap.** The PRD's #1 feature requirement: the product must force the user from preparation to decision within a bounded timeframe.
- **The methodology already addresses these outcomes** — constraint identification forces specificity, the decision commitment forces a date, AI decomposition forces daily actions. The product's job is to deliver the methodology with enough friction reduction that users actually do it.
- **Step 8 outcomes suggest the Wins Board is a secondary priority** — important for retention but the primary product value is in Steps 3-5.

---

## 8. Two Modalities — Learning Job vs Doing Job

The course and the AI skills are not one product with one job. They serve fundamentally different jobs with different success criteria and different competitive sets.

### Modality 1: The Course (Learning Job)

**Job:** "When I encounter a new concept about decisions, I want to understand how it applies to my specific situation, so I can approach my decision with better framework."

**Consumption chain:**
1. **Find:** Social media → landing page → purchase (or: life event → remembered concept → return to course)
2. **Evaluate:** "Is this relevant to what I'm going through right now?"
3. **Learn:** Read/watch the class. Follow the Brunson flow: story → concept → examples → bridge.
4. **Integrate:** Connect the concept to my situation. "Oh, that's what I've been doing — Sin #3."

**Success criteria:** The student can articulate the concept in her own words and connect it to her situation. Not "I understand the theory" but "I see how this is what I've been doing."

**Competitive set:** Self-help books, online courses, podcasts, therapy sessions.

**Where manual is VALUE:** The thinking and recognition. When she reads a story and sees herself in it. When she connects a concept to her own life. This CANNOT be automated — the insight must be hers.

**Where manual is FRICTION:** Note-taking, organizing thoughts, remembering which module covered what. The course must be searchable and navigable as a reference.

### Modality 2: AI Skills (Doing Job)

**Job:** "When I'm at a specific step of the methodology, I want guided questions that pull the right answer out of me, so I can produce a structured output I can act on."

**Consumption chain:**
1. **Set up:** Install skill, create folder for this decision cycle
2. **Engage:** Run the skill → it asks questions → user answers in their own words
3. **Process:** AI structures the answers, identifies patterns, surfaces the constraint
4. **Output:** raw.md (their exact words) + document.md (structured insight)
5. **Reflect:** Read the document. "Is this right? Did the AI capture what I meant?"

**Success criteria:** The structured output is accurate and actionable. The user reads document.md and says "yes, that IS my constraint" or "yes, those ARE my daily tasks." Not "interesting analysis" but "this is what I need to DO."

**Competitive set:** Free ChatGPT, journaling, talking to a friend, talking to a therapist.

**Where manual is VALUE:** The answers. The student's own words ARE the input. The AI asks questions; she does the thinking. The thinking is not automatable because it IS the methodology. If the AI answers its own questions, the methodology fails.

**Where manual is FRICTION:** Structuring. Organizing. Synthesizing multiple answers into a coherent state map or constraint identification. The AI handles all of this — the student never writes a structured document herself.

### The Boundary

| Step | Manual (student thinks) | AI (skill structures) |
|---|---|---|
| State mapping | Answers honest questions about finances, health, relationships, career | Organizes answers into a state map document |
| Target state | Describes the conditions of life she wants | Formats as observable conditions with evidence criteria |
| Constraint identification | Rates each obstacle, gut-checks the selection | Surfaces the highest-rated constraint, challenges the choice |
| Decision commitment | Names the decision, sets the date, names the witness | Formats the decision statement, records the commitment |
| Decomposition | Answers questions about capacity, safety, support | Generates objectives, tasks, habits with deadlines and triggers |
| Execution | Does the daily task, records yes/no | Tracks progress, signals "hard but working" vs "not working" |
| Feedback | Answers weekly review questions | Updates the state map, compares to target |
| Resolution | Determines if the constraint is gone | Confirms resolution criteria met, prompts the win story |

**Key insight:** The exercise IS the AI skill interaction. Not "learn the concept, then go do a manual exercise, then optionally check with AI." The flow is: learn the concept in the course → run the skill → the skill IS the exercise → read your output. The course teaches why. The skill does the doing.

**Confidence:** 🟡 hypothesis (modality distinction), 🔴 guess (boundary specifics)

### PRD implications
- **Course architecture must support reference navigation** — not just sequential progress. Users return to specific concepts when life triggers recall. Search, bookmarks, concept index.
- **Skills must remember context across sessions.** The state map from Phase 1 must inform the constraint identification in Phase 3. The decision from Phase 4 must shape the decomposition in Phase 5. Skills are not isolated exercises.
- **Exercise sections in the course rewritten (2026-04-06)** to reflect skills-first design. Course outline updated: exercises = AI skills, thinking-first structuring-second.
- **Each skill must produce readable output.** The student should be able to open raw.md and see her exact words, and open document.md and see a structured version she can act on. The output IS the deliverable.

---

## 9. Implications for PRD

### Top 5 Outcomes to Address in MVP

| Priority | Outcome | Source | Feature direction |
|---|---|---|---|
| 1 | Minimize time spent preparing before deciding | Step 3, Opp 9 | Time-bounded methodology phases. "You have 3 days for state mapping, not 3 months." |
| 2 | Minimize gap between understanding and commitment | Step 5, Opp 9 | Decision commitment skill with date, verb, witness. Cannot proceed without naming the decision. |
| 3 | Increase likelihood of recognizing preparation-as-avoidance | Step 3, Opp 9 | Course content + AI skill challenges: "You've been in Phase 3 for 2 weeks. Is this research or avoidance?" |
| 4 | Increase likelihood of distinguishing "hard" from "wrong" | Step 6, Opp 8 | Weekly review skill with decision tree: if X then continue, if Y then reassess. |
| 5 | Increase likelihood of recognizing when constraint is resolved | Step 8, Opp 8 | Resolution skill + Wins Board: celebrate the win, start the next cycle. |

### UX Principles (from Emotional/Social Jobs)

1. **"Doing the real work" feel.** Every screen, interaction, and exercise must feel like genuine progress toward a decision, not like consuming content or tracking metrics. If it feels like journaling with extra steps, we've failed.
2. **No fluff, no inspiration, no dashboards.** Direct. Honest. Decision-forcing. The visual design is warm (Ethereal Warmth from DESIGN.md). The words are honest (voice.md). The combination: safe space for hard truths.
3. **One active decision at a time.** The product reinforces the methodology's "one constraint at a time" rule. No multi-project view. No parallel decision tracking. One decision. Focus.
4. **Celebration over measurement.** The Wins Board over dashboards. "What did you win?" over "how many days did you streak?" Win-oriented, not healing-oriented.

### Anxiety-Reduction Requirements for V1

1. **Structural difference messaging.** The landing page and onboarding must explain HOW this is different from the self-help loop — three mechanisms (constraint identification, forced decision, AI decomposition) address three specific failure points.
2. **Immediate action.** The user makes a REAL decision in Week 1 (throughline selection). Not in Week 9. The first decision is the proof that this is different.
3. **Wins Board / social proof.** Anonymous victories from real users, categorized by life area. "Someone like me broke the loop." This is the most powerful anxiety reducer.
4. **7-day money-back guarantee.** Standard but necessary. "If this feels like another course by Day 7, get your money back."
5. **Progressive revelation.** Don't dump all 9 modules upfront. Show the first step. "Run this skill. Answer these questions. See your state map." Small first commitment.

### The "Don't Build" List

| Feature | Why NOT to build it | JTBD reasoning |
|---|---|---|
| **Dashboards / life optimization tracking** | Creates the illusion of progress without decisions. Tracking feels productive (the "doing the work" disguise). Dashboards serve the preparation addiction, not the decision job. | Contradicts top outcome: "minimize time preparing" |
| **Live coaching / 1-on-1 calls** | Outsources the diagnosis (Sin #2). Creates dependency. Breaks the empowerment thesis: "the decision must be yours." | Contradicts emotional job: "feel like I'm doing the real work myself" |
| **Traditional community forums** | Low engagement (people don't interact in app communities). Creates noise without signal. Discussions about being stuck reinforce stuckness. | Does NOT serve the functional job. Serves a social job better addressed by the Wins Board. |
| **Streak tracking / gamification** | Optimizes for consistency, not decisions. Streaks become the goal instead of the constraint resolution. Missing a streak creates guilt instead of action. | Contradicts UX principle: "celebration over measurement" |
| **AI that tells you what to decide** | Outsources the decision (the entire anti-thesis). The AI asks questions; the user decides. If the AI decides, the methodology fails. | Contradicts the core JTBD: "I want to decide, not be told what to decide" |

### The "Must Build" List (Emerged from JTBD Analysis)

| Feature | Why MUST build it | JTBD source |
|---|---|---|
| **Wins Board / Victory Hall** | Serves retention (Little Hire), social proof (anxiety reduction), methodology embedding (Phase 7 = winning), and community — without traditional community problems. Win-oriented instead of healing-oriented. | Sections 3, 4, 6, 8 |
| **Skills-as-exercises** | The exercise IS the AI skill interaction. Not optional. The thinking is manual; the structuring is AI. This is the core delivery mechanism. | Section 8 (Two Modalities) |
| **Course-as-reference** | Users return when life triggers recall. Must be navigable as a knowledge base, not just sequential. Search, bookmarks, concept index. | Section 3 (Little Hire) |
| **Decision primitive** | One active decision per user. Versioned. With evolution history. The decision is the unit of the product, not the module or the exercise. | Section 3 (Big Hire), Founder Q7 |
| **Time-bounded phases** | Prevent the preparation trap. "You have 3 days for state mapping." The product enforces what the methodology recommends. | Section 7 (Top outcome) |

### MVP Scope Decision

**In scope for V1:**
- Course platform (sequential + reference navigation)
- AI skills for each methodology phase (the exercises)
- Decision primitive (one active decision, visible evolution)
- Onboarding throughline selection
- Time-bounded phase progression

**Deferred to V2:**
- Wins Board (requires user base + anonymous identity system)
- Daily content (podcast-to-blog pipeline)
- Evolving/updating course content
- Gamification around decisions/wins
- Cross-cycle history (how past decisions inform new ones)

**Confidence:** 🟡 hypothesis (priorities), 🔴 guess (MVP scope boundary)

---

## Quality Checklist

- ✅ Every job statement is solution-agnostic
- ✅ Functional, emotional, and social jobs documented together (Section 3)
- ✅ Customer segments defined by struggling moment, not demographics (Section 2)
- ✅ "Do nothing" analyzed as full competitor with detailed treatment (Section 5)
- ✅ Self-help graveyard documented — the eternal loop (Section 5)
- ✅ Forces of Progress include Anxiety and Habit at Critical strength (Section 4)
- ✅ Big Hire vs Little Hire hierarchy explicit (Section 3)
- ✅ Two modalities (course vs AI skills) have separate analysis (Section 8)
- ✅ Manual-vs-AI boundary drawn with reasoning (Section 8)
- ✅ Every section ends with PRD implications
- ✅ Outcome statements follow direction + metric + object format (Section 7)
- ✅ Hiring and firing criteria documented independently (Section 4)
- ✅ All findings marked with confidence tags
- ✅ Section 9 has prioritized top-5, "don't build" list, and MVP scoping
- ✅ Document understandable without prior product knowledge

**Result: 15/15 criteria met.**

---

## Assumptions Registry

| Assumption | Confidence | Signal that proves it wrong |
|---|---|---|
| The threshold model (no universal trigger) is correct | 🟡 hypothesis | Customer interviews reveal 80%+ share the same trigger type |
| "Doing the work" disguise is the main competitor, not a specific product | 🟡 hypothesis | Users name a specific competing product they're switching from |
| The eternal self-help loop is the dominant pattern | 🟡 hypothesis | Users report this as their first self-help purchase |
| Anxiety ("another course") is the primary adoption barrier | 🟡 hypothesis | Price or trust are cited more often |
| Steps 3-5 (Prepare→Execute) are where all current solutions fail | 🟡 hypothesis | Users report failure at Step 1 (they don't know something is wrong) or Step 6 (they can't sustain execution) |
| The Wins Board serves retention, social proof, and methodology simultaneously | 🔴 guess | Users don't engage with anonymous wins, or find it performative |
| Course-as-reference is how users return (not tracking or AI) | 🟡 hypothesis | Users want a daily engagement mechanism, not episodic reference |
| Manual thinking + AI structuring is the right boundary | 🟡 hypothesis | Users want AI to do more (generate insights, suggest constraints) or less (just store answers) |
| Win-oriented framing compresses the loop faster than healing-oriented | 🔴 guess | Users find win-orientation stressful or performative |
| One active decision at a time is the right constraint for the product | 🟡 hypothesis | Users have genuinely entangled constraints that require parallel work |

---

## Decision Log

| Date | Decision | Why | Watch signal |
|---|---|---|---|
| 2026-04-06 | Three customer segments by struggling moment | Segments map to different manifestations of the same threshold model | If interviews reveal a 4th segment or collapse into 2 |
| 2026-04-06 | Anxiety is the #1 force to address | "Another cycle of the loop" is amplified by the graveyard effect | If users cite price or trust as primary barrier |
| 2026-04-06 | Wins Board deferred to V2 | Requires user base for social proof to work. V1 must prove the course + skills work first. | If V1 retention is poor, accelerate Wins Board to V1.1 |
| 2026-04-06 | Exercise = AI skill (not manual docx) | Skills-as-exercises is the delivery mechanism. The exercise IS the skill interaction. | If users find AI exercises less meaningful than manual reflection |
| 2026-04-06 | "Don't build" dashboards, coaching, forums, streaks | Each contradicts a specific JTBD finding (preparation trap, dependency, noise, measurement-over-winning) | If users request these features with JTBD-valid reasoning |
| 2026-04-06 | MVP scope: course + skills + decision primitive + time-bounded phases | Core value is in the Prepare→Execute gap. Everything else is important but secondary. | If users need the Wins Board for activation, not just retention |

---

## Override Warnings

This document introduces concepts that may update or conflict with earlier documents:

1. **Wins Board / Victory Hall concept** is new. Not in methodology doc, course outline, or business model. Must be added to the methodology (Phase 7 = winning, not just feedback) and to the product roadmap.
2. **Exercise = AI skill** redefines the course exercise structure. Course outline (doc #4) updated 2026-04-06 to reflect skills-first design.
3. **Three customer segments** by struggling moment don't map 1:1 to the two personas in company.md. Both Persona 1 and 2 can appear in any of the three segments. Segments are situation-based; personas are demographic-based. Both are useful for different purposes.
4. **"Don't build" list** conflicts with future roadmap considerations (community was listed as "Phase 2 consideration" in lifedecisions.md). The Wins Board replaces traditional community — this should be updated in the roadmap.
5. **Daily content (podcast-to-blog)** was mentioned as a Little Hire mechanism. This connects to the viral strategy (doc #8) but isn't in the current pipeline. Should be added to roadmap as a content mechanism, not a product feature.

---

**Next step:** Run `/d-auto prd` to create the PRD (doc #8), which translates every finding here into specific product requirements. Every feature must trace back to a job, outcome, or force documented in this JTBD.
