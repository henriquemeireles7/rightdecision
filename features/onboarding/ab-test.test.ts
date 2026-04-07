import { describe, expect, test } from 'bun:test'
import { ACTIVE_TESTS, assignAllVariants, assignVariant, getVariantContent } from './ab-test'

describe('A/B testing', () => {
  test('assignVariant returns A or B', () => {
    const variant = assignVariant()
    expect(['A', 'B']).toContain(variant)
  })

  test('assignAllVariants returns assignments for all active tests', () => {
    const assignments = assignAllVariants()
    for (const testName of Object.keys(ACTIVE_TESTS)) {
      expect(assignments[testName]).toBeDefined()
      expect(['A', 'B']).toContain(assignments[testName]!)
    }
  })

  test('getVariantContent returns correct content', () => {
    const contentA = getVariantContent('paywall_headline', 'A')
    const contentB = getVariantContent('paywall_headline', 'B')
    expect(contentA).toBeTruthy()
    expect(contentB).toBeTruthy()
    expect(contentA).not.toBe(contentB)
  })

  test('getVariantContent returns undefined for unknown test', () => {
    expect(getVariantContent('nonexistent', 'A')).toBeUndefined()
  })

  test('distribution is roughly 50/50 over many trials', () => {
    let aCount = 0
    const trials = 1000
    for (let i = 0; i < trials; i++) {
      if (assignVariant() === 'A') aCount++
    }
    // Should be within 40-60% range
    expect(aCount / trials).toBeGreaterThan(0.4)
    expect(aCount / trials).toBeLessThan(0.6)
  })
})
