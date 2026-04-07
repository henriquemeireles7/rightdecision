---
name: d-code
description: "Code from beads tasks. Implements the next ready bead, runs tests, closes it. Triggers: 'd-code', 'code the beads', 'implement tasks', 'start coding'."
---

# d-code — Code From Beads

## What this does
Implements beads tasks one at a time. Picks the highest-priority ready task,
codes it following the Build Order and TDD methodology, runs all checks, and
closes the bead. Repeats until all beads are done.

## Pipeline
d-meta → d-input → d-plan → d-tasks → **d-code**

## Prerequisites
- beads CLI installed (`bd` command available)
- Beads created via d-tasks skill
- `brready` returns at least one task

## Before Starting
1. Read root CLAUDE.md (build order, rules, seven key files)
2. Read `decisions/coding.md` (patterns, TDD methodology)
3. Read the plan document referenced in the epic: `brshow <epic-id>`
4. Run `brready --json` to see available work
5. Tell the user what you plan to do: list the ready beads and your intended order

## The Loop

### Step 1: Pick Next Task
```sh
brready --json
```
Select the highest-priority task. If multiple have same priority, pick the one
that unblocks the most downstream tasks.

### Step 2: Read Task Context
```sh
brshow <task-id>
```
The bead description contains everything needed:
- Files to create/modify
- Imports to use (from CLAUDE.md import maps)
- Recipe to follow (from CLAUDE.md recipes)
- Test cases to write
- Acceptance criteria

Read the target folder's CLAUDE.md for its Critical Rules, Import Maps, and Recipes.

### Step 3: Implement (Follow Build Order)
1. Read/update the folder's CLAUDE.md if creating new files
2. Write/update schema if the bead requires it
3. Update errors.ts if new error codes needed
4. Update env.ts if new env vars needed
5. Write tests FIRST — they MUST fail (TDD Red)
6. Write code to pass tests (TDD Green)
7. Refactor while tests stay green (TDD Refactor)
8. Wire into pages/ if needed (last step)

### Step 4: Verify
Run the verify command from the folder's CLAUDE.md, then:
```sh
bun test                   # all tests pass
bunx tsc --noEmit          # no type errors
bunx biome ci .            # lint + format clean
```

### Step 5: Fix Loop
If ANY check fails (tests, typecheck, or biome):
1. Read the error output carefully
2. Fix the issue
3. Re-run ALL checks: `bun test && bunx tsc --noEmit && bunx biome ci .`
4. If a fix introduces new errors, create a bead to track the fix:
   ```sh
   brcreate "Fix: [error description]" -t task -p 1 --depends-on <current-task-id>
   ```
5. Repeat until ALL checks pass — NEVER close a bead with failing checks

### Step 6: Close the Bead
Only after ALL checks pass:
```sh
brclose <task-id>
```

### Step 7: Check What's Next
```sh
brready --json
```
If more tasks are ready, go to Step 1.
If no tasks ready but open tasks exist, check if any dependencies were missed.

### Step 8: Final Quality Gate (when all beads are closed)
When `brready` returns nothing and all tasks are closed:
1. Run full quality check: `bun run check` (lint + typecheck + test)
2. If ANY errors remain, create beads to track them and fix them
3. Verify the app builds (if applicable)
4. Run `brlist --json` to confirm all tasks are closed
5. Tell the user: **"All X beads implemented and verified. Run `/review` to review the diff before shipping."**

## Rules
- NEVER skip the Build Order steps — even if the bead only mentions one file
- NEVER close a bead without ALL checks passing (tests + typecheck + biome)
- ALWAYS read the bead description fully before coding — it's the spec
- ALWAYS follow TDD: write failing test → make it pass → refactor
- ONE bead per cycle — don't batch multiple beads
- If a bead's description is insufficient, DON'T guess — update the bead first with `brupdate`
- If implementation reveals sub-tasks, create new beads with `brcreate` and link deps
- If a fix creates new errors, create beads to track them — never leave broken state
- Commit at natural completion points (every 2-3 beads, or when a feature is complete)
- When done, ALWAYS suggest `/review` before `/ship`
