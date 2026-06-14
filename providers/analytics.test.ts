import { afterAll, describe, expect, mock, test } from 'bun:test'
import { clearEnvOverride, envProxy, setEnvOverride } from '@/platform/test/mocks'

// Mock env before analytics imports it
mock.module('@/platform/env', () => ({ env: envProxy }))
setEnvOverride({
  POSTHOG_API_KEY: undefined,
  POSTHOG_HOST: 'https://us.i.posthog.com',
})

afterAll(clearEnvOverride)

// Mock posthog-node to avoid real HTTP calls
const mockCapture = mock(() => {})
const mockIdentify = mock(() => {})
const mockShutdown = mock(() => Promise.resolve())

mock.module('posthog-node', () => ({
  PostHog: class {
    capture = mockCapture
    identify = mockIdentify
    shutdown = mockShutdown
  },
}))

describe('analytics provider — no API key', () => {
  test('track() is a no-op when POSTHOG_API_KEY is not set', async () => {
    const { track } = await import('@/providers/analytics')
    await track('test_event', { foo: 'bar' })
    expect(mockCapture).not.toHaveBeenCalled()
  })

  test('identify() is a no-op when POSTHOG_API_KEY is not set', async () => {
    const { identify } = await import('@/providers/analytics')
    await identify('user-123', { name: 'Test' })
    expect(mockIdentify).not.toHaveBeenCalled()
  })

  test('shutdown() is a no-op when POSTHOG_API_KEY is not set', async () => {
    const { shutdown } = await import('@/providers/analytics')
    await shutdown()
    expect(mockShutdown).not.toHaveBeenCalled()
  })

  test('exports are functions', async () => {
    const analytics = await import('@/providers/analytics')
    expect(typeof analytics.track).toBe('function')
    expect(typeof analytics.identify).toBe('function')
    expect(typeof analytics.shutdown).toBe('function')
  })
})
