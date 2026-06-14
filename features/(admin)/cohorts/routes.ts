import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { requireAuth } from '@/platform/auth/middleware'
import { requirePermission } from '@/platform/auth/permissions'
import { throwError } from '@/platform/errors'
import { created, success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import { createCohort, listCohorts, suggestCohorts, updateCohort } from './service'

const idParam = z.object({ id: z.uuid() })

const listQuerySchema = z.object({
  programId: z.uuid(),
  when: z.enum(['upcoming', 'past', 'all']).default('all'),
})
const createSchema = z.object({
  programId: z.uuid(),
  title: z.string().min(1),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional(),
})
const updateSchema = z.object({
  title: z.string().min(1).optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().nullable().optional(),
})
const suggestionsQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(12).default(3),
})

export const adminCohortsRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .use(requirePermission('manage_content'))
  // NOTE: /suggestions before /:id-style routes is irrelevant here (no GET /:id), but
  // keep static paths first if one is ever added.
  .get('/suggestions', zValidator('query', suggestionsQuerySchema), async (c) => {
    return success(c, suggestCohorts(c.req.valid('query').months))
  })
  .get('/', zValidator('query', listQuerySchema), async (c) => {
    const { programId, when } = c.req.valid('query')
    const result = await listCohorts(programId, when)
    if ('error' in result) return throwError(c, result.error, result.details)
    return success(c, result)
  })
  .post('/', zValidator('json', createSchema), async (c) => {
    const result = await createCohort(c.req.valid('json'))
    if ('error' in result) return throwError(c, result.error, result.details)
    return created(c, result)
  })
  .patch('/:id', zValidator('param', idParam), zValidator('json', updateSchema), async (c) => {
    const result = await updateCohort(c.req.valid('param').id, c.req.valid('json'))
    if ('error' in result) return throwError(c, result.error, result.details)
    return success(c, result)
  })
