import { zValidator } from '@hono/zod-validator'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { requireAuth } from '@/platform/auth/middleware'
import { db } from '@/platform/db/client'
import { courseProgress, purchases } from '@/platform/db/schema'
import { throwError } from '@/platform/errors'
import { success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'

const completeSchema = z.object({
  moduleId: z.number().min(1).max(7),
})

export const progressRoutes = new Hono<AppEnv>()

progressRoutes.post('/complete', requireAuth, zValidator('json', completeSchema), async (c) => {
  const user = c.get('user')
  const { moduleId } = c.req.valid('json')

  const purchase = await db.query.purchases.findFirst({
    where: and(eq(purchases.userId, user.id), eq(purchases.status, 'active')),
  })

  if (!purchase) {
    return throwError(c, 'NO_SUBSCRIPTION')
  }

  if (moduleId > 1) {
    const prev = await db.query.courseProgress.findFirst({
      where: and(eq(courseProgress.userId, user.id), eq(courseProgress.moduleId, moduleId - 1)),
    })

    if (!prev) {
      return throwError(c, 'LESSON_LOCKED')
    }
  }

  await db.insert(courseProgress).values({ userId: user.id, moduleId }).onConflictDoNothing()

  return success(c, { moduleId, completed: true })
})

progressRoutes.get('/', requireAuth, async (c) => {
  const user = c.get('user')

  const progress = await db.query.courseProgress.findMany({
    where: eq(courseProgress.userId, user.id),
    orderBy: (cp, { asc }) => [asc(cp.moduleId)],
  })

  return success(c, { completedModules: progress.map((p) => p.moduleId) })
})
