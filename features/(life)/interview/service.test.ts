import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { and, eq } from 'drizzle-orm'
import { db } from '@/platform/db/client'
import { aiUsage, documentAnswers, documents, events } from '@/platform/db/schema'
import {
  createTestDocumentTemplate,
  createTestProgram,
  createTestUser,
} from '@/platform/test/factories'
import { setupTestDb, teardownTestDb } from '@/platform/test/setup'
import type { DistillResult } from '@/providers/ai'
import {
  abandonInterview,
  appendInterviewMessage,
  confirmInterview,
  type DistillProvider,
  distillInterview,
  getInterview,
  startInterview,
} from './service'

beforeAll(setupTestDb)
afterAll(teardownTestDb)

/** A fixture distill provider: returns the given fields + usage (no network). */
function fixtureDistill(
  fields: Record<string, string>,
  usage = { inputTokens: 60, outputTokens: 20 },
): DistillProvider {
  return async (): Promise<DistillResult> => ({ fields, ...usage, model: 'fixture-small' })
}

async function seedDocument() {
  const program = (await createTestProgram())!
  const template = (await createTestDocumentTemplate(program.id))!
  const user = await createTestUser()
  const [doc] = await db
    .insert(documents)
    .values({ userId: user!.id, templateId: template.id, templateVersion: 1, status: 'empty' })
    .returning()
  // template fields: 'f-required', 'f-optional'
  return { user: user!, documentId: doc!.id }
}

describe('interview: state machine (ADR 11)', () => {
  test('start creates an interview in active + an interview conversation + records the event', async () => {
    const { user, documentId } = await seedDocument()
    const started = await startInterview({ userId: user.id, documentId, pageId: 'pg-1' })
    if ('error' in started) throw new Error('start failed')
    expect(started.interview?.status).toBe('active')
    expect(started.conversationId).toBeTruthy()
    const evts = await db
      .select()
      .from(events)
      .where(and(eq(events.userId, user.id), eq(events.name, 'interview_started')))
    expect(evts.length).toBeGreaterThanOrEqual(1)
  })

  test('start on a FOREIGN document is DOCUMENT_NOT_FOUND', async () => {
    const owner = await seedDocument()
    const intruder = await createTestUser()
    const result = await startInterview({
      userId: intruder!.id,
      documentId: owner.documentId,
      pageId: 'pg-1',
    })
    expect('error' in result && result.error).toBe('DOCUMENT_NOT_FOUND')
  })

  test('full happy path active → distilling → awaiting_confirmation → confirmed', async () => {
    const { user, documentId } = await seedDocument()
    const started = await startInterview({ userId: user.id, documentId, pageId: 'pg-1' })
    if ('error' in started) throw new Error('start failed')
    const id = started.interview!.id

    await appendInterviewMessage(user.id, id, 'assistant', 'What is the decision?')
    await appendInterviewMessage(user.id, id, 'user', 'Open my own studio')

    const distilled = await distillInterview(user.id, id, 'system', {
      distill: fixtureDistill({ 'f-required': 'Open my own studio' }),
    })
    if ('error' in distilled) throw new Error('distill failed')
    expect(distilled.status).toBe('awaiting_confirmation')
    expect(distilled.distilledFields).toEqual({ 'f-required': 'Open my own studio' })

    // Distillation must NOT have written a document_answer yet (nothing before confirmation).
    const beforeConfirm = await db
      .select()
      .from(documentAnswers)
      .where(eq(documentAnswers.documentId, documentId))
    expect(beforeConfirm.length).toBe(0)

    const confirmed = await confirmInterview(user.id, id, ['f-required'])
    if ('error' in confirmed) throw new Error('confirm failed')
    expect(confirmed.status).toBe('confirmed')

    const answers = await db
      .select()
      .from(documentAnswers)
      .where(eq(documentAnswers.documentId, documentId))
    expect(answers.length).toBe(1)
    expect(answers[0]?.fieldId).toBe('f-required')
    expect(answers[0]?.value).toBe('Open my own studio')
    expect(answers[0]?.source).toBe('interview')
    expect(answers[0]?.confirmedAt).not.toBeNull()
  })

  test('distillation meters a kind=distill ai_usage row', async () => {
    const { user, documentId } = await seedDocument()
    void documentId
    const started = await startInterview({ userId: user.id, documentId, pageId: 'pg-1' })
    if ('error' in started) throw new Error('start failed')
    await distillInterview(user.id, started.interview!.id, 'sys', {
      distill: fixtureDistill({ 'f-required': 'x' }, { inputTokens: 7, outputTokens: 3 }),
    })
    const usage = await db
      .select()
      .from(aiUsage)
      .where(and(eq(aiUsage.userId, user.id), eq(aiUsage.kind, 'distill')))
    expect(usage.length).toBe(1)
    expect(usage[0]?.inputTokens).toBe(7)
  })

  test('distillation DROPS keys that are not valid fields of the pinned version', async () => {
    const { user, documentId } = await seedDocument()
    const started = await startInterview({ userId: user.id, documentId, pageId: 'pg-1' })
    if ('error' in started) throw new Error('start failed')
    const distilled = await distillInterview(user.id, started.interview!.id, 'sys', {
      distill: fixtureDistill({ 'f-required': 'kept', 'f-bogus': 'dropped' }),
    })
    if ('error' in distilled) throw new Error('distill failed')
    expect(distilled.distilledFields).toEqual({ 'f-required': 'kept' })
  })

  test('confirm writes ONLY the accepted fields — unaccepted distilled fields stay unwritten', async () => {
    const { user, documentId } = await seedDocument()
    const started = await startInterview({ userId: user.id, documentId, pageId: 'pg-1' })
    if ('error' in started) throw new Error('start failed')
    await distillInterview(user.id, started.interview!.id, 'sys', {
      distill: fixtureDistill({ 'f-required': 'accept me', 'f-optional': 'reject me' }),
    })
    const confirmed = await confirmInterview(user.id, started.interview!.id, ['f-required'])
    if ('error' in confirmed) throw new Error('confirm failed')
    expect(confirmed.confirmedFieldIds).toEqual(['f-required'])
    const answers = await db
      .select()
      .from(documentAnswers)
      .where(eq(documentAnswers.documentId, documentId))
    expect(answers.map((a) => a.fieldId)).toEqual(['f-required'])
  })
})

describe('interview: INVALID state transitions (INTERVIEW_INVALID_STATE 409)', () => {
  test('confirm from active (skipping distill) is rejected', async () => {
    const { user, documentId } = await seedDocument()
    const started = await startInterview({ userId: user.id, documentId, pageId: 'pg-1' })
    if ('error' in started) throw new Error('start failed')
    const result = await confirmInterview(user.id, started.interview!.id, ['f-required'])
    expect('error' in result && result.error).toBe('INTERVIEW_INVALID_STATE')
  })

  test('distilling twice (awaiting_confirmation → distilling) is rejected', async () => {
    const { user, documentId } = await seedDocument()
    const started = await startInterview({ userId: user.id, documentId, pageId: 'pg-1' })
    if ('error' in started) throw new Error('start failed')
    await distillInterview(user.id, started.interview!.id, 'sys', {
      distill: fixtureDistill({ 'f-required': 'x' }),
    })
    const again = await distillInterview(user.id, started.interview!.id, 'sys', {
      distill: fixtureDistill({ 'f-required': 'y' }),
    })
    expect('error' in again && again.error).toBe('INTERVIEW_INVALID_STATE')
  })

  test('confirm after confirm (terminal) is rejected', async () => {
    const { user, documentId } = await seedDocument()
    const started = await startInterview({ userId: user.id, documentId, pageId: 'pg-1' })
    if ('error' in started) throw new Error('start failed')
    await distillInterview(user.id, started.interview!.id, 'sys', {
      distill: fixtureDistill({ 'f-required': 'x' }),
    })
    await confirmInterview(user.id, started.interview!.id, ['f-required'])
    const again = await confirmInterview(user.id, started.interview!.id, ['f-required'])
    expect('error' in again && again.error).toBe('INTERVIEW_INVALID_STATE')
  })

  test('abandon from awaiting_confirmation is allowed; abandon after confirmed is rejected', async () => {
    const { user, documentId } = await seedDocument()
    const started = await startInterview({ userId: user.id, documentId, pageId: 'pg-1' })
    if ('error' in started) throw new Error('start failed')
    await distillInterview(user.id, started.interview!.id, 'sys', {
      distill: fixtureDistill({ 'f-required': 'x' }),
    })
    const abandoned = await abandonInterview(user.id, started.interview!.id)
    expect('error' in abandoned).toBe(false)

    // a fresh confirmed interview cannot be abandoned
    const s2 = await startInterview({ userId: user.id, documentId, pageId: 'pg-1' })
    if ('error' in s2) throw new Error('start failed')
    await distillInterview(user.id, s2.interview!.id, 'sys', {
      distill: fixtureDistill({ 'f-required': 'x' }),
    })
    await confirmInterview(user.id, s2.interview!.id, ['f-required'])
    const bad = await abandonInterview(user.id, s2.interview!.id)
    expect('error' in bad && bad.error).toBe('INTERVIEW_INVALID_STATE')
  })
})

describe('interview: ownership + read', () => {
  test('getInterview returns the proposed distilled fields for the confirm UI', async () => {
    const fresh = await seedDocument()
    const s = await startInterview({
      userId: fresh.user.id,
      documentId: fresh.documentId,
      pageId: 'pg-1',
    })
    if ('error' in s) throw new Error('start failed')
    await distillInterview(fresh.user.id, s.interview!.id, 'sys', {
      distill: fixtureDistill({ 'f-required': 'proposed' }),
    })
    const got = await getInterview(fresh.user.id, s.interview!.id)
    if ('error' in got) throw new Error('get failed')
    expect(got.interview.status).toBe('awaiting_confirmation')
    expect(got.interview.distilledFields).toEqual({ 'f-required': 'proposed' })
  })

  test('a foreign interview is INTERVIEW_INVALID_STATE (not enumerable)', async () => {
    const owner = await seedDocument()
    const started = await startInterview({
      userId: owner.user.id,
      documentId: owner.documentId,
      pageId: 'pg-1',
    })
    if ('error' in started) throw new Error('start failed')
    const intruder = await createTestUser()
    const result = await getInterview(intruder!.id, started.interview!.id)
    expect('error' in result && result.error).toBe('INTERVIEW_INVALID_STATE')
  })
})
