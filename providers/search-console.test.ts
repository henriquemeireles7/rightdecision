import { describe, expect, mock, test } from 'bun:test'

// Mock env without credentials
mock.module('@/platform/env', () => ({
  env: {
    GOOGLE_SERVICE_ACCOUNT_JSON: undefined,
    PUBLIC_APP_URL: 'https://rightdecisions.io',
  },
}))

describe('search-console (unconfigured)', () => {
  test('isConfigured returns false when env var not set', async () => {
    const { isConfigured } = await import('./search-console')
    expect(isConfigured()).toBe(false)
  })

  test('getAccessToken returns null when unconfigured', async () => {
    const { getAccessToken } = await import('./search-console')
    const token = await getAccessToken()
    expect(token).toBeNull()
  })

  test('inspectUrl throws when unconfigured', async () => {
    const { inspectUrl } = await import('./search-console')
    await expect(
      inspectUrl('sc-domain:rightdecisions.io', 'https://rightdecisions.io/'),
    ).rejects.toThrow('search-console.inspectUrl failed (401)')
  })

  test('getSearchAnalytics throws when unconfigured', async () => {
    const { getSearchAnalytics } = await import('./search-console')
    await expect(
      getSearchAnalytics('sc-domain:rightdecisions.io', {
        startDate: '2026-04-01',
        endDate: '2026-04-08',
      }),
    ).rejects.toThrow('search-console.getSearchAnalytics failed (401)')
  })
})
