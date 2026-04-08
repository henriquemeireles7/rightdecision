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
    if ('partial' in result) {
      const r = result as { clips: Array<{ clipId: string; success: boolean; error?: string }>; partial: boolean }
      const failures = r.clips.filter((x) => !x.success).map((x) => ({ id: x.clipId, error: x.error ?? 'Unknown' }))
      return partial(c, r.clips, failures)
    }
    return success(c, result)
  })
