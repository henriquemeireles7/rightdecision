import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { requireAuth } from '@/platform/auth/middleware'
import { db } from '@/platform/db/client'
import { courseProgress, purchases } from '@/platform/db/schema'
import { throwError } from '@/platform/errors'
import { success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'

export const courseRoutes = new Hono<AppEnv>()

courseRoutes.get('/', requireAuth, async (c) => {
  const user = c.get('user')

  const purchase = await db.query.purchases.findFirst({
    where: and(eq(purchases.userId, user.id), eq(purchases.status, 'active')),
  })

  if (!purchase) {
    return throwError(c, 'NO_SUBSCRIPTION')
  }

  const progress = await db.query.courseProgress.findMany({
    where: eq(courseProgress.userId, user.id),
  })

  return success(c, { completedModules: progress.map((p) => p.moduleId) })
})
