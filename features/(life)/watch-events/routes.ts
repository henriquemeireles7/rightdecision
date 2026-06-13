import { zValidator } from '@hono/zod-validator'
import type { MiddlewareHandler } from 'hono'
import { Hono } from 'hono'
import { requireAuth } from '@/platform/auth/middleware'
import { throwError } from '@/platform/errors'
import { checkRateLimit } from '@/platform/rate-limit'
import { success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import { ingestWatchEvents, watchEventsBatchSchema } from './service'

/** Generous for a 1/30s heartbeat cadence with batched flushes (~2 POSTs/min in practice). */
export const WATCH_EVENTS_RATE_LIMIT_PER_MINUTE = 20

type RouteDeps = {
  /** Options injection for TESTS ONLY (auth stub) — production callers never pass it. */
  auth?: MiddlewareHandler<AppEnv>
}

export function createWatchEventsRoutes(deps: RouteDeps = {}) {
  const auth = deps.auth ?? requireAuth

  return new Hono<AppEnv>().post(
    '/',
    auth,
    // Taxonomy boundary: invalid payloads are EVENT_INVALID, never the default 400 shape
    zValidator('json', watchEventsBatchSchema, (result, c) => {
      if (!result.success) return throwError(c, 'EVENT_INVALID')
    }),
    async (c) => {
      const user = c.get('user')
      const rate = checkRateLimit(
        `watch-events:${user.id}`,
        WATCH_EVENTS_RATE_LIMIT_PER_MINUTE,
        60_000,
      )
      if (!rate.allowed) return throwError(c, 'RATE_LIMITED')

      const { events: heartbeats } = c.req.valid('json')
      return success(c, await ingestWatchEvents(user.id, heartbeats))
    },
  )
}

/** Mounted by the parent router (platform/server/routes.ts) under /api/watch-events. */
export const watchEventsRoutes = createWatchEventsRoutes()
