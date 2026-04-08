# clip-select

## Purpose
Step 2 of BD pipeline. SKILL-DRIVEN RECEIVER: validates and saves clip definitions sent by the /select-clips skill. Server never calls AI — it only validates + stores.

## Critical Rules
- NEVER call AI APIs — this is a RECEIVER endpoint
- ALWAYS validate timestamps against video durationSeconds
- ALWAYS delete existing clips before re-inserting (non-deterministic AI output)
- ALWAYS use assertTransition() for status changes
- NEVER return raw c.json() — use success()

## Imports
```ts
import { db } from '@/platform/db/client'
import { pipelineRuns, clips } from '@/platform/db/schema'
import { throwError } from '@/platform/errors'
import { success } from '@/platform/server/responses'
import { assertTransition } from '@/features/(business)/workflow/state-machine'
```

## Verify
```sh
bun test features/\(business\)/clip-select/service.test.ts
```
