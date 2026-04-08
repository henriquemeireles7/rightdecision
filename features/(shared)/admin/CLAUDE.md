# admin

## Purpose
Admin-only analytics and management routes. Requires admin role.

## Critical Rules
- ALWAYS use requirePermission('view_analytics') on all routes
- NEVER expose individual user PII in aggregate analytics

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| onboarding-analytics.ts | getOnboardingAnalytics |
| routes.ts | adminRoutes |

## Internal Dependencies
- platform/auth
- platform/db
- platform/server
- platform/types

<!-- Generated: 2026-04-08T05:22:13.832Z -->
