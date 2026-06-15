import { zValidator } from '@hono/zod-validator'
import { Hono, type MiddlewareHandler } from 'hono'
import { z } from 'zod'
import { requireAuth } from '@/platform/auth/middleware'
import { throwError } from '@/platform/errors'
import { success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import {
  addDecision,
  createDecisionSchema,
  createPlan,
  createPlanSchema,
  deleteDecision,
  deletePlan,
  getPlan,
  listPlans,
  updateDecision,
  updateDecisionSchema,
  updatePlan,
  updatePlanSchema,
} from './service'

const planParam = z.object({ planId: z.uuid() })
const decisionParam = z.object({ decisionId: z.uuid() })

type RouteDeps = {
  /** Options injection for TESTS ONLY (auth stub) — production callers never pass it. */
  auth?: MiddlewareHandler<AppEnv>
}

export function createPlanRoutes(deps: RouteDeps = {}) {
  const auth = deps.auth ?? requireAuth

  return (
    new Hono<AppEnv>()
      .get('/', auth, async (c) => {
        return success(c, { plans: await listPlans(c.get('user').id) })
      })
      .post('/', auth, zValidator('json', createPlanSchema), async (c) => {
        const { plan } = await createPlan(c.get('user').id, c.req.valid('json'))
        return success(c, { plan })
      })
      // Decision routes are declared BEFORE '/:planId' so the literal 'decisions'
      // segment is never shadowed by the planId param.
      .post(
        '/:planId/decisions',
        auth,
        zValidator('param', planParam),
        zValidator('json', createDecisionSchema),
        async (c) => {
          const result = await addDecision(
            c.get('user').id,
            c.req.valid('param').planId,
            c.req.valid('json'),
          )
          if ('error' in result) return throwError(c, result.error)
          return success(c, { decision: result.decision })
        },
      )
      .patch(
        '/decisions/:decisionId',
        auth,
        zValidator('param', decisionParam),
        zValidator('json', updateDecisionSchema),
        async (c) => {
          const result = await updateDecision(
            c.get('user').id,
            c.req.valid('param').decisionId,
            c.req.valid('json'),
          )
          if ('error' in result) return throwError(c, result.error)
          return success(c, { decision: result.decision })
        },
      )
      .delete('/decisions/:decisionId', auth, zValidator('param', decisionParam), async (c) => {
        const result = await deleteDecision(c.get('user').id, c.req.valid('param').decisionId)
        if ('error' in result) return throwError(c, result.error)
        return success(c, { id: result.id })
      })
      .get('/:planId', auth, zValidator('param', planParam), async (c) => {
        const result = await getPlan(c.get('user').id, c.req.valid('param').planId)
        if ('error' in result) return throwError(c, result.error)
        return success(c, result)
      })
      .patch(
        '/:planId',
        auth,
        zValidator('param', planParam),
        zValidator('json', updatePlanSchema),
        async (c) => {
          const result = await updatePlan(
            c.get('user').id,
            c.req.valid('param').planId,
            c.req.valid('json'),
          )
          if ('error' in result) return throwError(c, result.error)
          return success(c, { plan: result.plan })
        },
      )
      .delete('/:planId', auth, zValidator('param', planParam), async (c) => {
        const result = await deletePlan(c.get('user').id, c.req.valid('param').planId)
        if ('error' in result) return throwError(c, result.error)
        return success(c, { id: result.id })
      })
  )
}

/** Mounted by the parent router (platform/server/routes.ts) under /api/plans. */
export const planRoutes = createPlanRoutes()
