/**
 * Content quality validation script.
 * Checks blog posts and concept pages against quality gates from Doc 11 Section 7.
 *
 * Usage: bun run content:check
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseFrontmatter } from '@/providers/markdown'

const BLOG_DIR = join(import.meta.dir, '../content/blog')
const CONCEPTS_DIR = join(import.meta.dir, '../content/concepts')

type Issue = { file: string; check: string; message: string; severity: 'error' | 'warning' }

function checkFile(filePath: string, type: 'blog' | 'concept'): Issue[] {
  const issues: Issue[] = []
  const file = filePath.split('/').pop()!
  const raw = readFileSync(filePath, 'utf-8')

  let frontmatter: Record<string, unknown>
  let body: string
  try {
    const parsed = parseFrontmatter(raw)
    frontmatter = parsed.frontmatter
    body = parsed.body
  } catch {
    issues.push({
      file,
      check: 'frontmatter',
      message: 'Missing or invalid frontmatter',
      severity: 'error',
    })
    return issues
  }

  if (frontmatter.status === 'draft') return issues

  // Word count (1,000-2,500 for blog, 800-2,500 for concepts)
  const wordCount = body.split(/\s+/).filter(Boolean).length
  const minWords = type === 'blog' ? 1000 : 800
  if (wordCount < minWords) {
    issues.push({
      file,
      check: 'word-count',
      message: `${wordCount} words (min ${minWords})`,
      severity: 'warning',
    })
  }
  if (wordCount > 2500) {
    issues.push({
      file,
      check: 'word-count',
      message: `${wordCount} words (max 2500)`,
      severity: 'warning',
    })
  }

  // Keywords present
  const keywords = frontmatter.keywords as string[] | undefined
  if (!keywords || keywords.length === 0) {
    issues.push({
      file,
      check: 'keywords',
      message: 'No keywords in frontmatter',
      severity: 'error',
    })
  } else if (keywords.length < 3) {
    issues.push({
      file,
      check: 'keywords',
      message: `Only ${keywords.length} keywords (min 3)`,
      severity: 'warning',
    })
  }

  // Description length (120-160 chars for SEO)
  const desc = frontmatter.description as string | undefined
  if (!desc) {
    issues.push({
      file,
      check: 'description',
      message: 'No description in frontmatter',
      severity: 'error',
    })
  } else if (desc.length < 120) {
    issues.push({
      file,
      check: 'description',
      message: `Description too short (${desc.length} chars, min 120)`,
      severity: 'warning',
    })
  } else if (desc.length > 160) {
    issues.push({
      file,
      check: 'description',
      message: `Description too long (${desc.length} chars, max 160)`,
      severity: 'warning',
    })
  }

  // Internal links (min 3 for blog, min 2 for concepts)
  const internalLinks = (body.match(/\]\(\//g) || []).length
  const minLinks = type === 'blog' ? 3 : 2
  if (internalLinks < minLinks) {
    issues.push({
      file,
      check: 'internal-links',
      message: `${internalLinks} internal links (min ${minLinks})`,
      severity: 'warning',
    })
  }

  // FAQ pairs (concepts only)
  if (type === 'concept') {
    const faq = frontmatter.faq as Array<{ question: string; answer: string }> | undefined
    if (!faq || faq.length < 4) {
      issues.push({
        file,
        check: 'faq',
        message: `${faq?.length ?? 0} FAQ pairs (min 4)`,
        severity: 'warning',
      })
    }
  }

  // H1 heading check (should have exactly 0 in body — title is in frontmatter)
  const h1Count = (body.match(/^# /gm) || []).length
  if (h1Count > 0) {
    issues.push({
      file,
      check: 'heading',
      message: `${h1Count} H1 heading(s) in body (use H2+)`,
      severity: 'warning',
    })
  }

  return issues
}

function main() {
  const allIssues: Issue[] = []

  // Blog posts
  try {
    const blogFiles = readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md'))
    for (const file of blogFiles) {
      allIssues.push(...checkFile(join(BLOG_DIR, file), 'blog'))
    }
  } catch {}

  // Concept pages
  try {
    const conceptFiles = readdirSync(CONCEPTS_DIR).filter((f) => f.endsWith('.md'))
    for (const file of conceptFiles) {
      allIssues.push(...checkFile(join(CONCEPTS_DIR, file), 'concept'))
    }
  } catch {}

  const errors = allIssues.filter((i) => i.severity === 'error')
  const warnings = allIssues.filter((i) => i.severity === 'warning')

  console.log('\n=== Content Quality Report ===')
  console.log(`Errors: ${errors.length} | Warnings: ${warnings.length}\n`)

  if (errors.length > 0) {
    console.log('ERRORS:')
    for (const i of errors) {
      console.log(`  ${i.file} [${i.check}]: ${i.message}`)
    }
    console.log()
  }

  if (warnings.length > 0) {
    console.log('WARNINGS:')
    for (const i of warnings) {
      console.log(`  ${i.file} [${i.check}]: ${i.message}`)
    }
  }

  console.log()
  process.exit(errors.length > 0 ? 1 : 0)
}

main()
