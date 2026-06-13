import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { eq } from 'drizzle-orm'
import { enforceAiBudget } from '@/features/(life)/ai-chat/budget'
import { db } from '@/platform/db/client'
import { documentAnswers, documents } from '@/platform/db/schema'
import {
  createTestDocumentTemplate,
  createTestProgram,
  createTestUser,
} from '@/platform/test/factories'
import { apiCall, assertError, assertSuccess, stubAuth } from '@/platform/test/helpers'
import { setupTestDb, teardownTestDb } from '@/platform/test/setup'
import type { DistillResult } from '@/providers/ai'
import { createInterviewRoutes } from './routes'

beforeAll(setupTestDb)
afterAll(teardownTestDb)

const fixtureDistill = async (): Promise<DistillResult> => ({
  fields: { 'f-required': 'Open my own studio' },
  inputTokens: 30,
  outputTokens: 10,
  model: 'fixture-small',
})

async function seed() {
  const program = (await createTestProgram())!
  const template = (await createTestDocumentTemplate(program.id))!
  const user = await createTestUser()
  const [doc] = await db
    .insert(documents)
    .values({ userId: user!.id, templateId: template.id, templateVersion: 1, status: 'empty' })
    .returning()
  const app = createInterviewRoutes({
    auth: stubAuth(user!),
    budget: enforceAiBudget(),
    distill: fixtureDistill,
  })
  return { user: user!, documentId: doc!.id, app }
}

describe('interview routes: the ADR 11 trust flow', () => {
  test('start → distill → confirm fills the page field only AFTER confirmation', async () => {
    const { documentId, app } = await seed()

    const startRes = await apiCall(app, 'POST', '/', { documentId, pageId: 'pg-1' })
    const started = assertSuccess(startRes) as { interview: { id: string } }
    const id = started.interview.id

    const distillRes = await apiCall(app, 'POST', `/${id}/distill`)
    const distilled = assertSuccess(distillRes) as {
      status: string
      distilledFields: Record<string, string>
    }
    expect(distilled.status).toBe('awaiting_confirmation')
    expect(distilled.distilledFields['f-required']).toBe('Open my own studio')

    // Not filled yet.
    let answers = await db
      .select()
      .from(documentAnswers)
      .where(eq(documentAnswers.documentId, documentId))
    expect(answers.length).toBe(0)

    const confirmRes = await apiCall(app, 'POST', `/${id}/confirm`, {
      acceptedFieldIds: ['f-required'],
    })
    assertSuccess(confirmRes)

    answers = await db
      .select()
      .from(documentAnswers)
      .where(eq(documentAnswers.documentId, documentId))
    expect(answers.length).toBe(1)
    expect(answers[0]?.source).toBe('interview')
    expect(answers[0]?.confirmedAt).not.toBeNull()
  })

  test('confirming before distilling is INTERVIEW_INVALID_STATE (409)', async () => {
    const { documentId, app } = await seed()
    const startRes = await apiCall(app, 'POST', '/', { documentId, pageId: 'pg-1' })
    const started = assertSuccess(startRes) as { interview: { id: string } }
    const confirmRes = await apiCall(app, 'POST', `/${started.interview.id}/confirm`, {
      acceptedFieldIds: ['f-required'],
    })
    assertError(confirmRes, 'INTERVIEW_INVALID_STATE')
  })

  test('GET /:interviewId returns proposed fields for the confirm UI', async () => {
    const fresh = await seed()
    const s = assertSuccess(
      await apiCall(fresh.app, 'POST', '/', { documentId: fresh.documentId, pageId: 'pg-1' }),
    ) as { interview: { id: string } }
    await apiCall(fresh.app, 'POST', `/${s.interview.id}/distill`)
    const getRes = await apiCall(fresh.app, 'GET', `/${s.interview.id}`)
    const got = assertSuccess(getRes) as {
      interview: { status: string; distilledFields: Record<string, string> }
    }
    expect(got.interview.status).toBe('awaiting_confirmation')
    expect(got.interview.distilledFields['f-required']).toBe('Open my own studio')
  })
})
