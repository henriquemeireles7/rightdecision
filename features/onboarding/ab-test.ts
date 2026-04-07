/**
 * Simple A/B testing for onboarding.
 * Assigns a variant at session creation (50/50 split).
 * Variant stored in session_data JSONB.
 * Track conversion per variant in analytics.
 */

export type ABVariant = 'A' | 'B'

export type ABTest = {
  name: string
  variants: { A: string; B: string }
}

// Active tests — add new tests here
export const ACTIVE_TESTS: Record<string, ABTest> = {
  paywall_headline: {
    name: 'Paywall headline',
    variants: {
      A: "You've named your decision. Now let's make it happen.",
      B: 'Your decision is waiting. The course makes it real.',
    },
  },
}

/**
 * Assign a variant for a test (50/50 random split).
 */
export function assignVariant(): ABVariant {
  return Math.random() < 0.5 ? 'A' : 'B'
}

/**
 * Get all variant assignments for a new session.
 */
export function assignAllVariants(): Record<string, ABVariant> {
  const assignments: Record<string, ABVariant> = {}
  for (const testName of Object.keys(ACTIVE_TESTS)) {
    assignments[testName] = assignVariant()
  }
  return assignments
}

/**
 * Get the content for a test variant.
 */
export function getVariantContent(testName: string, variant: ABVariant): string | undefined {
  const test = ACTIVE_TESTS[testName]
  if (!test) return undefined
  return test.variants[variant]
}
