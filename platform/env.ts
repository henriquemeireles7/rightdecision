import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DATABASE_URL: z.string().url(),
    STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
    STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
    STRIPE_PRICE_ID: z.string().startsWith('price_'),
    STRIPE_MONTHLY_PRICE_ID: z.string().startsWith('price_'),
    // ─── AI: Anthropic (decision block suggestions) ───
    ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-'),
    RESEND_API_KEY: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    PORT: z.coerce.number().default(3000),
    ONBOARDING_SESSION_TTL_HOURS: z.coerce.number().default(24),
    WIN_RATE_LIMIT_PER_DAY: z.coerce.number().default(3),
    // ─── BD Pipeline: Object Storage (Railway R2/S3) ───
    R2_ENDPOINT: z.string().url().optional(),
    R2_ACCESS_KEY_ID: z.string().min(1).optional(),
    R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    R2_BUCKET_NAME: z.string().min(1).optional(),
    // ─── BD Pipeline: Upload-Post (social media posting) ───
    UPLOAD_POST_API_KEY: z.string().min(1).optional(),
    // ─── BD Pipeline: Whisper (local transcription) ───
    WHISPER_MODEL_PATH: z.string().default('models/ggml-large-v3.bin'),
    // ─── BD Pipeline: Configuration ───
    PIPELINE_AUTO_APPROVE: z.coerce.boolean().default(true),
    // ─── PostHog: Server-side analytics ───
    POSTHOG_API_KEY: z.string().min(1).optional(),
    POSTHOG_HOST: z.string().url().default('https://us.i.posthog.com'),
    // ─── OAuth: Google ───
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
    // ─── SEO: IndexNow ───
    INDEXNOW_KEY: z.string().min(8).optional(),
    // ─── SEO: Google Search Console API ───
    GOOGLE_SERVICE_ACCOUNT_JSON: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val) return true
          try {
            const p = JSON.parse(val)
            return p.client_email && p.private_key
          } catch {
            return false
          }
        },
        { message: 'Must be valid JSON with client_email and private_key' },
      ),
  },
  clientPrefix: 'PUBLIC_',
  client: {
    PUBLIC_APP_URL: z.string().url(),
    PUBLIC_STRIPE_KEY: z.string().startsWith('pk_'),
    PUBLIC_POSTHOG_KEY: z.string().min(1).optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
