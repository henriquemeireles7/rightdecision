# Life Decisions — Product Reference

> Last verified: 2026-04-06
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
- **Skills:** One Claude skill per methodology exercise — the skill IS the exercise. User runs skill → answers questions → AI saves structured output to personal folder.
- **Delivery:** User installs skills in Claude Cowork. Exercises = skill interactions. Output saved to personal folder.
- **Exercise flow:** Thinking-first, structuring-second. The student does the thinking (answers questions). The AI does the structuring (organizes into documents).
- **No API needed.** Life Decisions is docs + skills only.
- **Wins Board (V2):** Anonymous decision sharing + win stories. Categories: health, relationships, money. Win-oriented retention, social proof, and methodology embedding in one feature.
- **Bonus course:** "Claude Cowork for Personal Decisions" (standalone, not part of main course)
- **Free course funnel:** Simplified methodology (fewer steps) as lead generation

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
