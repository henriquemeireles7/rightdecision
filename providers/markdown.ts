import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
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

export const MethodFrontmatter = z.object({
  title: z.string(),
  slug: z.string(),
  description: z.string(),
  keywords: z.array(z.string()),
  related: z.array(z.string()).optional(),
  relatedConcepts: z.array(z.string()).optional(),
  internalConcept: z.string().optional(),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })),
  status: z.enum(['draft', 'published']),
})

export const HandbookFrontmatter = z.object({
  title: z.string(),
  slug: z.string().optional(),
  description: z.string(),
  section: z.string().optional(),
  order: z.number().optional(),
  keywords: z.array(z.string()).optional(),
  related: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published']),
})

export const GuideFrontmatter = z.object({
  title: z.string(),
  slug: z.string().optional(),
  description: z.string(),
  order: z.number().optional(),
  keywords: z.array(z.string()).optional(),
  related: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published']),
})

export const HelpFrontmatter = z.object({
  title: z.string(),
  slug: z.string().optional(),
  description: z.string(),
  topic: z.string().optional(),
  order: z.number().optional(),
  keywords: z.array(z.string()).optional(),
  related: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published']),
})

export const ChangelogFrontmatter = z.object({
  title: z.string(),
  slug: z.string().optional(),
  description: z.string().optional(),
  date: z.string(),
  version: z.string().optional(),
  type: z.enum(['feature', 'fix', 'improvement']).optional(),
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
export type Method = z.infer<typeof MethodFrontmatter>
export type Handbook = z.infer<typeof HandbookFrontmatter>
export type Guide = z.infer<typeof GuideFrontmatter>
export type Help = z.infer<typeof HelpFrontmatter>
export type Changelog = z.infer<typeof ChangelogFrontmatter>
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

function isSafeUrl(url: string): boolean {
  const lower = url.trim().toLowerCase()
  return (
    !lower.startsWith('javascript:') && !lower.startsWith('data:') && !lower.startsWith('vbscript:')
  )
}

const marked = new Marked({
  renderer: {
    heading({ text, depth }) {
      const id = slugify(text)
      return `<h${depth} id="${id}">${text}</h${depth}>\n`
    },
    link({ href, text }) {
      if (!isSafeUrl(href)) return text
      const isExternal = href.startsWith('http://') || href.startsWith('https://')
      if (isExternal) {
        return `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`
      }
      return `<a href="${href}">${text}</a>`
    },
    image({ href, title, text }) {
      if (!isSafeUrl(href)) return ''
      const alt = text ? ` alt="${text}"` : ' alt=""'
      const titleAttr = title ? ` title="${title}"` : ''
      return `<img src="${href}"${alt}${titleAttr} loading="lazy" />`
    },
  },
})

// ─── Course Markdown Renderer (editorial extensions) ────────────────────────

const courseMarked = new Marked({
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
    blockquote({ text }) {
      // text is the rendered inner HTML of the blockquote
      const trimmed = text.trim()

      // Check for [!quote] directive — with or without <p> wrapping
      const quoteWithP = trimmed.match(/^<p>\[!quote\]\s*(?:<br\s*\/?>)?\s*([\s\S]*?)<\/p>/)
      if (quoteWithP) {
        return `<div class="pull-quote">${quoteWithP[1]!.trim()}</div>\n`
      }
      const quoteRaw = trimmed.match(/^\[!quote\]\s*([\s\S]*)/)
      if (quoteRaw) {
        return `<div class="pull-quote">${quoteRaw[1]!.trim()}</div>\n`
      }

      // Check for [!insight] directive — with or without <p> wrapping
      const insightWithP = trimmed.match(/^<p>\[!insight\]\s*(?:<br\s*\/?>)?\s*([\s\S]*?)<\/p>/)
      if (insightWithP) {
        return `<div class="insight-callout"><span class="insight-label">Insight</span>${insightWithP[1]!.trim()}</div>\n`
      }
      const insightRaw = trimmed.match(/^\[!insight\]\s*([\s\S]*)/)
      if (insightRaw) {
        return `<div class="insight-callout"><span class="insight-label">Insight</span>${insightRaw[1]!.trim()}</div>\n`
      }

      // Default blockquote
      return `<blockquote>\n${text}</blockquote>\n`
    },
  },
})

/**
 * Render course content with editorial extensions:
 * - [!quote] blockquotes → pull quotes with gold border
 * - [!insight] blockquotes → insight callouts with sand background
 * - First paragraph gets .drop-cap class for ::first-letter styling
 */
export function renderCourseMarkdown(body: string): string {
  let result = courseMarked.parse(body, { async: false }) as string
  // Add drop-cap class to first <p> tag
  result = result.replace(/<p>/, '<p class="drop-cap">')
  return result
}

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

export type ContentHeading = {
  id: string
  text: string
  depth: number
}

export function extractHeadings(body: string): ContentHeading[] {
  const headings: ContentHeading[] = []
  const regex = /^(#{2,3})\s+(.+)$/gm
  let match: RegExpExecArray | null = regex.exec(body)
  while (match !== null) {
    headings.push({
      id: slugify(match[2]!),
      text: match[2]!,
      depth: match[1]!.length,
    })
    match = regex.exec(body)
  }
  return headings
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
  headings: ContentHeading[]
}

function collectMdFiles(dir: string, recursive: boolean, prefix = ''): string[] {
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return []
  }

  const files: string[] = []
  for (const entry of entries) {
    const fullPath = join(dir, entry)
    try {
      const stat = statSync(fullPath)
      if (stat.isFile() && entry.endsWith('.md')) {
        files.push(prefix ? `${prefix}/${entry}` : entry)
      } else if (recursive && stat.isDirectory() && !entry.startsWith('.')) {
        files.push(...collectMdFiles(fullPath, true, prefix ? `${prefix}/${entry}` : entry))
      }
    } catch {}
  }
  return files
}

export async function listContentFiles(
  dir: string,
  options?: { recursive?: boolean },
): Promise<ParsedContentItem[]> {
  const recursive = options?.recursive ?? false
  const files = collectMdFiles(dir, recursive)

  const items: ParsedContentItem[] = []

  for (const file of files) {
    const raw = readFileSync(join(dir, file), 'utf-8')
    try {
      const { frontmatter } = parseFrontmatter(raw)
      if (frontmatter.status === 'draft') continue
      const slug = (frontmatter.slug as string) || file.replace('.md', '').replace(/\\/g, '/')
      items.push({ frontmatter: { ...frontmatter, slug }, slug })
    } catch {
      console.warn(`Skipping ${file}: invalid frontmatter`)
    }
  }

  items.sort((a, b) => {
    const dateA = (a.frontmatter.date as string) || ''
    const dateB = (b.frontmatter.date as string) || ''
    return dateB.localeCompare(dateA)
  })

  return items
}

export async function getContentFile(
  dir: string,
  slug: string,
  options?: { allowNested?: boolean },
): Promise<ParsedContentFull | null> {
  // Block path traversal
  if (slug.includes('..') || slug.includes('\\')) return null

  // Nested slugs (section/page) allowed when explicitly enabled
  if (slug.includes('/') && !options?.allowNested) return null

  // Resolve and verify the path stays within the content directory
  const resolvedDir = resolve(dir)
  const filePath = resolve(dir, `${slug}.md`)
  if (!filePath.startsWith(resolvedDir)) return null

  let raw: string
  try {
    raw = readFileSync(filePath, 'utf-8')
  } catch {
    return null
  }

  try {
    const { frontmatter, body } = parseFrontmatter(raw)
    if (frontmatter.status === 'draft') return null

    const html = renderMarkdown(body)
    const readTime = calculateReadTime(body)
    const headings = extractHeadings(body)

    return { frontmatter: { ...frontmatter, slug }, html, body, readTime, headings }
  } catch {
    console.warn(`Failed to parse ${slug}: invalid frontmatter`)
    return null
  }
}
