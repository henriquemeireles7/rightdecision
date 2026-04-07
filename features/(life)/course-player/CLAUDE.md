# course-player

## Purpose
Course access gate + content delivery. Checks purchase status before serving course data.

## Critical Rules
- ALWAYS check purchase status before returning course data (query purchases table)
- ALWAYS use `requireAuth` middleware — every route in this feature requires authentication
- NEVER return course content without verifying `purchases.status === 'active'`
- ALWAYS use `success()` from `platform/server/responses.ts` — never raw `c.json()`
- New endpoints MUST have `zValidator` on request body/params

## Recipe: New Endpoint
```ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requireAuth } from '@/platform/auth/middleware'
import { db } from '@/platform/db/client'
import { purchases } from '@/platform/db/schema'
import { throwError } from '@/platform/errors'
import { success } from '@/platform/server/responses'

const schema = z.object({ /* ... */ })

export const myRoutes = new Hono()
myRoutes.get('/', requireAuth, zValidator('query', schema), async (c) => {
  const user = c.get('user')
  // ALWAYS check purchase status first
  const purchase = await db.query.purchases.findFirst({ where: eq(purchases.userId, user.id) })
  if (!purchase || purchase.status !== 'active') return throwError(c, 'NO_SUBSCRIPTION')
  // ... business logic ...
  return success(c, result)
})
```
Then wire in `platform/server/routes.ts` via `.route('/api/my', myRoutes)`

## Verify
```sh
bun test features/course-player/
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| routes.ts | courseRoutes |

## Internal Dependencies
- platform/auth
- platform/db
- platform/errors
- platform/server
- platform/types

<!-- Generated: 2026-04-06T23:27:10.491Z -->
