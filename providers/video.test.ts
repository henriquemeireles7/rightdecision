import { afterAll, afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import { createHmac } from 'node:crypto'
import { decodeJwt, decodeProtectedHeader, exportJWK, generateKeyPair, jwtVerify } from 'jose'
import { clearEnvOverride, envProxy, setEnvOverride } from '@/platform/test/mocks'
import { ProviderError } from '@/providers/errors'

// ─── Fixture signing keys (generated once, real keys, no network) ───
const rsa = await generateKeyPair('RS256', { extractable: true })
// Strip alg so fixtures exercise the kty-based fallback branches in signPlaybackToken
const { alg: _rsaAlg, ...rsaJwk } = await exportJWK(rsa.privateKey)
const ec = await generateKeyPair('ES256', { extractable: true })
const { alg: _ecAlg, ...ecJwk } = await exportJWK(ec.privateKey)

const toBase64Jwk = (jwk: unknown) => Buffer.from(JSON.stringify(jwk)).toString('base64')

const WEBHOOK_SECRET = 'test-webhook-secret'
const SIGNING_KEY_ID = 'test-signing-key-id'

// Mutable env mock — tests mutate keys, afterEach restores (provider reads env at call time)
const baseEnv = {
  CLOUDFLARE_ACCOUNT_ID: 'acct-123',
  CLOUDFLARE_STREAM_API_TOKEN: 'token-abc',
  CLOUDFLARE_STREAM_SIGNING_KEY_ID: SIGNING_KEY_ID,
  CLOUDFLARE_STREAM_SIGNING_KEY_JWK: toBase64Jwk(rsaJwk),
  CLOUDFLARE_STREAM_WEBHOOK_SECRET: WEBHOOK_SECRET,
  CLOUDFLARE_STREAM_CUSTOMER_CODE: 'customer-code',
}
const mockEnv: Record<string, string | undefined> = { ...baseEnv }

// Live reference — tests mutate mockEnv between cases, the proxy sees it.
mock.module('@/platform/env', () => ({ env: envProxy }))
setEnvOverride(mockEnv)

afterAll(clearEnvOverride)

const {
  createTusUploadUrl,
  generateCaptions,
  getVideo,
  parseWebhookEvent,
  signPlaybackToken,
  verifyWebhookSignature,
} = await import('./video')

const originalFetch = globalThis.fetch

beforeEach(() => {
  Object.assign(mockEnv, baseEnv)
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

function signedHeader(body: string, time = Math.floor(Date.now() / 1000), secret = WEBHOOK_SECRET) {
  const sig = createHmac('sha256', secret).update(`${time}.${body}`).digest('hex')
  return `time=${time},sig1=${sig}`
}

describe('createTusUploadUrl', () => {
  it('returns uploadUrl and streamVideoId from response headers', async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(null, {
          status: 201,
          headers: {
            Location: 'https://upload.cloudflarestream.com/tus/abc123',
            'stream-media-id': 'abc123',
          },
        }),
      ),
    )
    globalThis.fetch = fetchMock as unknown as typeof fetch

    const result = await createTusUploadUrl({ uploadLengthBytes: 1024 })
    expect(result).toEqual({
      uploadUrl: 'https://upload.cloudflarestream.com/tus/abc123',
      streamVideoId: 'abc123',
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(
      'https://api.cloudflare.com/client/v4/accounts/acct-123/stream?direct_user=true',
    )
    const headers = init.headers as Record<string, string>
    expect(init.method).toBe('POST')
    expect(headers.Authorization).toBe('Bearer token-abc')
    expect(headers['Tus-Resumable']).toBe('1.0.0')
    expect(headers['Upload-Length']).toBe('1024')
  })

  it('encodes name/maxDurationSeconds/requiresignedurls into Upload-Metadata', async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(null, {
          status: 201,
          headers: { Location: 'https://u.example/tus/x', 'stream-media-id': 'x' },
        }),
      ),
    )
    globalThis.fetch = fetchMock as unknown as typeof fetch

    await createTusUploadUrl({
      uploadLengthBytes: 10,
      name: 'Lesson 1',
      maxDurationSeconds: 3600,
      requireSignedUrls: true,
    })
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    const meta = (init.headers as Record<string, string>)['Upload-Metadata']
    expect(meta).toContain(`name ${Buffer.from('Lesson 1').toString('base64')}`)
    expect(meta).toContain(`maxDurationSeconds ${Buffer.from('3600').toString('base64')}`)
    expect(meta).toContain('requiresignedurls')
  })

  it('throws ProviderError with status on non-2xx response', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response('nope', { status: 403 })),
    ) as unknown as typeof fetch
    await expect(createTusUploadUrl({ uploadLengthBytes: 1 })).rejects.toThrow(
      'stream.createTusUploadUrl failed (403)',
    )
  })

  it('throws ProviderError when Location/stream-media-id headers missing', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(null, { status: 201 })),
    ) as unknown as typeof fetch
    await expect(createTusUploadUrl({ uploadLengthBytes: 1 })).rejects.toThrow(ProviderError)
  })

  it('throws ProviderError when Stream env vars absent', async () => {
    mockEnv.CLOUDFLARE_ACCOUNT_ID = undefined
    await expect(createTusUploadUrl({ uploadLengthBytes: 1 })).rejects.toThrow(ProviderError)
  })

  it('throws ProviderError when fetch itself rejects', async () => {
    globalThis.fetch = mock(() =>
      Promise.reject(new Error('network down')),
    ) as unknown as typeof fetch
    await expect(createTusUploadUrl({ uploadLengthBytes: 1 })).rejects.toThrow(
      'stream.createTusUploadUrl failed (500)',
    )
  })
})

describe('getVideo', () => {
  const readyBody = {
    result: {
      uid: 'vid-1',
      readyToStream: true,
      status: { state: 'ready' },
      duration: 123.4,
      thumbnail: 'https://thumb.example/vid-1.jpg',
    },
  }

  it('returns status, duration, readiness and thumbnail', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(Response.json(readyBody)),
    ) as unknown as typeof fetch
    const video = await getVideo('vid-1')
    expect(video.streamVideoId).toBe('vid-1')
    expect(video.state).toBe('ready')
    expect(video.readyToStream).toBe(true)
    expect(video.durationSeconds).toBe(123.4)
    expect(video.thumbnailUrl).toBe('https://thumb.example/vid-1.jpg')
  })

  it('calls the Stream video endpoint with auth', async () => {
    const fetchMock = mock(() => Promise.resolve(Response.json(readyBody)))
    globalThis.fetch = fetchMock as unknown as typeof fetch
    await getVideo('vid-1')
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://api.cloudflare.com/client/v4/accounts/acct-123/stream/vid-1')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer token-abc')
  })

  it('surfaces error state with reason', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(
        Response.json({
          result: {
            uid: 'vid-2',
            readyToStream: false,
            status: { state: 'error', errorReasonCode: 'ERR_CODEC', errorReasonText: 'bad codec' },
          },
        }),
      ),
    ) as unknown as typeof fetch
    const video = await getVideo('vid-2')
    expect(video.state).toBe('error')
    expect(video.errorReasonCode).toBe('ERR_CODEC')
    expect(video.durationSeconds).toBeUndefined()
  })

  it('throws ProviderError with status on non-2xx', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response('not found', { status: 404 })),
    ) as unknown as typeof fetch
    await expect(getVideo('missing')).rejects.toThrow('stream.getVideo failed (404)')
  })

  it('throws ProviderError on malformed response body', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(Response.json({ result: { nope: true } })),
    ) as unknown as typeof fetch
    await expect(getVideo('vid-1')).rejects.toThrow(ProviderError)
  })

  it('throws ProviderError when Stream env vars absent', async () => {
    mockEnv.CLOUDFLARE_STREAM_API_TOKEN = undefined
    await expect(getVideo('vid-1')).rejects.toThrow(ProviderError)
  })
})

describe('signPlaybackToken', () => {
  it('produces a verifiable RS256 JWT with kid header, sub and exp (no API call)', async () => {
    const fetchMock = mock(() => Promise.reject(new Error('must not be called')))
    globalThis.fetch = fetchMock as unknown as typeof fetch

    const token = await signPlaybackToken('vid-1', { expiresInSeconds: 600 })
    const header = decodeProtectedHeader(token)
    expect(header.alg).toBe('RS256')
    expect(header.kid).toBe(SIGNING_KEY_ID)

    const payload = decodeJwt(token)
    expect(payload.sub).toBe('vid-1')
    expect(payload.kid).toBe(SIGNING_KEY_ID)
    const now = Math.floor(Date.now() / 1000)
    expect(payload.exp).toBeGreaterThan(now + 590)
    expect(payload.exp).toBeLessThanOrEqual(now + 610)

    await jwtVerify(token, rsa.publicKey) // signature is genuine
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('defaults expiry when not provided', async () => {
    const token = await signPlaybackToken('vid-1')
    const payload = decodeJwt(token)
    expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000))
  })

  it('includes accessRules in payload when provided', async () => {
    const rules = [{ type: 'ip.geoip.country' as const, action: 'allow' as const, country: ['BR'] }]
    const token = await signPlaybackToken('vid-1', { accessRules: rules })
    const payload = decodeJwt(token)
    expect(payload.accessRules).toEqual([
      { type: 'ip.geoip.country', action: 'allow', country: ['BR'] },
    ])
  })

  it('signs with ES256 when the JWK is an EC key', async () => {
    mockEnv.CLOUDFLARE_STREAM_SIGNING_KEY_JWK = toBase64Jwk(ecJwk)
    const token = await signPlaybackToken('vid-1')
    expect(decodeProtectedHeader(token).alg).toBe('ES256')
    await jwtVerify(token, ec.publicKey)
  })

  it('honors an explicit alg in the JWK', async () => {
    mockEnv.CLOUDFLARE_STREAM_SIGNING_KEY_JWK = toBase64Jwk({ ...rsaJwk, alg: 'RS256' })
    const token = await signPlaybackToken('vid-1')
    expect(decodeProtectedHeader(token).alg).toBe('RS256')
  })

  it('throws ProviderError when signing env vars absent', async () => {
    mockEnv.CLOUDFLARE_STREAM_SIGNING_KEY_JWK = undefined
    await expect(signPlaybackToken('vid-1')).rejects.toThrow(ProviderError)
    Object.assign(mockEnv, baseEnv)
    mockEnv.CLOUDFLARE_STREAM_SIGNING_KEY_ID = undefined
    await expect(signPlaybackToken('vid-1')).rejects.toThrow(ProviderError)
  })

  it('throws ProviderError on an unparseable JWK', async () => {
    mockEnv.CLOUDFLARE_STREAM_SIGNING_KEY_JWK = Buffer.from('not-json').toString('base64')
    await expect(signPlaybackToken('vid-1')).rejects.toThrow(
      'stream.signPlaybackToken failed (500)',
    )
  })
})

describe('verifyWebhookSignature', () => {
  const body = JSON.stringify({ uid: 'vid-1', status: { state: 'ready' } })

  it('accepts a valid signature', () => {
    expect(verifyWebhookSignature(body, signedHeader(body))).toBe(true)
  })

  it('rejects a tampered body', () => {
    const header = signedHeader(body)
    expect(verifyWebhookSignature(`${body} `, header)).toBe(false)
  })

  it('rejects a signature made with the wrong secret', () => {
    expect(verifyWebhookSignature(body, signedHeader(body, undefined, 'wrong-secret'))).toBe(false)
  })

  it('rejects stale timestamps (>5 min)', () => {
    const stale = Math.floor(Date.now() / 1000) - 301
    expect(verifyWebhookSignature(body, signedHeader(body, stale))).toBe(false)
  })

  it('rejects missing or malformed headers', () => {
    expect(verifyWebhookSignature(body, null)).toBe(false)
    expect(verifyWebhookSignature(body, undefined)).toBe(false)
    expect(verifyWebhookSignature(body, 'garbage')).toBe(false)
    expect(verifyWebhookSignature(body, 'time=abc,sig1=deadbeef')).toBe(false)
    expect(verifyWebhookSignature(body, `time=${Math.floor(Date.now() / 1000)}`)).toBe(false)
  })

  it('rejects signatures of a different length without throwing', () => {
    const time = Math.floor(Date.now() / 1000)
    expect(verifyWebhookSignature(body, `time=${time},sig1=abcd`)).toBe(false)
  })

  it('throws ProviderError when webhook secret absent', () => {
    mockEnv.CLOUDFLARE_STREAM_WEBHOOK_SECRET = undefined
    expect(() => verifyWebhookSignature(body, signedHeader(body))).toThrow(ProviderError)
  })
})

describe('parseWebhookEvent', () => {
  it('parses a video.ready payload', () => {
    const event = parseWebhookEvent(
      JSON.stringify({
        uid: 'vid-1',
        readyToStream: true,
        status: { state: 'ready' },
        duration: 99,
        thumbnail: 'https://thumb.example/v.jpg',
        meta: { name: 'Lesson 1' },
      }),
    )
    expect(event.uid).toBe('vid-1')
    expect(event.status.state).toBe('ready')
    expect(event.readyToStream).toBe(true)
    expect(event.duration).toBe(99)
  })

  it('parses a video error payload with reason', () => {
    const event = parseWebhookEvent(
      JSON.stringify({
        uid: 'vid-2',
        readyToStream: false,
        status: { state: 'error', errorReasonCode: 'ERR_DURATION', errorReasonText: 'too long' },
      }),
    )
    expect(event.status.state).toBe('error')
    expect(event.status.errorReasonCode).toBe('ERR_DURATION')
  })

  it('throws ProviderError 400 on invalid JSON', () => {
    expect(() => parseWebhookEvent('{nope')).toThrow('stream.parseWebhookEvent failed (400)')
  })

  it('throws ProviderError 400 on schema violations', () => {
    expect(() => parseWebhookEvent(JSON.stringify({ status: { state: 'ready' } }))).toThrow(
      ProviderError,
    )
    expect(() =>
      parseWebhookEvent(JSON.stringify({ uid: 'v', status: { state: 'exploded' } })),
    ).toThrow(ProviderError)
  })
})

describe('generateCaptions', () => {
  it('requests generated captions for a language and returns status', async () => {
    const fetchMock = mock(() =>
      Promise.resolve(Response.json({ result: { language: 'en', status: 'inprogress' } })),
    )
    globalThis.fetch = fetchMock as unknown as typeof fetch
    const result = await generateCaptions('vid-1')
    expect(result).toEqual({ language: 'en', status: 'inprogress' })
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(
      'https://api.cloudflare.com/client/v4/accounts/acct-123/stream/vid-1/captions/en/generate',
    )
    expect(init.method).toBe('POST')
  })

  it('passes a custom language', async () => {
    const fetchMock = mock(() =>
      Promise.resolve(Response.json({ result: { language: 'pt', status: 'inprogress' } })),
    )
    globalThis.fetch = fetchMock as unknown as typeof fetch
    await generateCaptions('vid-1', 'pt')
    const [url] = fetchMock.mock.calls[0] as unknown as [string]
    expect(url).toContain('/captions/pt/generate')
  })

  it('throws ProviderError with status on non-2xx', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response('bad', { status: 409 })),
    ) as unknown as typeof fetch
    await expect(generateCaptions('vid-1')).rejects.toThrow('stream.generateCaptions failed (409)')
  })

  it('throws ProviderError on malformed response', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(Response.json({ result: {} })),
    ) as unknown as typeof fetch
    await expect(generateCaptions('vid-1')).rejects.toThrow(ProviderError)
  })

  it('throws ProviderError when Stream env vars absent', async () => {
    mockEnv.CLOUDFLARE_STREAM_API_TOKEN = undefined
    await expect(generateCaptions('vid-1')).rejects.toThrow(ProviderError)
  })
})
