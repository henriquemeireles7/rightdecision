---
name: d-code
description: "Code from beads tasks. Implements the next ready bead using TDD, runs tests, closes it. Triggers: 'd-code', 'code the beads', 'implement tasks', 'start coding'."
---

# d-code — Code From Beads

## What this does
Implements beads tasks one at a time. Uses bv (beads_viewer) to pick the highest-impact
ready task, claims it, codes it following the Build Order and TDD methodology, runs all
checks, closes the bead, and picks the next. Repeats until all beads are done.

## Pipeline
d-meta → d-input → d-docs → d-tasks → **d-code** → d-review

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

### Step 0: Codebase Audit (MANDATORY)
Understand what exists before coding:
```sh
cat platform/db/schema.ts                          # What tables exist?
find features -type f -not -name 'CLAUDE.md' | sort  # What features exist?
cat platform/server/routes.ts                      # What routes exist?
cat platform/errors.ts                             # What errors exist?
cat platform/env.ts                                # What env vars exist?
```

### Step 1: Context Loading
1. Read root CLAUDE.md (build order, rules, seven key files)
2. Read `decisions/coding.md` (patterns, TDD, dependency rules, security, performance)
3. Read the plan document referenced in the epic: `br show <epic-id>`
4. Run `bv --robot-triage --format toon` for graph-aware project state
5. Run `cm context "<epic-description>" --json` to get relevant patterns from past sessions
6. Check Agent Mail inbox: use `mcp__mcp-agent-mail__fetch_inbox` for messages from other agents
7. Tell the user what you plan to do: list the ready beads and your intended order

## The Loop

### Step 2: Pick Next Task
```sh
bv --robot-next
```
This returns the graph-optimal next task considering PageRank, betweenness, blocker ratio,
staleness, and priority. It also returns a ready-to-paste claim command.

Fallback if bv is unavailable: `br ready --json` and pick highest priority that unblocks the most.

### Step 3: Claim the Task
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

### Step 4: Read Task Context
```sh
br show <task-id>
```
The bead description + acceptance criteria contain everything needed:
- Files to create/modify (CREATE vs MODIFY)
- Imports to use (from CLAUDE.md import maps)
- Recipe to follow (from CLAUDE.md recipes)
- Test obligations (specific test cases)
- Acceptance criteria

**CRITICAL: Read the CLAUDE.md of EVERY folder you're about to modify.**
If the bead says "CREATE features/onboarding/session.ts", read `features/` CLAUDE.md first.
If the folder doesn't exist yet, create its CLAUDE.md FIRST (using the template from root CLAUDE.md).

### Step 5: TDD Implementation (Red → Green → Refactor)

Follow the Build Order strictly:

**5a. CLAUDE.md** — Create/update folder CLAUDE.md if creating a new folder

**5b. Schema** — If the bead requires schema changes:
```sh
# Modify platform/db/schema.ts, then:
bun run db:generate && bun run db:migrate
```

**5c. Errors** — If new error codes needed, add to `platform/errors.ts`

**5d. Env** — If new env vars needed, add to `platform/env.ts`

**5e. RED — Write failing tests**
Write tests from the bead's TEST OBLIGATIONS / acceptance criteria.
Run: `bun test <test-file>` — it MUST fail. If it passes, the test is wrong.

**5f. GREEN — Write minimum code to pass**
Write only what's needed to make the failing test pass. No more.
Run: `bun test <test-file>` — it MUST pass now.

**5g. REFACTOR — Clean up while tests stay green**
Extract shared logic only if duplicated 3+ times. Run tests after every change.

**5h. WIRE — Connect to routes/pages (last step)**
Wire routes in `platform/server/routes.ts` (must chain with `.route()`).
Wire pages in `pages/` (max 20 lines).

### Step 6: Verify
```sh
bun test                   # all tests pass
bunx tsc --noEmit          # no type errors
bunx biome ci .            # lint + format clean
ubs --diff --format=toon   # bug scan on changed files (fix any findings)
```

### Step 7: Fix Loop
If ANY check fails:
1. Read the error output carefully
2. Fix the issue
3. Re-run ALL checks: `bun test && bunx tsc --noEmit && bunx biome ci .`
4. If a fix reveals a new issue outside this bead's scope, create a discovered bead:
   ```sh
   br create "Fix: [description]" -t bug -p 1 --deps "discovered-from:<current-task-id>"
   ```
5. Repeat until ALL checks pass — NEVER close a bead with failing checks

### Step 8: Harden + Fresh Eyes Review
After implementing, BEFORE closing:

**8a. Quick hardening check on changed files:**
```sh
bun platform/scripts/harden-check.ts
```
If errors found, fix them. If warnings, note them but proceed.

**8b. Fresh eyes self-review (Agent Flywheel):**
1. Read over ALL new/modified code with "fresh eyes" looking for obvious bugs
2. Check: Are edge cases covered (empty inputs, concurrent access, error paths, boundaries)?
3. Check: Are similar issues lurking elsewhere in the codebase?
4. Check: Should the approach be different?
5. Fix anything found. Repeat until no more issues. (1-2 rounds simple, 2-3 complex)

### Step 9: Close the Bead + Record Outcome
Only after ALL checks pass AND fresh eyes review is clean:
```sh
br close <task-id> -r "Implemented: [brief summary]" --suggest-next --json
cm outcome success <task-id> --summary "[what was done, key patterns used, files changed]"
```
`--suggest-next` returns newly unblocked tasks. `cm outcome` teaches future agents what worked.

If the bead required significant debugging or unexpected approach changes:
```sh
cm outcome failure <task-id> --summary "[what went wrong, why initial approach failed]"
```

Release file reservations via `mcp__mcp-agent-mail__release_file_reservations`.

### Step 10: Advance to Next Bead
1. If `--suggest-next` returned unblocked tasks, pick the best candidate
2. Otherwise: `bv --robot-next` for graph-optimal pick
3. If no tasks ready but open tasks exist, check blockers: `br blocked`
4. Start systematically executing beads in optimal logical order

### Step 11: Final Quality Gate (when all beads are closed)
When `br ready` returns nothing and all tasks are closed:
1. Run full quality check: `bun run check` (lint + typecheck + test)
2. If ANY errors remain, create beads to track them and fix them
3. Verify the app builds (if applicable)
4. Run `bv --robot-alerts` to check for any remaining issues
5. Export: `br sync --flush-only`
6. Tell the user: **"All X beads implemented and verified. Run `/d-review` for deep review, then `/ship` to ship."**

## Mandatory Output (ALWAYS show at the end of each bead)
```
=== IMPLEMENTATION SUMMARY ===
Bead: <id> — <title>
Status: CLOSED ✅

Files created:  [list]
Files modified: [list]
Tests: X passed, 0 failed
bun run check: ✅ PASS

Ready beads: [list next ready]
Suggested next: <id> (<title>)
```

## Multi-Agent Coordination (Agent Mail)
When running multiple Claude Code instances (Conductor workspaces):

### At Session Start
1. Check if Agent Mail server is running
2. Register identity if available
3. Check for messages from other agents
4. Reserve files you plan to edit

### During Work
- Before editing a file: check if another agent has reserved it
- If reserved: pick a different bead or wait
- Announce in bead thread what you're working on

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

## THE LOOP RULE (most important rule)
**NEVER STOP. NEVER ASK "should I continue?" NEVER pause between beads.**
After closing a bead, IMMEDIATELY pick the next one and start coding.
Keep going until `br ready` returns 0 actionable tasks. The ONLY reasons to stop:
1. All beads are done (br ready returns nothing)
2. You are genuinely blocked (needs user input, needs TTY, needs external service)
3. The user explicitly tells you to stop
Commit every 2-3 beads, but DO NOT pause for confirmation. Just commit and keep going.

## Rules
- NEVER skip the Build Order steps — even if the bead only mentions one file
- NEVER close a bead without ALL checks passing (tests + typecheck + biome)
- NEVER run bare `bv` — always use `--robot-*` flags
- NEVER modify a file without reading its folder's CLAUDE.md first
- ALWAYS run codebase audit (Step 0) before starting
- ALWAYS claim before working (`br update <id> --claim`)
- ALWAYS read the bead description fully before coding — it's the spec
- ALWAYS follow TDD: write failing test → make it pass → refactor
- ALWAYS use `--suggest-next` when closing to chain work efficiently
- ONE bead per cycle — don't batch multiple beads (unless they all modify the same file)
- If a bead's description is insufficient, DON'T guess — update it with `br update`
- If implementation reveals sub-tasks, create new beads with `--deps discovered-from:<id>`
- Security: validate all input via Zod, use throwError(), never log sensitive data
- Performance: no N+1 queries, < 200ms API responses
- Commit at natural completion points (every 2-3 beads, or when a feature is complete)
- Run `br sync --flush-only` at session end to export JSONL for git
- When done, ALWAYS suggest `/d-review` before `/ship`
