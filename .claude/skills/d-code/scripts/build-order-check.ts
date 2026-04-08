#!/usr/bin/env bun

/**
 * build-order-check.ts — Checks Build Order compliance for changed files.
 *
 * Build Order:
 *   1. schema.ts
 *   2. errors.ts (before files using throwError)
 *   3. env.ts (before files using env)
 *   4. Feature code
 *
 * Heuristic: If foundational files changed, verify that dependent files also changed
 * (meaning the developer updated both). If a feature file uses throwError but errors.ts
 * wasn't updated, that's a potential violation.
 *
 * Usage: bun build-order-check.ts [--base <branch>]
 * Output: JSON with warnings
 */

import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

const repoRoot = resolve(import.meta.dir, '../../..')

function getChangedFiles(base: string): string[] {
  const result = spawnSync('git', ['diff', '--name-only', '--diff-filter=ACMR', base], {
    cwd: repoRoot,
  })
  if (result.status !== 0) return []
  return result.stdout
    .toString()
    .trim()
    .split('\n')
    .filter((f) => f.length > 0)
}

function fileUsesPattern(file: string, pattern: string): boolean {
  const result = spawnSync('rg', ['-l', pattern, resolve(repoRoot, file)], {
    cwd: repoRoot,
  })
  return result.status === 0
}

interface Warning {
  type: string
  message: string
  files: string[]
}

// --- Main ---
const args = process.argv.slice(2)
const baseIdx = args.indexOf('--base')
const base = baseIdx !== -1 && args[baseIdx + 1] ? args[baseIdx + 1] : 'master'

const changedFiles = getChangedFiles(base)
const warnings: Warning[] = []

const schemaChanged = changedFiles.some((f) => f.endsWith('schema.ts') && f.includes('platform/'))
const errorsChanged = changedFiles.some((f) => f === 'platform/errors.ts')
const envChanged = changedFiles.some((f) => f === 'platform/env.ts')

// Check: files using throwError but errors.ts not changed
const filesUsingThrowError = changedFiles.filter(
  (f) =>
    (f.startsWith('features/') || f.startsWith('platform/')) &&
    !f.endsWith('.test.ts') &&
    !f.endsWith('.test.tsx') &&
    f !== 'platform/errors.ts' &&
    fileUsesPattern(f, 'throwError'),
)

if (filesUsingThrowError.length > 0 && !errorsChanged) {
  warnings.push({
    type: 'errors_not_updated',
    message:
      'Files use throwError but platform/errors.ts was not changed. If new error codes are needed, update errors.ts first.',
    files: filesUsingThrowError,
  })
}

// Check: files using env but env.ts not changed
const filesUsingEnv = changedFiles.filter(
  (f) =>
    (f.startsWith('features/') || f.startsWith('platform/')) &&
    !f.endsWith('.test.ts') &&
    !f.endsWith('.test.tsx') &&
    f !== 'platform/env.ts' &&
    fileUsesPattern(f, 'from.*platform/env'),
)

if (filesUsingEnv.length > 0 && !envChanged) {
  // This is informational — not always a violation
  warnings.push({
    type: 'env_not_updated',
    message:
      'Files import from platform/env.ts but it was not changed. If new env vars are needed, update env.ts first.',
    files: filesUsingEnv,
  })
}

// Check: schema changed but no migration generated
if (schemaChanged) {
  const migrationChanged = changedFiles.some((f) => f.includes('migrations/'))
  if (!migrationChanged) {
    warnings.push({
      type: 'schema_no_migration',
      message:
        'schema.ts changed but no migration files were modified. Run `bun run db:generate` to create a migration.',
      files: changedFiles.filter((f) => f.endsWith('schema.ts')),
    })
  }
}

const result = {
  pass: warnings.length === 0,
  checkedFiles: changedFiles.length,
  warnings,
}

console.log(JSON.stringify(result, null, 2))
process.exit(warnings.length > 0 ? 1 : 0)
