/**
 * Build-time git timestamp extraction
 * Outputs: public/content-timestamps.json
 * Maps content file paths to their last git commit date
 * Graceful fallback: writes {} if git is unavailable or repo is shallow
 */
import { execSync } from 'node:child_process'
import { mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

type Timestamps = Record<string, string>

function collectMdFiles(dir: string, prefix = ''): string[] {
  const files: string[] = []
  try {
    for (const entry of readdirSync(dir)) {
      const fullPath = join(dir, entry)
      const stat = statSync(fullPath)
      if (stat.isFile() && entry.endsWith('.md')) {
        files.push(prefix ? `${prefix}/${entry}` : entry)
      } else if (stat.isDirectory() && !entry.startsWith('.')) {
        files.push(...collectMdFiles(fullPath, prefix ? `${prefix}/${entry}` : entry))
      }
    }
  } catch {}
  return files
}

function getGitTimestamp(filePath: string): string | null {
  try {
    const result = execSync(`git log -1 --format=%aI -- "${filePath}"`, {
      encoding: 'utf-8',
      timeout: 5000,
    }).trim()
    return result || null
  } catch {
    return null
  }
}

function buildTimestamps(): void {
  const timestamps: Timestamps = {}
  const contentDirs = [
    'content/blog',
    'content/method',
    'content/handbook',
    'content/guides',
    'content/help',
    'content/changelog',
  ]

  for (const dir of contentDirs) {
    const fullDir = join(process.cwd(), dir)
    const files = collectMdFiles(fullDir)

    for (const file of files) {
      const relPath = `${dir}/${file}`
      const ts = getGitTimestamp(relPath)
      if (ts) {
        timestamps[relPath] = ts
      }
    }
  }

  mkdirSync(join(process.cwd(), 'public'), { recursive: true })
  writeFileSync(join(process.cwd(), 'public/content-timestamps.json'), JSON.stringify(timestamps))
  console.log(`Timestamps: ${Object.keys(timestamps).length} files`)
}

try {
  buildTimestamps()
} catch (err) {
  console.warn('Timestamp build failed, writing empty:', err)
  mkdirSync(join(process.cwd(), 'public'), { recursive: true })
  writeFileSync(join(process.cwd(), 'public/content-timestamps.json'), '{}')
}
