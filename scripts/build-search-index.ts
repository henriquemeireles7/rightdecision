/**
 * Build-time search index generator for Fuse.js
 * Outputs: public/search-index.json
 * Reads all content directories, extracts title + description + body text
 * Capped at 200KB — logs warning if exceeded
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { getContentFile, listContentFiles } from '../providers/markdown'

type SearchEntry = {
  title: string
  description: string
  body: string
  type: string
  url: string
}

const CONTENT_SECTIONS = [
  { dir: 'content/handbook', type: 'handbook', urlPrefix: '/handbook', recursive: true },
  { dir: 'content/blog', type: 'blog', urlPrefix: '/blog', recursive: false },
  { dir: 'content/method', type: 'method', urlPrefix: '/method', recursive: false },
  { dir: 'content/guides', type: 'guides', urlPrefix: '/guides', recursive: false },
  { dir: 'content/help', type: 'help', urlPrefix: '/help', recursive: true },
  { dir: 'content/changelog', type: 'changelog', urlPrefix: '/changelog', recursive: false },
]

const MAX_BODY_LENGTH = 500
const MAX_INDEX_SIZE = 200 * 1024

async function buildSearchIndex(): Promise<void> {
  const entries: SearchEntry[] = []

  for (const section of CONTENT_SECTIONS) {
    const dir = join(process.cwd(), section.dir)
    const items = await listContentFiles(dir, { recursive: section.recursive })

    for (const item of items) {
      const full = await getContentFile(dir, item.slug, { allowNested: section.recursive })
      if (!full) continue

      entries.push({
        title: (full.frontmatter.title as string) || item.slug,
        description: (full.frontmatter.description as string) || '',
        body: full.body.slice(0, MAX_BODY_LENGTH).replace(/[#*_`[\]]/g, ''),
        type: section.type,
        url: `${section.urlPrefix}/${item.slug}`,
      })
    }
  }

  const json = JSON.stringify(entries)
  const sizeKB = Math.round(json.length / 1024)

  if (json.length > MAX_INDEX_SIZE) {
    console.warn(
      `Search index is ${sizeKB}KB (exceeds ${MAX_INDEX_SIZE / 1024}KB cap). Consider splitting per-type.`,
    )
  }

  mkdirSync(join(process.cwd(), 'public'), { recursive: true })
  writeFileSync(join(process.cwd(), 'public/search-index.json'), json)
  console.log(`Search index: ${entries.length} entries, ${sizeKB}KB`)
}

buildSearchIndex().catch((err) => {
  console.warn('Search index build failed, writing empty index:', err)
  mkdirSync(join(process.cwd(), 'public'), { recursive: true })
  writeFileSync(join(process.cwd(), 'public/search-index.json'), '[]')
})
