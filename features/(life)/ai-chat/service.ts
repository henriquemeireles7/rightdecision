import { and, asc, desc, eq } from 'drizzle-orm'
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

/** A chat() provider — the live one OR an injected fixture AsyncIterable (tests). */
export type ChatProvider = (params: ChatParams) => AsyncIterable<ChatChunk>

/**
 * Per-request context assembly (ADR 9): the user's STRUCTURED TYPED ROWS — playbook answers,
 * journal entries, recent decisions, interview distillations — formatted into a system prompt.
 * NO vector DB, NO embeddings: a user's playbook fits in a prompt and is debuggable.
 *
 * The assembled string is asserted on in tests (it must reference the user's actual data).
 */
export async function assembleContext(userId: string): Promise<string> {
  // ── Playbook answers (the core "typed rows", with their field labels) ──
  const answerRows = await db
    .select({
      fieldId: documentAnswers.fieldId,
      value: documentAnswers.value,
      schema: documentTemplates.schema,
      templateTitle: documentTemplates.title,
    })
    .from(documentAnswers)
    .innerJoin(documents, eq(documents.id, documentAnswers.documentId))
    .innerJoin(documentTemplates, eq(documentTemplates.id, documents.templateId))
    .where(eq(documents.userId, userId))

  const playbookLines: string[] = []
  for (const row of answerRows) {
    const fields = collectFields(row.schema)
    const label = fields.find((f) => f.id === row.fieldId)?.label ?? row.fieldId
    playbookLines.push(`- ${label}: ${row.value}`)
  }

  // ── Journal entries (most recent first, bounded) ──
  const journalRows = await db
    .select({
      entryDate: journalEntries.entryDate,
      kind: journalEntries.kind,
      content: journalEntries.content,
    })
    .from(journalEntries)
    .where(eq(journalEntries.userId, userId))
    .orderBy(desc(journalEntries.entryDate))
    .limit(14)
  const journalLines = journalRows.map((row) => `- ${row.entryDate} (${row.kind}): ${row.content}`)

  // ── Decisions made (the Decision Graph — counts, no PII text) ──
  const decisionRows = await db
    .select({ name: events.name, occurredAt: events.occurredAt })
    .from(events)
    .where(and(eq(events.userId, userId), eq(events.isDecision, true)))
    .orderBy(desc(events.occurredAt))
    .limit(20)
  const decisionsLine =
    decisionRows.length > 0
      ? `She has made ${decisionRows.length} tracked decisions recently.`
      : 'She has not logged a tracked decision yet.'

  // ── Interview distillations (confirmed-or-not proposed fields) ──
  const interviewRows = await db
    .select({ distilledFields: interviews.distilledFields })
    .from(interviews)
    .where(eq(interviews.userId, userId))
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

/** Past messages of a conversation, oldest first — replayed into the provider as history. */
async function conversationHistory(conversationId: string): Promise<ChatMessage[]> {
  const rows = await db
    .select({ role: conversationMessages.role, content: conversationMessages.content })
    .from(conversationMessages)
    .where(eq(conversationMessages.conversationId, conversationId))
    .orderBy(asc(conversationMessages.createdAt))
  return rows.map((row) => ({ role: row.role, content: row.content }))
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
    for await (const chunk of provider({ kind: 'chat', system, messages: history })) {
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

/** A single conversation with its full message history — the refetch-on-drop read path. */
export async function getConversation(userId: string, conversationId: string) {
  const conversation = await findOwnedConversation(userId, conversationId)
  if (!conversation) return { error: 'CONVERSATION_NOT_FOUND' } satisfies ServiceError

  const messages = await db
    .select({
      id: conversationMessages.id,
      role: conversationMessages.role,
      content: conversationMessages.content,
      createdAt: conversationMessages.createdAt,
    })
    .from(conversationMessages)
    .where(eq(conversationMessages.conversationId, conversationId))
    .orderBy(asc(conversationMessages.createdAt))

  return {
    conversation: { id: conversation.id, kind: conversation.kind, title: conversation.title },
    messages,
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
