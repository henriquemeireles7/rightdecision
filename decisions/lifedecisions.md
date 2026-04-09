# Life Decisions — Product Reference

> Last verified: 2026-04-08
> Deep dive: decisions/lifedecisions/ (product-specific docs)

## What it is
Life Decisions is The Right Decision's B2C product ($197/year). A course + AI-powered Claude skills that teach the decision methodology for personal life transformation.

## One-liner
A yearly platform that teaches you the one decision that actually matters right now, then uses AI skills to decompose it into commitments you can execute daily.

## ICP (Two Personas)

### Persona 1 — "The Stuck Achiever"
Woman, 30-50. Has done the work (therapy, courses, books). Objectively ahead of peers. Stuck at a higher level. Disguises indecision as research.

### Persona 2 — "The Overthinker"
Man, 25-40. Overthinks career/business moves. Consumes content obsessively but never starts. Analysis paralysis disguised as preparation.

## Product Architecture
- **Course:** 3 acts (See Clearly, Decide, Move), 9 modules, ~23 hours, 3 months
- **Editorial reading experience:** Rendered markdown with pull quotes, insight callouts, drop caps. Book-like (65ch max-width, Instrument Serif/Sans)
- **Micro-decisions:** In-class decision prompts where reading becomes practice. 5-min edit window, then locked. The 10-star moment.
- **Your Journey:** Timeline of all decisions made throughout the course. Retention hook + screenshot IS the marketing.
- **Reading analytics:** Time spent, scroll depth, completion tracking. Fire-and-forget.
- **Share moments:** Server-side card generation (satori + resvg). Decision text on branded card.
- **Session memory:** localStorage scroll position save/restore with 7-day expiry
- **Multi-course architecture:** courses.json registry. Currently "life-decisions" only. Future: 10+ bonus courses.
- **Skills:** One Claude skill per methodology exercise — the skill IS the exercise.
- **Delivery:** User installs skills in Claude Cowork. Exercises = skill interactions.
- **Wins Board (V2):** Anonymous decision sharing + win stories.
- **Free course funnel:** Module 0 + Module 1 are free

## Skills Architecture
Each methodology step = one Claude skill. Skills use the same pattern as our d-meta → d-input → d-plan:
1. Skill asks deep questions
2. User answers in their own words
3. Skill saves raw answers to `raw.md`
4. Skill generates structured output to `document.md`
5. Output lives in user's personal folder on their computer

## Course Structure
- **Intro:** One class teaching AI setup (installing Claude Cowork, installing skills, how exercises work)
- **Main course:** Pure methodology. Manual exercises first, then AI skills for refinement.
- **Bonus:** "Claude Cowork for Personal Decisions" — standalone course expanding on AI tool usage

## Key Positioning
- "Life transformation through action, not introspection"
- Anti-self-help: the enemy is the dependency industry
- Win-oriented, not healing-oriented: track victories, not healing progress
- Thinking-first, structuring-second: the student does the thinking, the AI organizes it
- Not therapy, not coaching, not motivation — the discipline of deciding accurately

## What This Product is NOT
- Not a chatbot or AI coach that tells you what to decide
- Not a traditional community — but includes anonymous Wins Board for celebrating victories (V2)
- Not live coaching or 1-on-1 sessions
- Not a traditional SaaS dashboard — exercises run in Claude on the user's computer
