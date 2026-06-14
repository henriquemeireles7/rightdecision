import { afterEach, describe, expect, test } from 'bun:test'
import { Hono } from 'hono'
import { throwError } from '@/platform/errors'
import { success } from '@/platform/server/responses'
import { ApiError, api, createApiClient, createFetch, setUnauthorizedHandler, unwrap } from '.'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function catchApiError(promise: Promise<unknown>): Promise<ApiError> {
  let caught: unknown
  try {
    await promise
  } catch (err) {
    caught = err
  }
  expect(caught).toBeInstanceOf(ApiError)
  return caught as ApiError
}

afterEach(() => {
  setUnauthorizedHandler(null)
})

describe('unit: api-client unwrap', () => {
  test('unwraps { ok: true, data } envelope to data', async () => {
    const data = await unwrap(jsonResponse({ ok: true, data: { id: 'abc' } }))
    expect(data).toEqual({ id: 'abc' })
  })

  test('unwraps paginated envelopes ({ ok, data, meta }) to data', async () => {
    const data = await unwrap(
      jsonResponse({
        ok: true,
        data: [{ id: '1' }, { id: '2' }],
        meta: { total: 2, page: 1, perPage: 50, totalPages: 1 },
      }),
    )
    expect(data).toEqual([{ id: '1' }, { id: '2' }])
  })

  test('maps { ok: false } envelope to ApiError carrying the error code', async () => {
    const err = await catchApiError(
      unwrap(
        jsonResponse({ ok: false, code: 'LESSON_NOT_FOUND', message: 'Lesson not found' }, 404),
      ),
    )
    expect(err.code).toBe('LESSON_NOT_FOUND')
    expect(err.status).toBe(404)
    expect(err.message).toBe('Lesson not found')
    expect(err.details).toBeUndefined()
  })

  test('carries details when the error envelope includes them', async () => {
    const err = await catchApiError(
      unwrap(
        jsonResponse(
          {
            ok: false,
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: 'name required',
          },
          400,
        ),
      ),
    )
    expect(err.code).toBe('VALIDATION_ERROR')
    expect(err.details).toBe('name required')
  })

  test('network failure → ApiError INTERNAL_ERROR with status 0', async () => {
    const err = await catchApiError(unwrap(Promise.reject(new TypeError('fetch failed'))))
    expect(err.code).toBe('INTERNAL_ERROR')
    expect(err.status).toBe(0)
    expect(err.message).toContain('fetch failed')
  })

  test('non-Error network rejection still maps to ApiError', async () => {
    const err = await catchApiError(unwrap(Promise.reject('boom')))
    expect(err.code).toBe('INTERNAL_ERROR')
    expect(err.status).toBe(0)
  })

  test('non-JSON response → ApiError INTERNAL_ERROR with response status', async () => {
    const err = await catchApiError(unwrap(new Response('<html>oops</html>', { status: 502 })))
    expect(err.code).toBe('INTERNAL_ERROR')
    expect(err.status).toBe(502)
  })

  test('unexpected response shape → ApiError INTERNAL_ERROR', async () => {
    const err = await catchApiError(unwrap(jsonResponse({ hello: 'world' })))
    expect(err.code).toBe('INTERNAL_ERROR')
    expect(err.status).toBe(200)
  })
})

describe('unit: api-client fetch wrapper', () => {
  test('defaults credentials to include and Accept to application/json', async () => {
    let captured: RequestInit | undefined
    const wrapped = createFetch({
      fetch: async (_input, init) => {
        captured = init
        return jsonResponse({ ok: true, data: null })
      },
    })
    await wrapped('http://test.local/api/thing')
    expect(captured?.credentials).toBe('include')
    expect(new Headers(captured?.headers).get('accept')).toBe('application/json')
  })

  test('respects caller-provided credentials and Accept header', async () => {
    let captured: RequestInit | undefined
    const wrapped = createFetch({
      fetch: async (_input, init) => {
        captured = init
        return jsonResponse({ ok: true, data: null })
      },
    })
    await wrapped('http://test.local/api/thing', {
      credentials: 'omit',
      headers: { Accept: 'text/event-stream' },
    })
    expect(captured?.credentials).toBe('omit')
    expect(new Headers(captured?.headers).get('accept')).toBe('text/event-stream')
  })

  test('fires per-client onUnauthorized callback on 401', async () => {
    let fired = 0
    const wrapped = createFetch({
      fetch: async () =>
        jsonResponse({ ok: false, code: 'UNAUTHORIZED', message: 'Authentication required' }, 401),
      onUnauthorized: () => {
        fired++
      },
    })
    const res = await wrapped('http://test.local/api/me')
    expect(fired).toBe(1)
    const err = await catchApiError(unwrap(res))
    expect(err.code).toBe('UNAUTHORIZED')
    expect(err.status).toBe(401)
  })

  test('falls back to the global handler from setUnauthorizedHandler on 401', async () => {
    let fired = 0
    setUnauthorizedHandler(() => {
      fired++
    })
    const wrapped = createFetch({
      fetch: async () =>
        jsonResponse({ ok: false, code: 'SESSION_EXPIRED', message: 'Session expired' }, 401),
    })
    await wrapped('http://test.local/api/me')
    expect(fired).toBe(1)
  })

  test('does not fire unauthorized callbacks on non-401 responses', async () => {
    let fired = 0
    setUnauthorizedHandler(() => {
      fired++
    })
    const wrapped = createFetch({
      fetch: async () => jsonResponse({ ok: true, data: null }),
      onUnauthorized: () => {
        fired++
      },
    })
    await wrapped('http://test.local/api/thing')
    expect(fired).toBe(0)
  })

  test('no-op when 401 arrives and no handler is registered', async () => {
    const wrapped = createFetch({
      fetch: async () =>
        jsonResponse({ ok: false, code: 'UNAUTHORIZED', message: 'Authentication required' }, 401),
    })
    const res = await wrapped('http://test.local/api/me')
    expect(res.status).toBe(401)
  })
})

describe('unit: api-client typed RPC (canonical pattern)', () => {
  // Route files MUST chain handlers like this for AppRoutes/RPC type inference.
  const demoApp = new Hono()
    .get('/api/demo', (c) => success(c, { greeting: 'hi' }))
    .get('/api/missing', (c) => throwError(c, 'NOT_FOUND'))

  test('chained route → typed client → unwrap returns inferred data', async () => {
    const client = createApiClient<typeof demoApp>('http://test.local', {
      fetch: (input, init) => demoApp.request(input, init),
    })
    const data = await unwrap(client.api.demo.$get())
    // data.greeting is typed string — inferred from the route, no manual types
    expect(data.greeting).toBe('hi')
  })

  test('error envelope from a real route maps to ApiError', async () => {
    const client = createApiClient<typeof demoApp>('http://test.local', {
      fetch: (input, init) => demoApp.request(input, init),
    })
    const err = await catchApiError(unwrap(client.api.missing.$get()))
    expect(err.code).toBe('NOT_FOUND')
    expect(err.status).toBe(404)
  })

  test('default api singleton is bound to AppRoutes', () => {
    expect(api).toBeDefined()
  })
})
