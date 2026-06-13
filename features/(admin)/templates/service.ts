import { and, asc, eq, ne } from 'drizzle-orm'
import { db } from '@/platform/db/client'
import { documentTemplates, programs, templateSchemaSchema } from '@/platform/db/schema'
import type { ErrorCode } from '@/platform/errors'
import { validatePublishedSchemaUpdate, validateTemplateSchemaForWrite } from '@/platform/templates'

type ServiceError = { error: ErrorCode; details?: string }
type Template = typeof documentTemplates.$inferSelect

// NOTE: there is deliberately NO delete function — documents FK-cascade from
// templates, so deleting one would destroy user answers. Archive via program
// status instead if a template must disappear.

async function programExists(programId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: programs.id })
    .from(programs)
    .where(eq(programs.id, programId))
    .limit(1)
  return row !== undefined
}

/** Slug is unique per program (service-enforced — no DB index on purpose, drafts move around). */
async function slugTaken(programId: string, slug: string, excludeId?: string): Promise<boolean> {
  const clauses = [eq(documentTemplates.programId, programId), eq(documentTemplates.slug, slug)]
  if (excludeId) clauses.push(ne(documentTemplates.id, excludeId))
  const [row] = await db
    .select({ id: documentTemplates.id })
    .from(documentTemplates)
    .where(and(...clauses))
    .limit(1)
  return row !== undefined
}

export async function listTemplates(programId?: string): Promise<{ templates: Template[] }> {
  const templates = await db
    .select()
    .from(documentTemplates)
    .where(programId ? eq(documentTemplates.programId, programId) : undefined)
    .orderBy(asc(documentTemplates.sortOrder), asc(documentTemplates.createdAt))
  return { templates }
}

export async function getTemplate(id: string): Promise<{ template: Template } | ServiceError> {
  const [template] = await db
    .select()
    .from(documentTemplates)
    .where(eq(documentTemplates.id, id))
    .limit(1)
  if (!template) return { error: 'TEMPLATE_NOT_FOUND' }
  return { template }
}

export async function createTemplate(input: {
  programId: string
  slug: string
  title: string
  sortOrder?: number
  schema: unknown
}): Promise<{ template: Template } | ServiceError> {
  if (!(await programExists(input.programId))) return { error: 'PROGRAM_NOT_FOUND' }

  const issue = validateTemplateSchemaForWrite(input.schema)
  if (issue) return { error: 'VALIDATION_ERROR', details: issue }

  if (await slugTaken(input.programId, input.slug)) {
    return {
      error: 'VALIDATION_ERROR',
      details: `A template with slug "${input.slug}" already exists in this program`,
    }
  }

  const siblings = await db
    .select({ sortOrder: documentTemplates.sortOrder })
    .from(documentTemplates)
    .where(eq(documentTemplates.programId, input.programId))
  const sortOrder =
    input.sortOrder ?? siblings.reduce((max, row) => Math.max(max, row.sortOrder + 1), 0)

  const [template] = await db
    .insert(documentTemplates)
    .values({
      programId: input.programId,
      slug: input.slug,
      title: input.title,
      sortOrder,
      version: 1,
      schema: templateSchemaSchema.parse(input.schema),
      status: 'draft',
    })
    .returning()
  if (!template) return { error: 'INTERNAL_ERROR' }
  return { template }
}

/**
 * Draft templates edit freely. PUBLISHED templates: a schema change goes through the
 * immutability gate (ids never renamed/retyped; deprecate/add allowed) and BUMPS the
 * version in the same write; metadata-only edits never bump.
 */
export async function updateTemplate(
  id: string,
  patch: {
    title?: string
    slug?: string
    sortOrder?: number
    programId?: string
    schema?: unknown
  },
): Promise<{ template: Template } | ServiceError> {
  const found = await getTemplate(id)
  if ('error' in found) return found
  const current = found.template

  const targetProgramId = patch.programId ?? current.programId
  if (patch.programId && !(await programExists(patch.programId))) {
    return { error: 'PROGRAM_NOT_FOUND' }
  }
  if (
    (patch.slug || patch.programId) &&
    (await slugTaken(targetProgramId, patch.slug ?? current.slug, id))
  ) {
    return {
      error: 'VALIDATION_ERROR',
      details: `A template with slug "${patch.slug ?? current.slug}" already exists in this program`,
    }
  }

  const set: Partial<typeof documentTemplates.$inferInsert> = { updatedAt: new Date() }
  if (patch.title !== undefined) set.title = patch.title
  if (patch.slug !== undefined) set.slug = patch.slug
  if (patch.sortOrder !== undefined) set.sortOrder = patch.sortOrder
  if (patch.programId !== undefined) set.programId = patch.programId

  if (patch.schema !== undefined) {
    const issue = validateTemplateSchemaForWrite(patch.schema)
    if (issue) return { error: 'VALIDATION_ERROR', details: issue }
    const nextSchema = templateSchemaSchema.parse(patch.schema)

    if (current.status === 'published') {
      const newVersion = current.version + 1
      const gate = validatePublishedSchemaUpdate(current.schema, nextSchema, newVersion)
      if ('error' in gate) return { error: 'VALIDATION_ERROR', details: gate.error }
      set.schema = gate.schema
      set.version = newVersion
    } else {
      set.schema = nextSchema
    }
  }

  const [template] = await db
    .update(documentTemplates)
    .set(set)
    .where(eq(documentTemplates.id, id))
    .returning()
  if (!template) return { error: 'TEMPLATE_NOT_FOUND' }
  return { template }
}

/** First publish flips status (version unchanged). Re-publishing is an idempotent no-op. */
export async function publishTemplate(id: string): Promise<{ template: Template } | ServiceError> {
  const found = await getTemplate(id)
  if ('error' in found) return found
  if (found.template.status === 'published') return found

  const [template] = await db
    .update(documentTemplates)
    .set({ status: 'published', updatedAt: new Date() })
    .where(eq(documentTemplates.id, id))
    .returning()
  if (!template) return { error: 'TEMPLATE_NOT_FOUND' }
  return { template }
}
