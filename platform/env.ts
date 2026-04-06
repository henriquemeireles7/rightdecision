import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DATABASE_URL: z.string().url(),
    STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
    STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
    RESEND_API_KEY: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    PORT: z.coerce.number().default(3000),
  },
  clientPrefix: 'PUBLIC_',
  client: {
    PUBLIC_APP_URL: z.string().url(),
    PUBLIC_STRIPE_KEY: z.string().startsWith('pk_'),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
