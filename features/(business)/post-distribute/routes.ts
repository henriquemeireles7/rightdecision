import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { throwError } from '@/platform/errors'
import type { ErrorCode } from '@/platform/errors'
import { success, partial } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import { requireAuth } from '@/platform/auth/middleware'
import { distributePostsForRun } from './service'

const distributeSchema = z.object({
  pipelineRunId: z.string().uuid(),
})

export const postDistributeRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .post('/', zValidator('json', distributeSchema), async (c) => {
    const { pipelineRunId } = c.req.valid('json')
    const result = await distributePostsForRun(pipelineRunId)
    if ('error' in result) return throwError(c, result.error as ErrorCode)
    if ('partial' in result && result.partial) {
      const failures = result.posts.filter((r) => !r.success).map((r) => ({ id: r.postId, error: r.error ?? 'Unknown' }))
      return partial(c, result.posts, failures)
    }
    return success(c, { posts: result.posts })
  })
