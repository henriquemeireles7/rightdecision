/**
 * PreToolUse hook on Bash — intercepts `git commit` commands.
 * Runs `bunx biome ci .` before allowing the commit.
 * Ensures nothing gets committed without passing the same checks CI runs.
 */
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

const input = await Bun.stdin.json()
const cmd: string = input.tool_input?.command ?? ''

// Only intercept git commit commands
if (!/\bgit\s+commit\b/.test(cmd)) {
  process.exit(0)
}

const cwd = resolve(import.meta.dir, '../..')

// Run biome ci (same as CI pipeline)
const biome = spawnSync('bunx', ['biome', 'ci', '.'], {
  cwd,
  stdio: ['ignore', 'pipe', 'pipe'],
})

if (biome.status !== 0) {
  const output = biome.stderr?.toString() || biome.stdout?.toString() || ''
  console.error('\n  Pre-commit check FAILED: biome ci found violations.')
  console.error('  Run `bunx biome check --write --unsafe .` to auto-fix, then try again.')
  if (output.trim()) {
    const lines = output.trim().split('\n')
    for (const line of lines.slice(-8)) {
      console.error(`  ${line}`)
    }
  }
  process.exit(2)
}

// Run TypeScript check
const tsc = spawnSync('bunx', ['tsc', '--noEmit'], {
  cwd,
  stdio: ['ignore', 'pipe', 'pipe'],
})

if (tsc.status !== 0) {
  const output = tsc.stdout?.toString() || tsc.stderr?.toString() || ''
  console.error('\n  Pre-commit check FAILED: TypeScript errors found.')
  if (output.trim()) {
    const lines = output.trim().split('\n')
    for (const line of lines.slice(-8)) {
      console.error(`  ${line}`)
    }
  }
  process.exit(2)
}

process.exit(0)
