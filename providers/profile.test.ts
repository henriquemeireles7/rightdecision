import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// Test against real content/profiles/ created by bead lyon-1d3h.3
const PROFILES_DIR = join(process.cwd(), 'content/profiles')

// Create a temp profile for edge-case tests
const TEMP_DIR = join(PROFILES_DIR, '_test-temp')

beforeAll(() => {
  mkdirSync(join(TEMP_DIR, 'learning'), { recursive: true })
  mkdirSync(join(TEMP_DIR, 'changelog'), { recursive: true })
})

afterAll(() => {
  rmSync(TEMP_DIR, { recursive: true, force: true })
})

describe('listProfiles', () => {
  test('returns profile directories excluding _template and _insights', async () => {
    const { listProfiles } = await import('./profile')
    const profiles = listProfiles()
    expect(profiles).toContain('indy-kaz')
    expect(profiles).toContain('henry-kaz')
    expect(profiles).toContain('the-right-decision')
    expect(profiles).not.toContain('_template')
    expect(profiles).not.toContain('_insights')
    expect(profiles).not.toContain('_test-temp')
  })
})

describe('readProfile', () => {
  test('reads a valid profile with profile.md and social.md', async () => {
    const { readProfile } = await import('./profile')
    const result = readProfile('indy-kaz')
    expect(result.name).toBe('indy-kaz')
    expect(result.profileContent).toContain('## Identity')
    expect(result.socialContent).toContain('## Platform Accounts')
    expect(result.quickRef).toBeDefined()
    expect(result.quickRef.who).toContain('Indy Kaz')
  })

  test('throws PROFILE_NOT_FOUND for nonexistent profile', async () => {
    const { readProfile } = await import('./profile')
    expect(() => readProfile('nonexistent-profile')).toThrow('profile.readProfile failed (404)')
  })

  test('throws PROFILE_VALIDATION_FAILED for missing social.md', async () => {
    // Create profile.md but no social.md in temp dir
    writeFileSync(
      join(TEMP_DIR, 'profile.md'),
      `# Test\n\n> **Quick Reference**\n> - **Who:** Test\n> - **For:** Test\n> - **Big Idea:** Test\n> - **Primary CTA:** Test\n> - **Health:** 0/10 | **Plays:** 0 | **Last Learning:** none yet\n\n## Identity\n\n## ICP\n\n## Core Messaging Framework\n\n### Big Idea\n\n### Problem Core + Agitation\n\n### Desired Outcome\n\n### Unique Mechanism\n\n## Plays\n\n## Voice & Tone`,
    )
    const { readProfile } = await import('./profile')
    expect(() => readProfile('_test-temp')).toThrow('profile.readProfile failed (422)')
  })

  test('throws PROFILE_VALIDATION_FAILED for missing required section', async () => {
    // Create both files but profile.md is missing ## Identity
    writeFileSync(join(TEMP_DIR, 'profile.md'), '# Test\n\n## ICP\n\n## Plays\n\n## Voice & Tone')
    writeFileSync(
      join(TEMP_DIR, 'social.md'),
      '# Test\n\n## Platform Accounts\n\n## Active Platforms\n\n## Platform-Specific Strategies',
    )
    const { readProfile } = await import('./profile')
    expect(() => readProfile('_test-temp')).toThrow('profile.readProfile failed (422)')
  })
})

describe('getHealthScore', () => {
  test('computes health score from rubric', async () => {
    const { getHealthScore } = await import('./profile')
    const score = getHealthScore('indy-kaz')
    // Indy-kaz has Identity, ICP, Plays (empty), Voice sections = some completeness
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(10)
  })

  test('returns 0 for nonexistent profile', async () => {
    const { getHealthScore } = await import('./profile')
    expect(() => getHealthScore('nonexistent')).toThrow()
  })
})

describe('validateProfiles', () => {
  test('validates all profiles and returns report', async () => {
    const { validateProfiles } = await import('./profile')
    const report = validateProfiles()
    expect(report.profiles.length).toBeGreaterThanOrEqual(3)
    expect(report.valid).toBe(true)
    for (const p of report.profiles) {
      expect(p.name).toBeTruthy()
      expect(typeof p.healthScore).toBe('number')
    }
  })
})
