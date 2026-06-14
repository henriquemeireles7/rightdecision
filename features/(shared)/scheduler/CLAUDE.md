# scheduler

## Purpose
In-process job scheduler for the single Railway instance (eng-schema M2). `tick(now)` runs
all recurring jobs; it FIXES the live bug where drip emails were scheduled but never sent
(processPendingDrips had zero callers).

## Critical Rules
- NEVER put setInterval here — the 1-min setInterval wiring lives in app.ts ONLY (3 lines);
  `tick(now)` is the tested seam. No leader election; deploy restarts catch up on next tick.
- ALWAYS make every job idempotent — running it twice with the same `now` must be a no-op
  the second time (cohort creation no-ops via `cohorts_program_start_idx` +
  onConflictDoNothing; expiry sweep only matches status='active'; drips flip to 'sent').
- ALWAYS take `now: Date` as the job argument — NEVER call `new Date()` inside a job;
  injected time is what makes jobs testable.
- NEVER let one job's failure stop the others — tick wraps each job in try/catch
  (log + continue).
- ALWAYS do cohort date math through `computeFirstMonday()` in `date-math.ts` — first Monday
  of the month at COHORT_START_HOUR local in env.COHORT_TIMEZONE, stored timestamptz,
  compared as UTC instants (eng-schema M7). No tz math anywhere else. No date libraries —
  Intl API only.
- Import shape decision: this feature imports `processPendingDrips` directly from
  `@/features/(shared)/drip-email/scheduler`. The repo's "features never import features"
  rule is enforced at the parenthesized-GROUP level (dep-check.ts + health-architecture.ts
  treat `(shared)` as the feature segment), and `(shared)`→`(shared)` imports have precedent
  (subscription → email). If that enforcement ever tightens to per-folder, give drip-email a
  thin re-export consumed here.

## Imports (use from other modules)
```ts
import { tick, jobs } from '@/features/(shared)/scheduler/tick'
import { computeFirstMonday, nextMonthOf } from '@/features/(shared)/scheduler/date-math'
```

## Recipe: New Job
```ts
// jobs.ts — idempotent, takes injected now, returns affected-row count
export async function myNewJob(now: Date): Promise<number> {
  // query/update guarded so a second run with the same now is a no-op
  return affectedCount
}
// then add { name: 'myNew', run: myNewJob } to the jobs list in tick.ts
// and add an idempotency test: run twice, assert the second run returns 0
```

## Verify
```sh
DATABASE_URL=postgresql://test:test@localhost:5432/test_b3 bun test "features/(shared)/scheduler"
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| date-math.ts | computeFirstMonday, nextMonthOf |
| jobs.ts | COHORT_START_HOUR, processPendingDripsJob, cohortAutoCreationJob, enrollmentExpirySweepJob |
| tick.ts | SchedulerJob, jobs, tick |

## Internal Dependencies
- features/(shared)
- platform/db
- platform/env

<!-- Generated: 2026-06-12T22:38:50.331Z -->
