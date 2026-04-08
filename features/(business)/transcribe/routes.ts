import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { throwError } from '@/platform/errors'
import type { ErrorCode } from '@/platform/errors'
import { success, paginated, created } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import { startTranscription, processTranscription, getPipelineRun, listPipelineRuns, getClipsForRun } from './service'

const transcribeSchema = z.object({
  videoUrl: z.string().min(1),
  config: z.record(z.string(), z.unknown()).optional(),
})

const listQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(100).default(20),
})

export const transcribeRoutes = new Hono<AppEnv>()
  .post('/', zValidator('json', transcribeSchema), async (c) => {
    const { videoUrl, config } = c.req.valid('json')
    const result = await startTranscription(videoUrl, config)
    if ('error' in result) return throwError(c, result.error as ErrorCode)
    return created(c, { run: result.run })
  })
  .post('/:id/process', async (c) => {
    const id = c.req.param('id')
    const result = await processTranscription(id)
    if ('error' in result) return throwError(c, result.error as ErrorCode)
    return success(c, { run: result.run })
  })
  .get('/', zValidator('query', listQuerySchema), async (c) => {
    const { page, perPage } = c.req.valid('query')
    const result = await listPipelineRuns(page, perPage)
    return paginated(c, result.runs, result.total, result.page, result.perPage)
  })
  .get('/:id', async (c) => {
    const id = c.req.param('id')
    const result = await getPipelineRun(id)
    if ('error' in result) return throwError(c, result.error as ErrorCode)
    return success(c, { run: result.run })
  })
  .get('/:id/clips', async (c) => {
    const id = c.req.param('id')
    const result = await getClipsForRun(id)
    if ('error' in result) return throwError(c, result.error as ErrorCode)
    return success(c, { clips: result.clips })
  })
