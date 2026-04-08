import { describe, expect, test } from 'bun:test'

describe('getUserForSubscription', () => {
  test('exports a function', async () => {
    const { getUserForSubscription } = await import('./helpers')
    expect(typeof getUserForSubscription).toBe('function')
  })
})
