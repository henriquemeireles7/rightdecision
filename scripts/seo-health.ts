/**
 * SEO health dashboard script.
 * Monthly review of content inventory, freshness, indexing, and search performance.
 *
 * Usage: bun run seo-health
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { env } from '@/platform/env'
import { parseFrontmatter } from '@/providers/markdown'
import { getSearchAnalytics, inspectUrl, isConfigured } from '@/providers/search-console'

const BLOG_DIR = join(import.meta.dir, '../content/blog')
const CONCEPTS_DIR = join(import.meta.dir, '../content/concepts')
const STALE_DAYS = 90

type ContentInfo = {
  slug: string
  type: string
  title: string
  status: string
  daysOld: number
}

function scanContent(): ContentInfo[] {
  const results: ContentInfo[] = []
  const now = Date.now()

  const dirs = [
    { path: BLOG_DIR, type: 'blog' },
    { path: CONCEPTS_DIR, type: 'concept' },
  ]

  for (const dir of dirs) {
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
          status: (frontmatter.status as string) ?? 'published',
          daysOld,
        })
      } catch {}
    }
  }
  return results
}

async function main() {
  console.log('\n========================================')
  console.log('  SEO HEALTH DASHBOARD')
  console.log('========================================\n')

  // ─── 1. Content Inventory ───
  const content = scanContent()
  const published = content.filter((c) => c.status === 'published')
  const drafts = content.filter((c) => c.status === 'draft')
  const blogs = published.filter((c) => c.type === 'blog')
  const concepts = published.filter((c) => c.type === 'concept')

  console.log('1. CONTENT INVENTORY')
  console.log(
    `   Published: ${published.length} (${blogs.length} blog, ${concepts.length} concept)`,
  )
  console.log(`   Drafts: ${drafts.length}`)
  console.log()

  // ─── 2. Content Freshness ───
  const stale = published.filter((c) => c.daysOld > STALE_DAYS)
  const freshPercent =
    published.length > 0
      ? Math.round(((published.length - stale.length) / published.length) * 100)
      : 100

  console.log('2. CONTENT FRESHNESS')
  console.log(
    `   Fresh (<${STALE_DAYS}d): ${published.length - stale.length} | Stale: ${stale.length} | ${freshPercent}% fresh`,
  )
  if (stale.length > 0) {
    console.log('   Worst offenders:')
    stale
      .sort((a, b) => b.daysOld - a.daysOld)
      .slice(0, 5)
      .forEach((c) => {
        console.log(`     - ${c.title} (${c.daysOld} days)`)
      })
  }
  console.log()

  // ─── 3. Indexing Status ───
  if (isConfigured()) {
    console.log('3. INDEXING STATUS')
    const baseUrl = env.PUBLIC_APP_URL
    const siteUrl = `sc-domain:${new URL(baseUrl).hostname}`
    let indexed = 0
    let notIndexed = 0
    let errors = 0

    for (const page of published.slice(0, 10)) {
      const url =
        page.type === 'blog' ? `${baseUrl}/blog/${page.slug}` : `${baseUrl}/concepts/${page.slug}`
      try {
        const result = await inspectUrl(siteUrl, url)
        if (result.verdict === 'PASS') indexed++
        else notIndexed++
      } catch {
        errors++
      }
    }
    console.log(
      `   Indexed: ${indexed} | Not indexed: ${notIndexed} | Errors: ${errors} (checked ${Math.min(published.length, 10)} pages)`,
    )
    console.log()

    // ─── 4. Search Performance ───
    console.log('4. SEARCH PERFORMANCE (last 28 days)')
    try {
      const endDate = new Date().toISOString().split('T')[0]!
      const startDate = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!
      const rows = await getSearchAnalytics(siteUrl, { startDate, endDate })

      if (rows.length > 0) {
        const totalClicks = rows.reduce((s, r) => s + r.clicks, 0)
        const totalImpressions = rows.reduce((s, r) => s + r.impressions, 0)
        const avgPosition = rows.reduce((s, r) => s + r.position, 0) / rows.length

        console.log(`   Total clicks: ${totalClicks} | Impressions: ${totalImpressions}`)
        console.log(`   Avg position: ${avgPosition.toFixed(1)}`)
        console.log('   Top queries:')
        rows
          .sort((a, b) => b.clicks - a.clicks)
          .slice(0, 5)
          .forEach((r) => {
            console.log(
              `     - "${r.keys[0]}" — ${r.clicks} clicks, pos ${r.position.toFixed(1)}`,
            )
          })
      } else {
        console.log('   No search data available yet.')
      }
    } catch (e) {
      console.log(`   Search data unavailable: ${(e as Error).message}`)
    }
    console.log()
  } else {
    console.log('3. INDEXING STATUS: Search Console not configured')
    console.log('4. SEARCH PERFORMANCE: Search Console not configured')
    console.log()
  }

  // ─── 5. Summary Score ───
  const freshnessScore = freshPercent * 0.4
  const inventoryScore = Math.min(published.length / 25, 1) * 30 // target 25 pages
  const configScore = isConfigured() ? 30 : 15 // 30 if SC configured, 15 for partial

  const totalScore = Math.round(freshnessScore + inventoryScore + configScore)

  console.log('5. HEALTH SCORE')
  console.log(`   Freshness (40%): ${Math.round(freshnessScore)}/40`)
  console.log(`   Inventory (30%): ${Math.round(inventoryScore)}/30`)
  console.log(`   Configuration (30%): ${Math.round(configScore)}/30`)
  console.log(`   ─────────────────`)
  console.log(`   TOTAL: ${totalScore}/100`)
  console.log()
}

main().catch((err) => {
  console.error('SEO health check failed:', err.message)
  process.exit(1)
})
