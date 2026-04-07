import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import { searchClasses } from '@/providers/content'
import { type AccessTier, canAccessClass, getModuleFromClassId, getUserAccessTier } from './access'

const searchSchema = z.object({
  q: z.string().min(1).max(200),
  limit: z.coerce.number().min(1).max(50).default(20),
})

export const searchRoutes = new Hono<AppEnv>()

// Search course content — no auth required (free users see module 0-1 only)
searchRoutes.get('/', zValidator('query', searchSchema), async (c) => {
  const { q, limit } = c.req.valid('query')

  // Determine access tier (may be unauthenticated)
  let accessTier: AccessTier = 'free'
  try {
    const user = c.get('user')
    if (user) {
      accessTier = await getUserAccessTier(user.id)
    }
  } catch {
    // No auth — free tier
  }

  const allResults = searchClasses(q)

  // Filter by access tier
  const filtered = allResults
    .filter((cls) => {
      const moduleNum = getModuleFromClassId(cls.id)
      return canAccessClass(moduleNum, accessTier)
    })
    .slice(0, limit)
    .map((cls) => ({
      classId: cls.id,
      title: cls.title,
      module: cls.module,
      courseId: cls.courseId,
      type: cls.type,
      durationMinutes: cls.durationMinutes,
    }))

  return success(c, { results: filtered, total: filtered.length })
})
