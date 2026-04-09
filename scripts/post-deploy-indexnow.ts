/**
 * Post-deploy IndexNow submission script.
 * Submits new/changed URLs to search engines via IndexNow protocol.
 * Idempotent: tracks submitted URLs in .indexnow-submitted.json.
 *
 * Usage: bun run indexnow
 */
import { join } from 'node:path'
import { env } from '@/platform/env'
import {
  getUnsubmittedUrls,
  loadSubmittedLog,
  saveSubmittedLog,
  submitUrls,
} from '@/providers/indexnow'
import { listContentFiles } from '@/providers/markdown'

const BLOG_DIR = join(import.meta.dir, '../content/blog')
const CONCEPTS_DIR = join(import.meta.dir, '../content/concepts')

async function main() {
  if (!env.INDEXNOW_KEY) {
    console.log('INDEXNOW_KEY not set — skipping.')
    process.exit(0)
  }

  const baseUrl = env.PUBLIC_APP_URL

  // Build URL list from all published content
  const staticUrls = [
    `${baseUrl}/`,
    `${baseUrl}/about`,
    `${baseUrl}/life`,
    `${baseUrl}/blog`,
    `${baseUrl}/concepts`,
  ]

  const blogPosts = await listContentFiles(BLOG_DIR)
  const blogUrls = blogPosts.map((p) => `${baseUrl}/blog/${p.slug}`)

  const concepts = await listContentFiles(CONCEPTS_DIR)
  const conceptUrls = concepts.map((c) => `${baseUrl}/concepts/${c.slug}`)

  const allUrls = [...staticUrls, ...blogUrls, ...conceptUrls]

  // Filter already-submitted
  const log = loadSubmittedLog()
  const newUrls = getUnsubmittedUrls(allUrls, log)

  if (newUrls.length === 0) {
    console.log(`All ${allUrls.length} URLs already submitted. Nothing to do.`)
    process.exit(0)
  }

  console.log(`Submitting ${newUrls.length} new URLs (${allUrls.length} total)...`)

  const result = await submitUrls(newUrls)
  console.log(`Submitted ${result.submitted} URLs.`)

  // Update log
  const now = new Date().toISOString().split('T')[0]
  for (const url of newUrls) {
    log[url] = now!
  }
  saveSubmittedLog(log)

  console.log('Done. Log updated.')
}

main().catch((err) => {
  console.error('IndexNow submission failed:', err.message)
  process.exit(1)
})
