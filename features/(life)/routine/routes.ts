import { zValidator } from '@hono/zod-validator'
import { Hono, type MiddlewareHandler } from 'hono'
import { z } from 'zod'
import { requireAuth } from '@/platform/auth/middleware'
import { throwError } from '@/platform/errors'
import { success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import {
  createHabit,
  createHabitSchema,
  deleteHabit,
  getHabitLogs,
  listHabits,
  logHabit,
  logHabitSchema,
  updateHabit,
  updateHabitSchema,
} from './service'

const habitParam = z.object({ habitId: z.uuid() })
const listQuery = z.object({
  includeArchived: z.coerce.boolean().optional(),
})
const logsQuery = z.object({
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
})

type RouteDeps = {
  /** Options injection for TESTS ONLY (auth stub) — production callers never pass it. */
  auth?: MiddlewareHandler<AppEnv>
}

export function createRoutineRoutes(deps: RouteDeps = {}) {
  const auth = deps.auth ?? requireAuth

  return new Hono<AppEnv>()
    .get('/', auth, zValidator('query', listQuery), async (c) => {
      const { includeArchived } = c.req.valid('query')
      return success(c, { habits: await listHabits(c.get('user').id, { includeArchived }) })
    })
    .post('/', auth, zValidator('json', createHabitSchema), async (c) => {
      const { habit } = await createHabit(c.get('user').id, c.req.valid('json'))
      return success(c, { habit })
    })
    .get(
      '/:habitId/logs',
      auth,
      zValidator('param', habitParam),
      zValidator('query', logsQuery),
      async (c) => {
        const result = await getHabitLogs(
          c.get('user').id,
          c.req.valid('param').habitId,
          c.req.valid('query'),
        )
        if ('error' in result) return throwError(c, result.error)
        return success(c, { logs: result.logs })
      },
    )
    .put(
      '/:habitId/logs',
      auth,
      zValidator('param', habitParam),
      zValidator('json', logHabitSchema),
      async (c) => {
        const result = await logHabit(
          c.get('user').id,
          c.req.valid('param').habitId,
          c.req.valid('json'),
        )
        if ('error' in result) return throwError(c, result.error)
        return success(c, result)
      },
    )
    .patch(
      '/:habitId',
      auth,
      zValidator('param', habitParam),
      zValidator('json', updateHabitSchema),
      async (c) => {
        const result = await updateHabit(
          c.get('user').id,
          c.req.valid('param').habitId,
          c.req.valid('json'),
        )
        if ('error' in result) return throwError(c, result.error)
        return success(c, { habit: result.habit })
      },
    )
    .delete('/:habitId', auth, zValidator('param', habitParam), async (c) => {
      const result = await deleteHabit(c.get('user').id, c.req.valid('param').habitId)
      if ('error' in result) return throwError(c, result.error)
      return success(c, { id: result.id })
    })
}

/** Mounted by the parent router (platform/server/routes.ts) under /api/routine. */
export const routineRoutes = createRoutineRoutes()
