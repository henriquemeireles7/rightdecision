import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { throwError } from '@/platform/errors'
import { success } from '@/platform/server/responses'
import { createSession, getSession, updateSession } from './session'

const stepSchema = z.object({
  step: z.coerce.number().min(1).max(6),
})

const stepDataSchema = z.object({
  throughlineQ1: z.string().min(1).max(2000).optional(),
  throughlineQ2: z.string().min(1).max(2000).optional(),
  throughlineQ3: z.string().min(1).max(2000).optional(),
  throughlineNamed: z.string().min(1).max(500).optional(),
  email: z.string().email().optional(),
})

export const onboardingRoutes = new Hono()

// Start a new onboarding session
onboardingRoutes.post('/start', async (c) => {
  const session = await createSession()
  return success(c, { sessionId: session.id, currentStep: session.currentStep })
})

// Get current session state (by session ID in query param or cookie)
onboardingRoutes.get('/session/:id', async (c) => {
  const sessionId = c.req.param('id')
  const session = await getSession(sessionId)

  if (!session) {
    return throwError(c, 'ONBOARDING_SESSION_NOT_FOUND')
  }

  return success(c, {
    sessionId: session.id,
    currentStep: session.currentStep,
    sessionData: session.sessionData,
    expiresAt: session.expiresAt.toISOString(),
  })
})

// Update a specific step
onboardingRoutes.put(
  '/step/:step',
  zValidator('param', stepSchema),
  zValidator('json', stepDataSchema),
  async (c) => {
    const { step } = c.req.valid('param')
    const data = c.req.valid('json')
    const sessionId = c.req.header('x-onboarding-session')

    if (!sessionId) {
      return throwError(c, 'ONBOARDING_SESSION_NOT_FOUND')
    }

    const session = await getSession(sessionId)
    if (!session) {
      return throwError(c, 'ONBOARDING_SESSION_EXPIRED')
    }

    const updated = await updateSession(sessionId, step, data)
    if (!updated) {
      return throwError(c, 'ONBOARDING_SESSION_EXPIRED')
    }

    return success(c, {
      sessionId: updated.id,
      currentStep: updated.currentStep,
      sessionData: updated.sessionData,
    })
  },
)
