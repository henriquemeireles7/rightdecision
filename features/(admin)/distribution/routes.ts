import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { requireAuth } from '@/platform/auth/middleware'
import { requirePermission } from '@/platform/auth/permissions'
import { throwError } from '@/platform/errors'
import { success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import { getRunDetail, requestVideoUploadUrl, setClipApproval } from './service'

const uploadUrlSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
})
const runIdParam = z.object({ runId: z.uuid() })
const clipParam = z.object({ runId: z.uuid(), clipId: z.uuid() })
const approvalSchema = z.object({ approved: z.boolean() })

/**
 * Admin glue over the existing BD pipeline. Three endpoints only — everything else (start run,
 * transcribe, clip-select, clip-cut, metadata, distribute) is the existing (business) pipeline,
 * called unchanged from the SPA. Mounted (by the founder) at /api/admin/distribution.
 */
export const adminDistributionRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .use(requirePermission('manage_content'))

  // Presigned PUT for direct-to-R2 video ingest — bytes never touch Hono.
  .post('/upload-url', zValidator('json', uploadUrlSchema), async (c) => {
    const result = await requestVideoUploadUrl(c.req.valid('json'))
    if ('error' in result) return throwError(c, result.error, result.details)
    return success(c, result)
  })

  // Aggregated run detail (run + clips + posts) for the status dashboard.
  .get('/runs/:runId', zValidator('param', runIdParam), async (c) => {
    const result = await getRunDetail(c.req.valid('param').runId)
    if ('error' in result) return throwError(c, result.error, result.details)
    return success(c, result)
  })

  // The approval-gate setter (the only production writer of clips.approved).
  .patch(
    '/runs/:runId/clips/:clipId/approval',
    zValidator('param', clipParam),
    zValidator('json', approvalSchema),
    async (c) => {
      const { runId, clipId } = c.req.valid('param')
      const result = await setClipApproval(runId, clipId, c.req.valid('json').approved)
      if ('error' in result) return throwError(c, result.error, result.details)
      return success(c, result)
    },
  )
