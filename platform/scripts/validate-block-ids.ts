/**
 * Build-time validator: ensures all blockIds in .mdx lesson files are unique within each lesson.
 * Run: bun platform/scripts/validate-block-ids.ts
 * Exits with code 1 if duplicates found.
 */

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const CONTENT_DIR = join(process.cwd(), 'content/courses')
const BLOCK_RE = /:::decision-block\{[^}]*blockId="([^"]+)"[^}]*\}/g

let errors = 0

function scanDir(dir: string) {
  try {
    const entries = readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        scanDir(fullPath)
      } else if (entry.name.endsWith('.mdx')) {
        validateFile(fullPath)
      }
    }
  } catch {
    // Directory may not exist
  }
}

function validateFile(filePath: string) {
  const content = readFileSync(filePath, 'utf-8')
  const blockIds: string[] = []

  for (const match of content.matchAll(BLOCK_RE)) {
    const blockId = match[1]!
    if (blockIds.includes(blockId)) {
      console.error(`  DUPLICATE blockId "${blockId}" in ${filePath}`)
      errors++
    }
    blockIds.push(blockId)
  }
}

console.info('[validate-block-ids] Scanning content/courses/ for duplicate blockIds...')
scanDir(CONTENT_DIR)

if (errors > 0) {
  console.error(`\n  ${errors} duplicate blockId(s) found. Fix before deploying.`)
  process.exit(1)
} else {
  console.info('  All blockIds are unique within their lessons.')
}
