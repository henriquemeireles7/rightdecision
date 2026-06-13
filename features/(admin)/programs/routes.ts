import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { requireAuth } from '@/platform/auth/middleware'
import { requirePermission } from '@/platform/auth/permissions'
import { throwError } from '@/platform/errors'
import { created, success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import {
  addCourseToProgram,
  createProgram,
  getProgram,
  listPrograms,
  removeCourseFromProgram,
  reorderProgramCourses,
  updateProgram,
} from './service'

const idParam = z.object({ id: z.uuid() })
const programIdParam = z.object({ programId: z.uuid() })
const mappingParam = z.object({ programId: z.uuid(), courseId: z.uuid() })

const slugSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9-]+$/, 'lowercase letters, digits and dashes only')

const createSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1),
  description: z.string().optional(),
  tier: z.enum(['free', 'paid']),
})
const updateSchema = z.object({
  slug: slugSchema.optional(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  tier: z.enum(['free', 'paid']).optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
})

export const adminProgramsRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .use(requirePermission('manage_content'))
  .get('/', async (c) => {
    return success(c, await listPrograms())
  })
  .post('/', zValidator('json', createSchema), async (c) => {
    const result = await createProgram(c.req.valid('json'))
    if ('error' in result) return throwError(c, result.error, result.details)
    return created(c, result)
  })
  .get('/:id', zValidator('param', idParam), async (c) => {
    const result = await getProgram(c.req.valid('param').id)
    if ('error' in result) return throwError(c, result.error, result.details)
    return success(c, result)
  })
  .patch('/:id', zValidator('param', idParam), zValidator('json', updateSchema), async (c) => {
    const result = await updateProgram(c.req.valid('param').id, c.req.valid('json'))
    if ('error' in result) return throwError(c, result.error, result.details)
    return success(c, result)
  })

  // ─── program_courses mapping ───
  .post(
    '/:programId/courses',
    zValidator('param', programIdParam),
    zValidator(
      'json',
      z.object({ courseId: z.uuid(), sortOrder: z.number().int().min(0).optional() }),
    ),
    async (c) => {
      const { courseId, sortOrder } = c.req.valid('json')
      const result = await addCourseToProgram(c.req.valid('param').programId, courseId, sortOrder)
      if ('error' in result) return throwError(c, result.error, result.details)
      return created(c, result)
    },
  )
  .delete('/:programId/courses/:courseId', zValidator('param', mappingParam), async (c) => {
    const { programId, courseId } = c.req.valid('param')
    const result = await removeCourseFromProgram(programId, courseId)
    if ('error' in result) return throwError(c, result.error, result.details)
    return success(c, result)
  })
  .post(
    '/:programId/courses/reorder',
    zValidator('param', programIdParam),
    zValidator('json', z.object({ courseIds: z.array(z.uuid()).min(1) })),
    async (c) => {
      const result = await reorderProgramCourses(
        c.req.valid('param').programId,
        c.req.valid('json').courseIds,
      )
      if ('error' in result) return throwError(c, result.error, result.details)
      return success(c, result)
    },
  )
