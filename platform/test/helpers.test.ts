import { describe, expect, test } from 'bun:test'
import { apiCall, assertError, assertSuccess, authenticatedRequest } from '@/platform/test/helpers'

describe('test helpers', () => {
  test('exports all helper functions', () => {
    expect(typeof apiCall).toBe('function')
    expect(typeof authenticatedRequest).toBe('function')
    expect(typeof assertError).toBe('function')
    expect(typeof assertSuccess).toBe('function')
  })

  test('assertSuccess validates correct shape', () => {
    const response = { status: 200, body: { ok: true, data: { id: '123' } } }
    const data = assertSuccess(response)
    expect(data).toEqual({ id: '123' })
  })

  test('assertError validates error shape', () => {
    const response = {
      status: 401,
      body: { ok: false, code: 'UNAUTHORIZED', message: 'Authentication required' },
    }
    assertError(response, 'UNAUTHORIZED')
  })
})
