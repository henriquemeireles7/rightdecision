import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import matter from 'gray-matter'
import { Marked } from 'marked'
import { z } from 'zod'

// ─── Zod Schemas ────────────────────────────────────────────────────────────

export const BlogPostFrontmatter = z.object({
  title: z.string(),
  slug: z.string(),
  description: z.string(),
  author: z.enum(['henry', 'indy', 'henry-and-indy']),
  date: z.string(),
  updated: z.string().optional(),
  cluster: z.enum(['feeling-stuck', 'anti-self-help', 'decision-making', 'life-transitions']),
  tags: z.array(z.string()).optional(),
  keywords: z.array(z.string()),
  status: z.enum(['draft', 'published']),
})

export const ConceptFrontmatter = z.object({
  title: z.string(),
  slug: z.string(),
  description: z.string(),
  keywords: z.array(z.string()),
  relatedConcepts: z.array(z.string()).optional(),
  internalConcept: z.string().optional(),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })),
  status: z.enum(['draft', 'published']),
})

export const LegalFrontmatter = z.object({
  title: z.string(),
  slug: z.string(),
  description: z.string(),
  date: z.string(),
})

export type BlogPost = z.infer<typeof BlogPostFrontmatter>
export type Concept = z.infer<typeof ConceptFrontmatter>
export type Legal = z.infer<typeof LegalFrontmatter>

// ─── Markdown Renderer ──────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

const marked = new Marked({
  renderer: {
    heading({ text, depth }) {
      const id = slugify(text)
      return `<h${depth} id="${id}">${text}</h${depth}>\n`
    },
    link({ href, text }) {
      const isExternal = href.startsWith('http://') || href.startsWith('https://')
      if (isExternal) {
        return `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`
      }
      return `<a href="${href}">${text}</a>`
    },
  },
})

// ─── Public API ─────────────────────────────────────────────────────────────

export function parseFrontmatter(raw: string): {
  frontmatter: Record<string, unknown>
  body: string
} {
  const parsed = matter(raw)
  if (!parsed.data || Object.keys(parsed.data).length === 0) {
    throw new Error('Missing frontmatter')
  }
  return { frontmatter: parsed.data, body: parsed.content }
}

export function renderMarkdown(body: string): string {
  const result = marked.parse(body, { async: false })
  return result as string
}

export function calculateReadTime(body: string): number {
  const words = body.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

export type ParsedContentItem = {
  frontmatter: Record<string, unknown>
  slug: string
}

export type ParsedContentFull = {
  frontmatter: Record<string, unknown>
  html: string
  body: string
  readTime: number
}

export async function listContentFiles(dir: string): Promise<ParsedContentItem[]> {
  let files: string[]
  try {
    files = readdirSync(dir).filter((f) => f.endsWith('.md'))
  } catch {
    return []
  }

  const items: ParsedContentItem[] = []

  for (const file of files) {
    const raw = readFileSync(join(dir, file), 'utf-8')
    try {
      const { frontmatter } = parseFrontmatter(raw)
      if (frontmatter.status === 'draft') continue
      const slug = (frontmatter.slug as string) || file.replace('.md', '')
      items.push({ frontmatter: { ...frontmatter, slug }, slug })
    } catch {}
  }

  items.sort((a, b) => {
    const dateA = (a.frontmatter.date as string) || ''
    const dateB = (b.frontmatter.date as string) || ''
    return dateB.localeCompare(dateA)
  })

  return items
}

export async function getContentFile(dir: string, slug: string): Promise<ParsedContentFull | null> {
  // Sanitize slug to prevent path traversal
  if (slug.includes('..') || slug.includes('/') || slug.includes('\\')) return null

  const filePath = join(dir, `${slug}.md`)
  let raw: string
  try {
    raw = readFileSync(filePath, 'utf-8')
  } catch {
    return null
  }

  const { frontmatter, body } = parseFrontmatter(raw)
  if (frontmatter.status === 'draft') return null

  const html = renderMarkdown(body)
  const readTime = calculateReadTime(body)

  return { frontmatter: { ...frontmatter, slug }, html, body, readTime }
}
