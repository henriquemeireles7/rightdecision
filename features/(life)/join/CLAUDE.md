# join

## Purpose
Cohort acquisition funnel (Platform V2, P4): the ad landing page's next-cohort data source
and the join flow that enrolls an authenticated user into the free program's current-or-next
cohort. This is the front door of the free→paid funnel — it must NEVER 404 for an ad visitor.

## Critical Rules
- NEVER 404 the next-cohort lookup because no cohort row exists yet — create-on-read with
  the SAME idempotent insert as the scheduler job (cohorts_program_start_idx +
  onConflictDoNothing). Only a missing program is an error.
- ALWAYS return cohort startsAt as the raw instant (ISO timestamptz) from data endpoints —
  the client localizes via Intl. NEVER return a server-formatted date string (eng-schema M7).
- ALWAYS gate the join flow through isV2CutoverEnabled() (platform/auth/enrollment.ts) —
  never read env.V2_ENROLLMENT_CUTOVER directly; both flag states must be testable in one
  process. Flag off = the evergreen funnel stays untouched.
- The join rule is exactly: if the latest cohort started ≤7 days ago (JOIN_GRACE_DAYS),
  join it; otherwise join the next upcoming cohort. Never invent other windows.
- ALWAYS enroll via grantEnrollment() from features/(shared)/enrollment/service —
  one row per user×program; re-join UPDATEs cohortId (TD-2). Cohort-join history goes to
  the events spine as 'cohort_joined', never to extra enrollment rows.
- ALWAYS do cohort date math through features/(shared)/scheduler/date-math.ts
  (computeFirstMonday + COHORT_START_HOUR) — no tz math here, no date libraries.
- Joining schedules the cohort drip sequence (features/(shared)/drip-email/cohort-drips.ts)
  — scheduling lives in the join flow so drips are inherently cutover-gated.

## Imports (use from other modules)
```ts
import { joinRoutes } from '@/features/(life)/join/routes'
import { getNextCohort, joinFreeCohort, JOIN_GRACE_DAYS } from '@/features/(life)/join/service'
```

## Recipe: Consume the next cohort on a server-rendered page
```ts
import { isV2CutoverEnabled } from '@/platform/auth/enrollment'
import { FREE_PROGRAM_SLUG } from '@/platform/programs'
import { getNextCohort } from '@/features/(life)/join/service'

let startsAt: Date | null = null
if (isV2CutoverEnabled()) {
  const next = await getNextCohort(FREE_PROGRAM_SLUG) // null only if the program is missing
  startsAt = next?.startsAt ?? null
}
// render <time datetime={startsAt.toISOString()}> — format client-side via Intl
```

## Verify
```sh
DATABASE_URL=postgresql://test:test@localhost:5432/test_b3 bun test "features/(life)/join"
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| routes.ts | createJoinRoutes, joinRoutes |
| service.ts | JOIN_GRACE_DAYS, getNextCohort, joinFreeCohort |

## Internal Dependencies
- features/(shared)
- platform/auth
- platform/db
- platform/env
- platform/errors
- platform/events
- platform/programs
- platform/server
- platform/types

<!-- Generated: 2026-06-12T23:31:24.935Z -->
