# insight-generate

## Purpose
Step 7 of BD pipeline. SKILL-DRIVEN RECEIVER: validates and saves insights sent by the /whats-working skill. Persists recommendations with supporting data. Server never calls AI.

## Verify
```sh
bun test features/\(business\)/insight-generate/service.test.ts
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| routes.ts | insightRoutes |
| service.ts | insightInputSchema, saveInsight, listInsights |

## Internal Dependencies
- platform/auth
- platform/db
- platform/errors
- platform/server
- platform/types

<!-- Generated: 2026-04-10T08:28:38.396Z -->
