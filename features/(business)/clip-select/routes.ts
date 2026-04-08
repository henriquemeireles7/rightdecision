import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { throwError } from '@/platform/errors'
import type { ErrorCode } from '@/platform/errors'
import { success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import { requireAuth } from '@/platform/auth/middleware'
import { clipSelectInputSchema, saveClipSelections } from './service'

export const clipSelectRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .post('/', zValidator('json', clipSelectInputSchema), async (c) => {
    const { pipelineRunId, clips } = c.req.valid('json')
    const result = await saveClipSelections(pipelineRunId, clips)
    if ('error' in result) return throwError(c, result.error as ErrorCode)
    return success(c, { clips: result.clips })
  })
