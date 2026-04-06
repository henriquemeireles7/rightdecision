import { spawnSync } from 'node:child_process'

const input = await Bun.stdin.json()

// Prevent infinite loops when Stop hook triggers another Stop
if (input.stop_hook_active) {
  process.exit(0)
}

const cwd = '/Users/henriquemeireles/conductor/workspaces/getzeny/da-nang'

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

// Run Biome on changed files
console.log(`Running quality gate on ${allFiles.length} changed file(s)...`)

const biomeResult = spawnSync('bunx', ['biome', 'check', '--write', '--unsafe', ...allFiles], {
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
