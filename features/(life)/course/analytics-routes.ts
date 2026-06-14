import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { requireAuth } from '@/platform/auth/middleware'
import { success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import { logReading } from './reading-analytics'

export const analyticsReadingRoutes = new Hono<AppEnv>()

const logSchema = z.object({
  classId: z.string().min(1),
  courseSlug: z.string().min(1),
  timeSpentSec: z.number().int().min(0).max(36000),
  scrollDepth: z.number().int().min(0).max(100),
})

analyticsReadingRoutes.post('/', requireAuth, zValidator('json', logSchema), async (c) => {
  const user = c.get('user')
  const { classId, courseSlug, timeSpentSec, scrollDepth } = c.req.valid('json')

  // Fire-and-forget: swallow failures and always return 200 (analytics never breaks reading).
  try {
    await logReading(user.id, classId, courseSlug, timeSpentSec, scrollDepth)
  } catch {
    // intentionally ignored — best-effort analytics write
  }

  return success(c, { logged: true })
})
