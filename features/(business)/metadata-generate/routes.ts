import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { requireAuth } from '@/platform/auth/middleware'
import { requirePermission } from '@/platform/auth/permissions'
import type { ErrorCode } from '@/platform/errors'
import { throwError } from '@/platform/errors'
import { success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import { metadataInputSchema, saveMetadata } from './service'

export const metadataRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .use(requirePermission('manage_content'))
  .post('/', zValidator('json', metadataInputSchema), async (c) => {
    const { pipelineRunId, metadata, profileSlug } = c.req.valid('json')
    const result = await saveMetadata(pipelineRunId, metadata, profileSlug)
    if ('error' in result) return throwError(c, result.error as ErrorCode)
    return success(c, result)
  })
