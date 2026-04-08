import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import {
  passwordChangedEmail,
  passwordResetEmail,
  verificationEmail,
} from '@/features/(shared)/email/auth-emails'
import { db } from '@/platform/db/client'
import { env } from '@/platform/env'
import { sendEmail } from '@/providers/email'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.PUBLIC_APP_URL,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail(user.email, passwordResetEmail({ name: user.name, url }))
    },
    resetPasswordTokenExpiresIn: 1800, // 30 minutes
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 86400, // 24 hours
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail(user.email, verificationEmail({ name: user.name, url }))
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh daily
  },
})
