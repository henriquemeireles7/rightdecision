import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { and, eq } from 'drizzle-orm'
import { documentTemplates, programs } from '@/platform/db/schema'
import { FREE_PROGRAM_SLUG, PAID_PROGRAM_SLUG } from '@/platform/programs'
import { validateTemplateSchemaForWrite } from '@/platform/templates'
import { setupTestDb, teardownTestDb, testDb } from '@/platform/test/setup'
import {
  LIFE_PLAYBOOK_SLUG,
  SEED_TEMPLATES,
  STARTER_NOTEBOOK_SLUG,
  seedTemplates,
} from './seed-templates'

describe('integration: seed-templates', () => {
  beforeAll(setupTestDb)
  afterAll(teardownTestDb)
  beforeEach(teardownTestDb)

  async function templateBySlug(slug: string) {
    const [row] = await testDb
      .select()
      .from(documentTemplates)
      .where(eq(documentTemplates.slug, slug))
    return row
  }

  test('seeds Life Playbook (paid) and Starter Notebook (free), published v1', async () => {
    const report = await seedTemplates(testDb)

    expect(report.created.sort()).toEqual([LIFE_PLAYBOOK_SLUG, STARTER_NOTEBOOK_SLUG].sort())
    const playbook = await templateBySlug(LIFE_PLAYBOOK_SLUG)
    const notebook = await templateBySlug(STARTER_NOTEBOOK_SLUG)
    expect(playbook?.status).toBe('published')
    expect(playbook?.version).toBe(1)
    expect(notebook?.status).toBe('published')

    const [paid] = await testDb
      .select()
      .from(programs)
      .where(eq(programs.id, playbook?.programId as string))
    const [free] = await testDb
      .select()
      .from(programs)
      .where(eq(programs.id, notebook?.programId as string))
    expect(paid?.slug).toBe(PAID_PROGRAM_SLUG)
    expect(paid?.tier).toBe('paid')
    expect(free?.slug).toBe(FREE_PROGRAM_SLUG)
    expect(free?.tier).toBe('free')
  })

  test('is idempotent by slug — run twice, zero new rows, drifted content restored', async () => {
    await seedTemplates(testDb)
    const playbook = await templateBySlug(LIFE_PLAYBOOK_SLUG)
    await testDb
      .update(documentTemplates)
      .set({ title: 'Drifted Title' })
      .where(eq(documentTemplates.id, playbook?.id as string))

    const report = await seedTemplates(testDb)

    expect(report.created).toEqual([])
    expect(report.updated.sort()).toEqual([LIFE_PLAYBOOK_SLUG, STARTER_NOTEBOOK_SLUG].sort())
    const rows = await testDb.select().from(documentTemplates)
    expect(rows).toHaveLength(2)
    expect((await templateBySlug(LIFE_PLAYBOOK_SLUG))?.title).toBe('Life Playbook')
  })

  test('never touches a template the admin has republished (version > 1)', async () => {
    await seedTemplates(testDb)
    const playbook = await templateBySlug(LIFE_PLAYBOOK_SLUG)
    await testDb
      .update(documentTemplates)
      .set({ version: 2, title: 'Admin Owned Now' })
      .where(eq(documentTemplates.id, playbook?.id as string))

    const report = await seedTemplates(testDb)

    expect(report.skipped).toEqual([LIFE_PLAYBOOK_SLUG])
    expect((await templateBySlug(LIFE_PLAYBOOK_SLUG))?.title).toBe('Admin Owned Now')
  })

  test('reuses existing programs instead of duplicating them', async () => {
    await testDb
      .insert(programs)
      .values({ slug: PAID_PROGRAM_SLUG, name: 'Existing Paid', tier: 'paid', status: 'active' })

    await seedTemplates(testDb)

    const paidRows = await testDb
      .select()
      .from(programs)
      .where(and(eq(programs.slug, PAID_PROGRAM_SLUG), eq(programs.tier, 'paid')))
    expect(paidRows).toHaveLength(1)
    expect(paidRows[0]?.name).toBe('Existing Paid')
  })
})

describe('seed template content (no DB)', () => {
  const playbook = SEED_TEMPLATES.find((t) => t.slug === LIFE_PLAYBOOK_SLUG)
  const notebook = SEED_TEMPLATES.find((t) => t.slug === STARTER_NOTEBOOK_SLUG)

  test('Life Playbook: 3 chapters / 7 pages per the roadmap', () => {
    expect(playbook?.schema.chapters.map((c) => c.title)).toEqual([
      'Who I Am',
      'What I Want',
      'My Plan',
    ])
    expect(playbook?.schema.chapters.map((c) => c.pages.map((p) => p.title))).toEqual([
      ['My Story', 'My Values', 'My Fears'],
      ['My Perfect Day', 'What I Want and Why'],
      ["This Year's Three Decisions", 'My Commitments'],
    ])
  })

  test('Starter Notebook: 1 chapter / 2 pages per the roadmap', () => {
    expect(notebook?.schema.chapters.map((c) => c.title)).toEqual(['Where I Am Now'])
    expect(notebook?.schema.chapters[0]?.pages.map((p) => p.title)).toEqual([
      "The One Decision I'm Avoiding",
      'My Perfect Day Lite',
    ])
  })

  test('every page is an invitation: instruction prose + 2-4 fields + an example answer', () => {
    for (const def of SEED_TEMPLATES) {
      for (const chapter of def.schema.chapters) {
        for (const page of chapter.pages) {
          expect(page.instruction?.length ?? 0).toBeGreaterThan(40)
          expect(page.fields.length).toBeGreaterThanOrEqual(2)
          expect(page.fields.length).toBeLessThanOrEqual(4)
          expect(page.fields.some((f) => (f.exampleAnswer?.length ?? 0) > 0)).toBe(true)
        }
      }
    }
  })

  test('the Life Playbook exercises all six v1 field kinds', () => {
    const kinds = new Set(
      playbook?.schema.chapters.flatMap((c) => c.pages.flatMap((p) => p.fields.map((f) => f.kind))),
    )
    expect(kinds).toEqual(
      new Set(['short_text', 'long_text', 'select', 'multi_select', 'date', 'scale_1_10']),
    )
  })

  test('schemas pass the full admin write validation (unique ids, options rules)', () => {
    for (const def of SEED_TEMPLATES) {
      expect(validateTemplateSchemaForWrite(def.schema)).toBeNull()
    }
  })

  test('voice smoke test: no AI-vocabulary words anywhere in the seeded prose', () => {
    const banned = ['delve', 'robust', 'comprehensive', 'journey', 'unlock', 'empower']
    for (const def of SEED_TEMPLATES) {
      const prose: string[] = [def.title]
      for (const chapter of def.schema.chapters) {
        prose.push(chapter.title)
        for (const page of chapter.pages) {
          prose.push(page.title, page.instruction ?? '')
          for (const field of page.fields) {
            prose.push(field.label, field.exampleAnswer ?? '', field.placeholder ?? '')
            prose.push(...(field.options ?? []))
          }
        }
      }
      const haystack = prose.join(' ').toLowerCase()
      for (const word of banned) {
        expect(haystack).not.toContain(word)
      }
    }
  })
})
