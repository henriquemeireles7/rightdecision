#!/usr/bin/env bun

/**
 * classify-error.ts — Parse an error description into structured taxonomy.
 *
 * Usage: bun .claude/skills/d-harness/scripts/classify-error.ts "<error text>"
 *
 * Output: JSON with layer, category, severity, recurrence risk
 */

const errorText = process.argv[2] || ''

if (!errorText) {
  console.error('Usage: bun classify-error.ts "<error description>"')
  process.exit(1)
}

const lower = errorText.toLowerCase()

// --- Category detection ---
type Category = 'build' | 'runtime' | 'logic' | 'config' | 'deploy' | 'security' | 'performance'

function detectCategory(): Category {
  // Build errors
  if (
    lower.includes('lockfile') ||
    lower.includes('frozen-lockfile') ||
    lower.includes('bun install') ||
    lower.includes('tsc') ||
    lower.includes('typescript') ||
    lower.includes('biome') ||
    lower.includes('compile') ||
    lower.includes('build failed') ||
    lower.includes('module not found') ||
    lower.includes('cannot find module')
  )
    return 'build'

  // Deploy errors
  if (
    lower.includes('railway') ||
    lower.includes('dockerfile') ||
    lower.includes('docker') ||
    lower.includes('pre-deploy') ||
    lower.includes('health check') ||
    lower.includes('deploy') ||
    lower.includes('migration') ||
    lower.includes('db:migrate')
  )
    return 'deploy'

  // Security errors
  if (
    lower.includes('auth') ||
    lower.includes('permission') ||
    lower.includes('injection') ||
    lower.includes('xss') ||
    lower.includes('csrf') ||
    lower.includes('secret') ||
    lower.includes('token') ||
    lower.includes('idor')
  )
    return 'security'

  // Performance errors
  if (
    lower.includes('timeout') ||
    lower.includes('slow') ||
    lower.includes('n+1') ||
    lower.includes('memory') ||
    lower.includes('oom') ||
    lower.includes('performance')
  )
    return 'performance'

  // Config errors
  if (
    lower.includes('config') ||
    lower.includes('biome.json') ||
    lower.includes('tsconfig') ||
    lower.includes('.env') ||
    lower.includes('railway.toml') ||
    lower.includes('gitignore')
  )
    return 'config'

  // Runtime errors
  if (
    lower.includes('unhandled') ||
    lower.includes('exception') ||
    lower.includes('crash') ||
    lower.includes('500') ||
    lower.includes('error:') ||
    lower.includes('stack trace') ||
    lower.includes('undefined') ||
    lower.includes('null')
  )
    return 'runtime'

  return 'logic'
}

// --- Layer detection ---
type Layer = 'hook' | 'claude-md' | 'config' | 'script' | 'universal-file'

function detectLayer(category: Category): Layer {
  // Machine-checkable patterns → hook or script
  if (
    lower.includes('lockfile') ||
    lower.includes('frozen-lockfile') ||
    lower.includes('process.env') ||
    lower.includes('console.log') ||
    (lower.includes('import') && lower.includes('from'))
  )
    return 'hook'

  // Config file issues → config
  if (category === 'config') return 'config'

  // Deploy/infra issues → often need both config + universal file
  if (category === 'deploy') {
    if (lower.includes('dockerfile') || lower.includes('railway.toml')) return 'config'
    return 'universal-file'
  }

  // Complex multi-file checks → script
  if (
    lower.includes('dependency direction') ||
    lower.includes('build order') ||
    lower.includes('test coverage') ||
    lower.includes('missing test')
  )
    return 'script'

  // Security patterns → often script (harden-check.ts)
  if (category === 'security') return 'script'

  // Everything else → CLAUDE.md (judgment-based)
  return 'claude-md'
}

// --- Severity detection ---
type Severity = 'critical' | 'high' | 'medium' | 'low'

function detectSeverity(category: Category): Severity {
  if (category === 'security') return 'critical'
  if (category === 'deploy' && (lower.includes('fail') || lower.includes('crash')))
    return 'critical'
  if (category === 'build') return 'high'
  if (category === 'runtime') return 'high'
  if (category === 'performance') return 'medium'
  if (category === 'config') return 'medium'
  return 'low'
}

// --- Recurrence risk ---
type Recurrence = 'high' | 'medium' | 'low'

function detectRecurrence(category: Category): Recurrence {
  // Systematic issues recur
  if (
    lower.includes('lockfile') ||
    lower.includes('dockerfile') ||
    lower.includes('missing') ||
    lower.includes('forgot')
  )
    return 'high'

  if (category === 'build' || category === 'deploy') return 'high'
  if (category === 'security' || category === 'config') return 'medium'
  return 'low'
}

const category = detectCategory()
const layer = detectLayer(category)
const severity = detectSeverity(category)
const recurrence = detectRecurrence(category)

const result = {
  error: errorText.slice(0, 200),
  category,
  layer,
  severity,
  recurrence,
  suggestions: [] as string[],
}

// Add specific suggestions based on classification
if (lower.includes('lockfile') || lower.includes('frozen-lockfile')) {
  result.suggestions.push(
    'Add lockfile-check to Stop hook: if package.json changed, verify bun.lock also changed',
  )
}
if (lower.includes('dockerfile') && lower.includes('not found')) {
  result.suggestions.push(
    'Add dockerfile-check script: validate runtime stage includes files needed by railway.toml commands',
  )
}
if (lower.includes('process.env')) {
  result.suggestions.push(
    'Existing hook should catch this — check if protect-files.ts covers this pattern',
  )
}
if (lower.includes('merge conflict')) {
  result.suggestions.push(
    'Add CLAUDE.md rule: rebase long-running branches before PR exceeds 10 files changed',
  )
}

console.log(JSON.stringify(result, null, 2))
