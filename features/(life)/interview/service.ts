import { and, asc, eq } from 'drizzle-orm'
import { writeUsage } from '@/features/(life)/ai-chat/budget'
import { db } from '@/platform/db/client'
import {
  conversationMessages,
  conversations,
  documentAnswers,
  documents,
  documentTemplates,
  interviews,
} from '@/platform/db/schema'
import type { ErrorCode } from '@/platform/errors'
import { record } from '@/platform/events'
import { fieldIdsForVersion } from '@/platform/templates'
import type { ChatMessage } from '@/providers/ai'
import { distill } from '@/providers/ai'

type ServiceError = { error: ErrorCode; details?: string }

/** A distill() provider — the live one OR an injected fixture (tests). */
export type DistillProvider = typeof distill

type InterviewStatus = (typeof interviews.$inferSelect)['status']

/**
 * The interview state machine (ADR 11):
 *   active → distilling → awaiting_confirmation → confirmed | abandoned
 * Any transition not listed here is rejected with INTERVIEW_INVALID_STATE (409).
 */
const ALLOWED: Record<InterviewStatus, InterviewStatus[]> = {
  active: ['distilling', 'abandoned'],
  distilling: ['awaiting_confirmation', 'abandoned'],
  awaiting_confirmation: ['confirmed', 'abandoned'],
  confirmed: [],
  abandoned: [],
}

function canTransition(from: InterviewStatus, to: InterviewStatus): boolean {
  return ALLOWED[from].includes(to)
}

async function findOwnedInterview(userId: string, interviewId: string) {
  const [row] = await db
    .select()
    .from(interviews)
    .where(and(eq(interviews.id, interviewId), eq(interviews.userId, userId)))
    .limit(1)
  return row ?? null
}

export type StartInterviewInput = { userId: string; documentId: string; pageId: string }

/**
 * Start a page-scoped interview: a conversation (kind='interview') + an interview row in
 * `active`. Ownership of the document is enforced. Records `interview_started`.
 */
export async function startInterview(input: StartInterviewInput) {
  const { userId, documentId, pageId } = input
  const [doc] = await db
    .select({ id: documents.id })
    .from(documents)
    .where(and(eq(documents.id, documentId), eq(documents.userId, userId)))
    .limit(1)
  if (!doc) return { error: 'DOCUMENT_NOT_FOUND' } satisfies ServiceError

  return db.transaction(async (tx) => {
    const [conversation] = await tx
      .insert(conversations)
      .values({ userId, kind: 'interview' })
      .returning({ id: conversations.id })
    const [interview] = await tx
      .insert(interviews)
      .values({
        userId,
        documentId,
        pageId,
        conversationId: conversation?.id,
        status: 'active',
      })
      .returning()
    await record(
      { name: 'interview_started', properties: { interviewId: interview?.id as string }, userId },
      tx,
    )
    return { interview, conversationId: conversation?.id }
  })
}

/** Append a Q&A turn to the interview's conversation (kind='interview', SMALL model upstream). */
export async function appendInterviewMessage(
  userId: string,
  interviewId: string,
  role: 'user' | 'assistant',
  content: string,
) {
  const interview = await findOwnedInterview(userId, interviewId)
  if (!interview) return { error: 'INTERVIEW_INVALID_STATE' } satisfies ServiceError
  if (interview.status !== 'active')
    return { error: 'INTERVIEW_INVALID_STATE' } satisfies ServiceError
  if (!interview.conversationId) return { error: 'INTERVIEW_INVALID_STATE' } satisfies ServiceError
  await db
    .insert(conversationMessages)
    .values({ conversationId: interview.conversationId, role, content })
  return { ok: true as const }
}

/** The page's valid field ids (pinned templateVersion view) — distilled keys filter against these. */
async function validFieldIds(documentId: string): Promise<Set<string>> {
  const [row] = await db
    .select({ schema: documentTemplates.schema, version: documents.templateVersion })
    .from(documents)
    .innerJoin(documentTemplates, eq(documentTemplates.id, documents.templateId))
    .where(eq(documents.id, documentId))
    .limit(1)
  if (!row) return new Set()
  return fieldIdsForVersion(row.schema, row.version)
}

export type DistillDeps = { distill?: DistillProvider }

/**
 * active → distilling → awaiting_confirmation. Runs the distill provider over the interview
 * transcript, FILTERS distilled keys to the page's valid fieldIds (pinned version), writes
 * them to interviews.distilledFields (NOT to document_answers — nothing is filled before
 * confirmation, ADR 11), meters one ai_usage row (kind='distill'), records `interview_distilled`.
 */
export async function distillInterview(
  userId: string,
  interviewId: string,
  system: string,
  deps: DistillDeps = {},
) {
  const distillFn = deps.distill ?? distill
  const interview = await findOwnedInterview(userId, interviewId)
  if (!interview) return { error: 'INTERVIEW_INVALID_STATE' } satisfies ServiceError
  if (!canTransition(interview.status, 'distilling')) {
    return {
      error: 'INTERVIEW_INVALID_STATE',
      details: `cannot distill from "${interview.status}"`,
    } satisfies ServiceError
  }

  // Mark distilling, then run the provider (a long call) outside the lock.
  await db
    .update(interviews)
    .set({ status: 'distilling', updatedAt: new Date() })
    .where(eq(interviews.id, interviewId))

  const transcript: ChatMessage[] = interview.conversationId
    ? (
        await db
          .select({ role: conversationMessages.role, content: conversationMessages.content })
          .from(conversationMessages)
          .where(eq(conversationMessages.conversationId, interview.conversationId))
          .orderBy(asc(conversationMessages.createdAt))
      ).map((r) => ({ role: r.role, content: r.content }))
    : []

  const result = await distillFn(system, transcript)

  // Keep only keys that are valid fields of the page's pinned version.
  const allowed = await validFieldIds(interview.documentId)
  const filtered: Record<string, string> = {}
  for (const [key, value] of Object.entries(result.fields)) {
    if (allowed.has(key)) filtered[key] = value
  }

  return db.transaction(async (tx) => {
    await tx
      .update(interviews)
      .set({
        status: 'awaiting_confirmation',
        distilledFields: filtered,
        updatedAt: new Date(),
      })
      .where(eq(interviews.id, interviewId))
    await writeUsage(tx, {
      userId,
      conversationId: interview.conversationId,
      kind: 'distill',
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
    })
    await record({ name: 'interview_distilled', properties: { interviewId }, userId }, tx)
    return { interviewId, status: 'awaiting_confirmation' as const, distilledFields: filtered }
  })
}

/**
 * awaiting_confirmation → confirmed (the ADR 11 trust write). Writes ONLY the field ids the
 * user explicitly accepted to document_answers with source='interview' + confirmedAt=now —
 * a field is NEVER filled before the user accepts. Unaccepted distilled fields are dropped.
 * One transaction: answer upserts + status→confirmed + `interview_confirmed`.
 */
export async function confirmInterview(
  userId: string,
  interviewId: string,
  acceptedFieldIds: string[],
) {
  const interview = await findOwnedInterview(userId, interviewId)
  if (!interview) return { error: 'INTERVIEW_INVALID_STATE' } satisfies ServiceError
  if (!canTransition(interview.status, 'confirmed')) {
    return {
      error: 'INTERVIEW_INVALID_STATE',
      details: `cannot confirm from "${interview.status}"`,
    } satisfies ServiceError
  }

  const distilled = interview.distilledFields ?? {}
  // Only accept fields that were actually distilled (never fabricate a value).
  const toWrite = acceptedFieldIds.filter((id) => id in distilled)

  return db.transaction(async (tx) => {
    const now = new Date()
    for (const fieldId of toWrite) {
      await tx
        .insert(documentAnswers)
        .values({
          documentId: interview.documentId,
          fieldId,
          value: distilled[fieldId] as string,
          source: 'interview',
          confirmedAt: now,
        })
        .onConflictDoUpdate({
          target: [documentAnswers.documentId, documentAnswers.fieldId],
          set: {
            value: distilled[fieldId] as string,
            source: 'interview',
            confirmedAt: now,
            updatedAt: now,
          },
        })
    }
    await tx
      .update(interviews)
      .set({ status: 'confirmed', updatedAt: now })
      .where(eq(interviews.id, interviewId))
    await record({ name: 'interview_confirmed', properties: { interviewId }, userId }, tx)
    return { interviewId, status: 'confirmed' as const, confirmedFieldIds: toWrite }
  })
}

/** Any non-terminal state → abandoned (the user backed out). */
export async function abandonInterview(userId: string, interviewId: string) {
  const interview = await findOwnedInterview(userId, interviewId)
  if (!interview) return { error: 'INTERVIEW_INVALID_STATE' } satisfies ServiceError
  if (!canTransition(interview.status, 'abandoned')) {
    return {
      error: 'INTERVIEW_INVALID_STATE',
      details: `cannot abandon from "${interview.status}"`,
    } satisfies ServiceError
  }
  await db
    .update(interviews)
    .set({ status: 'abandoned', updatedAt: new Date() })
    .where(eq(interviews.id, interviewId))
  return { interviewId, status: 'abandoned' as const }
}

/** The interview + its proposed (unconfirmed) fields — the confirm-UI read path. */
export async function getInterview(userId: string, interviewId: string) {
  const interview = await findOwnedInterview(userId, interviewId)
  if (!interview) return { error: 'INTERVIEW_INVALID_STATE' } satisfies ServiceError
  const messages = interview.conversationId
    ? await db
        .select({ role: conversationMessages.role, content: conversationMessages.content })
        .from(conversationMessages)
        .where(eq(conversationMessages.conversationId, interview.conversationId))
        .orderBy(asc(conversationMessages.createdAt))
    : []
  return {
    interview: {
      id: interview.id,
      status: interview.status,
      pageId: interview.pageId,
      documentId: interview.documentId,
      distilledFields: interview.distilledFields ?? {},
    },
    messages,
  }
}
