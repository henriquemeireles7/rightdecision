import { afterAll, describe, expect, test } from 'bun:test'
import { eq } from 'drizzle-orm'
import { documentTemplates } from '@/platform/db/schema'
import {
  buildTestTemplateSchema,
  createTestDocumentTemplate,
  createTestProgram,
} from '@/platform/test/factories'
import { setupTestDb, teardownTestDb, testDb } from '@/platform/test/setup'
import {
  createTemplate,
  getTemplate,
  listTemplates,
  publishTemplate,
  updateTemplate,
} from './service'

await setupTestDb()
afterAll(teardownTestDb)

describe('createTemplate', () => {
  test('creates a draft at version 1', async () => {
    const program = await createTestProgram()

    const result = await createTemplate({
      programId: program!.id,
      slug: 'life-playbook-test',
      title: 'Life Playbook',
      schema: buildTestTemplateSchema(),
    })

    if ('error' in result) throw new Error(result.error)
    expect(result.template.status).toBe('draft')
    expect(result.template.version).toBe(1)
  })

  test('unknown program → PROGRAM_NOT_FOUND', async () => {
    const result = await createTemplate({
      programId: '00000000-0000-0000-0000-000000000000',
      slug: 's',
      title: 'T',
      schema: buildTestTemplateSchema(),
    })
    expect('error' in result && result.error).toBe('PROGRAM_NOT_FOUND')
  })

  test('invalid schema jsonb is rejected on write (Zod + structural)', async () => {
    const program = await createTestProgram()

    const badShape = await createTemplate({
      programId: program!.id,
      slug: 'bad',
      title: 'Bad',
      schema: { chapters: [{ id: '', title: 'x', pages: [] }] },
    })
    expect('error' in badShape && badShape.error).toBe('VALIDATION_ERROR')

    const selectWithoutOptions = await createTemplate({
      programId: program!.id,
      slug: 'bad-2',
      title: 'Bad 2',
      schema: {
        chapters: [
          {
            id: 'c',
            title: 'C',
            pages: [
              {
                id: 'p',
                title: 'P',
                fields: [{ id: 'f', label: 'F', kind: 'select', required: true }],
              },
            ],
          },
        ],
      },
    })
    expect('error' in selectWithoutOptions && selectWithoutOptions.error).toBe('VALIDATION_ERROR')
  })

  test('duplicate slug within the same program → VALIDATION_ERROR; other program is fine', async () => {
    const program = await createTestProgram()
    const other = await createTestProgram()
    const input = {
      programId: program!.id,
      slug: 'same-slug',
      title: 'T',
      schema: buildTestTemplateSchema(),
    }
    await createTemplate(input)

    const dupe = await createTemplate(input)
    expect('error' in dupe && dupe.error).toBe('VALIDATION_ERROR')

    const elsewhere = await createTemplate({ ...input, programId: other!.id })
    expect('error' in elsewhere).toBe(false)
  })
})

describe('updateTemplate (draft)', () => {
  test('draft schema edits are free — even renames — and never bump the version', async () => {
    const program = await createTestProgram()
    const template = await createTestDocumentTemplate(program!.id, { status: 'draft' })
    const schema = buildTestTemplateSchema()
    schema.chapters[0]!.pages[0]!.fields[0]!.id = 'f-renamed-freely'

    const result = await updateTemplate(template!.id, { schema })

    if ('error' in result) throw new Error(result.error)
    expect(result.template.version).toBe(1)
    expect(JSON.stringify(result.template.schema)).toContain('f-renamed-freely')
  })

  test('program assignment: PATCH programId moves the template (program must exist)', async () => {
    const program = await createTestProgram()
    const target = await createTestProgram()
    const template = await createTestDocumentTemplate(program!.id, { status: 'draft' })

    const moved = await updateTemplate(template!.id, { programId: target!.id })
    if ('error' in moved) throw new Error(moved.error)
    expect(moved.template.programId).toBe(target!.id)

    const badMove = await updateTemplate(template!.id, {
      programId: '00000000-0000-0000-0000-000000000000',
    })
    expect('error' in badMove && badMove.error).toBe('PROGRAM_NOT_FOUND')
  })

  test('renaming the slug onto a sibling in the same program → VALIDATION_ERROR', async () => {
    const program = await createTestProgram()
    const sibling = await createTestDocumentTemplate(program!.id, { slug: 'taken-slug' })
    const template = await createTestDocumentTemplate(program!.id, { status: 'draft' })

    const result = await updateTemplate(template!.id, { slug: sibling!.slug })

    expect('error' in result && result.error).toBe('VALIDATION_ERROR')
    expect('error' in result && result.details).toContain('taken-slug')
  })

  test('unknown template → TEMPLATE_NOT_FOUND', async () => {
    const result = await updateTemplate('00000000-0000-0000-0000-000000000000', { title: 'X' })
    expect('error' in result && result.error).toBe('TEMPLATE_NOT_FOUND')
  })
})

describe('publishTemplate', () => {
  test('first publish flips status, version stays 1', async () => {
    const program = await createTestProgram()
    const template = await createTestDocumentTemplate(program!.id, { status: 'draft' })

    const result = await publishTemplate(template!.id)

    if ('error' in result) throw new Error(result.error)
    expect(result.template.status).toBe('published')
    expect(result.template.version).toBe(1)
  })

  test('publishing an already-published template is an idempotent no-op', async () => {
    const program = await createTestProgram()
    const template = await createTestDocumentTemplate(program!.id, { status: 'published' })

    const result = await publishTemplate(template!.id)

    if ('error' in result) throw new Error(result.error)
    expect(result.template.version).toBe(1)
  })
})

describe('updateTemplate (published — immutability matrix)', () => {
  async function publishedTemplate() {
    const program = await createTestProgram()
    return createTestDocumentTemplate(program!.id, { status: 'published' })
  }

  test('renaming (removing) a published field id is rejected', async () => {
    const template = await publishedTemplate()
    const schema = buildTestTemplateSchema()
    schema.chapters[0]!.pages[0]!.fields[0]!.id = 'f-renamed'

    const result = await updateTemplate(template!.id, { schema })

    expect('error' in result && result.error).toBe('VALIDATION_ERROR')
    expect('error' in result && result.details).toContain('f-required')
  })

  test('retyping a published field is rejected', async () => {
    const template = await publishedTemplate()
    const schema = buildTestTemplateSchema()
    schema.chapters[0]!.pages[0]!.fields[0]!.kind = 'scale_1_10'

    const result = await updateTemplate(template!.id, { schema })

    expect('error' in result && result.error).toBe('VALIDATION_ERROR')
  })

  test('deprecating + adding fields is allowed, bumps version, stamps server-side', async () => {
    const template = await publishedTemplate()
    const schema = buildTestTemplateSchema()
    const page = schema.chapters[0]!.pages[0]!
    page.fields.find((f) => f.id === 'f-optional')!.deprecatedInVersion = 1 // intent marker
    page.fields.push({ id: 'f-added', label: 'Added', kind: 'date', required: false })

    const result = await updateTemplate(template!.id, { schema })

    if ('error' in result) throw new Error(result.error)
    expect(result.template.version).toBe(2)
    const fields = result.template.schema.chapters[0]?.pages[0]?.fields ?? []
    expect(fields.find((f) => f.id === 'f-optional')?.deprecatedInVersion).toBe(2)
    expect(fields.find((f) => f.id === 'f-added')?.addedInVersion).toBe(2)
    expect(fields.find((f) => f.id === 'f-required')?.deprecatedInVersion).toBeUndefined()
  })

  test('title/sortOrder edits on a published template do NOT bump the version', async () => {
    const template = await publishedTemplate()

    const result = await updateTemplate(template!.id, { title: 'New Title', sortOrder: 9 })

    if ('error' in result) throw new Error(result.error)
    expect(result.template.version).toBe(1)
    expect(result.template.title).toBe('New Title')
  })
})

describe('listTemplates / getTemplate', () => {
  test('lists drafts too (admin view), optionally scoped by program', async () => {
    const program = await createTestProgram()
    const other = await createTestProgram()
    const draft = await createTestDocumentTemplate(program!.id, { status: 'draft' })
    await createTestDocumentTemplate(other!.id)

    const scoped = await listTemplates(program!.id)
    expect(scoped.templates.map((t) => t.id)).toEqual([draft!.id])

    const all = await listTemplates()
    expect(all.templates.length).toBeGreaterThanOrEqual(2)
  })

  test('getTemplate returns the row; unknown id → TEMPLATE_NOT_FOUND', async () => {
    const program = await createTestProgram()
    const template = await createTestDocumentTemplate(program!.id)

    const found = await getTemplate(template!.id)
    if ('error' in found) throw new Error(found.error)
    expect(found.template.id).toBe(template!.id)

    const missing = await getTemplate('00000000-0000-0000-0000-000000000000')
    expect('error' in missing && missing.error).toBe('TEMPLATE_NOT_FOUND')
  })

  test('there is no delete path — documents FK to templates', async () => {
    // Guard the design decision: the service module exposes no delete export.
    const service = await import('./service')
    expect(Object.keys(service).some((key) => key.toLowerCase().includes('delete'))).toBe(false)
  })
})

describe('version stamps persist to the column', () => {
  test('a v1-pinned reader sees the old view after a published update (end-to-end)', async () => {
    const program = await createTestProgram()
    const template = await createTestDocumentTemplate(program!.id, { status: 'published' })
    const schema = buildTestTemplateSchema()
    schema.chapters[0]!.pages[0]!.fields.push({
      id: 'f-v2',
      label: 'V2 field',
      kind: 'short_text',
      required: false,
    })
    await updateTemplate(template!.id, { schema })

    const [row] = await testDb
      .select()
      .from(documentTemplates)
      .where(eq(documentTemplates.id, template!.id))
    expect(row?.version).toBe(2)
    const { fieldIdsForVersion } = await import('@/platform/templates')
    expect(fieldIdsForVersion(row?.schema as never, 1)).toEqual(
      new Set(['f-required', 'f-optional']),
    )
    expect(fieldIdsForVersion(row?.schema as never, 2)).toEqual(
      new Set(['f-required', 'f-optional', 'f-v2']),
    )
  })
})
