import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { requireAuth } from '@/platform/auth/middleware'
import { success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import { collectAnalytics } from './service'

const collectSchema = z.object({
  postIds: z.array(z.string().uuid()).optional(),
})

export const analyticsRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .post('/', zValidator('json', collectSchema), async (c) => {
    const { postIds } = c.req.valid('json')
    const result = await collectAnalytics(postIds)
    return success(c, result)
  })
