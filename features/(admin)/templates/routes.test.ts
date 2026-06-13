import { afterAll, describe, expect, test } from 'bun:test'
import { asUser, installTestAuth } from '@/features/(admin)/test-helpers'
import {
  buildTestTemplateSchema,
  createTestProgram,
  createTestUser,
} from '@/platform/test/factories'
import { apiCall, assertError, assertSuccess } from '@/platform/test/helpers'
import { setupTestDb, teardownTestDb } from '@/platform/test/setup'

installTestAuth()
const { adminTemplatesRoutes } = await import('./routes')

await setupTestDb()
afterAll(teardownTestDb)

async function admin() {
  const user = await createTestUser({ role: 'admin' })
  return asUser(user!.id, 'admin')
}

describe('integration: admin templates routes', () => {
  test('gating trio: no auth → 401, non-admin → 403, admin → 200', async () => {
    assertError(await apiCall(adminTemplatesRoutes, 'GET', '/'), 'UNAUTHORIZED')

    const member = await createTestUser()
    assertError(
      await apiCall(adminTemplatesRoutes, 'GET', '/', undefined, asUser(member!.id, 'free')),
      'FORBIDDEN',
    )

    assertSuccess(await apiCall(adminTemplatesRoutes, 'GET', '/', undefined, await admin()))
  })

  test('POST / creates a draft; GET /:id reads it back; list filters by program', async () => {
    const headers = await admin()
    const program = await createTestProgram()

    const createResponse = await apiCall(
      adminTemplatesRoutes,
      'POST',
      '/',
      {
        programId: program!.id,
        slug: 'route-made',
        title: 'Route Made',
        schema: buildTestTemplateSchema(),
      },
      headers,
    )
    expect(createResponse.status).toBe(201)
    const { template } = (createResponse.body as { data: { template: { id: string } } }).data

    const got = assertSuccess(
      await apiCall(adminTemplatesRoutes, 'GET', `/${template.id}`, undefined, headers),
    ) as { template: { slug: string; status: string } }
    expect(got.template.slug).toBe('route-made')
    expect(got.template.status).toBe('draft')

    const listed = assertSuccess(
      await apiCall(adminTemplatesRoutes, 'GET', `/?programId=${program!.id}`, undefined, headers),
    ) as { templates: Array<{ id: string }> }
    expect(listed.templates.map((t) => t.id)).toEqual([template.id])
  })

  test('POST / rejects invalid template jsonb with VALIDATION_ERROR', async () => {
    const headers = await admin()
    const program = await createTestProgram()

    assertError(
      await apiCall(
        adminTemplatesRoutes,
        'POST',
        '/',
        { programId: program!.id, slug: 'bad', title: 'Bad', schema: { chapters: 'nope' } },
        headers,
      ),
      'VALIDATION_ERROR',
    )
  })

  test('publish flow: PATCH draft → POST publish → published PATCH rename rejected', async () => {
    const headers = await admin()
    const program = await createTestProgram()
    const createResponse = await apiCall(
      adminTemplatesRoutes,
      'POST',
      '/',
      {
        programId: program!.id,
        slug: 'flow',
        title: 'Flow',
        schema: buildTestTemplateSchema(),
      },
      headers,
    )
    const { template } = (createResponse.body as { data: { template: { id: string } } }).data

    const published = assertSuccess(
      await apiCall(adminTemplatesRoutes, 'POST', `/${template.id}/publish`, undefined, headers),
    ) as { template: { status: string; version: number } }
    expect(published.template.status).toBe('published')
    expect(published.template.version).toBe(1)

    const renamed = buildTestTemplateSchema()
    renamed.chapters[0]!.pages[0]!.fields[0]!.id = 'f-renamed'
    assertError(
      await apiCall(adminTemplatesRoutes, 'PATCH', `/${template.id}`, { schema: renamed }, headers),
      'VALIDATION_ERROR',
    )

    // deprecation is the allowed path — and bumps the version
    const deprecated = buildTestTemplateSchema()
    deprecated.chapters[0]!.pages[0]!.fields[1]!.deprecatedInVersion = 1
    const bumped = assertSuccess(
      await apiCall(
        adminTemplatesRoutes,
        'PATCH',
        `/${template.id}`,
        { schema: deprecated },
        headers,
      ),
    ) as { template: { version: number } }
    expect(bumped.template.version).toBe(2)
  })

  test('invalid uuids 400 instead of leaking pg cast errors', async () => {
    const headers = await admin()
    expect(
      (await apiCall(adminTemplatesRoutes, 'GET', '/not-a-uuid', undefined, headers)).status,
    ).toBe(400)
  })
})
