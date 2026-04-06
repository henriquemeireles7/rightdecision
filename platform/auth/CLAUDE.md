# auth

## Purpose
Authentication and authorization — Better Auth setup, permissions, session handling.


## Must-Read Context
Before working in this folder, read:
- decisions/coding.md — data flow, API contracts, patterns

## Additional Context
- decisions/company.md — for permission logic and roles

## Rules
- Follow the project-wide rules in the root CLAUDE.md.

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
