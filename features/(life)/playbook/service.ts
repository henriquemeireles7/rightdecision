import { and, asc, eq, inArray } from 'drizzle-orm'
import { activeEnrollmentClause } from '@/features/(shared)/enrollment/service'
import { db } from '@/platform/db/client'
import type { TemplateSchema } from '@/platform/db/schema'
import { documentAnswers, documents, documentTemplates, enrollments } from '@/platform/db/schema'
import type { ErrorCode } from '@/platform/errors'
import { record } from '@/platform/events'
import {
  fieldIdsForVersion,
  requiredFieldIdsForVersion,
  schemaForVersion,
} from '@/platform/templates'

type ServiceError = { error: ErrorCode; details?: string }
type Template = typeof documentTemplates.$inferSelect
type DocumentRow = typeof documents.$inferSelect
type AnswerRow = typeof documentAnswers.$inferSelect

type DocumentSummary = Pick<DocumentRow, 'id' | 'status' | 'templateVersion'>

type PageProgress = { id: string; title: string; filled: number; total: number }
type ChapterProgress = {
  id: string
  title: string
  filled: number
  total: number
  pages: PageProgress[]
}
export type PlaybookProgress = { filled: number; total: number; chapters: ChapterProgress[] }

function summarize(doc: DocumentRow): DocumentSummary {
  return { id: doc.id, status: doc.status, templateVersion: doc.templateVersion }
}

function buildProgress(view: TemplateSchema, answeredFieldIds: Set<string>): PlaybookProgress {
  const chapters = view.chapters.map((chapter) => {
    const pages = chapter.pages.map((page) => ({
      id: page.id,
      title: page.title,
      filled: page.fields.filter((field) => answeredFieldIds.has(field.id)).length,
      total: page.fields.length,
    }))
    return {
      id: chapter.id,
      title: chapter.title,
      filled: pages.reduce((sum, page) => sum + page.filled, 0),
      total: pages.reduce((sum, page) => sum + page.total, 0),
      pages,
    }
  })
  return {
    filled: chapters.reduce((sum, chapter) => sum + chapter.filled, 0),
    total: chapters.reduce((sum, chapter) => sum + chapter.total, 0),
    chapters,
  }
}

/** Route resolver for requireEnrollment: the program owning a (published) template. */
export async function programIdForTemplate(templateId: string): Promise<string | null> {
  const [row] = await db
    .select({ programId: documentTemplates.programId })
    .from(documentTemplates)
    .where(eq(documentTemplates.id, templateId))
    .limit(1)
  return row?.programId ?? null
}

async function getPublishedTemplate(templateId: string): Promise<Template | null> {
  const [template] = await db
    .select()
    .from(documentTemplates)
    .where(and(eq(documentTemplates.id, templateId), eq(documentTemplates.status, 'published')))
    .limit(1)
  return template ?? null
}

/**
 * Lazy instantiation (eng-schema table 12): create the user's document on first read,
 * pinning the template's CURRENT version. Idempotent via onConflictDoNothing on
 * documents(userId, templateId) + re-select; an existing pin is never bumped.
 */
async function ensureDocument(userId: string, template: Template): Promise<DocumentRow> {
  const [inserted] = await db
    .insert(documents)
    .values({ userId, templateId: template.id, templateVersion: template.version })
    .onConflictDoNothing({ target: [documents.userId, documents.templateId] })
    .returning()
  if (inserted) return inserted
  const [existing] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.userId, userId), eq(documents.templateId, template.id)))
    .limit(1)
  // The unique index guarantees the row exists when the insert no-oped.
  return existing as DocumentRow
}

async function answersForDocument(documentId: string): Promise<AnswerRow[]> {
  return db.select().from(documentAnswers).where(eq(documentAnswers.documentId, documentId))
}

/**
 * The user's playbook index: published templates of their actively-enrolled programs,
 * merged with their (lazily instantiated) documents and per-page/chapter progress.
 */
export async function getPlaybook(userId: string) {
  const rows = await db
    .select({ template: documentTemplates })
    .from(documentTemplates)
    .innerJoin(
      enrollments,
      and(
        eq(enrollments.programId, documentTemplates.programId),
        eq(enrollments.userId, userId),
        activeEnrollmentClause(),
      ),
    )
    .where(eq(documentTemplates.status, 'published'))
    .orderBy(asc(documentTemplates.sortOrder), asc(documentTemplates.createdAt))

  const entries = []
  for (const { template } of rows) {
    const doc = await ensureDocument(userId, template)
    entries.push({ template, doc })
  }

  const docIds = entries.map((entry) => entry.doc.id)
  const allAnswers = docIds.length
    ? await db.select().from(documentAnswers).where(inArray(documentAnswers.documentId, docIds))
    : []
  const answersByDoc = new Map<string, Set<string>>()
  for (const answer of allAnswers) {
    const set = answersByDoc.get(answer.documentId) ?? new Set<string>()
    set.add(answer.fieldId)
    answersByDoc.set(answer.documentId, set)
  }

  return {
    documents: entries.map(({ template, doc }) => {
      const view = schemaForVersion(template.schema, doc.templateVersion)
      return {
        templateId: template.id,
        programId: template.programId,
        slug: template.slug,
        title: template.title,
        sortOrder: template.sortOrder,
        document: summarize(doc),
        progress: buildProgress(view, answersByDoc.get(doc.id) ?? new Set()),
      }
    }),
  }
}

/** One page of the user's document: instruction + fields (pinned-version view) merged with answers. */
export async function getPage(userId: string, templateId: string, pageId: string) {
  const template = await getPublishedTemplate(templateId)
  if (!template) return { error: 'TEMPLATE_NOT_FOUND' } satisfies ServiceError

  const doc = await ensureDocument(userId, template)
  const view = schemaForVersion(template.schema, doc.templateVersion)

  for (const chapter of view.chapters) {
    const page = chapter.pages.find((p) => p.id === pageId)
    if (!page) continue
    const answers = await answersForDocument(doc.id)
    const byField = new Map(answers.map((answer) => [answer.fieldId, answer]))
    const fields = page.fields.map((field) => {
      const answer = byField.get(field.id)
      return {
        ...field,
        answer: answer
          ? { value: answer.value, source: answer.source, confirmedAt: answer.confirmedAt }
          : null,
      }
    })
    return {
      document: summarize(doc),
      chapter: { id: chapter.id, title: chapter.title },
      page: { id: page.id, title: page.title, instruction: page.instruction, fields },
      progress: {
        filled: fields.filter((field) => field.answer !== null).length,
        total: fields.length,
      },
    }
  }
  return {
    error: 'NOT_FOUND',
    details: `page "${pageId}" not in this document`,
  } satisfies ServiceError
}

/** Everything the export endpoint needs: pinned-version view + the user's answers. */
export async function getExportData(userId: string, templateId: string) {
  const template = await getPublishedTemplate(templateId)
  if (!template) return { error: 'TEMPLATE_NOT_FOUND' } satisfies ServiceError
  const doc = await ensureDocument(userId, template)
  const answers = await answersForDocument(doc.id)
  return {
    title: template.title,
    schema: schemaForVersion(template.schema, doc.templateVersion),
    answersByFieldId: new Map(answers.map((answer) => [answer.fieldId, answer.value])),
  }
}

/**
 * Autosave-on-blur write path (ADR 20). ONE transaction: answer upsert + status
 * transition + decision event(s) — record() joins the tx, so a failed event insert
 * rolls the answer back (never a saved answer without its Decision Graph row).
 * fieldId validates against the PINNED templateVersion's view, never the current one.
 */
export async function saveAnswer(
  userId: string,
  templateId: string,
  fieldId: string,
  value: string,
) {
  const template = await getPublishedTemplate(templateId)
  if (!template) return { error: 'TEMPLATE_NOT_FOUND' } satisfies ServiceError

  const doc = await ensureDocument(userId, template)

  const validFieldIds = fieldIdsForVersion(template.schema, doc.templateVersion)
  if (!validFieldIds.has(fieldId)) {
    return {
      error: 'ANSWER_FIELD_INVALID',
      details: `field "${fieldId}" does not exist in template version ${doc.templateVersion}`,
    } satisfies ServiceError
  }

  const requiredIds = requiredFieldIdsForVersion(template.schema, doc.templateVersion)

  return db.transaction(async (tx) => {
    const now = new Date()
    // Typed answers are confirmed at write time (ADR 11 — only interview answers wait).
    await tx
      .insert(documentAnswers)
      .values({ documentId: doc.id, fieldId, value, source: 'typed', confirmedAt: now })
      .onConflictDoUpdate({
        target: [documentAnswers.documentId, documentAnswers.fieldId],
        set: { value, source: 'typed', confirmedAt: now, updatedAt: now },
      })

    const answered = new Set(
      (
        await tx
          .select({ fieldId: documentAnswers.fieldId })
          .from(documentAnswers)
          .where(eq(documentAnswers.documentId, doc.id))
      ).map((row) => row.fieldId),
    )
    const allRequiredAnswered = [...requiredIds].every((id) => answered.has(id))
    const newStatus = allRequiredAnswered ? ('complete' as const) : ('in_progress' as const)

    if (newStatus !== doc.status) {
      await tx
        .update(documents)
        .set({ status: newStatus, updatedAt: now })
        .where(eq(documents.id, doc.id))
    }

    if (doc.status === 'empty') {
      await record(
        { name: 'document_started', properties: { documentId: doc.id, templateId }, userId },
        tx,
      )
    }
    // The decision act — fieldId only, NEVER the answer value (PII rule).
    await record({ name: 'answer_saved', properties: { documentId: doc.id, fieldId }, userId }, tx)
    if (newStatus === 'complete' && doc.status !== 'complete') {
      await record({ name: 'document_completed', properties: { documentId: doc.id }, userId }, tx)
    }

    const view = schemaForVersion(template.schema, doc.templateVersion)
    return {
      document: { ...summarize(doc), status: newStatus },
      progress: buildProgress(view, answered),
    }
  })
}
