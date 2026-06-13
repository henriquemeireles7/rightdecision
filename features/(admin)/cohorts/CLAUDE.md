# cohorts

## Purpose
Admin cohort management: view auto-created cohorts (the scheduler's first-Monday cron),
manually create/override cohorts with custom dates, and suggest upcoming first-Monday dates.

## Critical Rules
- Manual creation MUST NOT collide with the cron idempotency key
  uniqueIndex(programId, startsAt) — a conflicting insert returns VALIDATION_ERROR with
  details, it never silently overwrites the auto-created row.
- ALWAYS reuse the scheduler's date math for suggestions — import `computeFirstMonday`/
  `nextMonthOf` from `features/(shared)/scheduler/date-math` and `COHORT_START_HOUR` from
  `features/(shared)/scheduler/jobs`. NO duplicate first-Monday logic ((admin) → (shared)
  imports are allowed; group-level dep rule, see features/(admin)/CLAUDE.md).
- Cohorts have NO status enum — upcoming/past derives from startsAt vs now (TD-1).
- Edits target FUTURE cohorts: updating a cohort whose startsAt is in the past returns
  VALIDATION_ERROR (destructive edits to started cohorts with enrollees are a founder
  decision — see roadmap open question; do not loosen without approval).
- NEVER delete cohorts (enrollments FK to them; free re-enrollment history lives in events).

## Imports (use from other modules)
```ts
import { adminCohortsRoutes } from '@/features/(admin)/cohorts/routes'
```

## Recipe: Suggestion endpoint contract
```ts
// GET /suggestions?months=3 → [{ startsAt, title }] — next N first-Mondays at
// COHORT_START_HOUR local in env.COHORT_TIMEZONE (same instants the cron will create)
```

## Verify
```sh
source /tmp/test-env.sh && DATABASE_URL=postgresql://test:test@localhost:5432/test_b1 bun test "features/(admin)/cohorts"
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| routes.ts | adminCohortsRoutes |
| service.ts | CohortsWhen, listCohorts, createCohort, updateCohort, suggestCohorts |

## Internal Dependencies
- features/(shared)
- platform/auth
- platform/db
- platform/env
- platform/errors
- platform/server
- platform/types

<!-- Generated: 2026-06-12T23:31:24.934Z -->
