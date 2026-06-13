import { zValidator } from '@hono/zod-validator'
import type { MiddlewareHandler } from 'hono'
import { Hono } from 'hono'
import { z } from 'zod'
import { requireAuth } from '@/platform/auth/middleware'
import { throwError } from '@/platform/errors'
import { success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import { getEntries, saveEntry } from './service'

// entryDate is the client-computed calendar date — validated as a date string,
// passed through verbatim (never recomputed server-side).
const saveBody = z.object({
  entryDate: z.iso.date(),
  kind: z.enum(['morning', 'evening']),
  content: z.string().min(1),
})

const rangeQuery = z.object({
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  // Bounds the entries window (default applied in the service); older entries page via from/to.
  limit: z.coerce.number().int().min(1).max(365).optional(),
})

type RouteDeps = {
  /** Options injection for TESTS ONLY (auth stub) — production callers never pass it. */
  auth?: MiddlewareHandler<AppEnv>
}

export function createJournalRoutes(deps: RouteDeps = {}) {
  const auth = deps.auth ?? requireAuth

  return (
    new Hono<AppEnv>()
      .get('/', auth, zValidator('query', rangeQuery), async (c) => {
        const user = c.get('user')
        return success(c, await getEntries(user.id, c.req.valid('query')))
      })
      // PUT: saving today's entry twice is an edit, not an error (see CLAUDE.md).
      .put('/entries', auth, zValidator('json', saveBody), async (c) => {
        const user = c.get('user')
        const result = await saveEntry(user.id, c.req.valid('json'))
        if ('error' in result) return throwError(c, result.error, result.details)
        return success(c, result)
      })
  )
}

/** Mounted by the parent router (platform/server/routes.ts) under /api/journal. */
export const journalRoutes = createJournalRoutes()
