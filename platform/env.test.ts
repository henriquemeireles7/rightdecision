import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('env sync', () => {
  test('.env.example keys match env.ts declarations', () => {
    const root = resolve(import.meta.dir, '..')

    // Parse .env.example keys
    const exampleContent = readFileSync(resolve(root, '.env.example'), 'utf-8')
    const exampleKeys = new Set(
      exampleContent
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'))
        .map((line) => line.split('=')[0]!)
        .filter(Boolean),
    )

    // Parse env.ts keys from server + client blocks
    const envTsContent = readFileSync(resolve(root, 'platform/env.ts'), 'utf-8')
    const envTsKeys = new Set<string>()
    for (const match of envTsContent.matchAll(/^\s+(\w+):\s*z\./gm)) {
      if (match[1]) envTsKeys.add(match[1])
    }

    // Keys with .default() or .optional() don't need to be in .env.example
    const requiredKeys = new Set<string>()
    for (const match of envTsContent.matchAll(/^\s+(\w+):\s*z\..*$/gm)) {
      const key = match[1]
      if (!key) continue
      const line = match[0]
      if (!line.includes('.optional()') && !line.includes('.default(')) {
        requiredKeys.add(key)
      }
    }

    // Every required env.ts key must be in .env.example
    const missingFromExample = [...requiredKeys].filter((k) => !exampleKeys.has(k))
    expect(missingFromExample).toEqual([])

    // Every .env.example key must be declared in env.ts
    const missingFromEnvTs = [...exampleKeys].filter((k) => !envTsKeys.has(k))
    expect(missingFromEnvTs).toEqual([])
  })
})
