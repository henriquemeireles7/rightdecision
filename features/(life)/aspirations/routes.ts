import { zValidator } from '@hono/zod-validator'
import { Hono, type MiddlewareHandler } from 'hono'
import { z } from 'zod'
import { requireAuth } from '@/platform/auth/middleware'
import { throwError } from '@/platform/errors'
import { success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import {
  createAspiration,
  createAspirationSchema,
  deleteAspiration,
  listAspirations,
  updateAspiration,
  updateAspirationSchema,
} from './service'

const idParam = z.object({ id: z.uuid() })

type RouteDeps = {
  /** Options injection for TESTS ONLY (auth stub) — production callers never pass it. */
  auth?: MiddlewareHandler<AppEnv>
}

export function createAspirationsRoutes(deps: RouteDeps = {}) {
  const auth = deps.auth ?? requireAuth

  return new Hono<AppEnv>()
    .get('/', auth, async (c) => {
      return success(c, { aspirations: await listAspirations(c.get('user').id) })
    })
    .post('/', auth, zValidator('json', createAspirationSchema), async (c) => {
      const { aspiration } = await createAspiration(c.get('user').id, c.req.valid('json'))
      return success(c, { aspiration })
    })
    .patch(
      '/:id',
      auth,
      zValidator('param', idParam),
      zValidator('json', updateAspirationSchema),
      async (c) => {
        const result = await updateAspiration(
          c.get('user').id,
          c.req.valid('param').id,
          c.req.valid('json'),
        )
        if ('error' in result) return throwError(c, result.error)
        return success(c, { aspiration: result.aspiration })
      },
    )
    .delete('/:id', auth, zValidator('param', idParam), async (c) => {
      const result = await deleteAspiration(c.get('user').id, c.req.valid('param').id)
      if ('error' in result) return throwError(c, result.error)
      return success(c, { id: result.id })
    })
}

/** Mounted by the parent router (platform/server/routes.ts) under /api/aspirations. */
export const aspirationsRoutes = createAspirationsRoutes()
