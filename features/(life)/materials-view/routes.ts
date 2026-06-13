import { zValidator } from '@hono/zod-validator'
import type { Context, MiddlewareHandler } from 'hono'
import { Hono } from 'hono'
import { z } from 'zod'
import { requireEnrollment } from '@/platform/auth/enrollment'
import { requireAuth } from '@/platform/auth/middleware'
import { throwError } from '@/platform/errors'
import { success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import { getMaterialDownloadUrl, listMaterials, programIdsForMaterial } from './service'

const materialParamSchema = z.object({ materialId: z.uuid() })

/** Resolver for requireEnrollment: every program the material is mapped to. */
const materialPrograms = (c: Context<AppEnv>) => {
  const materialId = c.req.param('materialId')
  return materialId ? programIdsForMaterial(materialId) : null
}

type RouteDeps = {
  /** Options injection for TESTS ONLY (auth stub) — production callers never pass it. */
  auth?: MiddlewareHandler<AppEnv>
}

export function createMaterialsViewRoutes(deps: RouteDeps = {}) {
  const auth = deps.auth ?? requireAuth

  return new Hono<AppEnv>()
    .get('/', auth, async (c) => {
      const user = c.get('user')
      return success(c, { materials: await listMaterials(user.id) })
    })
    .get(
      '/:materialId/download-url',
      auth,
      zValidator('param', materialParamSchema),
      requireEnrollment(materialPrograms),
      async (c) => {
        const user = c.get('user')
        const result = await getMaterialDownloadUrl(user.id, c.req.valid('param').materialId)
        if ('error' in result && result.error) return throwError(c, result.error)
        return success(c, result.data)
      },
    )
}

/** Mounted by the parent router (platform/server/routes.ts) under /api/materials. */
export const materialsViewRoutes = createMaterialsViewRoutes()
