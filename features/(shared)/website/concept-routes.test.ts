import { describe, expect, test, beforeAll, afterAll } from 'bun:test'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { listContentFiles, getContentFile } from '@/providers/markdown'

const TEST_DIR = join(import.meta.dir, '../../../.test-concept-content')

beforeAll(() => {
  mkdirSync(TEST_DIR, { recursive: true })

  writeFileSync(
    join(TEST_DIR, 'analysis-paralysis.md'),
    `---
title: "Analysis Paralysis"
slug: "analysis-paralysis"
description: "When overthinking prevents deciding"
keywords: ["analysis paralysis", "overthinking"]
relatedConcepts: ["decision-fatigue"]
internalConcept: "Sin #3"
faq:
  - question: "What is analysis paralysis?"
    answer: "The state of overthinking a decision."
  - question: "How do you overcome it?"
    answer: "Set a decision deadline."
status: "published"
---

Analysis paralysis is the state of overthinking a decision to the point where no decision is made.

## Why It Happens

People fear making the wrong choice.
`,
  )

  writeFileSync(
    join(TEST_DIR, 'decision-fatigue.md'),
    `---
title: "Decision Fatigue"
slug: "decision-fatigue"
description: "Why making too many decisions exhausts you"
keywords: ["decision fatigue"]
relatedConcepts: ["analysis-paralysis"]
faq:
  - question: "What is decision fatigue?"
    answer: "Mental exhaustion from making too many decisions."
status: "published"
---

Decision fatigue is the deterioration of decision quality after a long session of decision making.
`,
  )

  writeFileSync(
    join(TEST_DIR, 'draft-concept.md'),
    `---
title: "Draft Concept"
slug: "draft-concept"
description: "A draft"
keywords: ["draft"]
faq: []
status: "draft"
---

Draft content.
`,
  )
})

afterAll(() => {
  rmSync(TEST_DIR, { recursive: true, force: true })
})

describe('Concept data layer', () => {
  test('lists published concepts', async () => {
    const concepts = await listContentFiles(TEST_DIR)
    expect(concepts.length).toBe(2)
  })

  test('sorts alphabetically by title', async () => {
    const concepts = await listContentFiles(TEST_DIR)
    concepts.sort((a, b) =>
      ((a.frontmatter.title as string) || '').localeCompare((b.frontmatter.title as string) || ''),
    )
    expect(concepts[0]!.slug).toBe('analysis-paralysis')
    expect(concepts[1]!.slug).toBe('decision-fatigue')
  })

  test('excludes drafts', async () => {
    const concepts = await listContentFiles(TEST_DIR)
    const slugs = concepts.map((c) => c.slug)
    expect(slugs).not.toContain('draft-concept')
  })

  test('gets concept with faq', async () => {
    const concept = await getContentFile(TEST_DIR, 'analysis-paralysis')
    expect(concept).not.toBeNull()
    expect(concept!.frontmatter.title).toBe('Analysis Paralysis')
    const faq = concept!.frontmatter.faq as Array<{ question: string; answer: string }>
    expect(faq).toHaveLength(2)
    expect(faq[0]!.question).toBe('What is analysis paralysis?')
  })

  test('gets related concepts', async () => {
    const concept = await getContentFile(TEST_DIR, 'analysis-paralysis')
    expect(concept).not.toBeNull()
    const related = concept!.frontmatter.relatedConcepts as string[]
    expect(related).toContain('decision-fatigue')
  })

  test('returns null for draft concept', async () => {
    const concept = await getContentFile(TEST_DIR, 'draft-concept')
    expect(concept).toBeNull()
  })

  test('returns null for non-existent', async () => {
    const concept = await getContentFile(TEST_DIR, 'no-such-concept')
    expect(concept).toBeNull()
  })

  test('extracts first paragraph for DefinedTerm', async () => {
    const concept = await getContentFile(TEST_DIR, 'analysis-paralysis')
    expect(concept).not.toBeNull()
    const firstPara = concept!.body.split('\n\n')[0]?.trim()
    expect(firstPara).toContain('Analysis paralysis is the state')
  })
})
