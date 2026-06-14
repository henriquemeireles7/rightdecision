import { zValidator } from '@hono/zod-validator'
import type { MiddlewareHandler } from 'hono'
import { Hono } from 'hono'
import { z } from 'zod'
import { enforceAiBudget } from '@/features/(life)/ai-chat/budget'
import { requireAuth } from '@/platform/auth/middleware'
import { throwError } from '@/platform/errors'
import { checkRateLimit } from '@/platform/rate-limit'
import { success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import type { DistillProvider } from './service'
import {
  abandonInterview,
  appendInterviewMessage,
  confirmInterview,
  distillInterview,
  getInterview,
  startInterview,
} from './service'

const startBody = z.object({ documentId: z.uuid(), pageId: z.string().min(1) })
const messageBody = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(4000),
})
const confirmBody = z.object({ acceptedFieldIds: z.array(z.string().min(1)) })
const idParam = z.object({ interviewId: z.uuid() })

/**
 * Per-user per-minute ceiling on the LLM-calling interview POSTs (message turns + distill). The
 * budget is a MONTHLY cap; this guards against a user bursting many concurrent calls in a minute
 * (also narrows the budget check-then-write race). RATE_LIMITED on excess.
 */
export const INTERVIEW_RATE_LIMIT_PER_MINUTE = 10

/** Per-user per-minute limiter for the LLM-calling interview POSTs. */
const interviewRateLimit: MiddlewareHandler<AppEnv> = async (c, next) => {
  const user = c.get('user')
  const rate = checkRateLimit(`interview:${user.id}`, INTERVIEW_RATE_LIMIT_PER_MINUTE, 60_000)
  if (!rate.allowed) return throwError(c, 'RATE_LIMITED')
  await next()
}

/** Interview-mode system prompt — distill the transcript into concrete page-field answers. */
const DISTILL_SYSTEM =
  'You are distilling a short interview into concrete answers for the page she is filling in. Return only the field values she actually expressed, in her own words — never invent, never pad. If a field was not discussed, leave it out.'

type RouteDeps = {
  /** TESTS ONLY: auth stub + budget bypass + fixture distill provider. */
  auth?: MiddlewareHandler<AppEnv>
  budget?: MiddlewareHandler<AppEnv>
  distill?: DistillProvider
}

export function createInterviewRoutes(deps: RouteDeps = {}) {
  const auth = deps.auth ?? requireAuth
  const budget = deps.budget ?? enforceAiBudget()

  return (
    new Hono<AppEnv>()
      .post('/', auth, zValidator('json', startBody), async (c) => {
        const user = c.get('user')
        const { documentId, pageId } = c.req.valid('json')
        const result = await startInterview({ userId: user.id, documentId, pageId })
        if ('error' in result && result.error)
          return throwError(
            c,
            result.error,
            'details' in result ? (result.details as string | undefined) : undefined,
          )
        return success(c, result)
      })
      .get('/:interviewId', auth, zValidator('param', idParam), async (c) => {
        const user = c.get('user')
        const result = await getInterview(user.id, c.req.valid('param').interviewId)
        if ('error' in result && result.error)
          return throwError(
            c,
            result.error,
            'details' in result ? (result.details as string | undefined) : undefined,
          )
        return success(c, result)
      })
      .post(
        '/:interviewId/messages',
        auth,
        interviewRateLimit,
        budget,
        zValidator('param', idParam),
        zValidator('json', messageBody),
        async (c) => {
          const user = c.get('user')
          const { role, content } = c.req.valid('json')
          const result = await appendInterviewMessage(
            user.id,
            c.req.valid('param').interviewId,
            role,
            content,
          )
          if ('error' in result && result.error)
            return throwError(
              c,
              result.error,
              'details' in result ? (result.details as string | undefined) : undefined,
            )
          return success(c, result)
        },
      )
      // active → awaiting_confirmation (runs distill; budget-gated, meters a distill row).
      .post(
        '/:interviewId/distill',
        auth,
        interviewRateLimit,
        budget,
        zValidator('param', idParam),
        async (c) => {
          const user = c.get('user')
          const result = await distillInterview(
            user.id,
            c.req.valid('param').interviewId,
            DISTILL_SYSTEM,
            deps.distill ? { distill: deps.distill } : {},
          )
          if ('error' in result && result.error)
            return throwError(
              c,
              result.error,
              'details' in result ? (result.details as string | undefined) : undefined,
            )
          return success(c, result)
        },
      )
      // awaiting_confirmation → confirmed (the ADR 11 trust write — accepted fields only).
      .post(
        '/:interviewId/confirm',
        auth,
        zValidator('param', idParam),
        zValidator('json', confirmBody),
        async (c) => {
          const user = c.get('user')
          const result = await confirmInterview(
            user.id,
            c.req.valid('param').interviewId,
            c.req.valid('json').acceptedFieldIds,
          )
          if ('error' in result && result.error)
            return throwError(
              c,
              result.error,
              'details' in result ? (result.details as string | undefined) : undefined,
            )
          return success(c, result)
        },
      )
      .post('/:interviewId/abandon', auth, zValidator('param', idParam), async (c) => {
        const user = c.get('user')
        const result = await abandonInterview(user.id, c.req.valid('param').interviewId)
        if ('error' in result && result.error)
          return throwError(
            c,
            result.error,
            'details' in result ? (result.details as string | undefined) : undefined,
          )
        return success(c, result)
      })
  )
}

/** Mounted by the parent router (platform/server/routes.ts) under /api/interview. */
export const interviewRoutes = createInterviewRoutes()
