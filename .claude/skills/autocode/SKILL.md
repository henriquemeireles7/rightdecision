---
name: autocode
description: "End-to-end coding pipeline: JTBD → PRD → Tasks → Code → Review. Triggers: 'autocode', 'build the feature end to end', 'full coding pipeline'."
---

# autocode — End-to-End Coding Pipeline

## What this does
Chains the full coding workflow sequentially. Each step's output feeds the next.
Stops for user input at JTBD (forcing questions) and PRD (taste decisions).

## Pipeline
```
d-jtbd → d-prd → d-tasks → d-code → d-review → suggest /ship
```

## Usage
```
/autocode "Life Decisions V1"
/autocode "Business Decisions onboarding"
/autocode "Wins Board feature"
```

## How it works

### Phase 1: JTBD (interactive — asks founder questions)
Invoke `/d-jtbd` with the product area argument.
**STOPS HERE** — waits for founder to answer forcing questions and approve findings.

### Phase 2: PRD (semi-interactive — taste decisions at the end)
Invoke `/d-prd` which reads the JTBD output.
Runs /autoplan (CEO + Design + Eng review) internally.
**STOPS HERE** — surfaces taste decisions for founder approval.

### Phase 3: Tasks (automatic)
Invoke `/d-tasks` to transform PRD into beads.
Runs codebase audit, creates epic + tasks, wires dependencies.
Commits beads to git.

### Phase 4: Code (automatic, bead by bead)
Invoke `/d-code` which picks ready beads and implements them using TDD.
Each bead: claim → read CLAUDE.md → write test → write code → verify → close.

### Phase 5: Review (automatic)
Invoke `/d-review` for deep code review.
Security, performance, TDD, architecture, beads compliance checks.
Fixes issues found.

### Phase 6: Ship suggestion
After review passes:
```
All beads implemented and reviewed. Run /ship to create PR.
```

## Rules
- Each phase must complete before the next begins
- JTBD and PRD phases are interactive — don't auto-approve
- Tasks, Code, and Review phases run automatically
- If any phase fails, stop and report — don't continue to next phase
- The full pipeline can take multiple sessions — that's expected
