import { describe, expect, test } from 'bun:test'

describe('test setup', () => {
  test('exports setupTestDb, teardownTestDb, and testDb', async () => {
    const setup = await import('@/platform/test/setup')
    expect(typeof setup.setupTestDb).toBe('function')
    expect(typeof setup.teardownTestDb).toBe('function')
    expect(setup.testDb).toBeDefined()
  })
})
