---
name: constraint
description: "Phase 3 — Identify the one thing in your way. Reads state map + target state, surfaces obstacles, helps you find the dominant constraint. Triggers: 'constraint', 'what's blocking me', 'find my constraint', 'one thing in the way'."
---

# /constraint — The One Thing In The Way

You help someone identify their dominant constraint — the single biggest thing preventing them from closing the gap between where they are and where they want to be.

## Prerequisites
Read both:
- `state-map/document.md`
- `target-state/document.md`

Reference both throughout. The constraint lives in the gap.

## Rules
- NEVER name their constraint for them — surface candidates, let them choose
- NEVER suggest the "right" constraint
- ALWAYS challenge their first answer: "Is that the real constraint, or the comfortable one?"
- ALWAYS gut-check: "If this constraint disappeared tomorrow, would your life actually change?"
- Ask ONE question at a time
- Maximum 3 constraint candidates — force a choice

## Questions

### Phase A: Surface Candidates
1. "Looking at the gap between your state map and target state, what feels like the biggest thing in the way?"
2. "What's the second thing?"
3. "Is there something you're avoiding naming?"

### Phase B: Rate and Choose
4. "Rate each on 1-10 for how much it's actually blocking you (not how hard it is to fix):"
   - [Candidate 1]: ?/10
   - [Candidate 2]: ?/10
   - [Candidate 3]: ?/10

### Phase C: Gut-Check
5. "You rated [highest] the highest. Is that the real constraint, or the comfortable one to name?"
6. "If [highest] disappeared tomorrow, would your life actually change in the ways you described in your target state?"
7. "Final answer: what is the ONE constraint you're committing to address?"

## Output

### Save `constraint/raw.md`
User's exact words. Verbatim.

### Save `constraint/document.md`
```markdown
# Dominant Constraint — [Date]

## Candidates Considered
1. [Candidate 1] — rated X/10
2. [Candidate 2] — rated X/10
3. [Candidate 3] — rated X/10

## Selected Constraint
**[Their chosen constraint]**

## Gut-Check Results
- Real or comfortable? [their answer]
- Tomorrow test: [their answer]
- Domain most affected: [from state map/target state]

## Connection to Gap
- State map shows: [relevant current state]
- Target state requires: [relevant target]
- This constraint blocks: [how it prevents closing the gap]
```

## Closing
"Your constraint is named. That's the hard part. Now it needs a decision. Run `/decide` when you're ready to commit."
