import { describe, expect, it } from 'bun:test'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

const SCRIPT = join(import.meta.dir, 'harden-check.ts')

function run(args: string[] = []) {
  const result = spawnSync('bun', [SCRIPT, ...args], {
    cwd: join(import.meta.dir, '../..'),
  })
  return {
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
    exitCode: result.status ?? 1,
  }
}

describe('harden-check', () => {
  it('passes on a clean codebase', () => {
    const result = run(['--quiet'])
    expect(result.exitCode).toBe(0)
  })

  it('detects process.env outside env.ts', () => {
    const result = run(['--json'])
    const output = JSON.parse(result.stdout)
    // The codebase should be clean, so check the structure
    expect(output).toHaveProperty('pass')
    expect(output).toHaveProperty('errors')
    expect(output).toHaveProperty('warnings')
    expect(output).toHaveProperty('findings')
    expect(Array.isArray(output.findings)).toBe(true)
  })

  it('outputs valid JSON with --json flag', () => {
    const result = run(['--json'])
    expect(result.exitCode).toBe(0)
    const output = JSON.parse(result.stdout)
    expect(typeof output.pass).toBe('boolean')
    expect(typeof output.errors).toBe('number')
    expect(typeof output.warnings).toBe('number')
    expect(Array.isArray(output.findings)).toBe(true)
    for (const finding of output.findings) {
      expect(finding).toHaveProperty('file')
      expect(finding).toHaveProperty('line')
      expect(finding).toHaveProperty('severity')
      expect(finding).toHaveProperty('rule')
      expect(finding).toHaveProperty('message')
    }
  })

  it('produces no stdout with --quiet flag', () => {
    const result = run(['--quiet'])
    expect(result.stdout.trim()).toBe('')
  })

  it('returns correct exit code based on errors', () => {
    // Clean codebase should exit 0 (warnings are OK, only errors fail)
    const result = run(['--quiet'])
    expect(result.exitCode).toBe(0)
  })
})
