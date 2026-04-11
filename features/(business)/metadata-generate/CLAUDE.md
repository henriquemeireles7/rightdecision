# metadata-generate

## Purpose
Step 4 of BD pipeline. SKILL-DRIVEN RECEIVER: validates and saves metadata (descriptions, hashtags, CTAs) sent by the /generate-metadata skill. Creates posts rows. Server never calls AI.

## Critical Rules
- NEVER call AI APIs — this is a RECEIVER endpoint
- ALWAYS validate char limits against platformAccounts
- ALWAYS respect UNIQUE(clipId, platformAccountId) for idempotency
- ALWAYS use assertTransition() for status changes

## Verify
```sh
bun test features/\(business\)/metadata-generate/service.test.ts
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| routes.ts | metadataRoutes |
| service.ts | metadataInputSchema, saveMetadata |

## Internal Dependencies
- features/(business)
- platform/auth
- platform/db
- platform/errors
- platform/server
- platform/types
- providers/analytics

<!-- Generated: 2026-04-10T08:28:38.396Z -->
