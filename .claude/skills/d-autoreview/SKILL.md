---
name: d-autoreview
description: "Unified review chain before shipping: d-review → /review → /simplify → /ship. One command, fully reviewed code out. Triggers: 'd-autoreview', 'full review', 'review and ship'."
---

# d-autoreview — Unified Review Chain

## What this does
Chains all quality checks into a single pre-ship pipeline. Runs four review steps sequentially,
fixing issues found at each step before proceeding to the next. The output is a fully reviewed
PR ready for merge.

## Pipeline
d-code (implement) → **d-autoreview** (review + ship)

## The Chain

### Step 1: Fresh Eyes Review (d-review)
Run a deep code review using fresh eyes methodology:
- Reread ALL changed code looking for bugs, security issues, performance problems
- Check TDD coverage — are there missing test cases?
- Check architecture — does the code follow DSA patterns?
- Fix any issues found before proceeding

If critical issues found: fix them, re-run `bun run check`, then proceed.

### Step 2: Pre-Landing Diff Review (/review)
Run the pre-landing PR review on the current diff against master:
- SQL safety (injection, missing parameterization)
- LLM/AI trust boundary violations
- Conditional side effects (actions that should be atomic)
- Error handling gaps
- Fix any issues found before proceeding

If critical issues found: fix them, re-run `bun run check`, then proceed.

### Step 3: DRY & Simplify (/simplify)
Review changed code for reuse opportunities and quality:
- Flag any function that duplicates existing platform/ or provider/ utilities
- Flag any Zod schema that could reuse existing schema via `.extend()` or `.pick()`
- Flag any error handling that should use `throwError()` with existing codes
- Extract helpers when 3+ similar code blocks exist
- Fix any issues found before proceeding

If issues found: fix them, re-run `bun run check`, then proceed.

### Step 4: Ship (/ship)
Run the ship workflow:
- Merge base branch, run tests, review diff
- Bump VERSION, update CHANGELOG
- Commit, push, create PR

## Rules
- NEVER skip a step — each step catches different classes of issues
- ALWAYS fix issues before proceeding to the next step (don't accumulate)
- ALWAYS run `bun run check` after fixing issues at any step
- If a step reveals issues that require significant rework, stop and inform the user
- The chain is mandatory before any code hits master (founder decision from eng review)
- No individual gates on beads during d-code — this chain catches everything at once

## When to use
- After completing all beads in a d-code session
- Before any PR creation
- When the user says "review and ship" or "full review"

## Output
After completion, report:
```
=== AUTOREVIEW SUMMARY ===
Step 1 (d-review): X issues found, X fixed
Step 2 (/review): X issues found, X fixed
Step 3 (/simplify): X issues found, X fixed
Step 4 (/ship): PR created → [URL]

Total issues caught: X
All checks passing: ✅
```
