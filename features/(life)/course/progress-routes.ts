import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { requireAuth } from '@/platform/auth/middleware'
import { success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import {
  getModuleProgress,
  getOverallProgress,
  getUserProgress,
  markClassComplete,
} from './progress'

const completeSchema = z.object({
  classId: z.string().min(1),
  courseId: z.string().min(1),
})

export const progressApiRoutes = new Hono<AppEnv>()

// Mark a class complete
progressApiRoutes.post('/complete', requireAuth, zValidator('json', completeSchema), async (c) => {
  const user = c.get('user')
  const { classId, courseId } = c.req.valid('json')

  await markClassComplete(user.id, classId, courseId)

  return success(c, { classId, courseId, completed: true })
})

// Get all progress for current user
progressApiRoutes.get('/', requireAuth, async (c) => {
  const user = c.get('user')
  const progress = await getUserProgress(user.id)
  const overall = await getOverallProgress(user.id)

  return success(c, {
    completedClasses: progress.map((p) => ({ classId: p.classId, courseId: p.courseId })),
    overall,
  })
})

// Get progress for a specific module
progressApiRoutes.get('/module/:moduleNum', requireAuth, async (c) => {
  const moduleNum = Number.parseInt(c.req.param('moduleNum'), 10)
  const user = c.get('user')
  const moduleProgress = await getModuleProgress(user.id, moduleNum)

  return success(c, moduleProgress)
})
