import { describe, expect, test } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildClient } from './build-client'

const ROOT = join(import.meta.dir, '..', '..')

describe('unit: build-client', () => {
  test('builds content-hashed browser bundles + manifest within budget', async () => {
    const manifest = await buildClient()

    // every client/<entry>/index.tsx becomes one hashed bundle
    expect(manifest.app).toMatch(/^\/build\/app-[A-Za-z0-9]+\.js$/)

    // manifest is written to public/build/manifest.json for the /app shell SSR route
    const onDisk = JSON.parse(readFileSync(join(ROOT, 'public/build/manifest.json'), 'utf-8'))
    expect(onDisk).toEqual(manifest)

    // the bundle exists and fits the /app shell budget (eng-schema M6: ≤100KB gzipped)
    const bundlePath = join(ROOT, 'public', manifest.app ?? '')
    expect(existsSync(bundlePath)).toBe(true)
    const gzipBytes = Bun.gzipSync(new Uint8Array(readFileSync(bundlePath))).byteLength
    expect(gzipBytes).toBeLessThanOrEqual(100 * 1024)
  })

  test('rebuild of identical input is deterministic (content hashing)', async () => {
    const first = await buildClient()
    const second = await buildClient()
    expect(second).toEqual(first)
  })

  test('bundle budget gate in harden-check passes for built bundles', async () => {
    await buildClient()
    const result = Bun.spawnSync(['bun', 'platform/scripts/harden-check.ts', '--json'], {
      cwd: ROOT,
    })
    const report = JSON.parse(result.stdout.toString()) as {
      findings: Array<{ rule: string; message: string }>
    }
    const bundleFindings = report.findings.filter((f) => f.rule.startsWith('bundle-'))
    expect(bundleFindings).toEqual([])
  })

  test('bundle budget gate fails on a bundle without a budget row (marketing stays 0)', async () => {
    const manifestPath = join(ROOT, 'public/build/manifest.json')
    const manifest = await buildClient()
    try {
      // a rogue bundle outside the budget table must be an error
      const doctored = { ...manifest, rogue: '/build/rogue-deadbeef.js' }
      await Bun.write(manifestPath, JSON.stringify(doctored))
      const result = Bun.spawnSync(['bun', 'platform/scripts/harden-check.ts', '--json'], {
        cwd: ROOT,
      })
      const report = JSON.parse(result.stdout.toString()) as {
        pass: boolean
        findings: Array<{ rule: string }>
      }
      expect(report.pass).toBe(false)
      expect(report.findings.some((f) => f.rule === 'bundle-no-budget')).toBe(true)
      expect(result.exitCode).toBe(1)
    } finally {
      await Bun.write(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
    }
  })
})
