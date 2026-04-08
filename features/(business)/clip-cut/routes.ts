import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { throwError } from '@/platform/errors'
import type { ErrorCode } from '@/platform/errors'
import { success, partial } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import { requireAuth } from '@/platform/auth/middleware'
import { cutClipsForRun } from './service'

const cutSchema = z.object({
  pipelineRunId: z.string().uuid(),
})

export const clipCutRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .post('/', zValidator('json', cutSchema), async (c) => {
    const { pipelineRunId } = c.req.valid('json')
    const result = await cutClipsForRun(pipelineRunId)
    if ('error' in result) return throwError(c, result.error as ErrorCode)
    if ('partial' in result && result.partial) {
      const failures = result.clips.filter((r) => !r.success).map((r) => ({ id: r.clipId, error: r.error ?? 'Unknown' }))
      return partial(c, result.clips, failures)
    }
    return success(c, { clips: result.clips })
  })
