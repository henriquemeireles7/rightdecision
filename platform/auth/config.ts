import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@/platform/db/client'
import { env } from '@/platform/env'
import { identify, track } from '@/providers/analytics'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.PUBLIC_APP_URL,
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh daily
  },
  hooks: {
    after: [
      {
        matcher: (ctx) => ctx.path === '/sign-up/email',
        handler: async (ctx) => {
          const body = ctx.body as { user?: { id?: string; email?: string } } | undefined
          if (body?.user?.id) {
            identify(body.user.id, { email: body.user.email })
            track('user_signed_up', { method: 'email' }, body.user.id)
          }
        },
      },
      {
        matcher: (ctx) => ctx.path === '/sign-in/email',
        handler: async (ctx) => {
          const body = ctx.body as { user?: { id?: string } } | undefined
          if (body?.user?.id) {
            track('user_logged_in', { method: 'email' }, body.user.id)
          }
        },
      },
      {
        matcher: (ctx) => ctx.path === '/sign-out',
        handler: async (ctx) => {
          const body = ctx.body as { session?: { userId?: string } } | undefined
          if (body?.session?.userId) {
            track('user_logged_out', {}, body.session.userId)
          }
        },
      },
    ],
  },
})
