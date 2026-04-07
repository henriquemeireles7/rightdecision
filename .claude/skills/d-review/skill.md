---
name: d-review
description: "Deep code review using Agent Flywheel methodology. Fresh eyes, random exploration, architectural consistency, meticulous quality. Triggers: 'd-review', 'deep review', 'fresh eyes', 'check quality', 'flywheel review'."
---

# d-review — Deep Code Review (Agent Flywheel Methodology)

## What this does
Systematic, multi-pass deep code review inspired by Jeffrey Emanuel's Agent Flywheel.
Three distinct review modes that catch different classes of bugs:
1. **Fresh Eyes** — reread all recent changes looking for obvious bugs
2. **Random Exploration** — pick random files and trace execution flows deeply
3. **Architectural Consistency** — verify patterns are honored everywhere

Run after completing a batch of beads, before shipping, or periodically during implementation.

## Pipeline
d-tasks → d-code → **d-review** → ship

## When to Run
- After completing every 2-3 beads (catch integration issues early)
- Before `/ship` (final quality gate)
- When another agent asks for review (multi-agent workflow)
- When the user says "check quality", "fresh eyes", "deep review"
- Proactively suggest after a feature is complete

## CLI Reference
```sh
# Beads state
br list -s in_progress --json     # what's being worked on
bv --robot-triage --format toon   # project health
bv --robot-alerts                 # stale issues, blocking cascades

# Quality checks
bun run check                     # lint + typecheck + test
bun test --coverage               # coverage report
```

## Phase 1: Fresh Eyes Self-Review

Read over ALL recently changed/created code with completely "fresh eyes."
For each file changed:

1. **Read the file top to bottom** — don't skim, read every line
2. **Check for obvious bugs:**
   - Null/undefined access without guards
   - Off-by-one errors in loops/slices
   - Missing error handling on async operations
   - Wrong variable names (copy-paste errors)
   - Hardcoded values that should be from env/config
   - Console.log/debug statements left in production code
3. **Check for edge cases:**
   - Empty arrays/objects as input
   - Concurrent access (race conditions)
   - Error paths (what happens when things fail?)
   - Boundary conditions (max length, zero, negative)
4. **Check for security:**
   - XSS: user input rendered without escaping?
   - SQL injection: raw query interpolation?
   - Auth bypass: routes missing requireAuth middleware?
   - Secrets: hardcoded API keys or tokens?
5. **Fix anything found immediately**
6. **Repeat until clean** (1-2 rounds for simple changes, 2-3 for complex)

### Four Questions (ask for each changed file)
1. Is the implementation correct per the bead description / requirements?
2. Are edge cases covered (empty inputs, concurrent access, error paths, boundaries)?
3. Are similar issues lurking elsewhere in the codebase?
4. Should the approach be different?

## Phase 1.5: Automated Bug Scan (UBS)

Run the full bug scanner on changed files:
```sh
ubs --diff --format=toon --profile=strict
```
- Review ALL findings — categorize as: fix now, create bead, or suppress with `# ubs:ignore`
- For each suppression, add an explanation comment
- If clean, run full codebase scan: `ubs . --format=toon`

## Phase 2: Random Code Exploration

This catches bugs that per-file review misses — integration issues, stale references,
patterns that diverged over time.

### Pre-check: Search Past Sessions
Before random exploration, check if past agents found issues in these areas:
```sh
cass search "<feature-area>" --robot --limit 5 --fields minimal
```

### Process
1. **Pick 5-10 random code files** across the codebase (use `find src -name "*.ts" | shuf | head -10` or equivalent)
2. **For each file, deeply investigate:**
   - Read the file completely
   - Trace imports — follow where dependencies come from
   - Trace exports — follow where this code is used
   - Check: does the implementation match what callers expect?
   - Check: are there dead code paths? Unused exports?
   - Check: do error paths propagate correctly through the call chain?
3. **Trace 2-3 full execution flows** end-to-end:
   - Pick a user action (e.g., "user submits onboarding step 3")
   - Trace from the page → component → API route → service → database → response
   - Check: does data transform correctly at each boundary?
   - Check: are types consistent throughout the chain?
   - Check: what happens if any step fails?
4. **Document and fix** everything found

### What to Look For
- Functions that changed signature but callers weren't updated
- Schema changes that aren't reflected in queries
- Routes added but not wired into the main router
- Tests that pass but don't actually test what they claim
- Content/config files that reference old paths/IDs
- Imports from modules that were refactored

## Phase 3: Architectural Consistency Check

Verify the codebase follows its own patterns consistently.

### Check Each Pattern
1. **Error handling:** Every throwError() uses codes from platform/errors.ts? No ad-hoc errors?
2. **Responses:** Every API endpoint uses success() or paginated()? No raw c.json()?
3. **Auth:** Every protected route has requireAuth middleware? Permissions checked?
4. **Env vars:** All from platform/env.ts? No process.env anywhere?
5. **Types:** All inferred from Zod/Drizzle? No manual type definitions?
6. **Route chains:** All connected with .route() for AppRoutes inference?
7. **Pages:** All under 20 lines? Just wiring, no logic?
8. **Tests:** Colocated (foo.ts → foo.test.ts)? All test behavior not implementation?
9. **Providers:** One file each? Named by capability not vendor?
10. **Build Order:** Was it followed? (CLAUDE.md → schema → errors → env → tests → code → pages)

### Check DSA (Domain-Spec Architecture)
- Every folder with code has a CLAUDE.md?
- CLAUDE.md has Purpose, Critical Rules, Imports, Recipe, Verify sections?
- Imports match what the code actually uses?

## Phase 4: Beads Verification

Cross-reference implementation against beads:

```sh
br list -s closed --json    # all closed beads
```

For each recently closed bead:
1. Read the bead description and acceptance criteria
2. Verify the implementation matches
3. Verify the tests cover the acceptance criteria
4. Check: did we introduce scope creep beyond the bead?
5. Check: did we miss anything in the bead?

If gaps found: create new beads with `br create "Fix: ..." -t bug -p 1 --deps "discovered-from:<bead-id>"`

## Phase 5: Report

After all phases, produce a summary:

```markdown
## d-review Report

### Fresh Eyes (Phase 1)
- Files reviewed: X
- Issues found: Y (Z fixed)
- Remaining: [list if any]

### Random Exploration (Phase 2)
- Files explored: X
- Flows traced: Y
- Issues found: Z

### Architectural Consistency (Phase 3)
- Patterns checked: 10
- Violations found: X
- [List specific violations]

### Beads Verification (Phase 4)
- Beads verified: X
- Gaps found: Y
- New beads created: Z

### Verdict
[SHIP IT / FIX FIRST / NEEDS WORK]
```

If verdict is SHIP IT: suggest `/ship`.
If verdict is FIX FIRST: list the specific fixes, create beads if needed.
If verdict is NEEDS WORK: explain what's wrong and suggest next steps.

### Record Learnings to CM (CASS Memory)
After the review, record anti-patterns and patterns discovered:
```sh
# For each recurring bug pattern found
cm playbook add "Always check for null before accessing .property in [context]" --category "null-safety"

# For architectural violations
cm playbook add "Route handlers must use success() not c.json() — found 3 violations in features/" --category "architecture"
```
This teaches future agents to avoid the same mistakes.

## Multi-Agent Review Mode

When running as a dedicated review agent alongside coding agents:

1. **At session start:** Register with Agent Mail, announce "Review agent online"
2. **Monitor:** Watch for closed beads from coding agents
3. **Review in batches:** Every 2-3 closed beads, run Phase 1-3
4. **Report via Agent Mail:** Send findings to the coding agent's thread
5. **Create beads:** For any bugs found, create with `discovered-from` dep
6. **Don't fix directly:** Report issues, let the coding agent fix (avoids conflicts)

## Rules
- NEVER skip phases — each catches different classes of bugs
- NEVER approve code you haven't actually read line-by-line
- ALWAYS fix bugs found in Phase 1 immediately (you're the reviewer AND fixer)
- ALWAYS create beads for issues found in Phase 2-3 (track, don't just note)
- In multi-agent mode: report, don't fix (avoid file conflicts)
- Run `bun run check` at the end to verify nothing is broken
- Be meticulous, systematic, and diligent — this is the quality gate before shipping
