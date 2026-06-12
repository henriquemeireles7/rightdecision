import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { eq, sql } from 'drizzle-orm'
import type { PgTable } from 'drizzle-orm/pg-core'
import {
  aiUsage,
  cohorts,
  conversationMessages,
  conversations,
  courses,
  documentAnswers,
  documents,
  documentTemplates,
  enrollments,
  events,
  interviews,
  journalEntries,
  lessonProgress,
  lessons,
  lives,
  materials,
  modules,
  programCourses,
  programMaterials,
  programs,
  type TemplateSchema,
  users,
} from '@/platform/db/schema'
import { createTestUser } from '@/platform/test/factories'
import { setupTestDb, teardownTestDb, testDb } from '@/platform/test/setup'

const V2_TABLES = [
  'programs',
  'cohorts',
  'enrollments',
  'program_courses',
  'courses',
  'modules',
  'lessons',
  'materials',
  'program_materials',
  'lives',
  'document_templates',
  'documents',
  'document_answers',
  'journal_entries',
  'interviews',
  'conversations',
  'conversation_messages',
  'events',
  'ai_usage',
  'lesson_progress',
] as const

let counter = 0
function next() {
  counter++
  return counter
}

/** Narrow `T | undefined` from destructured `.returning()` rows. */
function must<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Expected a row, got undefined')
  return value
}

/** First row of an insert `.returning()`, asserted present. */
function one<T>(rows: T[]): T {
  return must(rows[0])
}

const templateSchemaFixture: TemplateSchema = {
  chapters: [
    {
      id: 'ch-1',
      title: 'Chapter One',
      pages: [
        {
          id: 'pg-1',
          title: 'Page One',
          instruction: 'Answer honestly.',
          fields: [
            { id: 'field-1', label: 'One decision', kind: 'long_text', required: true },
            {
              id: 'field-2',
              label: 'Area',
              kind: 'select',
              required: false,
              options: ['health', 'career'],
            },
          ],
        },
      ],
    },
  ],
}

async function createProgram(overrides: Partial<typeof programs.$inferInsert> = {}) {
  return one(
    await testDb
      .insert(programs)
      .values({ slug: `program-${next()}`, name: 'Test Program', tier: 'free', ...overrides })
      .returning(),
  )
}

async function createCohort(
  programId: string,
  overrides: Partial<typeof cohorts.$inferInsert> = {},
) {
  return one(
    await testDb
      .insert(cohorts)
      .values({
        programId,
        title: `Cohort ${next()}`,
        startsAt: new Date(Date.UTC(2026, 0, 1, 12) + next() * 60_000),
        ...overrides,
      })
      .returning(),
  )
}

async function createCourse(overrides: Partial<typeof courses.$inferInsert> = {}) {
  return one(
    await testDb
      .insert(courses)
      .values({ slug: `course-${next()}`, title: 'Test Course', ...overrides })
      .returning(),
  )
}

async function createModule(courseId: string) {
  return one(
    await testDb
      .insert(modules)
      .values({ courseId, title: 'Test Module', sortOrder: next() })
      .returning(),
  )
}

async function createLesson(
  moduleId: string,
  overrides: Partial<typeof lessons.$inferInsert> = {},
) {
  return one(
    await testDb
      .insert(lessons)
      .values({ moduleId, title: 'Test Lesson', sortOrder: next(), ...overrides })
      .returning(),
  )
}

async function createDocumentTemplate(programId: string) {
  return one(
    await testDb
      .insert(documentTemplates)
      .values({
        programId,
        slug: `template-${next()}`,
        title: 'Life Playbook',
        sortOrder: next(),
        schema: templateSchemaFixture,
      })
      .returning(),
  )
}

async function createDocument(userId: string, templateId: string) {
  return one(
    await testDb.insert(documents).values({ userId, templateId, templateVersion: 1 }).returning(),
  )
}

async function createConversation(userId: string, kind: 'chat' | 'interview' = 'chat') {
  return one(await testDb.insert(conversations).values({ userId, kind }).returning())
}

function expectUniqueViolation(promise: Promise<unknown>) {
  return promise.then(
    () => {
      throw new Error('Expected unique constraint violation, but insert succeeded')
    },
    (error: unknown) => {
      // drizzle-orm wraps the PostgresError — the SQLSTATE lives on the cause
      const wrapped = error as { code?: string; cause?: { code?: string } }
      expect(wrapped.code ?? wrapped.cause?.code).toBe('23505')
    },
  )
}

describe('integration: schema-v2 (Platform V2 — 20 tables)', () => {
  beforeAll(setupTestDb)
  afterAll(teardownTestDb)

  test('migration creates all 20 V2 tables on an empty DB', async () => {
    const rows = await testDb.execute<{ tablename: string }>(sql`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `)
    const tableNames = rows.map((r) => r.tablename)
    for (const table of V2_TABLES) {
      expect(tableNames).toContain(table)
    }
  })

  test('partial indexes carry their WHERE clauses', async () => {
    const rows = await testDb.execute<{ indexname: string; indexdef: string }>(sql`
      SELECT indexname, indexdef FROM pg_indexes
      WHERE indexname IN ('events_source_ref_idx', 'events_user_occurred_decision_idx')
    `)
    const byName = Object.fromEntries(rows.map((r) => [r.indexname, r.indexdef]))
    expect(byName.events_source_ref_idx).toContain('UNIQUE')
    expect(byName.events_source_ref_idx).toContain('WHERE (source_ref IS NOT NULL)')
    expect(byName.events_user_occurred_decision_idx).toContain('WHERE is_decision')
  })

  test('inserts a row in every table, exercising all FKs', async () => {
    const user = must(await createTestUser())
    const program = await createProgram()
    const cohort = await createCohort(program.id)
    const enrollment = one(
      await testDb
        .insert(enrollments)
        .values({ userId: user.id, programId: program.id, cohortId: cohort.id, source: 'signup' })
        .returning(),
    )
    const course = await createCourse()
    const programCourse = one(
      await testDb
        .insert(programCourses)
        .values({ programId: program.id, courseId: course.id, sortOrder: 1 })
        .returning(),
    )
    const module = await createModule(course.id)
    const lesson = await createLesson(module.id, {
      streamVideoId: 'stream-abc',
      videoStatus: 'ready',
      captionsReady: true,
      decisionPrompt: 'What will you decide?',
    })
    const material = one(
      await testDb
        .insert(materials)
        .values({
          title: 'Workbook',
          fileKey: `materials/workbook-${next()}.pdf`,
          lessonId: lesson.id,
        })
        .returning(),
    )
    const programMaterial = one(
      await testDb
        .insert(programMaterials)
        .values({ programId: program.id, materialId: material.id })
        .returning(),
    )
    const live = one(
      await testDb
        .insert(lives)
        .values({ programId: program.id, title: 'Monthly Live', scheduledAt: new Date() })
        .returning(),
    )
    const template = await createDocumentTemplate(program.id)
    const document = await createDocument(user.id, template.id)
    const answer = one(
      await testDb
        .insert(documentAnswers)
        .values({ documentId: document.id, fieldId: 'field-1', value: 'I decide to ship' })
        .returning(),
    )
    const journalEntry = one(
      await testDb
        .insert(journalEntries)
        .values({ userId: user.id, entryDate: '2026-06-12', kind: 'morning', content: 'Entry' })
        .returning(),
    )
    const conversation = await createConversation(user.id, 'interview')
    const message = one(
      await testDb
        .insert(conversationMessages)
        .values({ conversationId: conversation.id, role: 'user', content: 'Hello' })
        .returning(),
    )
    const interview = one(
      await testDb
        .insert(interviews)
        .values({
          userId: user.id,
          documentId: document.id,
          pageId: 'pg-1',
          conversationId: conversation.id,
          distilledFields: { 'field-1': 'distilled value' },
        })
        .returning(),
    )
    const event = one(
      await testDb
        .insert(events)
        .values({
          userId: user.id,
          name: 'lesson_decision_made',
          properties: { lessonId: lesson.id },
          isDecision: true,
          decisionKind: 'lesson_prompt',
        })
        .returning(),
    )
    const usage = one(
      await testDb
        .insert(aiUsage)
        .values({
          userId: user.id,
          conversationId: conversation.id,
          messageId: message.id,
          kind: 'interview',
          model: 'claude-test',
          inputTokens: 100,
          outputTokens: 200,
        })
        .returning(),
    )
    const progress = one(
      await testDb
        .insert(lessonProgress)
        .values({
          userId: user.id,
          lessonId: lesson.id,
          secondsWatched: 42,
          durationSeconds: 300,
          lastWatchedAt: new Date(),
        })
        .returning(),
    )

    for (const row of [
      program,
      cohort,
      enrollment,
      course,
      programCourse,
      module,
      lesson,
      material,
      programMaterial,
      live,
      template,
      document,
      answer,
      journalEntry,
      conversation,
      message,
      interview,
      event,
      usage,
      progress,
    ]) {
      expect(row.id).toBeString()
    }
    expect(event.properties).toEqual({ lessonId: lesson.id })
    expect(template.schema).toEqual(templateSchemaFixture)
  })

  test('cohorts (programId, startsAt) unique index rejects duplicates', async () => {
    const program = await createProgram()
    const startsAt = new Date('2026-07-06T12:00:00Z')
    await createCohort(program.id, { startsAt })
    await expectUniqueViolation(
      testDb.insert(cohorts).values({ programId: program.id, title: 'Dup', startsAt }),
    )
  })

  test('enrollments (userId, programId) unique index rejects duplicates', async () => {
    const user = must(await createTestUser())
    const program = await createProgram()
    await testDb
      .insert(enrollments)
      .values({ userId: user.id, programId: program.id, source: 'signup' })
    await expectUniqueViolation(
      testDb
        .insert(enrollments)
        .values({ userId: user.id, programId: program.id, source: 'admin' }),
    )
  })

  test('document_answers (documentId, fieldId) unique index rejects duplicates', async () => {
    const user = must(await createTestUser())
    const program = await createProgram()
    const template = await createDocumentTemplate(program.id)
    const document = await createDocument(user.id, template.id)
    await testDb
      .insert(documentAnswers)
      .values({ documentId: document.id, fieldId: 'field-1', value: 'first' })
    await expectUniqueViolation(
      testDb
        .insert(documentAnswers)
        .values({ documentId: document.id, fieldId: 'field-1', value: 'second' }),
    )
  })

  test('journal_entries (userId, entryDate, kind) unique index rejects duplicates', async () => {
    const user = must(await createTestUser())
    await testDb
      .insert(journalEntries)
      .values({ userId: user.id, entryDate: '2026-06-12', kind: 'evening', content: 'first' })
    await expectUniqueViolation(
      testDb
        .insert(journalEntries)
        .values({ userId: user.id, entryDate: '2026-06-12', kind: 'evening', content: 'second' }),
    )
    // Same date, different kind is allowed
    const morning = one(
      await testDb
        .insert(journalEntries)
        .values({ userId: user.id, entryDate: '2026-06-12', kind: 'morning', content: 'morning' })
        .returning(),
    )
    expect(morning.id).toBeString()
  })

  test('lesson_progress (userId, lessonId) unique index rejects duplicates', async () => {
    const user = must(await createTestUser())
    const course = await createCourse()
    const module = await createModule(course.id)
    const lesson = await createLesson(module.id)
    await testDb
      .insert(lessonProgress)
      .values({ userId: user.id, lessonId: lesson.id, lastWatchedAt: new Date() })
    await expectUniqueViolation(
      testDb
        .insert(lessonProgress)
        .values({ userId: user.id, lessonId: lesson.id, lastWatchedAt: new Date() }),
    )
  })

  test('events.sourceRef partial unique index rejects duplicates but allows many NULLs', async () => {
    const sourceRef = `user_decisions:${crypto.randomUUID()}`
    await testDb.insert(events).values({ name: 'decision_made', sourceRef, source: 'backfill' })
    await expectUniqueViolation(
      testDb.insert(events).values({ name: 'decision_made', sourceRef, source: 'backfill' }),
    )
    // NULL sourceRef rows are not constrained
    const a = one(await testDb.insert(events).values({ name: 'page_viewed' }).returning())
    const b = one(await testDb.insert(events).values({ name: 'page_viewed' }).returning())
    expect(a.id).not.toBe(b.id)
  })

  test('events accepts anonymous (pre-auth) rows with null userId', async () => {
    const event = one(
      await testDb
        .insert(events)
        .values({ anonymousId: `anon-${next()}`, name: 'funnel_started' })
        .returning(),
    )
    expect(event.userId).toBeNull()
    expect(event.isDecision).toBe(false)
    expect(event.source).toBe('app')
  })

  test('deleting a user cascades across every user-keyed V2 table', async () => {
    const user = must(await createTestUser())
    const program = await createProgram()
    const cohort = await createCohort(program.id)
    const course = await createCourse()
    const module = await createModule(course.id)
    const lesson = await createLesson(module.id)
    const template = await createDocumentTemplate(program.id)

    const enrollment = one(
      await testDb
        .insert(enrollments)
        .values({ userId: user.id, programId: program.id, cohortId: cohort.id, source: 'signup' })
        .returning(),
    )
    const document = await createDocument(user.id, template.id)
    const answer = one(
      await testDb
        .insert(documentAnswers)
        .values({ documentId: document.id, fieldId: 'field-1', value: 'answer' })
        .returning(),
    )
    const journalEntry = one(
      await testDb
        .insert(journalEntries)
        .values({ userId: user.id, entryDate: '2026-06-11', kind: 'morning', content: 'entry' })
        .returning(),
    )
    const conversation = await createConversation(user.id)
    const message = one(
      await testDb
        .insert(conversationMessages)
        .values({ conversationId: conversation.id, role: 'assistant', content: 'reply' })
        .returning(),
    )
    const interview = one(
      await testDb
        .insert(interviews)
        .values({
          userId: user.id,
          documentId: document.id,
          pageId: 'pg-1',
          conversationId: conversation.id,
        })
        .returning(),
    )
    const event = one(
      await testDb.insert(events).values({ userId: user.id, name: 'lesson_started' }).returning(),
    )
    const usage = one(
      await testDb
        .insert(aiUsage)
        .values({
          userId: user.id,
          conversationId: conversation.id,
          messageId: message.id,
          kind: 'chat',
          model: 'claude-test',
          inputTokens: 1,
          outputTokens: 1,
        })
        .returning(),
    )
    const progress = one(
      await testDb
        .insert(lessonProgress)
        .values({ userId: user.id, lessonId: lesson.id, lastWatchedAt: new Date() })
        .returning(),
    )

    await testDb.delete(users).where(eq(users.id, user.id))

    // Every user-keyed row (and children of user-keyed rows) must be gone
    const cascaded: [string, PgTable, { id: string }][] = [
      ['enrollments', enrollments, enrollment],
      ['documents', documents, document],
      ['document_answers', documentAnswers, answer],
      ['journal_entries', journalEntries, journalEntry],
      ['interviews', interviews, interview],
      ['conversations', conversations, conversation],
      ['conversation_messages', conversationMessages, message],
      ['events', events, event],
      ['ai_usage', aiUsage, usage],
      ['lesson_progress', lessonProgress, progress],
    ]
    for (const [name, table, row] of cascaded) {
      const remaining = await testDb.select().from(table).where(sql`id = ${row.id}`)
      expect({ table: name, remaining: remaining.length }).toEqual({ table: name, remaining: 0 })
    }

    // Program-side content is untouched by user deletion
    const programRows = await testDb.select().from(programs).where(eq(programs.id, program.id))
    expect(programRows).toHaveLength(1)
    const lessonRows = await testDb.select().from(lessons).where(eq(lessons.id, lesson.id))
    expect(lessonRows).toHaveLength(1)
  })
})
