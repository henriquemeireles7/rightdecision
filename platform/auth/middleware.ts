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

  c.set('user', {
    ...session.user,
    role: (session.user as any).role ?? 'free',
  } as AppEnv['Variables']['user'])
  c.set('session', session.session)
  await next()
})
