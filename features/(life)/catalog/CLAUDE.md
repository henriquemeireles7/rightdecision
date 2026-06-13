# catalog

## Purpose
Program-aware members-area catalog API (P3 members-area): the user's enrollments resolve to
their programs' courses/modules/lessons with per-item lock state, per-lesson progress, the
continue-watching list, and the pre-start cohort state. This is the read model behind the
Netflix-style rails (ADR 4: one platform, free users see the full catalog with locks).

## Critical Rules
- NEVER leak draft content — courses/modules/lessons are filtered to status='published'
  for BOTH unlocked and locked programs (Gate B: drafts never appear, not even as previews)
- NEVER expose lesson content on locked items — locked previews carry title/cover/description
  only; locked lessons are { id, title } (no video ids, no prompts, no durations)
- Lock state derives from ACTIVE enrollments only (status='active' AND not past expiresAt) —
  an expired enrollment renders the program locked, same as never-enrolled
- Visible programs = programs with status='active' (the one-platform rule); draft/archived
  programs do not exist to the catalog
- ALWAYS return unlocked programs before locked ones — the Lock-State UX puts unlocked
  content first
- Continue-watching = ONE query on index(userId, lastWatchedAt): most recent N incomplete
  lesson_progress rows joined down to published, enrollment-accessible lessons
- Pre-start: an active enrollment whose cohort startsAt is in the future returns
  cohortStartsAt (top-level + per-program) so the UI renders the welcome state — never an
  empty room

## Imports (use from other modules)
```ts
import { getCatalog, CONTINUE_WATCHING_LIMIT } from '@/features/(life)/catalog/service'
import { catalogRoutes } from '@/features/(life)/catalog/routes'
```

## Recipe: New catalog query
```ts
// Scope by ACTIVE enrollment + published status in the SQL, never in JS after the fact:
const rows = await db
  .select({ ... })
  .from(contentTable)
  .innerJoin(enrollments, and(
    eq(enrollments.programId, contentTable.programId),
    eq(enrollments.userId, userId),
    eq(enrollments.status, 'active'),
    or(isNull(enrollments.expiresAt), gt(enrollments.expiresAt, now)),
  ))
  .where(eq(contentTable.status, 'published'))
```

## Verify
```sh
DATABASE_URL=postgresql://test:test@localhost:5432/test_b2 bun test "features/(life)/catalog"
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| routes.ts | createCatalogRoutes, catalogRoutes |
| service.ts | CONTINUE_WATCHING_LIMIT, getCatalog |

## Internal Dependencies
- features/(shared)
- platform/auth
- platform/db
- platform/server
- platform/types

<!-- Generated: 2026-06-12T23:31:24.935Z -->
