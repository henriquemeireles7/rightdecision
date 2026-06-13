import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { requireAuth } from '@/platform/auth/middleware'
import { requirePermission } from '@/platform/auth/permissions'
import { throwError } from '@/platform/errors'
import { created, success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import { cancelLive, listLives, requestReplayUploadUrl, scheduleLive, updateLive } from './service'

const idParam = z.object({ id: z.uuid() })

const scheduleSchema = z.object({
  programId: z.uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  scheduledAt: z.coerce.date(),
  youtubeUrl: z.url().optional(),
})
const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  scheduledAt: z.coerce.date().optional(),
  youtubeUrl: z.url().nullable().optional(),
})
const listQuerySchema = z.object({
  programId: z.uuid(),
  when: z.enum(['upcoming', 'past', 'all']).default('all'),
})
const replayUploadSchema = z.object({
  uploadLengthBytes: z.number().int().positive(),
})

export const adminLivesRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .use(requirePermission('manage_content'))
  .post('/', zValidator('json', scheduleSchema), async (c) => {
    const result = await scheduleLive(c.req.valid('json'))
    if ('error' in result) return throwError(c, result.error, result.details)
    return created(c, result)
  })
  .get('/', zValidator('query', listQuerySchema), async (c) => {
    const { programId, when } = c.req.valid('query')
    const result = await listLives(programId, when)
    if ('error' in result) return throwError(c, result.error, result.details)
    return success(c, result)
  })
  .patch('/:id', zValidator('param', idParam), zValidator('json', updateSchema), async (c) => {
    const result = await updateLive(c.req.valid('param').id, c.req.valid('json'))
    if ('error' in result) return throwError(c, result.error, result.details)
    return success(c, result)
  })
  .post('/:id/cancel', zValidator('param', idParam), async (c) => {
    const result = await cancelLive(c.req.valid('param').id)
    if ('error' in result) return throwError(c, result.error, result.details)
    return success(c, result)
  })
  // tus replay upload — the route only hands out the URL; bytes go direct to Stream.
  .post(
    '/:id/replay-upload-url',
    zValidator('param', idParam),
    zValidator('json', replayUploadSchema),
    async (c) => {
      const result = await requestReplayUploadUrl(
        c.req.valid('param').id,
        c.req.valid('json').uploadLengthBytes,
      )
      if ('error' in result) return throwError(c, result.error, result.details)
      return success(c, result)
    },
  )
