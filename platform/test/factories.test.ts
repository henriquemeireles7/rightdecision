import { describe, expect, test } from 'bun:test'

describe('test factories', () => {
  test('exports all factory functions', async () => {
    const factories = await import('@/platform/test/factories')
    expect(typeof factories.createTestUser).toBe('function')
    expect(typeof factories.createTestSession).toBe('function')
    expect(typeof factories.createTestSubscription).toBe('function')
    expect(typeof factories.createTestWin).toBe('function')
    expect(typeof factories.createTestOnboardingProfile).toBe('function')
    expect(typeof factories.createTestPipelineRun).toBe('function')
    expect(typeof factories.createTestPlatformAccount).toBe('function')
  })
})
