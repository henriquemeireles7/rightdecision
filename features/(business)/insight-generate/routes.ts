import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { throwError } from '@/platform/errors'
import type { ErrorCode } from '@/platform/errors'
import { success, paginated } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import { requireAuth } from '@/platform/auth/middleware'
import { insightInputSchema, saveInsight, listInsights } from './service'

const listQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(100).default(20),
})

export const insightRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .post('/', zValidator('json', insightInputSchema), async (c) => {
    const input = c.req.valid('json')
    const result = await saveInsight(input)
    if ('error' in result) return throwError(c, result.error as ErrorCode)
    return success(c, { insight: result.insight })
  })
  .get('/', zValidator('query', listQuerySchema), async (c) => {
    const { page, perPage } = c.req.valid('query')
    const result = await listInsights(page, perPage)
    return paginated(c, result.insights, result.total, result.page, result.perPage)
  })
