import { Hono } from 'hono'
import { requireAuth } from '@/platform/auth/middleware'
import { success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import { getUserDecisions } from './decisions'
import { getReadingStats } from './reading-analytics'

export const journeyRoutes = new Hono<AppEnv>()

journeyRoutes.get('/', requireAuth, async (c) => {
  const user = c.get('user')

  const [decisions, stats] = await Promise.all([
    getUserDecisions(user.id, 'life-decisions'),
    getReadingStats(user.id, 'life-decisions'),
  ])

  return success(c, {
    decisions,
    stats,
  })
})
