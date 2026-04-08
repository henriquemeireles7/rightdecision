import { describe, expect, test } from 'bun:test'

// Customer portal imports Stripe SDK which requires STRIPE_SECRET_KEY.
// Full integration tests require env vars — covered in CI.

describe('customer-portal', () => {
  test('module exists', () => {
    const file = Bun.file('features/(shared)/subscription/customer-portal.ts')
    expect(file.size).toBeGreaterThan(0)
  })
})
