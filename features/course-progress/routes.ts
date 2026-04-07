import { zValidator } from '@hono/zod-validator'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { requireAuth } from '@/platform/auth/middleware'
import { db } from '@/platform/db/client'
import { courseProgress, subscriptions } from '@/platform/db/schema'
import { throwError } from '@/platform/errors'
import { success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'

const completeSchema = z.object({
  classId: z.string().min(1),
  courseId: z.string().min(1),
})

export const progressRoutes = new Hono<AppEnv>()

progressRoutes.post('/complete', requireAuth, zValidator('json', completeSchema), async (c) => {
  const user = c.get('user')
  const { classId, courseId } = c.req.valid('json')

  const subscription = await db.query.subscriptions.findFirst({
    where: and(eq(subscriptions.userId, user.id), eq(subscriptions.status, 'active')),
  })

  if (!subscription) {
    return throwError(c, 'SUBSCRIPTION_REQUIRED')
  }

  await db
    .insert(courseProgress)
    .values({ userId: user.id, classId, courseId })
    .onConflictDoNothing()

  return success(c, { classId, courseId, completed: true })
})

progressRoutes.get('/', requireAuth, async (c) => {
  const user = c.get('user')

  const progress = await db.query.courseProgress.findMany({
    where: eq(courseProgress.userId, user.id),
    orderBy: (cp, { asc }) => [asc(cp.completedAt)],
  })

  return success(c, { completedClasses: progress.map((p) => ({ classId: p.classId, courseId: p.courseId })) })
})
