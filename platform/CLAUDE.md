# platform

## Purpose
Shared infrastructure. Every feature depends on this layer — changes here affect the entire app.

## Critical Rules
- NEVER add env vars anywhere except `platform/env.ts` (uses `@t3-oss/env-core` with Zod validation)
- NEVER create ad-hoc error responses — add error codes to `platform/errors.ts`, use `throwError()`
- NEVER define types manually — infer from Zod schemas or Drizzle tables
- `AppEnv` type in `types.ts` defines the Hono context shape — update it when adding new middleware variables
- `ErrorCode` is a union of string literals from the `errors` const — always add new codes there

## Imports (use from other modules)
```ts
import { env } from '@/platform/env'
import { throwError } from '@/platform/errors'
import type { ErrorCode } from '@/platform/errors'
import type { AppUser, AppEnv } from '@/platform/types'
```

## Recipe: New Error Code
Add to the `errors` const in `platform/errors.ts`:
```ts
MY_ERROR: { code: 'MY_ERROR', status: 4xx, message: 'Human-readable message' },
```
`ErrorCode` type updates automatically (inferred from the const).

## Recipe: New Env Var
Add to `platform/env.ts` inside the `env` object:
```ts
MY_VAR: { env: z.string().min(1) }  // or z.string().optional()
```
Then add the actual value in Railway dashboard.

## Verify
```sh
bunx tsc --noEmit platform/env.ts platform/errors.ts platform/types.ts
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| env.ts | env |
| errors.ts | errors, ErrorCode, throwError |
| rate-limit.ts | checkRateLimit |
| types.ts | AppUser, AppEnv |

<!-- Generated: 2026-04-09T09:30:25.861Z -->
