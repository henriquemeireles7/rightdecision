import type { TemplateSchema } from '@/platform/db/schema'
import { templateSchemaSchema } from '@/platform/db/schema'

/**
 * TemplateSchema helpers shared by features/(life)/playbook, features/(admin)/templates
 * and platform/scripts (platform root is the only layer all three may import).
 *
 * Version model (eng-schema tables 11-12): document_templates stores ONE jsonb row that
 * carries every version's fields via per-field stamps (addedInVersion/deprecatedInVersion).
 * A document pinned at version P sees the schema "as of P":
 *   visible(field, P) = (addedInVersion ?? 1) <= P AND (deprecatedInVersion ?? ∞) > P
 * This only works because published field ids are IMMUTABLE — admin adds/deprecates,
 * never renames/retypes (enforced by validatePublishedSchemaUpdate).
 */

type TemplateField = TemplateSchema['chapters'][number]['pages'][number]['fields'][number]

function isVisibleAt(field: TemplateField, version: number): boolean {
  if ((field.addedInVersion ?? 1) > version) return false
  if (field.deprecatedInVersion !== undefined && field.deprecatedInVersion <= version) return false
  return true
}

/** Every field in document order, ignoring version visibility. */
export function collectFields(schema: TemplateSchema): TemplateField[] {
  return schema.chapters.flatMap((chapter) =>
    chapter.pages.flatMap((page) => page.fields.map((field) => field)),
  )
}

/** The schema as a document pinned at `version` sees it. Empty pages/chapters are dropped. */
export function schemaForVersion(schema: TemplateSchema, version: number): TemplateSchema {
  return {
    chapters: schema.chapters
      .map((chapter) => ({
        ...chapter,
        pages: chapter.pages
          .map((page) => ({
            ...page,
            fields: page.fields.filter((field) => isVisibleAt(field, version)),
          }))
          .filter((page) => page.fields.length > 0),
      }))
      .filter((chapter) => chapter.pages.length > 0),
  }
}

export function fieldIdsForVersion(schema: TemplateSchema, version: number): Set<string> {
  return new Set(collectFields(schemaForVersion(schema, version)).map((field) => field.id))
}

export function requiredFieldIdsForVersion(schema: TemplateSchema, version: number): Set<string> {
  return new Set(
    collectFields(schemaForVersion(schema, version))
      .filter((field) => field.required)
      .map((field) => field.id),
  )
}

/**
 * Full admin-write validation: Zod shape + structural rules the type alone can't carry.
 * Returns null when valid, or a human-readable issue string (VALIDATION_ERROR details).
 */
export function validateTemplateSchemaForWrite(input: unknown): string | null {
  const parsed = templateSchemaSchema.safeParse(input)
  if (!parsed.success) {
    return parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'schema'}: ${issue.message}`)
      .join('; ')
  }
  const schema = parsed.data

  const seen = new Set<string>()
  for (const field of collectFields(schema)) {
    if (seen.has(field.id)) return `duplicate field id "${field.id}"`
    seen.add(field.id)

    const isSelect = field.kind === 'select' || field.kind === 'multi_select'
    if (isSelect && (!field.options || field.options.length === 0)) {
      return `field "${field.id}" (${field.kind}) requires non-empty options`
    }
    if (!isSelect && field.options !== undefined) {
      return `field "${field.id}" (${field.kind}) must not carry options`
    }
  }
  return null
}

/**
 * Enforce field-id immutability when an already-published template is updated.
 * Allowed: adding fields, deprecating fields, label/placeholder/instruction/required edits,
 * adding select options. Rejected: removing an id (rename), changing kind (retype),
 * removing options. Returns the NORMALIZED schema with server-stamped versions:
 * - kept fields keep their original addedInVersion/deprecatedInVersion (no un-deprecation)
 * - a newly requested deprecation (any deprecatedInVersion value = intent) stamps newVersion
 * - new fields stamp addedInVersion = newVersion
 */
export function validatePublishedSchemaUpdate(
  oldSchema: TemplateSchema,
  nextSchema: TemplateSchema,
  newVersion: number,
): { schema: TemplateSchema } | { error: string } {
  const oldFields = new Map(collectFields(oldSchema).map((field) => [field.id, field]))
  const nextFields = new Map(collectFields(nextSchema).map((field) => [field.id, field]))

  for (const [id, oldField] of oldFields) {
    const nextField = nextFields.get(id)
    if (!nextField) {
      return {
        error: `published field id "${id}" is immutable — deprecate it instead of removing/renaming`,
      }
    }
    if (nextField.kind !== oldField.kind) {
      return {
        error: `published field "${id}" cannot change kind (${oldField.kind} → ${nextField.kind}) — add a new field instead`,
      }
    }
    for (const option of oldField.options ?? []) {
      if (!(nextField.options ?? []).includes(option)) {
        return {
          error: `published field "${id}" cannot remove option "${option}" — existing answers reference it`,
        }
      }
    }
  }

  const schema: TemplateSchema = {
    chapters: nextSchema.chapters.map((chapter) => ({
      ...chapter,
      pages: chapter.pages.map((page) => ({
        ...page,
        fields: page.fields.map((field) => {
          const old = oldFields.get(field.id)
          if (!old) {
            // brand-new field: stamp the version being created
            return { ...field, addedInVersion: newVersion, deprecatedInVersion: undefined }
          }
          const deprecatedInVersion =
            old.deprecatedInVersion ?? // once deprecated, stays deprecated at its original version
            (field.deprecatedInVersion !== undefined ? newVersion : undefined)
          return { ...field, addedInVersion: old.addedInVersion ?? 1, deprecatedInVersion }
        }),
      })),
    })),
  }
  return { schema }
}
