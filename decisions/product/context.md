# Product Context — Generate Value

> Last verified: 2026-04-09

## North Star

"Every user makes their first real decision within 48 hours."

## Core Loop

```
Engagement → Data → Network → Intelligence → Better Engagement
(more decisions)  (captured)  (cross-user)   (meta-layer)    (repeat)
```

Each layer deepens the moat. The product gets exponentially better with more engagement/data/users. Features must answer: "Which layer does this deepen?"

## Flywheel Deepening Map

### Engagement Layer — Make Users Make MORE Decisions

What it does: course flow, micro-decisions, exercises, retention hooks, gamification.

| Level | What It Looks Like | Evidence of Being Here |
|-------|-------------------|----------------------|
| L1 Manual (0-19) | Static course content, user reads passively | Content exists but no interactive elements |
| L2 Assisted (20-39) | Micro-decisions in classes, skill-based exercises, 5-min edit windows | Skills installed, users complete exercises |
| L3 Automated (40-59) | Personalized exercise scheduling, nudge emails, progress tracking | System schedules next exercise based on completion |
| L4 Self-Learning (60-79) | A/B test exercise formats, optimize for completion rate | System learns which exercise types drive more decisions |
| L5 Self-Evolving (80-99) | System creates new exercise types based on what works | New exercises generated without founder input |

### Data Layer — Capture Decisions as Structured Data

What it does: Decision Graph, analytics, user journey tracking, structured storage.

| Level | What It Looks Like |
|-------|-------------------|
| L1 Manual (0-19) | User answers saved as raw text in files |
| L2 Assisted (20-39) | Structured Decision Graph schema, decisions tagged by category/confidence |
| L3 Automated (40-59) | Auto-categorization, pattern detection, decision timeline |
| L4 Self-Learning (60-79) | System identifies decision patterns, suggests categories, improves tagging |
| L5 Self-Evolving (80-99) | Schema evolves based on new decision types it encounters |

### Network Layer — Cross-User Patterns

What it does: Decision Twins, collective intelligence, social proof, community effects.

| Level | What It Looks Like |
|-------|-------------------|
| L1 Manual (0-19) | Each user is isolated, no cross-user features |
| L2 Assisted (20-39) | Anonymous Wins Board, basic "X people also decided this" |
| L3 Automated (40-59) | Decision Twins matching, "people like you decided..." |
| L4 Self-Learning (60-79) | Network improves matching quality, predicts outcomes based on similar users |
| L5 Self-Evolving (80-99) | Collective Decision Intelligence — emergent patterns across all users |

### Intelligence Layer — Meta-Layer

What it does: own model, personalized recommendations, predictive insights. Makes ALL other layers more robust.

| Level | What It Looks Like |
|-------|-------------------|
| L1 Manual (0-19) | Generic AI (Claude) with our prompts |
| L2 Assisted (20-39) | Fine-tuned prompts based on decision data |
| L3 Automated (40-59) | Custom model trained on anonymized decision data |
| L4 Self-Learning (60-79) | Model improves from user outcomes, predicts decision quality |
| L5 Self-Evolving (80-99) | Own model + own hardware, full vertical AI stack |

## Current State Assessment

| Category | Score | Level | Evidence |
|----------|-------|-------|----------|
| Engagement | 8 | L1 | Course content partially written, micro-decisions designed but not all implemented |
| Data | 3 | L1 | User answers saved as files, no structured graph |
| Network | 0 | L1 | No cross-user features |
| Intelligence | 5 | L1 | Using Claude with custom skills, no decision-specific tuning |
| **Product Average** | **4** | **L1** | |

## Bottleneck Map

### Engagement → What's blocking L2?
**Blocker:** Course content not fully written. Can't engage users without content.
**Why:** Content creation has been secondary to platform building.
**Real example:** Only 3 free classes exist. No paid content written.
**First-principles unblock:** Content is the prerequisite for everything. No content = no engagement = no data = no flywheel.
**Project ideas:** "Complete Life Decisions course content" — write all 9 modules. This is THE P0 bottleneck.

### Data → What's blocking L2?
**Blocker:** No Decision Graph schema in the database. Micro-decisions save to localStorage, not structured storage.
**Why:** Platform focused on content delivery, not data capture.
**First-principles unblock:** Every decision must be a database row, not a localStorage entry. Schema: user_id, decision_text, context, category, confidence, timestamp.
**Project ideas:** "Decision Graph v1" — schema + migration + capture from micro-decisions.

## References by Category

### Who's best at Engagement Layer?
- **Duolingo** — gamification of learning through micro-exercises. Streak mechanics, XP, leagues. Their insight: make the exercise feel like play, not homework.
- **Noom** — behavioral change through daily micro-tasks. 10-minute lessons. Their insight: small daily actions > big weekly ones.

### Who's best at Data Layer?
- **Spotify Wrapped** — turns usage data into shareable moments. Their insight: data is only valuable if users SEE it and SHARE it.
- **Apple Health** — structured personal data over time. Their insight: longitudinal data tells a story that cross-sectional data can't.

### Who's best at Network Layer?
- **Strava** — social fitness with segments and leaderboards. Their insight: competition works when it's opt-in.

### Who's best at Intelligence Layer?
- **Netflix** — recommendation engine that improves with every watch. Their insight: the model IS the product.

## CEO Vision

Phase 1 is about Engagement + Data. Get users making decisions and capture them. Network and Intelligence come in later phases when there's enough data to be useful. The product should feel like a book that talks back — editorial quality content with AI exercises woven in.

## Anti-Killability

| Threat | Why We Survive |
|--------|---------------|
| Mindvalley adds AI exercises | They sell content, not methodology. Our moat is action-first + Decision Graph data. |
| Free AI decision app goes viral | Commoditizes the tool, not the methodology. Course content + voice is the moat. |
| "Anti-self-help" positioning gets copied | First mover + authenticity + Indy's voice can't be cloned. |
| ChatGPT adds "life coach" mode | Generic AI without methodology = generic advice. Our structured exercises + progress tracking = results. |
