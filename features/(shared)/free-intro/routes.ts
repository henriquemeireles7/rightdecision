import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import { z } from 'zod'
import { throwError } from '@/platform/errors'
import { checkRateLimit } from '@/platform/rate-limit'
import { success } from '@/platform/server/responses'
import { track } from '@/providers/analytics'
import { generateDecisionDocument } from './export'
import { createAnonSession, getSessionData, mergeToAccount, saveLessonOneAnswer } from './session'

const COOKIE_NAME = 'free_intro_session'
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 // 7 days in seconds

export const freeIntroRoutes = new Hono()

/** Create or retrieve anonymous session */
freeIntroRoutes.post('/session', async (c) => {
  const existingId = getCookie(c, COOKIE_NAME)

  if (existingId) {
    const session = await getSessionData(existingId)
    if (session) {
      return success(c, {
        sessionId: session.id,
        lessonOneCompleted: !!session.lessonOneCompletedAt,
      })
    }
  }

  const variant = c.req.query('v') ?? undefined
  const sessionId = await createAnonSession(variant)

  setCookie(c, COOKIE_NAME, sessionId, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
  })

  track('free_intro_started', { variant: variant ?? 'default' })

  return success(c, { sessionId, lessonOneCompleted: false })
})

/** Save Lesson 1 answer */
freeIntroRoutes.post(
  '/lesson-one',
  zValidator('json', z.object({ answer: z.string().min(1).max(2000) })),
  async (c) => {
    const sessionId = getCookie(c, COOKIE_NAME)
    if (!sessionId) return throwError(c, 'UNAUTHORIZED')

    const { answer } = c.req.valid('json')
    await saveLessonOneAnswer(sessionId, answer)

    track('free_intro_l1_completed')

    return success(c, { saved: true })
  },
)

/** Email gate — merge anonymous session to account */
freeIntroRoutes.post(
  '/email-gate',
  zValidator(
    'json',
    z.object({
      email: z.string().email(),
      consent: z.boolean().refine((v) => v === true, { message: 'Consent is required' }),
    }),
  ),
  async (c) => {
    const sessionId = getCookie(c, COOKIE_NAME)
    if (!sessionId) return throwError(c, 'UNAUTHORIZED')

    const { email } = c.req.valid('json')

    // Rate limit: 5 emails per IP per hour
    const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const rateCheck = checkRateLimit(`email-gate:${ip}`, 5, 60 * 60 * 1000)
    if (!rateCheck.allowed) {
      return throwError(c, 'RATE_LIMITED')
    }

    try {
      const result = await mergeToAccount(sessionId, email)

      track('free_intro_email_captured', { existingAccount: result.existingAccount })

      // Set Better Auth session cookie so L2/L3 decision API calls work
      if (result.sessionToken) {
        setCookie(c, 'better-auth.session_token', result.sessionToken, {
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60, // 30 days (matches Better Auth config)
        })
      }

      return success(c, {
        existingAccount: result.existingAccount,
      })
    } catch (error) {
      console.error('[free-intro] Email gate error:', error)
      return throwError(c, 'INTERNAL_ERROR')
    }
  },
)

/** Get session status */
freeIntroRoutes.get('/session', async (c) => {
  const sessionId = getCookie(c, COOKIE_NAME)
  if (!sessionId) return success(c, { session: null })

  const session = await getSessionData(sessionId)
  if (!session) return success(c, { session: null })

  return success(c, {
    session: {
      id: session.id,
      lessonOneCompleted: !!session.lessonOneCompletedAt,
      email: session.email,
      merged: !!session.mergedToUserId,
    },
  })
})

/** Generate and download decision document as PNG */
freeIntroRoutes.get(
  '/export',
  zValidator(
    'query',
    z.object({
      constraint: z.string().min(1),
      decision: z.string().min(1),
    }),
  ),
  async (c) => {
    const { constraint, decision } = c.req.valid('query')
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    try {
      const png = await generateDecisionDocument(constraint, decision, date)

      track('decision_export_downloaded')

      return new Response(new Uint8Array(png), {
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': 'attachment; filename="my-decision.png"',
          'Cache-Control': 'no-cache',
        },
      })
    } catch (error) {
      console.error('[free-intro] Export error:', error)
      return throwError(c, 'INTERNAL_ERROR')
    }
  },
)
