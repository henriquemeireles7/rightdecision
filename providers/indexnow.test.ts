import { afterEach, describe, expect, mock, test } from 'bun:test'
import { existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const LOG_PATH = join(import.meta.dir, '../.indexnow-submitted.json')
const originalFetch = globalThis.fetch

// Mock env with key present for all tests (optional key is fine)
mock.module('@/platform/env', () => ({
  env: {
    INDEXNOW_KEY: 'test-key-12345678',
    PUBLIC_APP_URL: 'https://rightdecisions.io',
  },
}))

afterEach(() => {
  globalThis.fetch = originalFetch
  if (existsSync(LOG_PATH)) rmSync(LOG_PATH)
})

describe('submitUrls', () => {
  test('submits urls successfully', async () => {
    const fetchMock = mock(() => Promise.resolve(new Response('', { status: 200 })))
    globalThis.fetch = fetchMock as typeof fetch

    const { submitUrls } = await import('./indexnow')
    const result = await submitUrls(['https://rightdecisions.io/blog/test'])
    expect(result.submitted).toBe(1)
    expect(result.skipped).toBe(false)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  test('returns 0 for empty url list', async () => {
    const { submitUrls } = await import('./indexnow')
    const result = await submitUrls([])
    expect(result.submitted).toBe(0)
    expect(result.skipped).toBe(false)
  })

  test('throws ProviderError on rate limit', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response('Rate limited', { status: 429 })),
    ) as typeof fetch

    const { submitUrls } = await import('./indexnow')
    await expect(submitUrls(['https://rightdecisions.io/'])).rejects.toThrow(
      'indexnow.submitUrls failed (429)',
    )
  })

  test('throws ProviderError on 422', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response('Invalid', { status: 422 })),
    ) as typeof fetch

    const { submitUrls } = await import('./indexnow')
    await expect(submitUrls(['https://rightdecisions.io/'])).rejects.toThrow(
      'indexnow.submitUrls failed (422)',
    )
  })
})

describe('submitUrls (no key)', () => {
  test('skips when INDEXNOW_KEY not set', async () => {
    // Re-mock env without key
    mock.module('@/platform/env', () => ({
      env: {
        INDEXNOW_KEY: undefined,
        PUBLIC_APP_URL: 'https://rightdecisions.io',
      },
    }))

    // Need fresh import with new mock
    const mod = await import('./indexnow')
    const result = await mod.submitUrls(['https://rightdecisions.io/blog/test'])
    expect(result.skipped).toBe(true)
    expect(result.submitted).toBe(0)
  })
})

describe('loadSubmittedLog', () => {
  test('returns empty object when file missing', async () => {
    if (existsSync(LOG_PATH)) rmSync(LOG_PATH)
    const { loadSubmittedLog } = await import('./indexnow')
    expect(loadSubmittedLog()).toEqual({})
  })

  test('round-trips correctly', async () => {
    const { loadSubmittedLog, saveSubmittedLog } = await import('./indexnow')
    const log = { 'https://rightdecisions.io/': '2026-04-08' }
    saveSubmittedLog(log)
    expect(loadSubmittedLog()).toEqual(log)
  })
})

describe('getUnsubmittedUrls', () => {
  test('filters already-submitted urls', async () => {
    const { getUnsubmittedUrls } = await import('./indexnow')
    const all = ['https://rightdecisions.io/', 'https://rightdecisions.io/about']
    const log = { 'https://rightdecisions.io/': '2026-04-08' }
    expect(getUnsubmittedUrls(all, log)).toEqual(['https://rightdecisions.io/about'])
  })

  test('returns all urls when log is empty', async () => {
    const { getUnsubmittedUrls } = await import('./indexnow')
    const all = ['https://rightdecisions.io/', 'https://rightdecisions.io/about']
    expect(getUnsubmittedUrls(all, {})).toEqual(all)
  })
})
