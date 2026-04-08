# health

## Purpose
Pipeline health check endpoint. Verifies all pipeline dependencies (DB, R2, Upload-Post, whisper-cpp, ffmpeg) are available before starting a pipeline run. Used by the orchestrator skill's pre-flight checks.

## Critical Rules
- NEVER let a health check failure crash the endpoint. Each provider check is wrapped in try/catch.
- ALWAYS return per-provider status even when some are down (degraded, not error).
- ALWAYS clean up R2 test files after the connectivity check.

## Imports (use from other modules)
```ts
import { db } from '@/platform/db/client'
import { upload, download, remove } from '@/providers/storage'
import { listProfiles } from '@/providers/social-posting'
import { requireAuth } from '@/platform/auth/middleware'
import { success } from '@/platform/server/responses'
```

## Verify
```sh
bun test features/\(business\)/health/service.test.ts
```
