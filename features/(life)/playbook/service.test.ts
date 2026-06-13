import { afterAll, beforeEach, describe, expect, mock, test } from 'bun:test'
import { and, eq } from 'drizzle-orm'
import { documentAnswers, documents, documentTemplates, events } from '@/platform/db/schema'
import * as realEvents from '@/platform/events'
import {
  buildTestTemplateSchema,
  createTestDocumentTemplate,
  createTestEnrollment,
  createTestProgram,
  createTestUser,
} from '@/platform/test/factories'
import { setupTestDb, teardownTestDb, testDb } from '@/platform/test/setup'

// Controllable record(): real by default; the rollback test flips it to throw.
// Capture the original BEFORE mock.module — the namespace binding is live and
// would otherwise point back at the mock (infinite recursion).
const realRecord = realEvents.record
let failNextRecord = false
const recordMock = mock(
  async (event: Parameters<typeof realEvents.record>[0], tx?: realEvents.DbOrTx) => {
    if (failNextRecord) throw new Error('record exploded (rollback test)')
    return realRecord(event, tx)
  },
)
mock.module('@/platform/events', () => ({ ...realEvents, record: recordMock }))
afterAll(() => {
  mock.module('@/platform/events', () => realEvents)
})

const { getPage, getPlaybook, programIdForTemplate, saveAnswer } = await import('./service')

await setupTestDb()
afterAll(teardownTestDb)
beforeEach(() => {
  failNextRecord = false
})

async function enrolledUserWithTemplate() {
  const user = await createTestUser()
  const program = await createTestProgram()
  await createTestEnrollment(user!.id, program!.id)
  const template = await createTestDocumentTemplate(program!.id)
  return { user: user!, program: program!, template: template! }
}

async function eventsFor(userId: string, name: string) {
  return testDb
    .select()
    .from(events)
    .where(and(eq(events.userId, userId), eq(events.name, name)))
}

async function answersForUser(userId: string) {
  return testDb
    .select({ answer: documentAnswers })
    .from(documentAnswers)
    .innerJoin(documents, eq(documents.id, documentAnswers.documentId))
    .where(eq(documents.userId, userId))
}

describe('getPlaybook', () => {
  test('returns published templates for enrolled programs only', async () => {
    const { user, template, program } = await enrolledUserWithTemplate()
    // draft template in the same program: never served to members
    await createTestDocumentTemplate(program.id, { status: 'draft' })
    // published template in a program the user is NOT enrolled in
    const otherProgram = await createTestProgram()
    await createTestDocumentTemplate(otherProgram!.id)

    const { documents: docs } = await getPlaybook(user.id)

    expect(docs.map((d) => d.templateId)).toEqual([template.id])
  })

  test('lazily instantiates a document row pinning the template version', async () => {
    const { user, template } = await enrolledUserWithTemplate()
    await testDb
      .update(documentTemplates)
      .set({ version: 4 })
      .where(eq(documentTemplates.id, template.id))

    const { documents: docs } = await getPlaybook(user.id)

    expect(docs[0]?.document.templateVersion).toBe(4)
    expect(docs[0]?.document.status).toBe('empty')
    const rows = await testDb.select().from(documents).where(eq(documents.userId, user.id))
    expect(rows).toHaveLength(1)
    expect(rows[0]?.templateVersion).toBe(4)
  })

  test('lazy instantiation is idempotent — repeated reads create exactly one row', async () => {
    const { user } = await enrolledUserWithTemplate()

    await getPlaybook(user.id)
    await getPlaybook(user.id)
    await getPlaybook(user.id)

    const rows = await testDb.select().from(documents).where(eq(documents.userId, user.id))
    expect(rows).toHaveLength(1)
  })

  test('reading after a version bump never re-pins an existing document', async () => {
    const { user, template } = await enrolledUserWithTemplate()
    await getPlaybook(user.id) // pins v1
    await testDb
      .update(documentTemplates)
      .set({ version: 2 })
      .where(eq(documentTemplates.id, template.id))

    const { documents: docs } = await getPlaybook(user.id)

    expect(docs[0]?.document.templateVersion).toBe(1)
  })

  test('progress counts filled/total per page and chapter', async () => {
    const { user, template } = await enrolledUserWithTemplate()
    await saveAnswer(user.id, template.id, 'f-required', 'done')

    const { documents: docs } = await getPlaybook(user.id)

    const progress = docs[0]?.progress
    expect(progress).toEqual({
      filled: 1,
      total: 2,
      chapters: [
        {
          id: 'ch-1',
          title: 'Test Chapter',
          filled: 1,
          total: 2,
          pages: [{ id: 'pg-1', title: 'Test Page', filled: 1, total: 2 }],
        },
      ],
    })
  })
})

describe('template version pinning (publish v2 → v1 documents keep the v1 view)', () => {
  async function pinThenBump() {
    const fixture = await enrolledUserWithTemplate()
    await getPlaybook(fixture.user.id) // pin v1
    // Admin publishes v2: f-optional deprecated, f-v2-only added
    const schema = buildTestTemplateSchema()
    const page = schema.chapters[0]!.pages[0]!
    page.fields.find((f) => f.id === 'f-optional')!.deprecatedInVersion = 2
    page.fields.push({
      id: 'f-v2-only',
      label: 'Added in v2',
      kind: 'short_text',
      required: true,
      addedInVersion: 2,
    })
    await testDb
      .update(documentTemplates)
      .set({ version: 2, schema })
      .where(eq(documentTemplates.id, fixture.template.id))
    return fixture
  }

  test('getPage serves the v1 field set to a v1-pinned document', async () => {
    const { user, template } = await pinThenBump()

    const result = await getPage(user.id, template.id, 'pg-1')

    if ('error' in result) throw new Error(result.error)
    expect(result.page.fields.map((f) => f.id)).toEqual(['f-required', 'f-optional'])
  })

  test('saveAnswer rejects a v2-only field for a v1-pinned document', async () => {
    const { user, template } = await pinThenBump()

    const result = await saveAnswer(user.id, template.id, 'f-v2-only', 'nope')

    expect('error' in result && result.error).toBe('ANSWER_FIELD_INVALID')
  })

  test('saveAnswer accepts a v1 field that v2 deprecated', async () => {
    const { user, template } = await pinThenBump()

    const result = await saveAnswer(user.id, template.id, 'f-optional', 'still mine')

    expect('error' in result).toBe(false)
  })

  test('a fresh user pins v2 and gets the v2 view', async () => {
    const { template } = await pinThenBump()
    const newUser = await createTestUser()
    await createTestEnrollment(newUser!.id, (await programIdForTemplate(template.id)) as string)

    const result = await getPage(newUser!.id, template.id, 'pg-1')

    if ('error' in result) throw new Error(result.error)
    expect(result.page.fields.map((f) => f.id)).toEqual(['f-required', 'f-v2-only'])
    expect(result.document.templateVersion).toBe(2)
  })
})

describe('saveAnswer', () => {
  test('upserts the answer row with source=typed and confirmedAt set', async () => {
    const { user, template } = await enrolledUserWithTemplate()

    await saveAnswer(user.id, template.id, 'f-required', 'first')
    const result = await saveAnswer(user.id, template.id, 'f-required', 'second')

    if ('error' in result) throw new Error(result.error)
    const rows = (await answersForUser(user.id)).filter((r) => r.answer.fieldId === 'f-required')
    expect(rows).toHaveLength(1)
    expect(rows[0]?.answer.value).toBe('second')
    expect(rows[0]?.answer.source).toBe('typed')
    expect(rows[0]?.answer.confirmedAt).not.toBeNull()
  })

  test('unknown fieldId → ANSWER_FIELD_INVALID, nothing written', async () => {
    const { user, template } = await enrolledUserWithTemplate()

    const result = await saveAnswer(user.id, template.id, 'f-made-up', 'x')

    expect('error' in result && result.error).toBe('ANSWER_FIELD_INVALID')
    expect(await answersForUser(user.id)).toHaveLength(0)
  })

  test('unknown template → TEMPLATE_NOT_FOUND', async () => {
    const user = await createTestUser()

    const result = await saveAnswer(
      user!.id,
      '00000000-0000-0000-0000-000000000000',
      'f-required',
      'x',
    )

    expect('error' in result && result.error).toBe('TEMPLATE_NOT_FOUND')
  })

  test('first answer: empty → in_progress with document_started + answer_saved events', async () => {
    const { user, template } = await enrolledUserWithTemplate()

    const result = await saveAnswer(user.id, template.id, 'f-optional', 'a thought')

    if ('error' in result) throw new Error(result.error)
    expect(result.document.status).toBe('in_progress')
    const started = await eventsFor(user.id, 'document_started')
    expect(started).toHaveLength(1)
    const saved = await eventsFor(user.id, 'answer_saved')
    expect(saved).toHaveLength(1)
    expect(saved[0]?.isDecision).toBe(true)
    expect(saved[0]?.decisionKind).toBe('playbook')
    // PII rule: fieldId only, never the value
    expect(JSON.stringify(saved[0]?.properties)).not.toContain('a thought')
  })

  test('all required fields answered → complete with document_completed event', async () => {
    const { user, template } = await enrolledUserWithTemplate()

    await saveAnswer(user.id, template.id, 'f-optional', 'optional answer')
    const result = await saveAnswer(user.id, template.id, 'f-required', 'required answer')

    if ('error' in result) throw new Error(result.error)
    expect(result.document.status).toBe('complete')
    expect(await eventsFor(user.id, 'document_completed')).toHaveLength(1)
    // re-saving once complete does not re-fire completion
    await saveAnswer(user.id, template.id, 'f-required', 'edited')
    expect(await eventsFor(user.id, 'document_completed')).toHaveLength(1)
    expect(await eventsFor(user.id, 'document_started')).toHaveLength(1)
  })

  test('completion only requires REQUIRED fields', async () => {
    const { user, template } = await enrolledUserWithTemplate()

    const result = await saveAnswer(user.id, template.id, 'f-required', 'just the required one')

    if ('error' in result) throw new Error(result.error)
    expect(result.document.status).toBe('complete')
  })

  test('rollback: if the event insert fails, the answer and status roll back too', async () => {
    const { user, template } = await enrolledUserWithTemplate()
    await getPlaybook(user.id) // instantiate the document outside the failing tx
    failNextRecord = true

    await expect(saveAnswer(user.id, template.id, 'f-required', 'doomed')).rejects.toThrow(
      'record exploded',
    )

    expect(await answersForUser(user.id)).toHaveLength(0)
    const [doc] = await testDb.select().from(documents).where(eq(documents.userId, user.id))
    expect(doc?.status).toBe('empty')
    expect(await eventsFor(user.id, 'answer_saved')).toHaveLength(0)
    expect(await eventsFor(user.id, 'document_started')).toHaveLength(0)
  })
})

describe('getPage', () => {
  test('returns instruction, fields with merged answers, and exampleAnswer', async () => {
    const { user, template } = await enrolledUserWithTemplate()
    await saveAnswer(user.id, template.id, 'f-required', 'my answer')

    const result = await getPage(user.id, template.id, 'pg-1')

    if ('error' in result) throw new Error(result.error)
    expect(result.page.instruction).toBe('Write the true thing, not the polite thing.')
    expect(result.chapter).toEqual({ id: 'ch-1', title: 'Test Chapter' })
    const required = result.page.fields.find((f) => f.id === 'f-required')
    expect(required?.answer?.value).toBe('my answer')
    expect(required?.answer?.source).toBe('typed')
    expect(required?.exampleAnswer).toBe('An example answer.')
    expect(result.page.fields.find((f) => f.id === 'f-optional')?.answer).toBeNull()
    expect(result.progress).toEqual({ filled: 1, total: 2 })
  })

  test('unknown page → NOT_FOUND; unknown template → TEMPLATE_NOT_FOUND', async () => {
    const { user, template } = await enrolledUserWithTemplate()

    const badPage = await getPage(user.id, template.id, 'pg-nope')
    expect('error' in badPage && badPage.error).toBe('NOT_FOUND')

    const badTemplate = await getPage(user.id, '00000000-0000-0000-0000-000000000000', 'pg-1')
    expect('error' in badTemplate && badTemplate.error).toBe('TEMPLATE_NOT_FOUND')
  })
})

describe('programIdForTemplate', () => {
  test('resolves the owning program; null for unknown ids', async () => {
    const { template, program } = await enrolledUserWithTemplate()
    expect(await programIdForTemplate(template.id)).toBe(program.id)
    expect(await programIdForTemplate('00000000-0000-0000-0000-000000000000')).toBeNull()
  })
})
