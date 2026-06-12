# auth

## Purpose
Better Auth integration. Session management, role-based permissions (free/pro/admin),
and V2 enrollment gating (`enrollment.ts` — sibling of requireAuth/requirePermission).

## Critical Rules
- ALWAYS use `requireAuth` middleware for protected routes — never check auth inline
- ALWAYS use `requirePermission()` for role-gated routes — never check roles manually
- Roles are exactly 3: `free`, `pro`, `admin`. Permissions are additive (admin does NOT inherit pro permissions)
- LEGACY: the `pro` role + its permissions row become legacy once enrollments gate content
  (eng-schema S7). NEVER gate V2 content on role — use `requireEnrollment` (enrollment.ts).
  Admin gating stays role-based. Do not migrate or remove the enum.
- `requireEnrollment(programResolver)` MUST be stacked AFTER `requireAuth`; it memoizes
  per-request on the context — NEVER add cross-request caching (eng-schema S1/S2)
- NEVER read `env.V2_ENROLLMENT_CUTOVER` directly at gate sites — call `isV2CutoverEnabled()`
  (test-overridable seam; both flag states must be testable in one process)
- Auth routes mount at `/api/auth/*` and delegate to Better Auth handler — do not add custom routes here
- Session: 30-day expiry, daily refresh. Do not change without explicit approval.
- NEVER access `session.user.role` directly in route handlers — use `c.get('user').role` after `requireAuth`

## Imports (use from other modules)
```ts
import { requireAuth } from '@/platform/auth/middleware'
import { requirePermission } from '@/platform/auth/permissions'
import type { Role } from '@/platform/auth/permissions'
import { requireEnrollment, isV2CutoverEnabled } from '@/platform/auth/enrollment'
```

## Recipe: Gate a content route on enrollment
```ts
route.get('/lessons/:id', requireAuth, requireEnrollment(async (c) => {
  // resolve the program(s) containing the content; string | string[] | null
  return programIdsForLesson(c.req.param('id'))
}), handler) // handler can read c.get('enrollment')
```

## Verify
```sh
bun test platform/auth/
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| config.ts | auth |
| enrollment.ts | setV2CutoverOverrideForTests, isV2CutoverEnabled, requireEnrollment |
| middleware.ts | requireAuth |
| permissions.ts | requirePermission |
| routes.ts | authRoutes |

## Internal Dependencies
- features/(shared)
- platform/db
- platform/env
- platform/errors
- platform/types
- providers/email

<!-- Generated: 2026-06-12T22:38:50.219Z -->
