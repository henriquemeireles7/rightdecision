---
name: d-harden
description: "Hardening audit: security, performance, UI quality. Finds AND fixes. Three modes: quick (changed files), standard (full scan), comprehensive (deep + deps + infra). Triggers: 'd-harden', 'harden', 'harden the code', 'security check', 'hardening audit', 'production ready?', 'is this secure?'."
---

# d-harden — Security, Performance & UI Hardening

## What this does
Audits the codebase for security vulnerabilities, performance issues, and UI quality problems.
Finds issues AND fixes them. Stack-specific: Bun/Hono/Drizzle/Zod/Better Auth/Stripe/Preact/Tailwind/Railway.

Complements `/cso` (generic, read-only) by being project-specific and action-oriented.

## Modes
- `/d-harden quick` — Changed files only (git diff). ~30s. Use before commits.
- `/d-harden` — Standard. Full codebase, all 8 phases. ~3min.
- `/d-harden comprehensive` — Standard + dependency audit + Dockerfile review + /cso integration. ~10min.

## Before Starting

### Step 0: Run Mechanical Checks First
Always start by running the mechanical checker — it catches 70% of issues instantly:

```sh
bun platform/scripts/harden-check.ts
```

If errors are found, fix them before proceeding. The script catches: `process.env` outside env.ts,
raw `c.json()`, SQL injection, hardcoded secrets, missing validators, `eval()`, UI accessibility issues.

### Step 1: Load Context
```sh
# Check for prior findings
cat decisions/hardening.md 2>/dev/null || echo "No prior audit found"
# Understand scope
git diff --stat 2>/dev/null
```

Read `decisions/hardening.md` if it exists. Note prior findings and resolved issues.
Read `decisions/design.md` for the design system (needed for Phase 8 UI checks).

## Eight Phases

Run all phases for standard mode. For quick mode, run only on changed files (from `git diff --name-only`).

### Phase 2: Input Validation & Data Flow
Check every route handler in `features/` and `platform/`:
- [ ] Every POST/PUT/PATCH route uses `zValidator()` with a Zod schema
- [ ] No `c.req.json()` or `c.req.query()` used directly (must go through `c.req.valid()`)
- [ ] Zod schemas validate all fields (no `.passthrough()` or `.strip()` on user input)
- [ ] Error responses use `throwError()` — never leak internal details
- [ ] User-supplied IDs validated as proper format before DB lookup
- [ ] Email always normalized: `.toLowerCase().trim()`
- [ ] No data crosses trust boundaries without re-validation

### Phase 3: Auth & Authorization
Check `platform/auth/` and every route in `features/`:
- [ ] Every `/api/*` route (except `/api/auth/*` and `/api/webhook`) has `requireAuth` middleware
- [ ] Role-gated routes use `requirePermission()`, not manual `role === 'admin'` checks
- [ ] No session token in URL query strings
- [ ] IDOR check: can user A access user B's data by changing IDs in request? Trace each route.
- [ ] Better Auth config: session expiry (30 days), CSRF enabled, cookie flags (httpOnly, secure, sameSite)
- [ ] Rate limiting on auth endpoints

### Phase 4: Payment Security
Check `features/subscription/` and `providers/payments`:
- [ ] Stripe webhook signature verified via `constructEvent` BEFORE any event processing
- [ ] Purchase insert uses `onConflictDoNothing` (idempotent)
- [ ] No full card numbers stored (Stripe Checkout handles this — verify no custom payment form)
- [ ] Stripe secret key only in `platform/env.ts`, never hardcoded
- [ ] Price amounts come from server-side `plans` config, not from client request
- [ ] `client_reference_id` set on checkout sessions for user binding
- [ ] All relevant Stripe event types handled (not just checkout.session.completed)

### Phase 5: Performance & Data Integrity
Check all DB queries in `features/` and `platform/db/`:
- [ ] No N+1 queries: look for loops that query inside them, or list endpoints that fetch related data per-item
- [ ] All list endpoints have pagination (`.limit()` + `.offset()` or cursor-based)
- [ ] Indexes exist on foreign keys and commonly queried columns (check schema.ts)
- [ ] No unbounded `SELECT *` without WHERE or LIMIT
- [ ] `uniqueIndex` on columns that must be unique (stripeSessionId, etc.)
- [ ] Database connection pool is configured (not unlimited connections)
- [ ] No synchronous file I/O in request handlers

### Phase 6: Infrastructure & Deploy
Check `Dockerfile`, `platform/env.ts`, `platform/server/app.ts`:
- [ ] Dockerfile uses multi-stage build (deps, build, runtime)
- [ ] Runtime stage does NOT include devDependencies
- [ ] No secrets in Dockerfile (no ENV with actual values, no COPY of .env files)
- [ ] Health check endpoint exists at `/health`
- [ ] `platform/env.ts` validates ALL required env vars at boot (fail fast)
- [ ] Error responses in production never include stack traces (check `app.onError`)
- [ ] CORS origin is specific domain, not `*`

### Phase 7: AI Code Quality
Check entire codebase:
- [ ] No stale TODO/FIXME/HACK comments that were never addressed
- [ ] No dead code (exported functions/types never imported anywhere)
- [ ] No single-implementation abstractions (interfaces with only one implementer)
- [ ] No hallucinated imports (packages in import statements not in package.json)
- [ ] Consistent patterns across similar features (all route files structured the same way)
- [ ] Every `.ts` file has a corresponding `.test.ts` (100% coverage rule from CLAUDE.md)

### Phase 8: UI Hardening
Check all `.tsx` files and page templates. Read `decisions/design.md` first for the design system.
- [ ] Does every page have clear visual hierarchy? (one hero element, not competing cards)
- [ ] Are spacing, border-radius, color values from the design system or arbitrary?
- [ ] Do error states have recovery actions + helpful copy? (not just "Something went wrong")
- [ ] Are loading states designed? (skeletons matching content layout, not generic spinners)
- [ ] Do empty states guide the user to next action? (not blank white space)
- [ ] Is typography using the scale? (Instrument Serif + Sans, `text-sm`/`base`/`xl` consistently)
- [ ] Do all interactive elements have hover/focus/active state transitions?
- [ ] Are forms preserving input on submission failure?
- [ ] Do success actions give clear feedback? (not silent success)
- [ ] Is there keyboard navigation for critical flows? (tab order, Enter to submit, Escape to close)

## Fix Loop

For each finding:
1. Classify severity: **CRITICAL** (security hole), **HIGH** (data integrity), **MEDIUM** (performance/UX), **LOW** (code quality)
2. **CRITICAL/HIGH**: Fix immediately, inline. Do not create beads.
3. **MEDIUM**: Fix if straightforward (<5 min). Otherwise create a bead: `br create "Harden: [description]" -p 1`
4. **LOW**: Create a bead for later: `br create "Harden: [description]" -p 2`

After fixing, re-run the mechanical checker to verify:
```sh
bun platform/scripts/harden-check.ts
```

## Output Report

After all phases, produce this report:

```
=== D-HARDEN REPORT ===
Mode: [quick|standard|comprehensive]
Date: [YYYY-MM-DD]
Scope: [X files scanned, Y routes, Z tables]

Mechanical Check:    PASS/FAIL (from harden-check.ts)
Input Validation:    X/Y passed  [PASS|WARN|FAIL]
Auth & Authorization: X/Y passed  [PASS|WARN|FAIL]
Payment Security:    X/Y passed  [PASS|WARN|FAIL]
Performance:         X/Y passed  [PASS|WARN|FAIL]
Infrastructure:      X/Y passed  [PASS|WARN|FAIL]
AI Code Quality:     X/Y passed  [PASS|WARN|FAIL]
UI Hardening:        X/Y passed  [PASS|WARN|FAIL]

Issues found:    X (C critical, H high, M medium, L low)
Issues fixed:    Y
Beads created:   Z

HARDENING SCORE: X/10
VERDICT: [PRODUCTION READY | NEEDS HARDENING | CRITICAL ISSUES]
```

Then update `decisions/hardening.md` with the run results.

## Comprehensive Mode Extras

When running `/d-harden comprehensive`, also:

1. **Dependency audit**: Run `bunx npm-audit --json 2>/dev/null || echo "no audit tool"` and check for critical/high CVEs
2. **Dockerfile review**: Read the full Dockerfile and check for secrets in layers, proper multi-stage, non-root user
3. **Railway env completeness**: Compare env vars in `platform/env.ts` against what Railway needs
4. **Invoke /cso**: Run the CSO security audit and incorporate infrastructure-level findings
5. **Stripe webhook coverage**: Check if all relevant event types are handled (customer.subscription.*, invoice.*, etc.)

## Updating decisions/hardening.md

After every run, update `decisions/hardening.md`. If it doesn't exist, create it:

```markdown
# Hardening — Security & Quality Baseline

> Last audit: YYYY-MM-DD
> Score: X/10
> Mode: standard

## Current Status
[1-2 sentence summary]

## Outstanding Issues
| ID | Severity | Phase | Description | Bead |
|----|----------|-------|-------------|------|

## Resolved Issues
| ID | Description | Resolved | How |
|----|-------------|----------|-----|

## Audit History
| Date | Mode | Score | Found | Fixed |
|------|------|-------|-------|-------|
```

## Chaining

This skill is called by:
- **d-code**: Runs `d-harden quick` after implementing a bead, before closing it
- **d-review**: Phases 2-5 run as part of the security/performance review
- **ship**: Checks hardening score from decisions/hardening.md before creating PR
