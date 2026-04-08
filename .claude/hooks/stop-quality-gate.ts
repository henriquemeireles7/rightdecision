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
  .filter((f) => /\.(ts|tsx|js|jsx)$/.test(f))

const untrackedFiles = (untrackedResult.stdout?.toString().trim() || '')
  .split('\n')
  .filter((f) => /\.(ts|tsx|js|jsx)$/.test(f))

const allFiles = [...new Set([...modifiedFiles, ...untrackedFiles])].filter(Boolean)

if (allFiles.length === 0) {
  process.exit(0)
}

// Run Biome in report-only mode (no --write, no auto-staging)
// Agents run `bun run lint` explicitly before committing
console.log(`Running quality gate on ${allFiles.length} changed file(s)...`)

const biomeResult = spawnSync('bunx', ['biome', 'check', ...allFiles], {
  cwd,
  stdio: ['ignore', 'pipe', 'pipe'],
})

const biomeOutput = biomeResult.stderr?.toString() || biomeResult.stdout?.toString() || ''
if (biomeOutput.trim()) {
  const lines = biomeOutput.trim().split('\n')
  console.log('Biome:', lines.slice(-3).join('\n'))
}

// Run TypeScript check
const tscResult = spawnSync('bunx', ['tsc', '--noEmit'], {
  cwd,
  stdio: ['ignore', 'pipe', 'pipe'],
})

const tscOutput = tscResult.stdout?.toString() || tscResult.stderr?.toString() || ''
if (tscResult.status !== 0 && tscOutput.trim()) {
  const lines = tscOutput.trim().split('\n')
  console.log('TypeScript errors:', lines.slice(-5).join('\n'))
}

process.exit(0)
