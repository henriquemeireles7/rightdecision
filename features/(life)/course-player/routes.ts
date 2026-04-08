import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { requireAuth } from '@/platform/auth/middleware'
import { db } from '@/platform/db/client'
import { courseProgress, subscriptions } from '@/platform/db/schema'
import { throwError } from '@/platform/errors'
import { success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'

export const courseRoutes = new Hono<AppEnv>()

courseRoutes.get('/', requireAuth, async (c) => {
  const user = c.get('user')

  const subscription = await db.query.subscriptions.findFirst({
    where: and(eq(subscriptions.userId, user.id), eq(subscriptions.status, 'active')),
  })

  if (!subscription) {
    return throwError(c, 'SUBSCRIPTION_REQUIRED')
  }

  const progress = await db.query.courseProgress.findMany({
    where: eq(courseProgress.userId, user.id),
  })

  return success(c, {
    completedClasses: progress.map((p) => ({ classId: p.classId, courseId: p.courseId })),
  })
})
