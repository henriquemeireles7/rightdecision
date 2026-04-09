---
name: d-autoreview
description: "Unified review chain before shipping: d-review -> /simplify -> /qa -> /ship. One command, fully reviewed code out. Triggers: 'd-autoreview', 'full review', 'review and ship'."
---

# d-autoreview — Unified Review Chain

## What this does
Chains all quality checks into a single pre-ship pipeline. Runs four review steps sequentially,
fixing issues found at each step before proceeding to the next. The output is a fully reviewed
PR ready for merge.

## Pipeline
d-code (implement) → **d-autoreview** (review + ship)

## The Chain

### Step 1: d-review (harden quick + coherence quick)
Run the fast pre-commit review:
- Harden quick: security, perf, pattern compliance on changed files
- Coherence quick: cross-check changes against the Seven Files for logical gaps
- Fixes all issues found before proceeding

d-review already runs `bun run check` as first and last action.

If critical issues found: fix them, verify `bun run check` passes, then proceed.

### Step 2: /simplify (DRY & reuse)
Review changed code for reuse opportunities and quality:
- Flag any function that duplicates existing platform/ or provider/ utilities
- Flag any Zod schema that could reuse existing schema via `.extend()` or `.pick()`
- Flag any error handling that should use `throwError()` with existing codes
- Extract helpers when 3+ similar code blocks exist
- Fix any issues found before proceeding

If issues found: fix them, re-run `bun run check`, then proceed.

### Step 3: /qa (runtime bug check)
Run QA to catch runtime bugs that static analysis misses:
- Test all changed routes/endpoints
- Verify error paths return correct status codes and error shapes
- Check edge cases: empty inputs, missing fields, invalid types
- Check browser rendering if pages/ changed
- Fix any issues found before proceeding

If critical issues found: fix them, re-run `bun run check`, then proceed.

### Step 4: /ship (create PR)
Run the ship workflow:
- Merge base branch, run tests, review diff
- Bump VERSION, update CHANGELOG
- Commit, push, create PR

## Rules
- NEVER skip a step — each step catches different classes of issues
- ALWAYS fix issues before proceeding to the next step (don't accumulate)
- ALWAYS run `bun run check` after fixing issues at any step
- If a step reveals issues that require significant rework, stop and inform the user
- d-review is FIRST because it covers both hardening and coherence in one pass
- /simplify is second because it catches duplication before QA runs
- /qa is before /ship to catch runtime bugs before creating the PR

## When to use
- After completing all beads in a d-code session
- Before any PR creation
- When the user says "review and ship" or "full review"

## Output
After completion, report:
```
=== AUTOREVIEW SUMMARY ===
Step 1 (d-review): X issues found, X fixed
Step 2 (/simplify): X issues found, X fixed
Step 3 (/qa): X issues found, X fixed
Step 4 (/ship): PR created → [URL]

Total issues caught: X
All checks passing: ✅
```
