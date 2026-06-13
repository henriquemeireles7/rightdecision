import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { workflowConfigSchema } from '@/features/(business)/workflow/config'
import { requireAuth } from '@/platform/auth/middleware'
import { requirePermission } from '@/platform/auth/permissions'
import type { ErrorCode } from '@/platform/errors'
import { throwError } from '@/platform/errors'
import { accepted, created, paginated, success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import {
  getClipsForRun,
  getPipelineRun,
  listPipelineRuns,
  processTranscription,
  startTranscription,
} from './service'

// Allowlisted R2 storage-key shape — episodes/<name>.<supported format>. Prevents a
// caller from steering the download to an arbitrary key (no slashes/traversal in name).
const videoUrlSchema = z
  .string()
  .regex(
    /^episodes\/[\w.-]+\.(mp4|webm|wav|mp3|ogg|m4a)$/,
    'must be an episodes/<name>.<mp4|webm|wav|mp3|ogg|m4a> storage key',
  )

const transcribeSchema = z.object({
  videoUrl: videoUrlSchema,
  config: workflowConfigSchema.partial().optional(),
})

const idParam = z.object({ id: z.uuid() })

const listQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(100).default(20),
})

export const transcribeRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .use(requirePermission('manage_content'))
  .post('/', zValidator('json', transcribeSchema), async (c) => {
    const { videoUrl, config } = c.req.valid('json')
    const result = await startTranscription(videoUrl, config)
    if ('error' in result) return throwError(c, result.error as ErrorCode)
    return created(c, { run: result.run })
  })
  .post('/:id/process', zValidator('param', idParam), async (c) => {
    const { id } = c.req.valid('param')
    const result = await processTranscription(id)
    if ('error' in result) return throwError(c, result.error as ErrorCode)
    return accepted(c, { run: result.run })
  })
  .get('/', zValidator('query', listQuerySchema), async (c) => {
    const { page, perPage } = c.req.valid('query')
    const result = await listPipelineRuns(page, perPage)
    return paginated(c, result.runs, result.total, result.page, result.perPage)
  })
  .get('/:id', zValidator('param', idParam), async (c) => {
    const { id } = c.req.valid('param')
    const result = await getPipelineRun(id)
    if ('error' in result) return throwError(c, result.error as ErrorCode)
    return success(c, { run: result.run })
  })
  .get('/:id/clips', zValidator('param', idParam), async (c) => {
    const { id } = c.req.valid('param')
    const result = await getClipsForRun(id)
    if ('error' in result) return throwError(c, result.error as ErrorCode)
    return success(c, { clips: result.clips })
  })
