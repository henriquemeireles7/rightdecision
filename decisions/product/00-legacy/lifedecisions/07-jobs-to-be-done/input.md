# INPUT: Jobs-to-be-Done (Life Decisions Software)
Captured: 2026-04-06
For meta-doc: decisions/lifedecisions/07-jobs-to-be-done/meta.md

## From existing documents

### Personas (from company.md, business model input)
- **Persona 1 — "The Stuck Achiever":** Woman, 30-50. Has done the work: therapy, courses, books, meditation. Objectively ahead of her peers. Stuck at a higher level where problems are harder to name. Disguises indecision as research.
- **Persona 2 — "The Overthinker":** Man, 25-40. Overthinks career and business moves. Consumes business content obsessively but never starts. Analysis paralysis disguised as preparation.

### Voice of Customer — Her exact words (from manifesto)
- "I feel stuck, my friends have been married, with children, with money, and I just don't have it"
- "I don't know where to start from"
- "I know what I need to do but I just can't make myself do it"
- "I'm not ready yet"
- "This makes sense, but I don't have time now, maybe next month"

### Her behaviors (from manifesto)
- Does everything except the thing: research, courses, therapy, planning
- Not aware she is avoiding the thing — she thinks she is preparing
- Gave up her dreams like the fox and the grapes — doesn't want what she believes she can't achieve
- Kept getting smaller — goals shrank to fit comfort zone
- Overacts or overthinks depending on personality — both produce the same result

### What she types into Google at midnight (from manifesto)
- "why can't I get my life together"
- "feeling stuck in life at 35"
- "I know what to do but can't do it"
- "how to stop overthinking and take action"
- "life coach vs therapy which is better"
- "how to make a big life decision"

### Her emotional state map (from manifesto)
- Frustration: "I've done everything right and I'm still here"
- Shame: "My friends figured it out, why can't I?"
- Exhaustion: "I'm tired of trying to fix myself"
- Quiet hope: "Maybe there IS something different out there"
- Resignation: "Maybe this is just how my life is"

### Competition table (from manifesto)
| What she does today | Why it fails | What Right Decision does instead |
|---|---|---|
| Therapy ($150-300/session) | Understands the past. Does not decide the future. | Identifies the dominant constraint and commits to resolving it |
| Online courses ($47-997) | Teaches frameworks without applying to HER situation | AI decomposes HER goal into HER decisions based on HER life |
| Life coaching ($200-500/hour) | Creates dependency on the coach's diagnosis (Sin #2) | Teaches her to diagnose and decide for herself |
| Self-help books | Consumed, underlined, forgotten. Sophisticated procrastination (Sin #3) | Every module ends with a decision she makes, not a concept she learns |
| Free ChatGPT | No methodology, no context, no constraint identification | Our AI knows the framework, knows her history, asks the right questions |
| Meditation/spirituality | Calm mind ≠ changed life | Action brings clarity. Decisions bring results. |
| Doing nothing | "I'm not ready." The most expensive decision. | The cost of no decision is invisible and usually higher |

### Product architecture (from lifedecisions.md, business model input)
- Course: 3 acts, 9 modules, ~23 hours, 3 months
- Each methodology step = one Claude skill
- Skill flow: run skill → answer questions → AI saves structured output → user reads insights
- Skills use d-input → d-plan pattern (question → raw → document)
- Output lives in user's personal folder on their computer
- No API needed — skills only
- Manual-first, AI-second: student does the thinking, AI organizes

### The methodology's 3-mechanism system (from methodology doc)
1. **Constraint identification** — forces ONE constraint, not general improvement
2. **Forced decision** — named decision with date and witness, not a wish
3. **AI decomposition** — breaks decision into daily tasks with system, bridges the gap between "I decided" and "I did it"

## From founder (JTBD-specific insights)

### The struggling moment has no universal form
There is no single trigger type. The trigger is a THRESHOLD: any discomfort (life event, accumulation, mirror moment, body signals) becomes a trigger when "the discomfort of the right decision is less than their actual life discomfort." The form doesn't matter. The intensity does.

### "Doing nothing" is disguised as "doing the work"
The main competitor is not inaction in its obvious form. They ARE doing something — therapy, journaling, reading, courses. They feel productive because they're consuming and processing. But no decision is being made. The disguise is what makes "doing nothing" sticky: it feels like progress.

### The eternal self-help loop (why they fire solutions)
The firing pattern is NOT "this was bad" or "I didn't finish." It's cyclical:
1. Start new solution (course, book, program) with enthusiasm
2. Do the practice for days, weeks, maybe months
3. Feel improvement — believe things are getting better
4. A life event happens that reveals they're still stuck
5. Realize the "improvement" didn't produce real change
6. Find the next solution → fire the old one → repeat

They do the PRACTICE instead of the WORK. The practice feels like progress but doesn't produce decisions. They fire solutions when they find the next one — the cycle never ends. This IS the problem The Right Decision solves.

### What makes this time structurally different
All three mechanisms address different failure points of the self-help loop:
- **Constraint identification** breaks the "general improvement" trap (they work on what matters, not what feels comfortable)
- **Forced decision** breaks the "practice without commitment" trap (the decision has a date, a name, a witness)
- **AI decomposition** breaks the "decided but didn't do" trap (the gap between commitment and daily action)
No single mechanism breaks the loop alone. The three together are structurally different from any self-help program.

### Big Hire vs Little Hire
- **Big Hire:** "Get unstuck and make the one decision that matters" — drives acquisition
- **Little Hire:** "Come back for information when life triggers a need" — the course as a living knowledge base
  - The course is dense; users return when something happens: "oh something just happened, I want to remember what they said about X"
  - Content evolves over time (skills and classes update)
  - Daily content possibility: podcast-to-blog as daily touchpoint (for all users, not just paid)
  - They come back for INFORMATION, not tracking, accountability, or AI conversation

### Manual vs AI boundary
- **Manual = the THINKING:** answering questions, naming constraints, making the decision. The student owns the insight.
- **AI = the STRUCTURING:** asking the right questions, organizing answers, generating output documents. AI owns the paperwork.
- **Exercise flow:** Run skill → AI asks questions → user answers → AI saves raw + structured output → user reads insights in-chat + full document in their folder
- **Key implication:** Exercise sections in the course need rewriting to reflect skills-first design (TODO)

### What NOT to build
- **NO dashboards/life optimization tracking:** "You don't need to track everything, just go live life, just decide." Dashboards create the illusion of progress without decisions.
- **NO live coaching/1-on-1:** Outsources the diagnosis (Sin #2). Breaks the empowerment thesis.
- **YES community, but specific form only:** Not forums or traditional community. See the Wins Board below.

### The Wins Board — Breakthrough Product Insight
The feedback step in the methodology should NOT be "feedback" — it should be **WINNING.** The product embeds this as:

1. **Anonymous decision sharing:** Users make their one active decision public (anonymous profile). The decision is the primitive in the product — it has versioning, evolution, results.
2. **Weekly updates as storytelling:** Not tracking metrics. Telling the story of how the decision is evolving. What happened this week. How the constraint shifted.
3. **Wins Board / Victory Hall:** When a constraint is resolved, the user writes their win. Categories: health, relationships, money. Other users can like and comment.
4. **Win-oriented, not healing-oriented:** This reframes the entire methodology from "fixing yourself" to "collecting victories." People compress the loop faster when they think about winning, not healing.
5. **Multiple functions in one feature:** Retention mechanism (Little Hire), social proof (testimonials), methodology embedding (feedback step), and community — without traditional community problems.
6. **Gamification without over-tracking:** Rankings and engagement around DECISIONS and WINS, not streaks or dashboard metrics.

This concept must be embedded into the methodology, the course, and the product. It reframes Phase 7 (Feedback) as celebration, not measurement.

## Gaps

1. **[OPEN] Wins Board taxonomy:** "Winning hall" or something better? Need the right name that matches the brand voice.
2. **[OPEN] Anonymity mechanics:** How does anonymous + decision storytelling work? Can people see the constraint but not the person?
3. **[OPEN] Course exercise rewrite:** Exercise sections need updating to reflect skills-first design (exercises happen in AI, not manually in docx).
4. **[OPEN] Daily content mechanism:** How does podcast-to-blog-to-email work? Is this for free users or paid? Part of the Little Hire retention or the free funnel?
5. **[OPEN] Gamification mechanics:** What's the ranking/reward system that's win-oriented without being tracking-oriented?
