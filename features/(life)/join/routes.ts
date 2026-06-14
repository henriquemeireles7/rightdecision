import { zValidator } from '@hono/zod-validator'
import type { MiddlewareHandler } from 'hono'
import { Hono } from 'hono'
import { z } from 'zod'
import { isV2CutoverEnabled } from '@/platform/auth/enrollment'
import { requireAuth } from '@/platform/auth/middleware'
import { throwError } from '@/platform/errors'
import { track } from '@/platform/events'
import { FREE_PROGRAM_SLUG } from '@/platform/programs'
import { success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import { getNextCohort, joinFreeCohort } from './service'

const nextCohortQuerySchema = z.object({
  program: z.string().min(1).default(FREE_PROGRAM_SLUG),
  /** Pre-auth funnel identity for cohort_page_viewed (ADR 6: anonymousId). */
  anonymousId: z.string().min(1).max(200).optional(),
})

const joinBodySchema = z.object({
  program: z.string().min(1).default(FREE_PROGRAM_SLUG),
})

/**
 * Route factory — `deps.auth` is test-only injection (stubAuth); production callers
 * never pass it. Every endpoint gates on isV2CutoverEnabled(): pre-cutover these routes
 * 404 and the evergreen funnel remains the only public surface (S6 rollback = flip the
 * env flag in Railway + redeploy).
 */
export function createJoinRoutes(deps: { auth?: MiddlewareHandler<AppEnv> } = {}) {
  const auth = deps.auth ?? requireAuth

  return (
    new Hono<AppEnv>()
      // Public data endpoint for the ad landing page: next cohort start as a raw instant.
      .get('/next-cohort', zValidator('query', nextCohortQuerySchema), async (c) => {
        if (!isV2CutoverEnabled()) return throwError(c, 'NOT_FOUND')
        const { program: programSlug, anonymousId } = c.req.valid('query')

        const next = await getNextCohort(programSlug)
        if (!next) return throwError(c, 'PROGRAM_NOT_FOUND')

        if (anonymousId) {
          // Best-effort funnel telemetry — never blocks the page data
          await track({ name: 'cohort_page_viewed', properties: {}, anonymousId })
        }

        return success(c, {
          programSlug: next.program.slug,
          cohortId: next.cohort.id,
          title: next.cohort.title,
          // The instant, not a formatted string — clients localize via Intl (M7)
          startsAt: next.cohort.startsAt.toISOString(),
        })
      })
      // Join the free program's current-or-next cohort (authenticated).
      .post('/', auth, zValidator('json', joinBodySchema), async (c) => {
        if (!isV2CutoverEnabled()) return throwError(c, 'NOT_FOUND')
        const user = c.get('user')
        const { program: programSlug } = c.req.valid('json')

        const result = await joinFreeCohort(user.id, programSlug)
        if (!result) return throwError(c, 'PROGRAM_NOT_FOUND')

        return success(c, {
          enrollmentId: result.enrollment.id,
          cohortId: result.cohort.id,
          title: result.cohort.title,
          startsAt: result.cohort.startsAt.toISOString(),
        })
      })
  )
}

export const joinRoutes = createJoinRoutes()
