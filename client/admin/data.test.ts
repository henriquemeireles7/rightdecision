import '@/platform/test/dom-preload'

import { describe, expect, test } from 'bun:test'
import { ApiError, createApiClient } from '@/features/(shared)/api-client'
import { createAdminData } from './data'

/** Fake transport: records requests, replies with a scripted success envelope. */
function fakeClient(data: unknown = {}) {
  const requests: Array<{ url: string; method: string; body: unknown }> = []
  const client = createApiClient('http://test.local', {
    fetch: async (input, init) => {
      requests.push({
        url: String(input instanceof Request ? input.url : input),
        method: init?.method ?? (input instanceof Request ? input.method : 'GET'),
        body: init?.body ? JSON.parse(String(init.body)) : undefined,
      })
      return new Response(JSON.stringify({ ok: true, data }), {
        headers: { 'content-type': 'application/json' },
      })
    },
  })
  return { client, requests }
}

describe('client/admin data: createAdminData wiring', () => {
  test('listCourses hits the course-builder list endpoint and unwraps the envelope', async () => {
    const { client, requests } = fakeClient({ courses: [] })
    const data = createAdminData(client)
    const result = await data.listCourses()
    expect(result).toEqual({ courses: [] })
    expect(requests[0]?.url).toBe('http://test.local/api/admin/course-builder/courses')
    expect(requests[0]?.method).toBe('GET')
  })

  test('getCourse substitutes the courseId param', async () => {
    const { client, requests } = fakeClient({ course: {}, modules: [] })
    await createAdminData(client).getCourse('11111111-1111-4111-8111-111111111111')
    expect(requests[0]?.url).toBe(
      'http://test.local/api/admin/course-builder/courses/11111111-1111-4111-8111-111111111111',
    )
  })

  test('publishLesson POSTs to the publish gate', async () => {
    const { client, requests } = fakeClient({ lesson: {} })
    await createAdminData(client).publishLesson('l-1')
    expect(requests[0]?.url).toBe('http://test.local/api/admin/course-builder/lessons/l-1/publish')
    expect(requests[0]?.method).toBe('POST')
  })

  test('setCaptionsReady PUTs the ready flag', async () => {
    const { client, requests } = fakeClient({ lesson: {} })
    await createAdminData(client).setCaptionsReady('l-1', true)
    expect(requests[0]?.url).toBe(
      'http://test.local/api/admin/course-builder/lessons/l-1/captions/ready',
    )
    expect(requests[0]?.method).toBe('PUT')
    expect(requests[0]?.body).toEqual({ ready: true })
  })

  test('listLives serializes the program scope query', async () => {
    const { client, requests } = fakeClient({ lives: [] })
    await createAdminData(client).listLives('p-1', 'upcoming')
    const url = new URL(requests[0]?.url ?? '')
    expect(url.pathname).toBe('/api/admin/lives')
    expect(url.searchParams.get('programId')).toBe('p-1')
    expect(url.searchParams.get('when')).toBe('upcoming')
  })

  test('reorderModules posts the full ordered id set', async () => {
    const { client, requests } = fakeClient({ modules: [] })
    await createAdminData(client).reorderModules('c-1', ['m-2', 'm-1'])
    expect(requests[0]?.url).toBe(
      'http://test.local/api/admin/course-builder/courses/c-1/modules/reorder',
    )
    expect(requests[0]?.body).toEqual({ moduleIds: ['m-2', 'm-1'] })
  })

  test('listTemplates hits the admin templates endpoint, optionally program-scoped', async () => {
    const { client, requests } = fakeClient({ templates: [] })
    await createAdminData(client).listTemplates()
    expect(new URL(requests[0]?.url ?? '').pathname).toBe('/api/admin/templates')
    await createAdminData(client).listTemplates('p-1')
    expect(new URL(requests[1]?.url ?? '').searchParams.get('programId')).toBe('p-1')
  })

  test('updateTemplate PATCHes the schema payload verbatim', async () => {
    const { client, requests } = fakeClient({ template: {} })
    const schema = { chapters: [] }
    await createAdminData(client).updateTemplate('t-1', { title: 'Life Playbook', schema })
    expect(requests[0]?.url).toBe('http://test.local/api/admin/templates/t-1')
    expect(requests[0]?.method).toBe('PATCH')
    expect(requests[0]?.body).toEqual({ title: 'Life Playbook', schema: { chapters: [] } })
  })

  test('publishTemplate POSTs to the publish endpoint', async () => {
    const { client, requests } = fakeClient({ template: {} })
    await createAdminData(client).publishTemplate('t-1')
    expect(requests[0]?.url).toBe('http://test.local/api/admin/templates/t-1/publish')
    expect(requests[0]?.method).toBe('POST')
  })

  test('error envelopes become typed ApiError (components branch on code)', async () => {
    const client = createApiClient('http://test.local', {
      fetch: async () =>
        new Response(
          JSON.stringify({ ok: false, code: 'CAPTIONS_REQUIRED', message: 'Captions required' }),
          { status: 422, headers: { 'content-type': 'application/json' } },
        ),
    })
    expect(createAdminData(client).publishLesson('l-1')).rejects.toThrow(ApiError)
  })
})
