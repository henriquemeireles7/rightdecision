# analytics

## Purpose
Admin-only analytics (onboarding funnel). MIGRATED from features/(shared)/admin/ into the
(admin) group (Platform V2 P2 deliverable 1) — one admin group, no orphan.

## Critical Rules
- ALWAYS use requirePermission('view_analytics') on all routes (analytics permission, not
  manage_content)
- NEVER expose individual user PII in aggregate analytics

## Imports (use from other modules)
```ts
import { adminAnalyticsRoutes } from '@/features/(admin)/analytics/routes'
```

## Verify
```sh
bun test "features/(admin)/analytics"
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| onboarding-analytics.ts | getOnboardingAnalytics |
| routes.ts | adminAnalyticsRoutes |

## Internal Dependencies
- platform/auth
- platform/db
- platform/server
- platform/types

<!-- Generated: 2026-06-12T23:26:29.520Z -->
