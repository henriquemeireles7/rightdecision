# enrollment

## Purpose
THE access primitive for Platform V2 (eng-schema S1/S2). Business queries that answer
"can this user see this content?" by joining content down to active enrollments.
Content is gated by enrollment rows, never by user role and never by subscription directly.

## Critical Rules
- NEVER cache enrollment checks (no Redis, no module-level memo) — request-scoped
  memoization only, stored on the Hono context by `requireEnrollment`. Revocation
  latency beats 1ms; it is one indexed query at <1k users.
- ALWAYS gate access through `status = 'active'` AND (`expiresAt IS NULL OR expiresAt > now()`)
  — never trust `status` alone between expiry sweeps.
- canAccessLesson is ONE indexed join: lessons → modules → program_courses (on courseId)
  → enrollments (on programId, userId, active). Never N+1 it, never split it.
- Re-enrollment is an UPSERT against `enrollments(userId, programId)` unique (TD-2):
  one row per user per program; a later cohort UPDATEs cohortId (cohort-join history
  belongs to the events spine as 'cohort_joined', not to this table).
- cohortId is NULLABLE by design: paid = evergreen (null), free = cohort-bound. Never
  require it.
- NEVER gate on user role here — `pro` role is legacy (eng-schema S7); enrollments are
  the source of truth post-cutover.

## Imports (use from other modules)
```ts
import {
  grantEnrollment,
  revokeEnrollment,
  listEnrollments,
  hasActiveEnrollment,
  getActiveEnrollment,
  canAccessLesson,
  canAccessMaterial,
  canAccessLive,
} from '@/features/(shared)/enrollment/service'
```

## Recipe: New canAccessX query
```ts
// Single indexed join from the content row to an active enrollment. Shape:
export async function canAccessThing(userId: string, thingId: string): Promise<boolean> {
  const rows = await db
    .select({ enrollmentId: enrollments.id })
    .from(things) // content table
    .innerJoin(enrollments, and(
      eq(enrollments.programId, things.programId), // or via a program_* join table
      eq(enrollments.userId, userId),
      activeEnrollmentClause(), // status active + not past expiresAt
    ))
    .where(eq(things.id, thingId))
    .limit(1)
  return rows.length > 0
}
```

## Verify
```sh
DATABASE_URL=postgresql://test:test@localhost:5432/test bun test "features/(shared)/enrollment"
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| service.ts | activeEnrollmentClause, grantEnrollmentInput, GrantEnrollmentInput, grantEnrollment, revokeEnrollment, listEnrollments, getActiveEnrollment, hasActiveEnrollment, canAccessLesson, canAccessMaterial, canAccessLive |

## Internal Dependencies
- platform/db

<!-- Generated: 2026-06-12T23:31:24.932Z -->
