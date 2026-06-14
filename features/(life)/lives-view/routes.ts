import { zValidator } from '@hono/zod-validator'
import type { Context, MiddlewareHandler } from 'hono'
import { Hono } from 'hono'
import { z } from 'zod'
import { requireEnrollment } from '@/platform/auth/enrollment'
import { requireAuth } from '@/platform/auth/middleware'
import { throwError } from '@/platform/errors'
import { success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import { getLive, getLiveReplay, listLives, programIdForLive } from './service'

const liveParamSchema = z.object({ liveId: z.uuid() })

/** Resolver for requireEnrollment: the program owning this live. */
const livePrograms = (c: Context<AppEnv>) => {
  const liveId = c.req.param('liveId')
  return liveId ? programIdForLive(liveId) : null
}

type RouteDeps = {
  /** Options injection for TESTS ONLY (auth stub) — production callers never pass it. */
  auth?: MiddlewareHandler<AppEnv>
}

export function createLivesViewRoutes(deps: RouteDeps = {}) {
  const auth = deps.auth ?? requireAuth

  return new Hono<AppEnv>()
    .get('/', auth, async (c) => {
      const user = c.get('user')
      return success(c, { lives: await listLives(user.id) })
    })
    .get(
      '/:liveId',
      auth,
      zValidator('param', liveParamSchema),
      requireEnrollment(livePrograms),
      async (c) => {
        const user = c.get('user')
        const result = await getLive(user.id, c.req.valid('param').liveId)
        if ('error' in result && result.error) return throwError(c, result.error)
        return success(c, result.data)
      },
    )
    .get(
      '/:liveId/replay',
      auth,
      zValidator('param', liveParamSchema),
      requireEnrollment(livePrograms),
      async (c) => {
        const user = c.get('user')
        const result = await getLiveReplay(user.id, c.req.valid('param').liveId)
        if ('error' in result && result.error) return throwError(c, result.error)
        return success(c, result.data)
      },
    )
}

/** Mounted by the parent router (platform/server/routes.ts) under /api/lives. */
export const livesViewRoutes = createLivesViewRoutes()
