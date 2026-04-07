import { describe, expect, test } from 'bun:test'
import type { SessionData } from './session'

// These tests verify the session service types and logic.
// Full integration tests require DATABASE_URL — run with `bun test --env`.

describe('onboarding session types', () => {
  test('SessionData shape is correct', () => {
    const data: SessionData = {
      throughlineQ1: 'answer 1',
      throughlineQ2: 'answer 2',
      throughlineQ3: 'answer 3',
      throughlineNamed: 'My decision',
      email: 'test@example.com',
    }
    expect(data.throughlineQ1).toBe('answer 1')
    expect(data.email).toBe('test@example.com')
  })

  test('SessionData allows partial data', () => {
    const partial: SessionData = { throughlineQ1: 'just one answer' }
    expect(partial.throughlineQ2).toBeUndefined()
  })

  test('SessionData fields are all optional', () => {
    const empty: SessionData = {}
    expect(Object.keys(empty).length).toBe(0)
  })
})
