import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { requireAuth } from '@/platform/auth/middleware'
import { requirePermission } from '@/platform/auth/permissions'
import { throwError } from '@/platform/errors'
import { created, success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import {
  addMaterialToProgram,
  createMaterial,
  deleteMaterial,
  listMaterials,
  listProgramMaterials,
  removeMaterialFromProgram,
  requestMaterialUploadUrl,
  updateMaterial,
} from './service'

const idParam = z.object({ id: z.uuid() })
const programIdParam = z.object({ programId: z.uuid() })
const mappingParam = z.object({ programId: z.uuid(), materialId: z.uuid() })

const uploadUrlSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
})
const createMaterialSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  fileKey: z.string().min(1),
  fileSizeBytes: z.number().int().positive().optional(),
  mimeType: z.string().optional(),
  lessonId: z.uuid().optional(),
})
const updateMaterialSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  fileSizeBytes: z.number().int().positive().nullable().optional(),
  mimeType: z.string().nullable().optional(),
  lessonId: z.uuid().nullable().optional(),
})

export const adminMaterialsRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .use(requirePermission('manage_content'))

  // Presigned PUT — the client uploads direct to R2, never through Hono.
  .post('/upload-url', zValidator('json', uploadUrlSchema), async (c) => {
    const result = await requestMaterialUploadUrl(c.req.valid('json'))
    if ('error' in result) return throwError(c, result.error, result.details)
    return success(c, result)
  })
  .post('/', zValidator('json', createMaterialSchema), async (c) => {
    const result = await createMaterial(c.req.valid('json'))
    if ('error' in result) return throwError(c, result.error, result.details)
    return created(c, result)
  })
  .get('/', async (c) => {
    return success(c, await listMaterials())
  })
  .patch(
    '/:id',
    zValidator('param', idParam),
    zValidator('json', updateMaterialSchema),
    async (c) => {
      const result = await updateMaterial(c.req.valid('param').id, c.req.valid('json'))
      if ('error' in result) return throwError(c, result.error, result.details)
      return success(c, result)
    },
  )
  .delete('/:id', zValidator('param', idParam), async (c) => {
    const result = await deleteMaterial(c.req.valid('param').id)
    if ('error' in result) return throwError(c, result.error, result.details)
    return success(c, result)
  })

  // ─── program_materials mapping ───
  .get('/programs/:programId', zValidator('param', programIdParam), async (c) => {
    const result = await listProgramMaterials(c.req.valid('param').programId)
    if ('error' in result) return throwError(c, result.error, result.details)
    return success(c, result)
  })
  .post(
    '/programs/:programId',
    zValidator('param', programIdParam),
    zValidator('json', z.object({ materialId: z.uuid() })),
    async (c) => {
      const result = await addMaterialToProgram(
        c.req.valid('param').programId,
        c.req.valid('json').materialId,
      )
      if ('error' in result) return throwError(c, result.error, result.details)
      return created(c, result)
    },
  )
  .delete('/programs/:programId/:materialId', zValidator('param', mappingParam), async (c) => {
    const { programId, materialId } = c.req.valid('param')
    const result = await removeMaterialFromProgram(programId, materialId)
    if ('error' in result) return throwError(c, result.error, result.details)
    return success(c, result)
  })
