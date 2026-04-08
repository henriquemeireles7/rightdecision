# transcribe

## Purpose
Step 1 of the BD podcast pipeline. Downloads video from R2, runs Whisper transcription, stores timestamped transcript in DB. No AI dependency — pure server-side processing.

## Critical Rules
- NEVER call AI APIs — transcription is local Whisper only
- ALWAYS clean up temp files on both success AND failure
- ALWAYS validate video format before spawning Whisper
- ALWAYS use assertTransition() for status changes
- NEVER return raw c.json() — use success() or paginated()

## Imports (use from other modules)
```ts
import { db } from '@/platform/db'
import { pipelineRuns, clips } from '@/platform/db/schema'
import { throwError } from '@/platform/errors'
import { success, paginated, created } from '@/platform/server/responses'
import { assertTransition } from '@/features/(business)/workflow/state-machine'
import { transcribe } from '@/providers/transcription'
import { download } from '@/providers/storage'
import { env } from '@/platform/env'
```

## Recipe: New Endpoint
```ts
.post('/', zValidator('json', schema), async (c) => {
  const body = c.req.valid('json')
  // validate → transition status → process → update DB
  return success(c, result)
})
```

## Verify
```sh
bun test features/\(business\)/transcribe/service.test.ts
```
