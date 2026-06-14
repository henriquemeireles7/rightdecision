import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { eq } from 'drizzle-orm'
import { db } from '@/platform/db/client'
import { aiUsage, conversations } from '@/platform/db/schema'
import { env } from '@/platform/env'
import { createTestUser } from '@/platform/test/factories'
import { apiCall, assertError, stubAuth } from '@/platform/test/helpers'
import { setupTestDb, teardownTestDb } from '@/platform/test/setup'
import type { ChatChunk, ChatParams } from '@/providers/ai'
import { enforceAiBudget } from './budget'
import { createAiChatRoutes } from './routes'
import type { ChatProvider } from './service'

beforeAll(setupTestDb)
afterAll(teardownTestDb)

const fixtureProvider: ChatProvider = (params: ChatParams) =>
  (async function* (): AsyncIterable<ChatChunk> {
    yield { type: 'text', text: 'hi there' }
    yield { type: 'done', inputTokens: 10, outputTokens: 5, model: `m-${params.kind}` }
  })()

function appFor(user: { id: string; email: string; name: string }, provider = fixtureProvider) {
  return createAiChatRoutes({
    auth: stubAuth(user),
    budget: enforceAiBudget(), // real budget middleware — exercises the ceiling path
    provider,
  })
}

async function readSse(response: Response): Promise<string> {
  return await response.text()
}

describe('ai-chat routes: streaming send', () => {
  test('POST / streams token + done SSE events and persists the assistant turn', async () => {
    const user = await createTestUser()
    const app = appFor(user!)
    const response = await app.fetch(
      new Request('http://localhost/', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: 'help me decide' }),
      }),
    )
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/event-stream')
    const body = await readSse(response)
    expect(body).toContain('event: token')
    expect(body).toContain('hi there')
    expect(body).toContain('event: done')

    const usage = await db.select().from(aiUsage).where(eq(aiUsage.userId, user!.id))
    expect(usage.find((u) => u.kind === 'chat')).toBeDefined()
  })

  test('POST / to a FOREIGN conversation emits an SSE error event (CONVERSATION_NOT_FOUND)', async () => {
    const owner = await createTestUser()
    const intruder = await createTestUser()
    const [conv] = await db
      .insert(conversations)
      .values({ userId: owner!.id, kind: 'chat' })
      .returning()
    const app = appFor(intruder!)
    const response = await app.fetch(
      new Request('http://localhost/', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ conversationId: conv!.id, message: 'sneak' }),
      }),
    )
    const body = await readSse(response)
    expect(body).toContain('event: error')
    expect(body).toContain('CONVERSATION_NOT_FOUND')
  })
})

describe('ai-chat routes: budget ceiling (graceful 429)', () => {
  test('a user at the free ceiling gets AI_BUDGET_EXCEEDED 429 — never reaches the stream', async () => {
    const user = await createTestUser()
    // Seed at the free ceiling (no paid enrollment → free plan).
    await db.insert(aiUsage).values({
      userId: user!.id,
      kind: 'chat',
      model: 'm',
      inputTokens: env.AI_MONTHLY_TOKEN_BUDGET_FREE,
      outputTokens: 0,
    })
    const app = appFor(user!)
    const result = await apiCall(app, 'POST', '/', { message: 'one more' })
    assertError(result, 'AI_BUDGET_EXCEEDED')
  })
})

describe('ai-chat routes: read paths', () => {
  test('GET /:conversationId returns the message history + not-therapy line', async () => {
    const user = await createTestUser()
    const [conv] = await db
      .insert(conversations)
      .values({ userId: user!.id, kind: 'chat', title: 'mine' })
      .returning()
    const app = appFor(user!)
    const result = await apiCall(app, 'GET', `/${conv!.id}`)
    expect(result.status).toBe(200)
    const data = result.body as { ok: boolean; data: { notTherapy: string } }
    expect(data.data.notTherapy.toLowerCase()).toContain('not therapy')
  })

  test('GET /:conversationId 404s for a foreign conversation', async () => {
    const owner = await createTestUser()
    const intruder = await createTestUser()
    const [conv] = await db
      .insert(conversations)
      .values({ userId: owner!.id, kind: 'chat' })
      .returning()
    const app = appFor(intruder!)
    const result = await apiCall(app, 'GET', `/${conv!.id}`)
    assertError(result, 'CONVERSATION_NOT_FOUND')
  })
})
