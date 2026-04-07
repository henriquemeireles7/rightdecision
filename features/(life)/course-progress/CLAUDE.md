# course-progress

## Purpose
Track and enforce sequential module completion. Modules 1-7 must be completed in order.

## Critical Rules
- ALWAYS enforce sequential completion: module N requires module N-1 completed first (except module 1)
- NEVER allow skipping modules — the `LESSON_LOCKED` error exists for this
- ALWAYS use `onConflictDoNothing()` on progress inserts (unique constraint: userId + moduleId)
- Validation: moduleId is `z.number().min(1).max(7)` — there are exactly 7 modules
- ALWAYS check purchase status before allowing progress updates
- ALWAYS use `success()` from `platform/server/responses.ts` — never raw `c.json()`

## Recipe: New Endpoint
```ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requireAuth } from '@/platform/auth/middleware'
import { db } from '@/platform/db/client'
import { courseProgress } from '@/platform/db/schema'
import { throwError } from '@/platform/errors'
import { success } from '@/platform/server/responses'

const schema = z.object({ moduleId: z.number().min(1).max(7) })

export const myRoutes = new Hono()
myRoutes.post('/', requireAuth, zValidator('json', schema), async (c) => {
  const user = c.get('user')
  const { moduleId } = c.req.valid('json')
  // ALWAYS enforce sequential completion
  if (moduleId > 1) {
    const prev = await db.query.courseProgress.findFirst({ /* check moduleId - 1 */ })
    if (!prev) return throwError(c, 'LESSON_LOCKED')
  }
  await db.insert(courseProgress).values({ userId: user.id, moduleId }).onConflictDoNothing()
  return success(c, { moduleId })
})
```

## Verify
```sh
bun test features/course-progress/
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| routes.ts | progressRoutes |

## Internal Dependencies
- platform/auth
- platform/db
- platform/errors
- platform/server
- platform/types

<!-- Generated: 2026-04-06T23:27:10.491Z -->
