---
name: d-review
description: "Deep code review using fresh eyes methodology. Security, performance, TDD, architecture checks. Triggers: 'd-review', 'deep review', 'fresh eyes', 'check quality', 'review the code'."
---

# d-review — Deep Code Review

## What this does
Reviews code changes with fresh eyes before committing. Checks security, performance,
TDD compliance, architecture rules, and bead acceptance criteria. Produces a structured
pass/fail report. Fixes issues found.

## Pipeline
d-meta → d-input → d-docs → d-tasks → d-code → **d-review** → /ship

## When to run
- After d-code completes a batch of beads (before committing)
- Before /ship (pre-landing review)
- Anytime code quality is in question

## Before Starting
1. Read root CLAUDE.md (build order, rules)
2. Read `decisions/coding.md` (dependency rules, security, performance, content layer)
3. Read `decisions/hardening.md` (known issues, prior audit findings)
4. Run `bun run check` — get a baseline (includes harden-check.ts)
5. Run `git diff --stat` — understand the scope of changes

## Review Methodology: Fresh Eyes + Structured Checks

### Phase 1: Fresh Eyes Scan (random exploration)
Pretend you've never seen this code. Pick 3-5 random changed files and read them cold:
- Does the code make sense without context?
- Are variable names clear?
- Are there magic numbers or strings?
- Does the code read like the CLAUDE.md describes?
- Would a new agent understand this file?

### Phase 2: Architecture Check
Read `decisions/coding.md` dependency rules, then verify:

**2a. Dependency direction**
- `features/` does NOT import from other `features/`
- `providers/` does NOT import from `features/`
- `platform/` does NOT import from `features/`
- `pages/` files are < 20 lines
- Route chains are connected (`.route()` chaining in routes.ts)

**2b. Folder CLAUDE.md consistency**
- Every new folder has a CLAUDE.md
- CLAUDE.md Purpose matches what the code actually does
- Critical Rules are followed by the code in that folder
- Import maps match actual imports used

**2c. Build Order compliance**
- Schema changes exist before feature code
- Error codes added before they're used
- Env vars added before they're referenced
- Tests exist alongside implementation files

### Phase 3: Security Check (delegates to d-harden phases 2-4)
Run the mechanical hardening check first:
```sh
bun platform/scripts/harden-check.ts
```
If errors found, fix them before continuing.

Then apply judgment-level checks from d-harden phases 2-4:
- [ ] All user input validated via Zod (`@hono/zod-validator`) — schema completeness, not just presence
- [ ] No `process.env` usage outside `platform/env.ts`
- [ ] No stack traces returned in error responses
- [ ] No sensitive data logged (passwords, tokens, card numbers)
- [ ] Auth middleware on protected routes (`requireAuth`)
- [ ] Permission checks where needed (`requirePermission`)
- [ ] IDOR check: can user A access user B's data by changing IDs?
- [ ] No SQL injection (all queries through Drizzle ORM)
- [ ] XSS test: `<script>alert(1)</script>` renders escaped in user-content areas
- [ ] Stripe webhook signature verified before processing
- [ ] Payment amounts validated server-side (not from client)
- [ ] Rate limiting on public endpoints (auth, checkout)

Reference: `decisions/coding.md` Security Patterns + `decisions/hardening.md` for known issues.

### Phase 4: Performance Check (delegates to d-harden phase 5)
Reference: `decisions/coding.md` Performance Patterns

- [ ] No N+1 queries (use Drizzle relational queries for joins)
- [ ] API responses designed for < 200ms (single DB operations)
- [ ] No unnecessary re-renders in Preact components
- [ ] Content loaded from in-memory Map, not per-request file I/O
- [ ] No blocking operations in request handlers
- [ ] Pagination for list endpoints (not unbounded queries)
- [ ] Indexes exist for queried columns (check schema.ts)
- [ ] fetch() calls have timeouts

### Phase 5: TDD Check
Reference: `decisions/coding.md` TDD Methodology

- [ ] Every `.ts` file has a corresponding `.test.ts` in the same folder
- [ ] Tests test BEHAVIOR ("when I call X with Y, I get Z"), not implementation
- [ ] Error paths tested (bad input, missing auth, locked resources)
- [ ] Edge cases tested (empty arrays, null values, boundary conditions)
- [ ] No test helpers abstracted prematurely (< 3 duplications)
- [ ] `bun run check` passes (lint + typecheck + test)

### Phase 6: Beads Compliance Check
For each bead that was implemented:

```sh
br show <bead-id>
```

- [ ] All files listed in bead description were created/modified
- [ ] Acceptance criteria met (check each criterion)
- [ ] No scope creep (code doesn't do more than the bead specifies)
- [ ] No scope gaps (code does everything the bead specifies)

### Phase 7: Content/Voice Check (if user-facing content was changed)
Only if changes include user-facing text (course content, onboarding copy, emails):

- Read `decisions/voice.md`
- [ ] No AI-sounding language ("I'd be happy to", "Let me help you")
- [ ] Questions that stop, not questions that flow
- [ ] Pattern interrupts present
- [ ] Specificity over generality

## Fix Loop
For each issue found:
1. Fix the issue directly (don't just report it)
2. Re-run the check that caught it
3. Continue until all checks pass

If a fix is too large for this review session, create a bead:
```sh
br create "Fix: [description]" -t bug -p 1 --parent <epic-id>
```

## Mandatory Output

### Review Report
```
=== D-REVIEW REPORT ===
Scope: [X files changed, Y beads reviewed]

Architecture:  ✅ PASS | ❌ FAIL (list issues)
Security:      ✅ PASS | ❌ FAIL (list issues)
Performance:   ✅ PASS | ❌ FAIL (list issues)
TDD:           ✅ PASS | ❌ FAIL (list issues)
Beads:         ✅ PASS | ❌ FAIL (list issues)
Voice:         ✅ PASS | ⏭ N/A (no user-facing content)

Issues found:  X
Issues fixed:  Y
Beads created: Z (for deferred fixes)

VERDICT: ✅ READY TO COMMIT | ❌ NEEDS FIXES
```

### If READY TO COMMIT
```
All checks pass. Run:
  git add <files>
  git commit -m "feat: [summary]"
  git push

Then run /ship to create PR.
```

## Rules
- NEVER skip a check phase — even if the change looks small
- NEVER approve code with failing `bun run check`
- ALWAYS read the folder's CLAUDE.md before reviewing code in that folder
- ALWAYS verify bead acceptance criteria, not just "does it compile"
- Fix issues directly when possible — don't just report them
- Create beads for issues too large to fix in review
- Security and performance checks reference decisions/coding.md patterns
- Voice check only applies when user-facing content was changed
