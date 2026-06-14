import { afterAll, afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import { clearEnvOverride, envProxy, setEnvOverride } from '@/platform/test/mocks'
import { ProviderError } from '@/providers/errors'

// Live reference — tests mutate mockEnv between cases, the proxy sees it.
const mockEnv: Record<string, string | undefined> = { IMAGE_GEN_API_KEY: 'img-key-123' }
mock.module('@/platform/env', () => ({ env: envProxy }))
setEnvOverride(mockEnv)

afterAll(clearEnvOverride)

const { COVER_PROMPT_VERSION, MASTER_PROMPT, generateCoverImage } = await import('./image-gen')

const originalFetch = globalThis.fetch
const FIXTURE_BYTES = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]) // PNG magic
const FIXTURE_B64 = Buffer.from(FIXTURE_BYTES).toString('base64')

function okImageResponse() {
  return Promise.resolve(Response.json({ data: [{ b64_json: FIXTURE_B64 }] }))
}

beforeEach(() => {
  mockEnv.IMAGE_GEN_API_KEY = 'img-key-123'
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('MASTER_PROMPT (ADR 18)', () => {
  it('is versioned', () => {
    expect(COVER_PROMPT_VERSION).toMatch(/^v\d+$/)
  })

  it('locks the warm palette with hex anchors', () => {
    expect(MASTER_PROMPT).toMatch(/#[0-9A-Fa-f]{6}/)
    expect(MASTER_PROMPT.toLowerCase()).toContain('warm')
  })

  it('demands painterly editorial illustration, scene/object-based', () => {
    const p = MASTER_PROMPT.toLowerCase()
    expect(p).toContain('painterly')
    expect(p).toContain('editorial illustration')
  })

  it('forbids text, faces, purple, neon and blue-dominant', () => {
    const p = MASTER_PROMPT.toLowerCase()
    for (const banned of ['text', 'typography', 'letter', 'face', 'purple', 'neon', 'blue']) {
      expect(p).toContain(banned)
    }
  })
})

describe('generateCoverImage', () => {
  it('returns the decoded image bytes as Uint8Array', async () => {
    globalThis.fetch = mock(okImageResponse) as unknown as typeof fetch
    const bytes = await generateCoverImage({ subject: 'Decision Foundations', aspect: '2:3' })
    expect(bytes).toBeInstanceOf(Uint8Array)
    expect([...bytes]).toEqual([...FIXTURE_BYTES])
  })

  it('sends the master prompt + subject and maps 2:3 to a portrait size', async () => {
    const fetchMock = mock(okImageResponse)
    globalThis.fetch = fetchMock as unknown as typeof fetch
    await generateCoverImage({ subject: 'Morning Journal', aspect: '2:3' })
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toContain('https://')
    const reqBody = JSON.parse(init.body as string)
    expect(reqBody.prompt).toContain(MASTER_PROMPT)
    expect(reqBody.prompt).toContain('Morning Journal')
    expect(reqBody.size).toBe('1024x1536')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer img-key-123')
  })

  it('maps 16:9 to a landscape size', async () => {
    const fetchMock = mock(okImageResponse)
    globalThis.fetch = fetchMock as unknown as typeof fetch
    await generateCoverImage({ subject: 'Lesson thumb', aspect: '16:9' })
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(init.body as string).size).toBe('1536x1024')
  })

  it('throws ProviderError with status on non-2xx', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response('rate limited', { status: 429 })),
    ) as unknown as typeof fetch
    await expect(generateCoverImage({ subject: 's', aspect: '2:3' })).rejects.toThrow(
      'image-gen.generateCoverImage failed (429)',
    )
  })

  it('throws ProviderError when the response has no image data', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(Response.json({ data: [] })),
    ) as unknown as typeof fetch
    await expect(generateCoverImage({ subject: 's', aspect: '2:3' })).rejects.toThrow(ProviderError)
  })

  it('throws ProviderError on an empty subject', async () => {
    await expect(generateCoverImage({ subject: '', aspect: '2:3' })).rejects.toThrow(ProviderError)
  })

  it('throws ProviderError when IMAGE_GEN_API_KEY absent', async () => {
    mockEnv.IMAGE_GEN_API_KEY = undefined
    await expect(generateCoverImage({ subject: 's', aspect: '2:3' })).rejects.toThrow(ProviderError)
  })

  it('throws ProviderError when fetch itself rejects', async () => {
    globalThis.fetch = mock(() => Promise.reject(new Error('network'))) as unknown as typeof fetch
    await expect(generateCoverImage({ subject: 's', aspect: '16:9' })).rejects.toThrow(
      'image-gen.generateCoverImage failed (500)',
    )
  })
})

describe('TD-8: provider isolation', () => {
  it('never imports providers/storage (caller owns uploads)', async () => {
    const source = await Bun.file(new URL('./image-gen.ts', import.meta.url)).text()
    expect(source).not.toMatch(/import[\s\S]*?from\s+'(@\/providers\/storage|\.\/storage)'/)
  })
})
