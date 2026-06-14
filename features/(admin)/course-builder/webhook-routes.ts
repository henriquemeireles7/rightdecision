import { Hono } from 'hono'
import { throwError } from '@/platform/errors'
import { success } from '@/platform/server/responses'
import type { AppEnv } from '@/platform/types'
import { handleStreamWebhook } from './webhook'

/**
 * Cloudflare Stream webhook (eng-schema S4). NOT auth-gated — Cloudflare calls it;
 * the gate is the HMAC Webhook-Signature header, verified in the handler.
 */
export const streamWebhookRoutes = new Hono<AppEnv>().post('/', async (c) => {
  const rawBody = await c.req.text()
  const result = await handleStreamWebhook(rawBody, c.req.header('Webhook-Signature'))
  if ('error' in result) return throwError(c, result.error, result.details)
  return success(c, result)
})
