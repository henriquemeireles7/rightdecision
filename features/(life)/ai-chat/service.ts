import { and, desc, eq, lt } from 'drizzle-orm'
import { db } from '@/platform/db/client'
import {
  conversationMessages,
  conversations,
  documentAnswers,
  documents,
  documentTemplates,
  events,
  interviews,
  journalEntries,
} from '@/platform/db/schema'
import type { ErrorCode } from '@/platform/errors'
import { record } from '@/platform/events'
import { collectFields } from '@/platform/templates'
import type { AiKind, ChatChunk, ChatMessage, ChatParams } from '@/providers/ai'
import { writeUsage } from './budget'
import { CRISIS_RESPONSE, classifyCrisis, NOT_THERAPY_LINE, SAFETY_SYSTEM_PROMPT } from './safety'

type ServiceError = { error: ErrorCode; details?: string }

/**
 * The newest N messages replayed into the LLM prompt every turn. Unbounded replay grows the
 * prompt (and token cost) without limit on long conversations — bound it to the recent window.
 */
export const CHAT_HISTORY_LIMIT = 40

/** Default page size for getConversation's message read (the refetch-on-drop path). */
export const CONVERSATION_MESSAGES_LIMIT = 200

/**
 * Idle watchdog for iterating the chat provider: if no chunk arrives within this window the turn
 * is treated as a drop (nothing persisted). Guards the SSE hot path against a hung provider —
 * the live provider also self-aborts (providers/ai.ts), this is the feature-layer backstop and
 * the seam tests exercise it with a never-yielding fixture.
 */
export const CHAT_TURN_IDLE_TIMEOUT_MS = 30_000

/** A chat() provider — the live one OR an injected fixture AsyncIterable (tests). */
export type ChatProvider = (params: ChatParams) => AsyncIterable<ChatChunk>

/**
 * Wrap a chunk stream with a per-chunk idle timeout. If no chunk arrives within `idleMs` the
 * iterator throws — runChatTurn's catch then maps it to dropped:true (nothing persisted). This is
 * the feature-layer backstop against a hung provider (the live provider self-aborts too).
 */
async function* withIdleTimeout<T>(source: AsyncIterable<T>, idleMs: number): AsyncIterable<T> {
  const iterator = source[Symbol.asyncIterator]()
  while (true) {
    let timer: ReturnType<typeof setTimeout> | undefined
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('AI chat stream idle timeout')), idleMs)
    })
    try {
      const next = await Promise.race([iterator.next(), timeout])
      if (next.done) return
      yield next.value
    } catch (error) {
      // On idle timeout, ask the underlying iterator to wind down but NEVER await it — a hung
      // provider's return() can itself hang (it resumes a generator stuck on a pending await).
      void iterator.return?.()
      throw error
    } finally {
      if (timer) clearTimeout(timer)
    }
  }
}

/**
 * Per-request context assembly (ADR 9): the user's STRUCTURED TYPED ROWS — playbook answers,
 * journal entries, recent decisions, interview distillations — formatted into a system prompt.
 * NO vector DB, NO embeddings: a user's playbook fits in a prompt and is debuggable.
 *
 * The assembled string is asserted on in tests (it must reference the user's actual data).
 */
export async function assembleContext(userId: string): Promise<string> {
  // These four reads are independent — run them concurrently (P0: this is the chat hot path,
  // serial awaits added avoidable latency to every turn).
  const [answerRows, journalRows, decisionRows, interviewRows] = await Promise.all([
    // ── Playbook answers (the core "typed rows", with their field labels) ──
    db
      .select({
        fieldId: documentAnswers.fieldId,
        value: documentAnswers.value,
        schema: documentTemplates.schema,
        templateTitle: documentTemplates.title,
      })
      .from(documentAnswers)
      .innerJoin(documents, eq(documents.id, documentAnswers.documentId))
      .innerJoin(documentTemplates, eq(documentTemplates.id, documents.templateId))
      .where(eq(documents.userId, userId)),
    // ── Journal entries (most recent first, bounded) ──
    db
      .select({
        entryDate: journalEntries.entryDate,
        kind: journalEntries.kind,
        content: journalEntries.content,
      })
      .from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .orderBy(desc(journalEntries.entryDate))
      .limit(14),
    // ── Decisions made (the Decision Graph — counts, no PII text) ──
    db
      .select({ name: events.name, occurredAt: events.occurredAt })
      .from(events)
      .where(and(eq(events.userId, userId), eq(events.isDecision, true)))
      .orderBy(desc(events.occurredAt))
      .limit(20),
    // ── Interview distillations (confirmed-or-not proposed fields) ──
    db
      .select({ distilledFields: interviews.distilledFields })
      .from(interviews)
      .where(eq(interviews.userId, userId)),
  ])

  const playbookLines: string[] = []
  for (const row of answerRows) {
    const fields = collectFields(row.schema)
    const label = fields.find((f) => f.id === row.fieldId)?.label ?? row.fieldId
    playbookLines.push(`- ${label}: ${row.value}`)
  }

  const journalLines = journalRows.map((row) => `- ${row.entryDate} (${row.kind}): ${row.content}`)

  const decisionsLine =
    decisionRows.length > 0
      ? `She has made ${decisionRows.length} tracked decisions recently.`
      : 'She has not logged a tracked decision yet.'

  const distillLines: string[] = []
  for (const row of interviewRows) {
    for (const [key, value] of Object.entries(row.distilledFields ?? {})) {
      distillLines.push(`- ${key}: ${value}`)
    }
  }

  const sections = [
    SAFETY_SYSTEM_PROMPT,
    '',
    'Here is what she has written in her playbook and journal. Talk like you have read it — reference the specifics, do not summarize them back at her.',
    '',
    playbookLines.length > 0
      ? `Her playbook:\n${playbookLines.join('\n')}`
      : 'Her playbook is still empty.',
    '',
    journalLines.length > 0 ? `Her recent journal:\n${journalLines.join('\n')}` : '',
    '',
    decisionsLine,
    '',
    distillLines.length > 0 ? `From her interviews:\n${distillLines.join('\n')}` : '',
  ]
  return sections.filter((s) => s !== '').join('\n')
}

/** A conversation row owned by this user, or null (foreign/missing → CONVERSATION_NOT_FOUND). */
async function findOwnedConversation(userId: string, conversationId: string) {
  const [row] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)))
    .limit(1)
  return row ?? null
}

/**
 * The most recent CHAT_HISTORY_LIMIT messages of a conversation, oldest-first — replayed into the
 * provider as history. Bounded so a long conversation can't grow the prompt (and token cost)
 * without limit: select newest-first with a LIMIT, then reverse into chronological order.
 */
async function conversationHistory(conversationId: string): Promise<ChatMessage[]> {
  const rows = await db
    .select({ role: conversationMessages.role, content: conversationMessages.content })
    .from(conversationMessages)
    .where(eq(conversationMessages.conversationId, conversationId))
    .orderBy(desc(conversationMessages.createdAt))
    .limit(CHAT_HISTORY_LIMIT)
  return rows.reverse().map((row) => ({ role: row.role, content: row.content }))
}

export type RunChatTurnInput = {
  userId: string
  /** Existing conversation; omit to start a new one. */
  conversationId?: string
  userMessage: string
  /** The chat() provider — fixture AsyncIterable in tests, live in prod. */
  provider: ChatProvider
  /** Called for each streamed text chunk (the route pipes these to streamSSE). */
  onChunk?: (text: string) => void | Promise<void>
  /** Per-chunk idle timeout. TESTS ONLY override it; production uses CHAT_TURN_IDLE_TIMEOUT_MS. */
  idleTimeoutMs?: number
}

export type RunChatTurnResult = {
  conversationId: string
  /** The full assistant text (also persisted) — empty when crisis/dropped. */
  assistantText: string
  /** A crisis turn: referral + boundary returned, LLM NEVER called. */
  crisis: boolean
  /** The stream dropped mid-flight: NOTHING persisted; client must refetch + retry. */
  dropped: boolean
}

/**
 * A chat turn — the PURE persist-on-completion core of the SSE seam (DX Convention 4 +
 * eng-schema S3). It:
 *   1. ensures an owned conversation + persists the USER message,
 *   2. crisis-gates: on a crisis signal, persists + streams CRISIS_RESPONSE, NEVER calls the LLM,
 *   3. otherwise assembles context, iterates the injected provider, accumulates text + usage,
 *   4. on COMPLETION: persists the assistant message + the ai_usage row + records the event,
 *   5. on DROP (provider throws): persists NOTHING for the assistant turn — the user message
 *      stays, the client refetches the conversation and retries (the dropped turn left no
 *      partial assistant row).
 *
 * The Hono route only pipes chunks; all of this lives here so it is testable with a fixture
 * provider and no socket.
 */
export async function runChatTurn(
  input: RunChatTurnInput,
): Promise<RunChatTurnResult | ServiceError> {
  const { userId, userMessage, provider, onChunk } = input

  // Resolve / create the conversation (ownership enforced for existing ones).
  let conversationId = input.conversationId
  if (conversationId) {
    const existing = await findOwnedConversation(userId, conversationId)
    if (!existing) return { error: 'CONVERSATION_NOT_FOUND' }
  } else {
    const [created] = await db
      .insert(conversations)
      .values({ userId, kind: 'chat' })
      .returning({ id: conversations.id })
    conversationId = created?.id as string
  }

  // Persist the user message immediately (it survives a later assistant-stream drop).
  await db
    .insert(conversationMessages)
    .values({ conversationId, role: 'user', content: userMessage })

  // ── Crisis gate: referral + boundary, the LLM is NEVER called ──
  if (classifyCrisis(userMessage)) {
    for (const line of CRISIS_RESPONSE.split('\n')) await onChunk?.(`${line}\n`)
    await db
      .insert(conversationMessages)
      .values({ conversationId, role: 'assistant', content: CRISIS_RESPONSE })
    return { conversationId, assistantText: CRISIS_RESPONSE, crisis: true, dropped: false }
  }

  // ── Normal turn: assemble context, iterate the provider, accumulate ──
  const system = await assembleContext(userId)
  const history = await conversationHistory(conversationId)

  let accumulated = ''
  let usage = { inputTokens: 0, outputTokens: 0, model: '' as string }
  let completed = false

  try {
    const stream = withIdleTimeout(
      provider({ kind: 'chat', system, messages: history }),
      input.idleTimeoutMs ?? CHAT_TURN_IDLE_TIMEOUT_MS,
    )
    for await (const chunk of stream) {
      if (chunk.type === 'text') {
        accumulated += chunk.text
        await onChunk?.(chunk.text)
      } else {
        usage = {
          inputTokens: chunk.inputTokens,
          outputTokens: chunk.outputTokens,
          model: chunk.model,
        }
        completed = true
      }
    }
  } catch {
    // Stream dropped (deploy severed the socket). Persist NOTHING for the assistant turn.
    return { conversationId, assistantText: '', crisis: false, dropped: true }
  }

  if (!completed) {
    // No terminal frame = an incomplete stream; treat as a drop (nothing persisted).
    return { conversationId, assistantText: '', crisis: false, dropped: true }
  }

  // ── Completion: assistant message + usage row + event, in one transaction ──
  await db.transaction(async (tx) => {
    const [message] = await tx
      .insert(conversationMessages)
      .values({ conversationId: conversationId as string, role: 'assistant', content: accumulated })
      .returning({ id: conversationMessages.id })
    await writeUsage(tx, {
      userId,
      conversationId: conversationId as string,
      messageId: message?.id,
      kind: 'chat',
      model: usage.model,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
    })
    await record(
      {
        name: 'chat_message_sent',
        properties: { conversationId: conversationId as string },
        userId,
      },
      tx,
    )
  })

  return { conversationId, assistantText: accumulated, crisis: false, dropped: false }
}

/**
 * A single conversation with its message history — the refetch-on-drop read path. Paginated:
 * returns the newest `limit` messages (oldest-first within the page); pass `before` (a createdAt
 * cursor) to page further back. `hasMore` signals older messages remain. Bounded so a long
 * conversation never SELECTs an unbounded row set.
 */
export async function getConversation(
  userId: string,
  conversationId: string,
  opts: { limit?: number; before?: Date } = {},
) {
  const conversation = await findOwnedConversation(userId, conversationId)
  if (!conversation) return { error: 'CONVERSATION_NOT_FOUND' } satisfies ServiceError

  const limit = Math.min(opts.limit ?? CONVERSATION_MESSAGES_LIMIT, CONVERSATION_MESSAGES_LIMIT)

  // Fetch one extra to detect whether older messages remain (hasMore), newest-first + LIMIT.
  const newestFirst = await db
    .select({
      id: conversationMessages.id,
      role: conversationMessages.role,
      content: conversationMessages.content,
      createdAt: conversationMessages.createdAt,
    })
    .from(conversationMessages)
    .where(
      opts.before
        ? and(
            eq(conversationMessages.conversationId, conversationId),
            lt(conversationMessages.createdAt, opts.before),
          )
        : eq(conversationMessages.conversationId, conversationId),
    )
    .orderBy(desc(conversationMessages.createdAt))
    .limit(limit + 1)

  const hasMore = newestFirst.length > limit
  const page = hasMore ? newestFirst.slice(0, limit) : newestFirst
  const messages = page.reverse()

  return {
    conversation: { id: conversation.id, kind: conversation.kind, title: conversation.title },
    messages,
    hasMore,
    notTherapy: NOT_THERAPY_LINE,
  }
}

/** The user's chat conversations (newest first) — the chat list / resume surface. */
export async function listConversations(userId: string) {
  const rows = await db
    .select({
      id: conversations.id,
      title: conversations.title,
      updatedAt: conversations.updatedAt,
    })
    .from(conversations)
    .where(and(eq(conversations.userId, userId), eq(conversations.kind, 'chat')))
    .orderBy(desc(conversations.updatedAt))
  return { conversations: rows, notTherapy: NOT_THERAPY_LINE }
}

/** Re-exported so the budget module's kind enum stays the single source. */
export type { AiKind }
