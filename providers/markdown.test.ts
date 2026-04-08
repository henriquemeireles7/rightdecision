import { describe, expect, test, beforeAll, afterAll } from 'bun:test'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import {
  parseFrontmatter,
  renderMarkdown,
  listContentFiles,
  getContentFile,
  calculateReadTime,
  BlogPostFrontmatter,
  ConceptFrontmatter,
  LegalFrontmatter,
} from './markdown'

const TEST_DIR = join(import.meta.dir, '../.test-content')

beforeAll(() => {
  mkdirSync(join(TEST_DIR, 'blog'), { recursive: true })
  mkdirSync(join(TEST_DIR, 'concepts'), { recursive: true })
  mkdirSync(join(TEST_DIR, 'legal'), { recursive: true })

  writeFileSync(
    join(TEST_DIR, 'blog/test-post.md'),
    `---
title: "Test Post"
slug: "test-post"
description: "A test blog post"
author: "henry"
date: "2026-04-07"
cluster: "anti-self-help"
keywords: ["test", "blog"]
status: "published"
---

# Hello World

This is a **test** post with [a link](https://example.com).

## Section Two

More content here.
`,
  )

  writeFileSync(
    join(TEST_DIR, 'blog/draft-post.md'),
    `---
title: "Draft Post"
slug: "draft-post"
description: "This is a draft"
author: "indy"
date: "2026-04-08"
cluster: "feeling-stuck"
keywords: ["draft"]
status: "draft"
---

Draft content.
`,
  )

  writeFileSync(
    join(TEST_DIR, 'blog/older-post.md'),
    `---
title: "Older Post"
slug: "older-post"
description: "An older post"
author: "henry-and-indy"
date: "2026-03-01"
cluster: "decision-making"
keywords: ["older"]
status: "published"
---

Older content here with enough words to test read time calculation. ${'word '.repeat(400)}
`,
  )

  writeFileSync(
    join(TEST_DIR, 'concepts/analysis-paralysis.md'),
    `---
title: "Analysis Paralysis"
slug: "analysis-paralysis"
description: "When overthinking prevents deciding"
keywords: ["analysis paralysis", "overthinking"]
relatedConcepts: ["decision-fatigue", "overthinking-decisions"]
internalConcept: "Sin #3"
faq:
  - question: "What is analysis paralysis?"
    answer: "The state of overthinking a decision to the point where no decision is made."
  - question: "How do you overcome analysis paralysis?"
    answer: "Set a decision deadline and commit to it."
status: "published"
---

Analysis paralysis is the state of overthinking a decision to the point where no decision is made at all.

## Why It Happens

People fear making the wrong choice.

## How to Overcome It

1. Set a deadline
2. Limit your options
3. Decide and commit
`,
  )

  writeFileSync(
    join(TEST_DIR, 'legal/privacy.md'),
    `---
title: "Privacy Policy"
slug: "privacy"
description: "How we handle your data"
date: "2026-04-07"
---

We collect your email and name.
`,
  )
})

afterAll(() => {
  rmSync(TEST_DIR, { recursive: true, force: true })
})

// ─── parseFrontmatter ───

describe('parseFrontmatter', () => {
  test('extracts YAML frontmatter and body', () => {
    const raw = `---
title: "Hello"
slug: "hello"
---

Body content here.`

    const result = parseFrontmatter(raw)
    expect(result.frontmatter.title).toBe('Hello')
    expect(result.frontmatter.slug).toBe('hello')
    expect(result.body).toContain('Body content here.')
  })

  test('throws on missing frontmatter', () => {
    expect(() => parseFrontmatter('No frontmatter here')).toThrow()
  })
})

// ─── renderMarkdown ───

describe('renderMarkdown', () => {
  test('converts markdown to HTML', () => {
    const html = renderMarkdown('# Hello\n\nThis is **bold**.')
    expect(html).toContain('<h1')
    expect(html).toContain('Hello')
    expect(html).toContain('<strong>bold</strong>')
  })

  test('generates heading IDs', () => {
    const html = renderMarkdown('## My Section Title')
    expect(html).toContain('id="my-section-title"')
  })

  test('adds target=_blank to external links', () => {
    const html = renderMarkdown('[Link](https://example.com)')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
  })

  test('does NOT add target=_blank to internal links', () => {
    const html = renderMarkdown('[Link](/about)')
    expect(html).not.toContain('target="_blank"')
  })

  test('handles code blocks', () => {
    const html = renderMarkdown('```js\nconst x = 1\n```')
    expect(html).toContain('<code')
  })

  test('handles lists', () => {
    const html = renderMarkdown('- Item 1\n- Item 2')
    expect(html).toContain('<li>')
  })
})

// ─── calculateReadTime ───

describe('calculateReadTime', () => {
  test('returns 1 min for short content', () => {
    expect(calculateReadTime('word '.repeat(100))).toBe(1)
  })

  test('returns correct time for longer content', () => {
    expect(calculateReadTime('word '.repeat(400))).toBe(2)
    expect(calculateReadTime('word '.repeat(600))).toBe(3)
  })
})

// ─── listContentFiles ───

describe('listContentFiles', () => {
  test('returns only published posts sorted by date desc', async () => {
    const posts = await listContentFiles(join(TEST_DIR, 'blog'))
    expect(posts.length).toBe(2) // excludes draft
    expect(posts[0]!.frontmatter.slug).toBe('test-post') // newer first
    expect(posts[1]!.frontmatter.slug).toBe('older-post')
  })

  test('filters out draft posts', async () => {
    const posts = await listContentFiles(join(TEST_DIR, 'blog'))
    const slugs = posts.map((p) => p.frontmatter.slug)
    expect(slugs).not.toContain('draft-post')
  })

  test('returns concept pages', async () => {
    const concepts = await listContentFiles(join(TEST_DIR, 'concepts'))
    expect(concepts.length).toBe(1)
    expect(concepts[0]!.frontmatter.slug).toBe('analysis-paralysis')
  })
})

// ─── getContentFile ───

describe('getContentFile', () => {
  test('returns parsed content for valid slug', async () => {
    const post = await getContentFile(join(TEST_DIR, 'blog'), 'test-post')
    expect(post).not.toBeNull()
    expect(post!.frontmatter.title).toBe('Test Post')
    expect(post!.html).toContain('<strong>test</strong>')
    expect(post!.readTime).toBeGreaterThan(0)
  })

  test('returns null for non-existent slug', async () => {
    const post = await getContentFile(join(TEST_DIR, 'blog'), 'no-such-post')
    expect(post).toBeNull()
  })

  test('returns null for draft post', async () => {
    const post = await getContentFile(join(TEST_DIR, 'blog'), 'draft-post')
    expect(post).toBeNull()
  })

  test('blocks path traversal attempts', async () => {
    const post1 = await getContentFile(join(TEST_DIR, 'blog'), '../../../etc/passwd')
    expect(post1).toBeNull()
    const post2 = await getContentFile(join(TEST_DIR, 'blog'), 'foo/bar')
    expect(post2).toBeNull()
    const post3 = await getContentFile(join(TEST_DIR, 'blog'), '..\\windows\\system32')
    expect(post3).toBeNull()
  })

  test('parses concept page with faq', async () => {
    const concept = await getContentFile(join(TEST_DIR, 'concepts'), 'analysis-paralysis')
    expect(concept).not.toBeNull()
    const faq = concept!.frontmatter.faq as Array<{ question: string; answer: string }>
    expect(faq).toHaveLength(2)
    expect(faq[0]!.question).toBe('What is analysis paralysis?')
  })
})

// ─── Zod Schemas ───

describe('Zod schemas', () => {
  test('BlogPostFrontmatter validates correct data', () => {
    const result = BlogPostFrontmatter.safeParse({
      title: 'Test',
      slug: 'test',
      description: 'desc',
      author: 'henry',
      date: '2026-04-07',
      cluster: 'anti-self-help',
      keywords: ['test'],
      status: 'published',
    })
    expect(result.success).toBe(true)
  })

  test('BlogPostFrontmatter rejects invalid author', () => {
    const result = BlogPostFrontmatter.safeParse({
      title: 'Test',
      slug: 'test',
      description: 'desc',
      author: 'unknown-author',
      date: '2026-04-07',
      cluster: 'anti-self-help',
      keywords: ['test'],
      status: 'published',
    })
    expect(result.success).toBe(false)
  })

  test('BlogPostFrontmatter rejects invalid cluster', () => {
    const result = BlogPostFrontmatter.safeParse({
      title: 'Test',
      slug: 'test',
      description: 'desc',
      author: 'henry',
      date: '2026-04-07',
      cluster: 'invalid-cluster',
      keywords: ['test'],
      status: 'published',
    })
    expect(result.success).toBe(false)
  })

  test('ConceptFrontmatter validates with faq array', () => {
    const result = ConceptFrontmatter.safeParse({
      title: 'Test',
      slug: 'test',
      description: 'desc',
      keywords: ['test'],
      faq: [{ question: 'Q?', answer: 'A.' }],
      status: 'published',
    })
    expect(result.success).toBe(true)
  })

  test('ConceptFrontmatter rejects missing faq', () => {
    const result = ConceptFrontmatter.safeParse({
      title: 'Test',
      slug: 'test',
      description: 'desc',
      keywords: ['test'],
      status: 'published',
    })
    expect(result.success).toBe(false)
  })

  test('LegalFrontmatter validates', () => {
    const result = LegalFrontmatter.safeParse({
      title: 'Privacy',
      slug: 'privacy',
      description: 'desc',
      date: '2026-04-07',
    })
    expect(result.success).toBe(true)
  })
})
