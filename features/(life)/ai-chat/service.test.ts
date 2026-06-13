import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { and, eq } from 'drizzle-orm'
import { db } from '@/platform/db/client'
import {
  aiUsage,
  conversationMessages,
  conversations,
  documentAnswers,
  documents,
  events,
  journalEntries,
} from '@/platform/db/schema'
import {
  createTestDocumentTemplate,
  createTestProgram,
  createTestUser,
} from '@/platform/test/factories'
import { setupTestDb, teardownTestDb } from '@/platform/test/setup'
import type { ChatChunk, ChatParams } from '@/providers/ai'
import {
  assembleContext,
  CHAT_HISTORY_LIMIT,
  type ChatProvider,
  getConversation,
  listConversations,
  runChatTurn,
} from './service'

beforeAll(setupTestDb)
afterAll(teardownTestDb)

/** A fixture chat provider: yields the given texts, then a terminal done frame. */
function fixtureProvider(
  texts: string[],
  usage = { inputTokens: 120, outputTokens: 40 },
): ChatProvider {
  return (params: ChatParams) =>
    (async function* (): AsyncIterable<ChatChunk> {
      for (const text of texts) yield { type: 'text', text }
      yield { type: 'done', ...usage, model: `model-for-${params.kind}` }
    })()
}

/** A provider that drops mid-stream (deploy severs the SSE socket): no done frame. */
function droppingProvider(text: string): ChatProvider {
  return () =>
    (async function* (): AsyncIterable<ChatChunk> {
      yield { type: 'text', text }
      throw new Error('socket severed mid-stream')
    })()
}

/** A provider that hangs forever — never yields a chunk (a hung Anthropic socket). */
function hangingProvider(): ChatProvider {
  return () =>
    (async function* (): AsyncIterable<ChatChunk> {
      await new Promise(() => {}) // never resolves
    })()
}

/** Seed a user whose playbook + journal + decisions carry asserting-able specifics. */
async function seedUserWithPlaybook() {
  const program = (await createTestProgram())!
  const template = (await createTestDocumentTemplate(program.id))!
  const user = await createTestUser()
  const [doc] = await db
    .insert(documents)
    .values({
      userId: user!.id,
      templateId: template.id,
      templateVersion: 1,
      status: 'in_progress',
    })
    .returning()
  await db.insert(documentAnswers).values({
    documentId: doc!.id,
    fieldId: 'f-required',
    value: 'Leave the salon job and open my own studio',
    source: 'typed',
    confirmedAt: new Date(),
  })
  await db.insert(journalEntries).values({
    userId: user!.id,
    entryDate: '2026-06-12',
    kind: 'evening',
    prompt: 'p',
    content: 'I avoided calling the landlord again',
  })
  await db.insert(events).values({
    userId: user!.id,
    name: 'answer_saved',
    properties: { documentId: doc!.id, fieldId: 'f-required' },
    isDecision: true,
    decisionKind: 'playbook',
  })
  return user!
}

describe('ai-chat: context assembly references the user actual playbook (ADR 9)', () => {
  test('the assembled context contains the playbook answer, journal, and the field LABEL', async () => {
    const user = await seedUserWithPlaybook()
    const context = await assembleContext(user.id)
    expect(context).toContain('Leave the salon job and open my own studio')
    expect(context).toContain('The required field') // the field label, not the raw fieldId
    expect(context).toContain('I avoided calling the landlord again')
    expect(context).toMatch(/made 1 tracked decisions/i)
  })

  test('an empty user gets a graceful empty-playbook context (no crash)', async () => {
    const user = await createTestUser()
    const context = await assembleContext(user!.id)
    expect(context).toContain('playbook is still empty')
  })
})

describe('ai-chat: persist-on-completion (the SSE seam, eng-schema S3)', () => {
  test('a completed turn persists the assistant message + an ai_usage row + streams chunks', async () => {
    const user = await seedUserWithPlaybook()
    const streamed: string[] = []
    const result = await runChatTurn({
      userId: user.id,
      userMessage: 'What should I do about the studio?',
      provider: fixtureProvider(['You already ', 'decided.']),
      onChunk: (text) => {
        streamed.push(text)
      },
    })
    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.dropped).toBe(false)
    expect(result.assistantText).toBe('You already decided.')
    expect(streamed.join('')).toBe('You already decided.')

    const messages = await db
      .select()
      .from(conversationMessages)
      .where(eq(conversationMessages.conversationId, result.conversationId))
    expect(messages.map((m) => m.role)).toEqual(['user', 'assistant'])
    expect(messages.find((m) => m.role === 'assistant')?.content).toBe('You already decided.')

    const usage = await db.select().from(aiUsage).where(eq(aiUsage.userId, user.id))
    const chatUsage = usage.find((u) => u.kind === 'chat')
    expect(chatUsage).toBeDefined()
    expect(chatUsage?.inputTokens).toBe(120)
    expect(chatUsage?.outputTokens).toBe(40)

    const evts = await db
      .select()
      .from(events)
      .where(and(eq(events.userId, user.id), eq(events.name, 'chat_message_sent')))
    expect(evts.length).toBe(1)
  })

  test('a DROPPED stream leaves NO partial assistant message — refetch recovers the conversation', async () => {
    const user = await seedUserWithPlaybook()
    const result = await runChatTurn({
      userId: user.id,
      userMessage: 'Tell me everything',
      provider: droppingProvider('half a sen'),
    })
    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.dropped).toBe(true)
    expect(result.assistantText).toBe('')

    // The user message persisted; NO assistant row, NO usage row.
    const refetched = await getConversation(user.id, result.conversationId)
    expect('error' in refetched).toBe(false)
    if ('error' in refetched) return
    expect(refetched.messages.map((m) => m.role)).toEqual(['user'])
    const usage = await db.select().from(aiUsage).where(eq(aiUsage.userId, user.id))
    expect(usage.filter((u) => u.kind === 'chat').length).toBe(0)
  })

  test('a HUNG provider (never yields) times out → dropped, nothing persisted (C1)', async () => {
    const user = await seedUserWithPlaybook()
    const result = await runChatTurn({
      userId: user.id,
      userMessage: 'are you there?',
      provider: hangingProvider(),
      idleTimeoutMs: 50, // short timeout so the test is fast; prod uses CHAT_TURN_IDLE_TIMEOUT_MS
    })
    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.dropped).toBe(true)
    expect(result.assistantText).toBe('')

    // User message persisted; NO assistant row, NO usage row.
    const refetched = await getConversation(user.id, result.conversationId)
    if ('error' in refetched) throw new Error('refetch failed')
    expect(refetched.messages.map((m) => m.role)).toEqual(['user'])
    const usage = await db.select().from(aiUsage).where(eq(aiUsage.userId, user.id))
    expect(usage.filter((u) => u.kind === 'chat').length).toBe(0)
  })

  test('conversationHistory replayed into the provider is bounded to CHAT_HISTORY_LIMIT (fix 6)', async () => {
    const user = await seedUserWithPlaybook()
    // Seed a conversation with many messages, then capture what the provider receives.
    const first = await runChatTurn({
      userId: user.id,
      userMessage: 'seed',
      provider: fixtureProvider(['ok']),
    })
    if ('error' in first) throw new Error('seed turn failed')
    const conversationId = first.conversationId
    // Insert well over CHAT_HISTORY_LIMIT messages directly.
    const extra = Array.from({ length: CHAT_HISTORY_LIMIT + 20 }, (_, i) => ({
      conversationId,
      role: 'user' as const,
      content: `m${i}`,
    }))
    await db.insert(conversationMessages).values(extra)

    let received: ChatParams['messages'] = []
    const capturingProvider: ChatProvider = (params) => {
      received = params.messages
      return (async function* (): AsyncIterable<ChatChunk> {
        yield { type: 'done', inputTokens: 1, outputTokens: 1, model: 'm' }
      })()
    }
    await runChatTurn({
      userId: user.id,
      conversationId,
      userMessage: 'next',
      provider: capturingProvider,
    })
    expect(received.length).toBeLessThanOrEqual(CHAT_HISTORY_LIMIT)
  })

  test('a second turn replays prior history and appends to the same conversation', async () => {
    const user = await seedUserWithPlaybook()
    const first = await runChatTurn({
      userId: user.id,
      userMessage: 'first',
      provider: fixtureProvider(['one']),
    })
    if ('error' in first) throw new Error('first turn failed')
    const second = await runChatTurn({
      userId: user.id,
      conversationId: first.conversationId,
      userMessage: 'second',
      provider: fixtureProvider(['two']),
    })
    if ('error' in second) throw new Error('second turn failed')
    expect(second.conversationId).toBe(first.conversationId)
    const got = await getConversation(user.id, first.conversationId)
    if ('error' in got) throw new Error('refetch failed')
    expect(got.messages.map((m) => m.content)).toEqual(['first', 'one', 'second', 'two'])
  })
})

describe('ai-chat: crisis gate (LLM NEVER called)', () => {
  test('a crisis message returns resources + boundary and never calls the provider', async () => {
    const user = await createTestUser()
    let providerCalled = false
    const spyProvider: ChatProvider = () => {
      providerCalled = true
      return (async function* (): AsyncIterable<ChatChunk> {})()
    }
    const result = await runChatTurn({
      userId: user!.id,
      userMessage: 'I want to kill myself',
      provider: spyProvider,
    })
    if ('error' in result) throw new Error('crisis turn errored')
    expect(providerCalled).toBe(false)
    expect(result.crisis).toBe(true)
    expect(result.assistantText).toContain('988')
    // No ai_usage row — the LLM was never billed.
    const usage = await db.select().from(aiUsage).where(eq(aiUsage.userId, user!.id))
    expect(usage.length).toBe(0)
  })
})

describe('ai-chat: ownership (CONVERSATION_NOT_FOUND)', () => {
  test('a foreign conversation 404s on a chat turn', async () => {
    const owner = await createTestUser()
    const other = await createTestUser()
    const [conv] = await db
      .insert(conversations)
      .values({ userId: owner!.id, kind: 'chat' })
      .returning()
    const result = await runChatTurn({
      userId: other!.id,
      conversationId: conv!.id,
      userMessage: 'hi',
      provider: fixtureProvider(['x']),
    })
    expect(result).toEqual({ error: 'CONVERSATION_NOT_FOUND' })
  })

  test('getConversation 404s for a foreign/missing conversation', async () => {
    const owner = await createTestUser()
    const other = await createTestUser()
    const [conv] = await db
      .insert(conversations)
      .values({ userId: owner!.id, kind: 'chat' })
      .returning()
    expect(await getConversation(other!.id, conv!.id)).toEqual({ error: 'CONVERSATION_NOT_FOUND' })
  })

  test('listConversations returns only the user own chats, newest first', async () => {
    const user = await createTestUser()
    await db.insert(conversations).values([
      { userId: user!.id, kind: 'chat', title: 'older' },
      { userId: user!.id, kind: 'interview', title: 'an interview, excluded' },
    ])
    const result = await listConversations(user!.id)
    expect(result.conversations.length).toBe(1)
    expect(result.conversations[0]?.title).toBe('older')
    expect(result.notTherapy.toLowerCase()).toContain('not therapy')
  })
})
