import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

const input = await Bun.stdin.json()

// Prevent infinite loops when Stop hook triggers another Stop
if (input.stop_hook_active) {
  process.exit(0)
}

// Dynamic cwd: hooks live in .claude/hooks/, project root is two levels up
const cwd = resolve(import.meta.dir, '../..')

// Check if there are any modified .ts/.tsx files
const gitResult = spawnSync('git', ['diff', '--name-only', '--diff-filter=ACM'], {
  cwd,
  stdio: ['ignore', 'pipe', 'pipe'],
})

const untrackedResult = spawnSync('git', ['ls-files', '--others', '--exclude-standard'], {
  cwd,
  stdio: ['ignore', 'pipe', 'pipe'],
})

const modifiedFiles = (gitResult.stdout?.toString().trim() || '')
  .split('\n')
  .filter((f) => /\.(ts|tsx|js|jsx|css)$/.test(f))

const untrackedFiles = (untrackedResult.stdout?.toString().trim() || '')
  .split('\n')
  .filter((f) => /\.(ts|tsx|js|jsx|css)$/.test(f))

const allFiles = [...new Set([...modifiedFiles, ...untrackedFiles])].filter(Boolean)

if (allFiles.length === 0) {
  process.exit(0)
}

// Run Biome with --write to auto-fix formatting, but do NOT auto-stage
// Agents control what gets committed — no surprise git add
console.log(`Running quality gate on ${allFiles.length} changed file(s)...`)

const biomeResult = spawnSync('bunx', ['biome', 'check', '--write', '--unsafe', ...allFiles], {
  cwd,
  stdio: ['ignore', 'pipe', 'pipe'],
})

const biomeOutput = biomeResult.stderr?.toString() || biomeResult.stdout?.toString() || ''
if (biomeOutput.trim()) {
  const lines = biomeOutput.trim().split('\n')
  console.log('Biome auto-fix:', lines.slice(-3).join('\n'))
}

// After auto-fix, verify with read-only check (same command CI uses)
const biomeVerify = spawnSync('bunx', ['biome', 'ci', ...allFiles], {
  cwd,
  stdio: ['ignore', 'pipe', 'pipe'],
})

let hasErrors = false

if (biomeVerify.status !== 0) {
  const verifyOutput = biomeVerify.stderr?.toString() || biomeVerify.stdout?.toString() || ''
  if (verifyOutput.trim()) {
    const lines = verifyOutput.trim().split('\n')
    console.log('\n  Biome CI check FAILED (unfixable violations):')
    for (const line of lines.slice(-10)) {
      console.log(`  ${line}`)
    }
  }
  hasErrors = true
}

// Run TypeScript check
const tscResult = spawnSync('bunx', ['tsc', '--noEmit'], {
  cwd,
  stdio: ['ignore', 'pipe', 'pipe'],
})

const tscOutput = tscResult.stdout?.toString() || tscResult.stderr?.toString() || ''
if (tscResult.status !== 0) {
  hasErrors = true
  if (tscOutput.trim()) {
    const lines = tscOutput.trim().split('\n')
    console.log('\n  TypeScript errors:')
    for (const line of lines.slice(-5)) {
      console.log(`  ${line}`)
    }
  }
}

if (hasErrors) {
  console.log('\n  Quality gate FAILED — fix errors before committing.')
  process.exit(2)
}

process.exit(0)
