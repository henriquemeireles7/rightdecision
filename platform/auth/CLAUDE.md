# auth

## Purpose
Better Auth integration. Session management, role-based permissions (free/pro/admin).

## Critical Rules
- ALWAYS use `requireAuth` middleware for protected routes — never check auth inline
- ALWAYS use `requirePermission()` for role-gated routes — never check roles manually
- Roles are exactly 3: `free`, `pro`, `admin`. Permissions are additive (admin does NOT inherit pro permissions)
- Auth routes mount at `/api/auth/*` and delegate to Better Auth handler — do not add custom routes here
- Session: 30-day expiry, daily refresh. Do not change without explicit approval.
- NEVER access `session.user.role` directly in route handlers — use `c.get('user').role` after `requireAuth`

## Imports (use from other modules)
```ts
import { requireAuth } from '@/platform/auth/middleware'
import { requirePermission } from '@/platform/auth/permissions'
import type { Role } from '@/platform/auth/permissions'
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
| middleware.ts | requireAuth |
| permissions.ts | permissions, Role, Permission, hasPermission, requirePermission |
| routes.ts | authRoutes |

## Internal Dependencies
- platform/db
- platform/env
- platform/errors
- platform/types

<!-- Generated: 2026-04-06T23:27:10.494Z -->
