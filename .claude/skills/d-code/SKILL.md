---
name: d-code
description: "Code from beads tasks. Implements the next ready bead, runs tests, closes it. Triggers: 'd-code', 'code the beads', 'implement tasks', 'start coding'."
---

# d-code — Code From Beads

## What this does
Implements beads tasks one at a time. Uses bv (beads_viewer) to pick the highest-impact
ready task, claims it, codes it following the Build Order and TDD methodology, runs all
checks, closes the bead, and picks the next. Repeats until all beads are done.

## Pipeline
d-meta → d-input → d-plan → d-tasks → **d-code**

## Prerequisites
- beads CLI installed (`br` command available — Jeffrey's beads_rust)
- beads viewer installed (`bv` command available — for graph-aware task picking)
- Beads created via d-tasks skill
- `br ready` returns at least one task

## CLI Quick Reference

### Querying
```sh
br ready --json                                    # unblocked work (flat list)
bv --robot-next                                    # graph-aware top pick + claim command
bv --robot-triage --format toon                    # full project state (token-efficient)
bv --robot-plan                                    # parallel execution tracks
br show <id> --json                                # full task details
```

### Working
```sh
br update <id> --claim                             # atomic: set assignee + in_progress
br create "Fix: ..." -t bug -p 1 --deps "discovered-from:<id>"  # discovered issue
br close <id> -r "Done" --suggest-next --json      # close + get newly unblocked
br sync --flush-only                               # export JSONL at session end
```

### CRITICAL: Never run bare `bv` — it launches TUI and blocks the agent.

## Before Starting
1. Read root CLAUDE.md (build order, rules, seven key files)
2. Read `decisions/coding.md` (patterns, TDD methodology)
3. Read the plan document referenced in the epic: `br show <epic-id>`
4. Run `bv --robot-triage --format toon` for graph-aware project state
5. Run `cm context "<epic-description>" --json` to get relevant patterns from past sessions
6. Check Agent Mail inbox: use `mcp__mcp-agent-mail__fetch_inbox` for messages from other agents
7. Tell the user what you plan to do: list the ready beads and your intended order

## The Loop

### Step 1: Pick Next Task
```sh
bv --robot-next
```
This returns the graph-optimal next task considering PageRank, betweenness, blocker ratio,
staleness, and priority. It also returns a ready-to-paste claim command.

Fallback if bv is unavailable: `br ready --json` and pick highest priority that unblocks the most.

### Step 2: Claim the Task
```sh
br update <task-id> --claim
```
Atomic operation: sets assignee + status=in_progress. Prevents other agents from picking it.

**Reserve files** (if Agent Mail is available):
Use `mcp__mcp-agent-mail__file_reservation_paths` with:
- `project_key`: current repo path
- `paths`: files listed in the bead description (e.g., `["platform/db/schema.ts"]`)
- `ttl_seconds`: 3600
- `exclusive`: true
- `reason`: `"<bead-id>: <bead-title>"`

### Step 3: Read Task Context
```sh
br show <task-id>
```
The bead description + acceptance criteria contain everything needed:
- Files to create/modify
- Imports to use (from CLAUDE.md import maps)
- Recipe to follow (from CLAUDE.md recipes)
- Test cases to write
- Acceptance criteria

Read the target folder's CLAUDE.md for its Critical Rules, Import Maps, and Recipes.

### Step 4: Implement (Follow Build Order)
1. Read/update the folder's CLAUDE.md if creating new files
2. Write/update schema if the bead requires it
3. Update errors.ts if new error codes needed
4. Update env.ts if new env vars needed
5. Write tests FIRST — they MUST fail (TDD Red)
6. Write code to pass tests (TDD Green)
7. Refactor while tests stay green (TDD Refactor)
8. Wire into pages/ if needed (last step)

### Step 5: Verify
Run the verify command from the folder's CLAUDE.md, then:
```sh
bun test                   # all tests pass
bunx tsc --noEmit          # no type errors
bunx biome ci .            # lint + format clean
ubs --diff --format=toon   # bug scan on changed files (fix any findings)
```

### Step 6: Fix Loop
If ANY check fails (tests, typecheck, or biome):
1. Read the error output carefully
2. Fix the issue
3. Re-run ALL checks: `bun test && bunx tsc --noEmit && bunx biome ci .`
4. If a fix reveals a new issue outside this bead's scope, create a discovered bead:
   ```sh
   br create "Fix: [description]" -t bug -p 1 --deps "discovered-from:<current-task-id>"
   ```
5. Repeat until ALL checks pass — NEVER close a bead with failing checks

### Step 7: Fresh Eyes Self-Review (Agent Flywheel)
After implementing a bead, BEFORE closing, do a fresh eyes review:
1. Read over ALL new/modified code with "fresh eyes" looking for obvious bugs, errors, problems
2. Check: Are edge cases covered (empty inputs, concurrent access, error paths, boundaries)?
3. Check: Are similar issues lurking elsewhere in the codebase?
4. Check: Should the approach be different?
5. Fix anything found. Repeat until no more issues. (1-2 rounds simple, 2-3 complex)

### Step 8: Close the Bead + Record Outcome
Only after ALL checks pass AND fresh eyes review is clean:
```sh
br close <task-id> -r "Implemented: [brief summary of what was done]" --suggest-next --json
cm outcome success <task-id> --summary "[what was done, key patterns used, files changed]"
```
`--suggest-next` returns newly unblocked tasks. `cm outcome` teaches future agents what worked.

If the bead required significant debugging or unexpected approach changes:
```sh
cm outcome failure <task-id> --summary "[what went wrong, why initial approach failed]"
```

Release file reservations via `mcp__mcp-agent-mail__release_file_reservations`.

### Step 9: Advance to Next Bead
1. If `--suggest-next` returned unblocked tasks, pick the best candidate
2. Otherwise: `bv --robot-next` for graph-optimal pick
3. If no tasks ready but open tasks exist, check blockers: `br blocked`
4. Start systematically, methodically, meticulously, and diligently executing beads
   in optimal logical order. Don't forget to mark beads as you work on them.

### Step 10: Final Quality Gate (when all beads are closed)
When `br ready` returns nothing and all tasks are closed:
1. Run full quality check: `bun run check` (lint + typecheck + test)
2. If ANY errors remain, create beads to track them and fix them
3. Verify the app builds (if applicable)
4. Run `bv --robot-alerts` to check for any remaining issues
5. Export: `br sync --flush-only`
6. Tell the user: **"All X beads implemented and verified. Run `/d-review` for deep review, then `/ship` to ship."**

## Multi-Agent Coordination (Agent Mail)
When running multiple Claude Code instances (Conductor workspaces) on the same project:

### At Session Start
1. Check if Agent Mail server is running (`curl http://127.0.0.1:8765/health`)
2. Register identity if available
3. Check for messages from other agents
4. Reserve files you plan to edit

### During Work
- Before editing a file: check if another agent has reserved it
- If reserved: pick a different bead or wait
- Announce in bead thread what you're working on
- Respond to messages from other agents promptly

### At Session End
- Release file reservations
- Announce completion of beads
- `br sync --flush-only` to export

## Environment Setup
```sh
export PATH="$HOME/.cargo/bin:$PATH"
export BD_ACTOR="claude-agent"
export RUST_LOG=error
export BV_OUTPUT_FORMAT=toon
```

## Rules
- NEVER skip the Build Order steps — even if the bead only mentions one file
- NEVER close a bead without ALL checks passing (tests + typecheck + biome)
- NEVER run bare `bv` — always use `--robot-*` flags
- ALWAYS claim before working (`br update <id> --claim`)
- ALWAYS read the bead description fully before coding — it's the spec
- ALWAYS follow TDD: write failing test → make it pass → refactor
- ALWAYS use `--suggest-next` when closing to chain work efficiently
- ALWAYS use `--reason` when closing to leave audit trail
- ONE bead per cycle — don't batch multiple beads
- If a bead's description is insufficient, DON'T guess — update the bead first with `br update`
- If implementation reveals sub-tasks, create new beads with `--deps discovered-from:<id>`
- If a fix creates new errors, create beads to track them — never leave broken state
- Commit at natural completion points (every 2-3 beads, or when a feature is complete)
- Run `br sync --flush-only` at session end to export JSONL for git
- When done, ALWAYS suggest `/review` before `/ship`
