import { createHmac, timingSafeEqual } from 'node:crypto'
import { importJWK, SignJWT } from 'jose'
import { z } from 'zod'
import { env } from '@/platform/env'
import { ProviderError } from '@/providers/errors'

const STREAM_API_BASE = 'https://api.cloudflare.com/client/v4/accounts'
const WEBHOOK_TOLERANCE_SECONDS = 300 // reject webhooks older than 5 minutes
/** Cap every Stream API fetch so a hung Cloudflare socket can't stall the request forever. */
const STREAM_FETCH_TIMEOUT_MS = 15_000
const DEFAULT_PLAYBACK_TTL_SECONDS = 3600

/** Env vars are optional in the schema (dev/CI boot without secrets) — absence is a runtime ProviderError. */
function requireStreamApi(operation: string): { accountId: string; apiToken: string } {
  const accountId = env.CLOUDFLARE_ACCOUNT_ID
  const apiToken = env.CLOUDFLARE_STREAM_API_TOKEN
  if (!accountId || !apiToken) {
    throw new ProviderError(
      'stream',
      operation,
      500,
      'CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_STREAM_API_TOKEN not configured',
    )
  }
  return { accountId, apiToken }
}

// ─── tus direct creator upload (eng-schema M5) ───

const tusUploadOptionsSchema = z.object({
  uploadLengthBytes: z.number().int().positive(),
  name: z.string().optional(),
  maxDurationSeconds: z.number().int().positive().optional(),
  requireSignedUrls: z.boolean().optional(),
})
export type TusUploadOptions = z.infer<typeof tusUploadOptionsSchema>

/**
 * Create a one-time tus upload URL (direct creator upload).
 * The admin client uploads straight to Cloudflare via tus-js-client — bytes never touch our server.
 */
export async function createTusUploadUrl(
  opts: TusUploadOptions,
): Promise<{ uploadUrl: string; streamVideoId: string }> {
  const { accountId, apiToken } = requireStreamApi('createTusUploadUrl')
  try {
    const { uploadLengthBytes, name, maxDurationSeconds, requireSignedUrls } =
      tusUploadOptionsSchema.parse(opts)

    const metadata: string[] = []
    if (name) metadata.push(`name ${Buffer.from(name).toString('base64')}`)
    if (maxDurationSeconds) {
      metadata.push(
        `maxDurationSeconds ${Buffer.from(String(maxDurationSeconds)).toString('base64')}`,
      )
    }
    if (requireSignedUrls) metadata.push('requiresignedurls')

    const response = await fetch(`${STREAM_API_BASE}/${accountId}/stream?direct_user=true`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Tus-Resumable': '1.0.0',
        'Upload-Length': String(uploadLengthBytes),
        ...(metadata.length > 0 ? { 'Upload-Metadata': metadata.join(',') } : {}),
      },
      signal: AbortSignal.timeout(STREAM_FETCH_TIMEOUT_MS),
    })
    if (!response.ok) {
      throw new ProviderError(
        'stream',
        'createTusUploadUrl',
        response.status,
        await response.text(),
      )
    }
    const uploadUrl = response.headers.get('Location')
    const streamVideoId = response.headers.get('stream-media-id')
    if (!uploadUrl || !streamVideoId) {
      throw new ProviderError(
        'stream',
        'createTusUploadUrl',
        502,
        'Missing Location / stream-media-id response headers',
      )
    }
    return { uploadUrl, streamVideoId }
  } catch (error) {
    if (error instanceof ProviderError) throw error
    throw new ProviderError('stream', 'createTusUploadUrl', 500, error)
  }
}

// ─── Video details ───

const videoStateSchema = z.enum([
  'pendingupload',
  'downloading',
  'queued',
  'inprogress',
  'ready',
  'error',
])

const videoDetailsResponseSchema = z.object({
  result: z.object({
    uid: z.string().min(1),
    readyToStream: z.boolean(),
    status: z.object({
      state: videoStateSchema,
      errorReasonCode: z.string().optional(),
      errorReasonText: z.string().optional(),
    }),
    duration: z.number().optional(),
    thumbnail: z.string().optional(),
  }),
})

/** Fetch processing status, duration, playback readiness and thumbnail for a Stream video. */
export async function getVideo(streamVideoId: string) {
  const { accountId, apiToken } = requireStreamApi('getVideo')
  try {
    const response = await fetch(`${STREAM_API_BASE}/${accountId}/stream/${streamVideoId}`, {
      headers: { Authorization: `Bearer ${apiToken}` },
      signal: AbortSignal.timeout(STREAM_FETCH_TIMEOUT_MS),
    })
    if (!response.ok) {
      throw new ProviderError('stream', 'getVideo', response.status, await response.text())
    }
    const { result } = videoDetailsResponseSchema.parse(await response.json())
    return {
      streamVideoId: result.uid,
      state: result.status.state,
      readyToStream: result.readyToStream,
      durationSeconds: result.duration,
      thumbnailUrl: result.thumbnail,
      errorReasonCode: result.status.errorReasonCode,
      errorReasonText: result.status.errorReasonText,
    }
  } catch (error) {
    if (error instanceof ProviderError) throw error
    throw new ProviderError('stream', 'getVideo', 500, error)
  }
}
export type StreamVideo = Awaited<ReturnType<typeof getVideo>>

// ─── Self-signed playback tokens (TD-6: zero Cloudflare API calls per playback) ───

const accessRuleSchema = z.object({
  type: z.enum(['any', 'ip.src', 'ip.geoip.country']),
  action: z.enum(['allow', 'block']),
  country: z.array(z.string()).optional(),
  ip: z.array(z.string()).optional(),
})
export type AccessRule = z.infer<typeof accessRuleSchema>

const playbackTokenOptionsSchema = z.object({
  expiresInSeconds: z.number().int().positive().default(DEFAULT_PLAYBACK_TTL_SECONDS),
  accessRules: z.array(accessRuleSchema).optional(),
})
export type PlaybackTokenOptions = Partial<z.input<typeof playbackTokenOptionsSchema>>

/**
 * Self-sign a Stream playback JWT with jose using the account signing key.
 * No Cloudflare API call — the signing key JWK lives in env (base64-encoded).
 */
export async function signPlaybackToken(
  streamVideoId: string,
  opts: PlaybackTokenOptions = {},
): Promise<string> {
  const keyId = env.CLOUDFLARE_STREAM_SIGNING_KEY_ID
  const jwkBase64 = env.CLOUDFLARE_STREAM_SIGNING_KEY_JWK
  if (!keyId || !jwkBase64) {
    throw new ProviderError(
      'stream',
      'signPlaybackToken',
      500,
      'CLOUDFLARE_STREAM_SIGNING_KEY_ID / CLOUDFLARE_STREAM_SIGNING_KEY_JWK not configured',
    )
  }
  try {
    const { expiresInSeconds, accessRules } = playbackTokenOptionsSchema.parse(opts)
    const jwk = JSON.parse(Buffer.from(jwkBase64, 'base64').toString('utf8'))
    const alg = jwk.alg ?? (jwk.kty === 'EC' ? 'ES256' : 'RS256')
    const key = await importJWK(jwk, alg)
    return await new SignJWT({ kid: keyId, ...(accessRules ? { accessRules } : {}) })
      .setProtectedHeader({ alg, kid: keyId })
      .setSubject(streamVideoId)
      .setExpirationTime(Math.floor(Date.now() / 1000) + expiresInSeconds)
      .sign(key)
  } catch (error) {
    throw new ProviderError('stream', 'signPlaybackToken', 500, error)
  }
}

// ─── Webhooks (eng-schema S4) ───

/**
 * Verify Stream's `Webhook-Signature: time=<unix>,sig1=<hex>` header.
 * HMAC-SHA256 of `${time}.${rawBody}`, constant-time compare, stale timestamps (>5 min) rejected.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null | undefined,
): boolean {
  const secret = env.CLOUDFLARE_STREAM_WEBHOOK_SECRET
  if (!secret) {
    throw new ProviderError(
      'stream',
      'verifyWebhookSignature',
      500,
      'CLOUDFLARE_STREAM_WEBHOOK_SECRET not configured',
    )
  }
  if (!signatureHeader) return false

  const parts = new Map<string, string>()
  for (const segment of signatureHeader.split(',')) {
    const [key, value] = segment.split('=', 2)
    if (key && value) parts.set(key.trim(), value.trim())
  }
  const time = Number(parts.get('time'))
  const sig1 = parts.get('sig1')
  if (!Number.isFinite(time) || !sig1) return false
  if (Math.abs(Math.floor(Date.now() / 1000) - time) > WEBHOOK_TOLERANCE_SECONDS) return false

  const expected = createHmac('sha256', secret).update(`${time}.${rawBody}`).digest('hex')
  const expectedBuffer = Buffer.from(expected)
  const actualBuffer = Buffer.from(sig1)
  if (expectedBuffer.length !== actualBuffer.length) return false
  return timingSafeEqual(expectedBuffer, actualBuffer)
}

const webhookEventSchema = z.object({
  uid: z.string().min(1),
  readyToStream: z.boolean().default(false),
  status: z.object({
    state: videoStateSchema,
    errorReasonCode: z.string().optional(),
    errorReasonText: z.string().optional(),
  }),
  duration: z.number().optional(),
  thumbnail: z.string().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
})
export type StreamWebhookEvent = z.infer<typeof webhookEventSchema>

/** Parse + validate a Stream webhook body (video.ready / error states). Invalid → ProviderError 400. */
export function parseWebhookEvent(rawBody: string): StreamWebhookEvent {
  try {
    return webhookEventSchema.parse(JSON.parse(rawBody))
  } catch (error) {
    throw new ProviderError('stream', 'parseWebhookEvent', 400, error)
  }
}

// ─── Generated captions ───

const captionsResponseSchema = z.object({
  result: z.object({
    language: z.string().min(1),
    status: z.string().min(1),
  }),
})
export type CaptionGeneration = z.infer<typeof captionsResponseSchema>['result']

/** Kick off AI-generated captions for a video (Stream `captions/{lang}/generate`). */
export async function generateCaptions(
  streamVideoId: string,
  language = 'en',
): Promise<CaptionGeneration> {
  const { accountId, apiToken } = requireStreamApi('generateCaptions')
  try {
    const response = await fetch(
      `${STREAM_API_BASE}/${accountId}/stream/${streamVideoId}/captions/${language}/generate`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiToken}` },
        signal: AbortSignal.timeout(STREAM_FETCH_TIMEOUT_MS),
      },
    )
    if (!response.ok) {
      throw new ProviderError('stream', 'generateCaptions', response.status, await response.text())
    }
    return captionsResponseSchema.parse(await response.json()).result
  } catch (error) {
    if (error instanceof ProviderError) throw error
    throw new ProviderError('stream', 'generateCaptions', 500, error)
  }
}
