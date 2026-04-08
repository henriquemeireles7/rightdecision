import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { requireAuth } from '@/platform/auth/middleware'
import { throwError } from '@/platform/errors'
import { success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import { getDecision, getUserDecisions, isDecisionEditable, saveDecision } from './decisions'

export const decisionRoutes = new Hono<AppEnv>()

const saveSchema = z.object({
  classId: z.string().min(1),
  courseSlug: z.string().min(1),
  decisionType: z.enum(['text', 'choice']),
  prompt: z.string().min(1),
  response: z.string().min(1).max(2000),
})

decisionRoutes.post('/save', requireAuth, zValidator('json', saveSchema), async (c) => {
  const user = c.get('user')
  const { classId, courseSlug, decisionType, prompt, response } = c.req.valid('json')

  const result = await saveDecision(user.id, classId, courseSlug, decisionType, prompt, response)

  if (result.locked) {
    return throwError(c, 'DECISION_LOCKED')
  }

  return success(c, {
    decision: result.decision,
    editable: isDecisionEditable(result.decision.createdAt),
  })
})

const classIdSchema = z.object({ classId: z.string().min(1).regex(/^module-\d+\/class-\d+$/) })

decisionRoutes.get('/:classId', requireAuth, zValidator('param', classIdSchema), async (c) => {
  const user = c.get('user')
  const { classId } = c.req.valid('param')

  const decision = await getDecision(user.id, classId)
  if (!decision) {
    return throwError(c, 'DECISION_NOT_FOUND')
  }

  return success(c, {
    decision,
    editable: isDecisionEditable(decision.createdAt),
  })
})

const listSchema = z.object({
  courseSlug: z.string().optional(),
})

decisionRoutes.get('/', requireAuth, zValidator('query', listSchema), async (c) => {
  const user = c.get('user')
  const { courseSlug } = c.req.valid('query')

  const decisions = await getUserDecisions(user.id, courseSlug)
  return success(c, { decisions })
})
