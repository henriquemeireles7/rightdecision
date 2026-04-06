/**
 * One-time script to generate CLAUDE.md context files for all code directories.
 * Run: bun run platform/scripts/generate-context-files.ts
 *
 * - Skips directories that already have a CLAUDE.md
 * - Skips empty directories (no code/md files)
 * - Creates skeleton headers with auto-detected purpose
 * - Generates full auto-generated footers
 */

import { existsSync, readdirSync, writeFileSync } from 'node:fs'
import { basename, join, relative } from 'node:path'
import { analyzeDirectory } from '../../.claude/hooks/lib/analyze-directory'

const ROOT = '/Users/henriquemeireles/conductor/workspaces/getzeny/da-nang'
const MARKER = '<!-- AUTO-GENERATED BELOW — do not edit manually -->'

const SKIP_DIRS = [
  'node_modules',
  'dist',
  '.git',
  '.claude',
  '.cursor',
  '.context',
  '.gstack',
  '.github',
]

function inferPurpose(dirPath: string): string {
  const rel = relative(ROOT, dirPath)
  const parts = rel.split('/')
  const name = basename(dirPath)

  if (parts[0] === 'platform') {
    const purposes: Record<string, string> = {
      auth: 'Authentication and authorization — Better Auth setup, permissions, session handling.',
      db: 'Database layer — Drizzle schema, migrations, connection.',
      server: 'HTTP server — Hono app, route mounting, response helpers.',
      middleware: 'Middleware — request processing pipeline.',
      scripts: 'Utility scripts — migrations, seeds, one-time tasks.',
    }
    if (parts.length === 1) return 'Platform layer — shared infrastructure used by all features.'
    return purposes[name] ?? `Platform module: ${name}.`
  }

  if (parts[0] === 'features') {
    if (parts.length === 1) return 'Feature modules — each subfolder is a self-contained domain.'
    if (name === 'components') return `UI components for the ${parts[1] ?? 'unknown'} feature.`
    return `Feature: ${(parts[1] ?? 'unknown').replace(/-/g, ' ')} — domain logic, routes, and components.`
  }

  if (parts[0] === 'marketing') {
    if (parts.length === 1) return 'Marketing pages — landing, pricing, shared components.'
    if (name === 'components') return `UI components for ${parts[1]} marketing page.`
    return `Marketing: ${name} page.`
  }

  if (parts[0] === 'pages') {
    return `Page routing: ${name} group — thin wiring layer, max 20 lines per page.`
  }

  if (parts[0] === 'providers') {
    return 'External service abstractions — one file per capability, named by what it does not who provides it.'
  }

  if (parts[0] === 'ui') {
    if (name === 'primitives') return 'Base UI primitives — buttons, inputs, typography.'
    return 'UI layer — shared components and primitives.'
  }

  if (parts[0] === 'content') {
    if (name.startsWith('module-'))
      return `Course module: ${name.replace(/^module-\d+-/, '').replace(/-/g, ' ')}.`
    return 'Content — course materials, MDX files.'
  }

  if (parts[0] === 'decisions') {
    if (parts.length === 1) return 'Strategy documents — the decisions/ knowledge base.'
    return `Strategy document: ${name.replace(/-/g, ' ')}.`
  }

  return `${name} directory.`
}

function hasCodeFiles(dirPath: string): boolean {
  try {
    const entries = readdirSync(dirPath, { withFileTypes: true })
    return entries.some(
      (e) =>
        e.isFile() &&
        (e.name.endsWith('.ts') ||
          e.name.endsWith('.tsx') ||
          e.name.endsWith('.js') ||
          e.name.endsWith('.jsx') ||
          e.name.endsWith('.md') ||
          e.name.endsWith('.mdx')) &&
        e.name !== 'CLAUDE.md',
    )
  } catch {
    return false
  }
}

function renderFooter(dirPath: string): string {
  const analysis = analyzeDirectory(dirPath)
  const lines: string[] = []

  lines.push('')
  lines.push('## Files')

  if (analysis.files.length === 0) {
    lines.push('No source files.')
  } else {
    lines.push('| File | Exports |')
    lines.push('|------|---------|')
    for (const file of analysis.files) {
      const exports = file.exports.length > 0 ? file.exports.join(', ') : '—'
      lines.push(`| ${file.name} | ${exports} |`)
    }
  }

  if (analysis.deps.length > 0) {
    lines.push('')
    lines.push('## Internal Dependencies')
    for (const dep of analysis.deps) {
      lines.push(`- ${dep}`)
    }
  }

  lines.push('')
  lines.push(`<!-- Generated: ${analysis.generatedAt} -->`)

  return lines.join('\n')
}

function walkDirs(dir: string): string[] {
  const results: string[] = []

  try {
    const entries = readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      if (SKIP_DIRS.includes(entry.name)) continue

      const fullPath = join(dir, entry.name)
      results.push(fullPath)
      results.push(...walkDirs(fullPath))
    }
  } catch {
    // Skip unreadable dirs
  }

  return results
}

// Main
const dirs = walkDirs(ROOT)
let created = 0
let skipped = 0

for (const dir of dirs) {
  const claudeMdPath = join(dir, 'CLAUDE.md')
  const rel = relative(ROOT, dir)

  // Skip if already exists
  if (existsSync(claudeMdPath)) {
    skipped++
    continue
  }

  // Skip empty directories
  if (!hasCodeFiles(dir)) {
    continue
  }

  const purpose = inferPurpose(dir)
  const name = basename(dir)
  const footer = renderFooter(dir)

  const content = `# ${name}

## Purpose
${purpose}

## Rules
- Follow the project-wide rules in the root CLAUDE.md.

---
${MARKER}
${footer}
`

  writeFileSync(claudeMdPath, content)
  created++
  console.log(`  Created: ${rel}/CLAUDE.md`)
}

console.log(`\nDone. Created ${created} CLAUDE.md files. Skipped ${skipped} (already exist).`)
