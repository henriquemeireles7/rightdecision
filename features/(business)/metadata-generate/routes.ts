import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { throwError } from '@/platform/errors'
import type { ErrorCode } from '@/platform/errors'
import { success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import { requireAuth } from '@/platform/auth/middleware'
import { metadataInputSchema, saveMetadata } from './service'

export const metadataRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .post('/', zValidator('json', metadataInputSchema), async (c) => {
    const { pipelineRunId, metadata } = c.req.valid('json')
    const result = await saveMetadata(pipelineRunId, metadata)
    if ('error' in result) return throwError(c, result.error as ErrorCode)
    return success(c, result)
  })
