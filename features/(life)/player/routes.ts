import { zValidator } from '@hono/zod-validator'
import type { Context, MiddlewareHandler } from 'hono'
import { Hono } from 'hono'
import { z } from 'zod'
import { requireEnrollment } from '@/platform/auth/enrollment'
import { requireAuth } from '@/platform/auth/middleware'
import { throwError } from '@/platform/errors'
import { success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import { answerDecisionPrompt, getLesson, programIdsForLesson, saveProgress } from './service'

const lessonParamSchema = z.object({ lessonId: z.uuid() })
const saveProgressSchema = z.object({ secondsWatched: z.number().int().nonnegative() })
const answerSchema = z.object({ answer: z.string().min(1).max(2000) })

/** Resolver for requireEnrollment: the programs containing this lesson. */
const lessonPrograms = (c: Context<AppEnv>) => {
  const lessonId = c.req.param('lessonId')
  return lessonId ? programIdsForLesson(lessonId) : null
}

type RouteDeps = {
  /** Options injection for TESTS ONLY (auth stub) — production callers never pass it. */
  auth?: MiddlewareHandler<AppEnv>
}

export function createPlayerRoutes(deps: RouteDeps = {}) {
  const auth = deps.auth ?? requireAuth

  return new Hono<AppEnv>()
    .get(
      '/lessons/:lessonId',
      auth,
      zValidator('param', lessonParamSchema), // BEFORE requireEnrollment — bad uuids 400, not 500
      requireEnrollment(lessonPrograms),
      async (c) => {
        const user = c.get('user')
        const result = await getLesson(user.id, c.req.valid('param').lessonId)
        if ('error' in result && result.error) return throwError(c, result.error)
        return success(c, result.data)
      },
    )
    .put(
      '/lessons/:lessonId/progress',
      auth,
      zValidator('param', lessonParamSchema),
      requireEnrollment(lessonPrograms),
      zValidator('json', saveProgressSchema),
      async (c) => {
        const user = c.get('user')
        const { secondsWatched } = c.req.valid('json')
        const result = await saveProgress(user.id, c.req.valid('param').lessonId, secondsWatched)
        if ('error' in result && result.error) return throwError(c, result.error)
        return success(c, result.data)
      },
    )
    .post(
      '/lessons/:lessonId/answer',
      auth,
      zValidator('param', lessonParamSchema),
      requireEnrollment(lessonPrograms),
      zValidator('json', answerSchema),
      async (c) => {
        const user = c.get('user')
        const { answer } = c.req.valid('json')
        const result = await answerDecisionPrompt(user.id, c.req.valid('param').lessonId, answer)
        if ('error' in result && result.error) return throwError(c, result.error)
        return success(c, result.data)
      },
    )
}

/** Mounted by the parent router (platform/server/routes.ts) under /api/player. */
export const playerRoutes = createPlayerRoutes()
