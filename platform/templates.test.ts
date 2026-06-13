import { describe, expect, test } from 'bun:test'
import type { TemplateSchema } from '@/platform/db/schema'
import {
  collectFields,
  fieldIdsForVersion,
  requiredFieldIdsForVersion,
  schemaForVersion,
  validatePublishedSchemaUpdate,
  validateTemplateSchemaForWrite,
} from '@/platform/templates'

/** v1: ch1/pg1 has f-a (required) + f-b; v2 added f-c and deprecated f-b. */
function versionedSchema(): TemplateSchema {
  return {
    chapters: [
      {
        id: 'ch1',
        title: 'Chapter One',
        pages: [
          {
            id: 'pg1',
            title: 'Page One',
            instruction: 'Write it down.',
            fields: [
              { id: 'f-a', label: 'A', kind: 'short_text', required: true },
              {
                id: 'f-b',
                label: 'B',
                kind: 'long_text',
                required: false,
                deprecatedInVersion: 2,
              },
              {
                id: 'f-c',
                label: 'C',
                kind: 'short_text',
                required: true,
                addedInVersion: 2,
              },
            ],
          },
          {
            id: 'pg2',
            title: 'Page Two (all v2)',
            fields: [
              { id: 'f-d', label: 'D', kind: 'scale_1_10', required: false, addedInVersion: 2 },
            ],
          },
        ],
      },
    ],
  }
}

describe('schemaForVersion', () => {
  test('version 1 view keeps v1 fields, including ones deprecated later', () => {
    const view = schemaForVersion(versionedSchema(), 1)
    const ids = collectFields(view).map((f) => f.id)
    expect(ids).toEqual(['f-a', 'f-b'])
  })

  test('version 2 view drops deprecated fields and includes added ones', () => {
    const view = schemaForVersion(versionedSchema(), 2)
    const ids = collectFields(view).map((f) => f.id)
    expect(ids).toEqual(['f-a', 'f-c', 'f-d'])
  })

  test('pages and chapters with no visible fields are dropped from the view', () => {
    const view = schemaForVersion(versionedSchema(), 1)
    expect(view.chapters[0]?.pages.map((p) => p.id)).toEqual(['pg1'])
  })

  test('fieldIdsForVersion and requiredFieldIdsForVersion follow the same view', () => {
    const schema = versionedSchema()
    expect(fieldIdsForVersion(schema, 1)).toEqual(new Set(['f-a', 'f-b']))
    expect(requiredFieldIdsForVersion(schema, 1)).toEqual(new Set(['f-a']))
    expect(requiredFieldIdsForVersion(schema, 2)).toEqual(new Set(['f-a', 'f-c']))
  })
})

describe('validateTemplateSchemaForWrite', () => {
  test('accepts a valid schema', () => {
    expect(validateTemplateSchemaForWrite(versionedSchema())).toBeNull()
  })

  test('rejects non-conforming jsonb (Zod)', () => {
    const issue = validateTemplateSchemaForWrite({ chapters: [{ id: '', pages: [] }] })
    expect(issue).toBeTruthy()
  })

  test('rejects duplicate field ids across the whole template', () => {
    const schema = versionedSchema()
    schema.chapters[0]!.pages[1]!.fields.push({
      id: 'f-a',
      label: 'Duplicate',
      kind: 'short_text',
      required: false,
    })
    expect(validateTemplateSchemaForWrite(schema)).toContain('f-a')
  })

  test('rejects select/multi_select without options', () => {
    const schema: unknown = {
      chapters: [
        {
          id: 'ch1',
          title: 'C',
          pages: [
            {
              id: 'pg1',
              title: 'P',
              fields: [{ id: 'f-s', label: 'S', kind: 'select', required: false }],
            },
          ],
        },
      ],
    }
    expect(validateTemplateSchemaForWrite(schema)).toContain('options')
  })

  test('rejects options on non-select kinds', () => {
    const schema: unknown = {
      chapters: [
        {
          id: 'ch1',
          title: 'C',
          pages: [
            {
              id: 'pg1',
              title: 'P',
              fields: [
                { id: 'f-t', label: 'T', kind: 'short_text', required: false, options: ['x'] },
              ],
            },
          ],
        },
      ],
    }
    expect(validateTemplateSchemaForWrite(schema)).toContain('options')
  })
})

describe('validatePublishedSchemaUpdate (immutability matrix)', () => {
  const old = versionedSchema()

  test('removing (renaming) a published field id is rejected', () => {
    const next = versionedSchema()
    next.chapters[0]!.pages[0]!.fields = next.chapters[0]!.pages[0]!.fields.filter(
      (f) => f.id !== 'f-a',
    )
    const result = validatePublishedSchemaUpdate(old, next, 3)
    expect('error' in result && result.error).toContain('f-a')
  })

  test('retyping a published field kind is rejected', () => {
    const next = versionedSchema()
    next.chapters[0]!.pages[0]!.fields[0]!.kind = 'long_text'
    const result = validatePublishedSchemaUpdate(old, next, 3)
    expect('error' in result && result.error).toContain('f-a')
  })

  test('removing an option from a published select field is rejected', () => {
    const withSelect = versionedSchema()
    withSelect.chapters[0]!.pages[0]!.fields.push({
      id: 'f-sel',
      label: 'Sel',
      kind: 'select',
      required: false,
      options: ['one', 'two'],
    })
    const next = structuredClone(withSelect)
    next.chapters[0]!.pages[0]!.fields.at(-1)!.options = ['one']
    const result = validatePublishedSchemaUpdate(withSelect, next, 3)
    expect('error' in result && result.error).toContain('f-sel')
  })

  test('deprecating a field is allowed and stamped with the new version', () => {
    const next = versionedSchema()
    next.chapters[0]!.pages[0]!.fields[0]!.deprecatedInVersion = 99 // any value = intent
    const result = validatePublishedSchemaUpdate(old, next, 3)
    if ('error' in result) throw new Error(result.error)
    const fA = collectFields(result.schema).find((f) => f.id === 'f-a')
    expect(fA?.deprecatedInVersion).toBe(3)
  })

  test('new fields are stamped addedInVersion = new version; old stamps preserved', () => {
    const next = versionedSchema()
    next.chapters[0]!.pages[0]!.fields.push({
      id: 'f-new',
      label: 'New',
      kind: 'date',
      required: false,
    })
    const result = validatePublishedSchemaUpdate(old, next, 3)
    if ('error' in result) throw new Error(result.error)
    const fields = collectFields(result.schema)
    expect(fields.find((f) => f.id === 'f-new')?.addedInVersion).toBe(3)
    expect(fields.find((f) => f.id === 'f-c')?.addedInVersion).toBe(2)
    // existing deprecation stamps survive even if the client resends them differently
    expect(fields.find((f) => f.id === 'f-b')?.deprecatedInVersion).toBe(2)
  })

  test('a previously deprecated field cannot be un-deprecated', () => {
    const next = versionedSchema()
    next.chapters[0]!.pages[0]!.fields[1]!.deprecatedInVersion = undefined
    const result = validatePublishedSchemaUpdate(old, next, 3)
    if ('error' in result) throw new Error(result.error)
    expect(collectFields(result.schema).find((f) => f.id === 'f-b')?.deprecatedInVersion).toBe(2)
  })
})
