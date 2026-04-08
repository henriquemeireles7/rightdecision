/**
 * Content freshness tracker.
 * Reports content older than 90 days without updates.
 * GEO citation decay: AI systems deprioritize content >3 months old.
 *
 * Usage: bun run freshness
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { parseFrontmatter } from '@/providers/markdown'

const CONTENT_DIRS = [
  { path: join(import.meta.dir, '../content/blog'), type: 'blog' },
  { path: join(import.meta.dir, '../content/concepts'), type: 'concept' },
]
const STALE_DAYS = 90

type ContentStatus = {
  slug: string
  type: string
  title: string
  lastUpdated: string
  daysOld: number
  stale: boolean
}

function getContentStatus(): ContentStatus[] {
  const results: ContentStatus[] = []
  const now = Date.now()

  for (const dir of CONTENT_DIRS) {
    let files: string[]
    try {
      files = readdirSync(dir.path).filter((f) => f.endsWith('.md'))
    } catch {
      continue
    }

    for (const file of files) {
      const filePath = join(dir.path, file)
      const raw = readFileSync(filePath, 'utf-8')

      try {
        const { frontmatter } = parseFrontmatter(raw)
        if (frontmatter.status === 'draft') continue

        // Use 'updated' date if available, otherwise 'date', otherwise file mtime
        const dateStr =
          (frontmatter.updated as string) ??
          (frontmatter.date as string) ??
          statSync(filePath).mtime.toISOString().split('T')[0]

        const lastUpdated = new Date(dateStr!.includes('T') ? dateStr! : `${dateStr}T12:00:00Z`)
        const daysOld = Math.floor((now - lastUpdated.getTime()) / (1000 * 60 * 60 * 24))

        results.push({
          slug: (frontmatter.slug as string) ?? file.replace('.md', ''),
          type: dir.type,
          title: (frontmatter.title as string) ?? file,
          lastUpdated: dateStr!,
          daysOld,
          stale: daysOld > STALE_DAYS,
        })
      } catch {}
    }
  }

  return results.sort((a, b) => b.daysOld - a.daysOld)
}

function main() {
  const content = getContentStatus()
  const stale = content.filter((c) => c.stale)
  const fresh = content.filter((c) => !c.stale)

  console.log(`\n=== Content Freshness Report ===`)
  console.log(`Total: ${content.length} | Fresh: ${fresh.length} | Stale (>${STALE_DAYS}d): ${stale.length}\n`)

  if (stale.length > 0) {
    console.log('STALE CONTENT (needs refresh):')
    for (const c of stale) {
      console.log(`  [${c.type}] ${c.title} — ${c.daysOld} days old (${c.lastUpdated})`)
    }
    console.log()
  }

  if (fresh.length > 0) {
    console.log('FRESH CONTENT:')
    for (const c of fresh) {
      console.log(`  [${c.type}] ${c.title} — ${c.daysOld} days old`)
    }
  }

  console.log()
  process.exit(stale.length > 0 ? 1 : 0)
}

main()
