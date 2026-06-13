import type { MiddlewareHandler } from 'hono'
import { Hono } from 'hono'
import { requireAuth } from '@/platform/auth/middleware'
import { success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import { getCatalog } from './service'

type RouteDeps = {
  /** Options injection for TESTS ONLY (auth stub) — production callers never pass it. */
  auth?: MiddlewareHandler<AppEnv>
}

export function createCatalogRoutes(deps: RouteDeps = {}) {
  const auth = deps.auth ?? requireAuth

  return new Hono<AppEnv>().get('/', auth, async (c) => {
    const user = c.get('user')
    return success(c, await getCatalog(user.id))
  })
}

/** Mounted by the parent router (platform/server/routes.ts) under /api/catalog. */
export const catalogRoutes = createCatalogRoutes()
