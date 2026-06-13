# programs

## Purpose
Admin CRUD for programs (the V2 entry point: free cohort program + paid program) and the
program_courses mapping — which courses each program includes, in what order. Changing the
mapping changes member access (enrollment queries join through program_courses).

## Critical Rules
- Program slugs are unique — duplicate slug returns VALIDATION_ERROR with details, never a
  raw postgres error.
- NEVER delete a program — archive via status='archived' (enrollments/cohorts/lives FK to it).
- program_courses add is idempotent (onConflictDoNothing on (programId, courseId));
  sortOrder defaults to end-of-list.
- Reorder writes sortOrder = array index; the id set must exactly match the program's
  current courses → VALIDATION_ERROR otherwise.
- Removing a course from a program revokes member access to it — that is the POINT
  (roadmap deliverable 8), not a bug. The mapping row is deleted, the course row is not.

## Imports (use from other modules)
```ts
import { adminProgramsRoutes } from '@/features/(admin)/programs/routes'
```

## Recipe: Mapping endpoints contract
```ts
// POST   /:programId/courses            { courseId, sortOrder? }
// DELETE /:programId/courses/:courseId
// POST   /:programId/courses/reorder    { courseIds: [uuid, ...] }
```

## Verify
```sh
source /tmp/test-env.sh && DATABASE_URL=postgresql://test:test@localhost:5432/test_b1 bun test "features/(admin)/programs"
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| routes.ts | adminProgramsRoutes |
| service.ts | createProgram, listPrograms, getProgram, updateProgram, addCourseToProgram, removeCourseFromProgram, reorderProgramCourses |

## Internal Dependencies
- platform/auth
- platform/db
- platform/errors
- platform/server
- platform/types

<!-- Generated: 2026-06-12T23:31:24.935Z -->
