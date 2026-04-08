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
