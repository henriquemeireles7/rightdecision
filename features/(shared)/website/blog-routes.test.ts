import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// We test the blog route logic by importing the markdown provider directly
// and verifying the data flow, since the full routes need renderPage which
// requires the global CSS file. Integration test approach.
import { getContentFile, listContentFiles } from '@/providers/markdown'

const TEST_DIR = join(import.meta.dir, '../../../.test-blog-content')

beforeAll(() => {
  mkdirSync(join(TEST_DIR), { recursive: true })

  writeFileSync(
    join(TEST_DIR, 'post-one.md'),
    `---
title: "First Post"
slug: "post-one"
description: "The first post"
author: "henry"
date: "2026-04-07"
cluster: "anti-self-help"
keywords: ["test"]
status: "published"
---

# First Post

This is the first post content.
`,
  )

  writeFileSync(
    join(TEST_DIR, 'post-two.md'),
    `---
title: "Second Post"
slug: "post-two"
description: "The second post"
author: "indy"
date: "2026-04-06"
cluster: "feeling-stuck"
keywords: ["test"]
status: "published"
---

# Second Post

This is the second post.
`,
  )

  writeFileSync(
    join(TEST_DIR, 'draft-post.md'),
    `---
title: "Draft"
slug: "draft-post"
description: "A draft"
author: "henry"
date: "2026-04-08"
cluster: "decision-making"
keywords: ["test"]
status: "draft"
---

Draft content.
`,
  )
})

afterAll(() => {
  rmSync(TEST_DIR, { recursive: true, force: true })
})

describe('Blog data layer', () => {
  test('lists published posts sorted by date desc', async () => {
    const posts = await listContentFiles(TEST_DIR)
    expect(posts.length).toBe(2)
    expect(posts[0]!.slug).toBe('post-one') // 2026-04-07, newer
    expect(posts[1]!.slug).toBe('post-two') // 2026-04-06, older
  })

  test('filters by cluster', async () => {
    const posts = await listContentFiles(TEST_DIR)
    const filtered = posts.filter((p) => p.frontmatter.cluster === 'anti-self-help')
    expect(filtered.length).toBe(1)
    expect(filtered[0]!.slug).toBe('post-one')
  })

  test('excludes drafts', async () => {
    const posts = await listContentFiles(TEST_DIR)
    const slugs = posts.map((p) => p.slug)
    expect(slugs).not.toContain('draft-post')
  })

  test('gets individual post', async () => {
    const post = await getContentFile(TEST_DIR, 'post-one')
    expect(post).not.toBeNull()
    expect(post!.frontmatter.title).toBe('First Post')
    expect(post!.html).toContain('<h1')
    expect(post!.readTime).toBeGreaterThan(0)
  })

  test('returns null for non-existent post', async () => {
    const post = await getContentFile(TEST_DIR, 'no-such-post')
    expect(post).toBeNull()
  })

  test('returns null for draft post', async () => {
    const post = await getContentFile(TEST_DIR, 'draft-post')
    expect(post).toBeNull()
  })

  test('pagination logic works', async () => {
    const posts = await listContentFiles(TEST_DIR)
    const perPage = 1
    const page1 = posts.slice(0, perPage)
    const page2 = posts.slice(perPage, perPage * 2)
    expect(page1.length).toBe(1)
    expect(page1[0]!.slug).toBe('post-one')
    expect(page2.length).toBe(1)
    expect(page2[0]!.slug).toBe('post-two')
  })
})
