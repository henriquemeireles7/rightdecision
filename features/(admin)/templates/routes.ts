import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { requireAuth } from '@/platform/auth/middleware'
import { requirePermission } from '@/platform/auth/permissions'
import { throwError } from '@/platform/errors'
import { created, success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import {
  createTemplate,
  getTemplate,
  listTemplates,
  publishTemplate,
  updateTemplate,
} from './service'

const idParam = z.object({ id: z.uuid() })
const listQuery = z.object({ programId: z.uuid().optional() })

const slugSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9-]+$/, 'lowercase letters, digits and dashes only')

// schema is z.unknown() on purpose: the service runs the FULL TemplateSchema
// validation (Zod + structural rules) and returns VALIDATION_ERROR with details.
const createSchema = z.object({
  programId: z.uuid(),
  slug: slugSchema,
  title: z.string().min(1),
  sortOrder: z.number().int().min(0).optional(),
  schema: z.unknown(),
})
const updateSchema = z.object({
  programId: z.uuid().optional(),
  slug: slugSchema.optional(),
  title: z.string().min(1).optional(),
  sortOrder: z.number().int().min(0).optional(),
  schema: z.unknown().optional(),
})

export const adminTemplatesRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .use(requirePermission('manage_content'))
  .get('/', zValidator('query', listQuery), async (c) => {
    return success(c, await listTemplates(c.req.valid('query').programId))
  })
  .post('/', zValidator('json', createSchema), async (c) => {
    const result = await createTemplate(c.req.valid('json'))
    if ('error' in result) return throwError(c, result.error, result.details)
    return created(c, result)
  })
  .get('/:id', zValidator('param', idParam), async (c) => {
    const result = await getTemplate(c.req.valid('param').id)
    if ('error' in result) return throwError(c, result.error, result.details)
    return success(c, result)
  })
  .patch('/:id', zValidator('param', idParam), zValidator('json', updateSchema), async (c) => {
    const result = await updateTemplate(c.req.valid('param').id, c.req.valid('json'))
    if ('error' in result) return throwError(c, result.error, result.details)
    return success(c, result)
  })
  .post('/:id/publish', zValidator('param', idParam), async (c) => {
    const result = await publishTemplate(c.req.valid('param').id)
    if ('error' in result) return throwError(c, result.error, result.details)
    return success(c, result)
  })
