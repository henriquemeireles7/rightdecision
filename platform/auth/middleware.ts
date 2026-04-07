import { createMiddleware } from 'hono/factory'
import { throwError } from '@/platform/errors'
import type { AppEnv } from '@/platform/types'
import { auth } from './config'

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  })

  if (!session) {
    return throwError(c, 'UNAUTHORIZED')
  }

  const userWithRole = session.user as Record<string, unknown>
  c.set('user', {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: (typeof userWithRole.role === 'string' ? userWithRole.role : 'free') as AppEnv['Variables']['user']['role'],
  })
  c.set('session', session.session)
  await next()
})
