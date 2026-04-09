import { describe, expect, test } from 'bun:test'
import { Hono } from 'hono'
import { errors, throwError } from './errors'

describe('Profile error codes', () => {
  const profileErrors = {
    PROFILE_NOT_FOUND: 404,
    PROFILE_VALIDATION_FAILED: 422,
    PROFILE_WRITE_FAILED: 500,
    PROFILE_EMPTY_RESPONSE: 502,
    PROFILE_EXISTS: 409,
    METADATA_MISSING_PROFILE: 422,
  } as const

  for (const [code, expectedStatus] of Object.entries(profileErrors)) {
    test(`${code} has status ${expectedStatus}`, () => {
      const error = errors[code as keyof typeof errors]
      expect(error).toBeDefined()
      expect(error.status).toBe(expectedStatus)
      expect(error.code).toBe(code)
      expect(error.message).toBeTruthy()
    })
  }

  test('throwError produces expected response shape', async () => {
    const app = new Hono()
    app.get('/test', (c) => throwError(c, 'PROFILE_NOT_FOUND', 'slug: test-profile'))

    const res = await app.request('/test')
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body).toEqual({
      ok: false,
      code: 'PROFILE_NOT_FOUND',
      message: 'Profile not found',
      details: 'slug: test-profile',
    })
  })
})
