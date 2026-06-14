import { afterAll, describe, expect, test } from 'bun:test'
import { setV2CutoverOverrideForTests } from '@/platform/auth/enrollment'
import {
  createTestDocumentTemplate,
  createTestEnrollment,
  createTestProgram,
  createTestUser,
} from '@/platform/test/factories'
import { apiCall, assertError, assertSuccess, stubAuth } from '@/platform/test/helpers'
import { setupTestDb, teardownTestDb } from '@/platform/test/setup'
import { createPlaybookRoutes } from './routes'

await setupTestDb()
setV2CutoverOverrideForTests(true)
afterAll(() => {
  setV2CutoverOverrideForTests(undefined)
  return teardownTestDb()
})

async function enrolledFixture() {
  const user = await createTestUser()
  const program = await createTestProgram()
  await createTestEnrollment(user!.id, program!.id)
  const template = await createTestDocumentTemplate(program!.id)
  return { user: user!, program: program!, template: template! }
}

describe('integration: playbook routes', () => {
  test('GET / requires authentication', async () => {
    assertError(await apiCall(createPlaybookRoutes(), 'GET', '/'), 'UNAUTHORIZED')
  })

  test('GET / returns the enrolled user playbook with progress', async () => {
    const { user, template } = await enrolledFixture()
    const app = createPlaybookRoutes({ auth: stubAuth(user) })

    const data = assertSuccess(await apiCall(app, 'GET', '/')) as {
      documents: Array<{ templateId: string; document: { status: string }; progress: unknown }>
    }

    expect(data.documents.map((d) => d.templateId)).toContain(template.id)
    expect(data.documents[0]?.document.status).toBe('empty')
    expect(data.documents[0]?.progress).toBeDefined()
  })

  test('GET /:templateId/pages/:pageId returns the page for an enrolled user', async () => {
    const { user, template } = await enrolledFixture()
    const app = createPlaybookRoutes({ auth: stubAuth(user) })

    const data = assertSuccess(await apiCall(app, 'GET', `/${template.id}/pages/pg-1`)) as {
      page: { id: string; fields: unknown[] }
    }

    expect(data.page.id).toBe('pg-1')
    expect(data.page.fields).toHaveLength(2)
  })

  test('page route is enrollment-gated', async () => {
    const { template } = await enrolledFixture()
    const stranger = await createTestUser()
    const app = createPlaybookRoutes({ auth: stubAuth(stranger!) })

    assertError(await apiCall(app, 'GET', `/${template.id}/pages/pg-1`), 'ENROLLMENT_REQUIRED')
  })

  test('PUT /:templateId/answers saves and reports progress', async () => {
    const { user, template } = await enrolledFixture()
    const app = createPlaybookRoutes({ auth: stubAuth(user) })

    const data = assertSuccess(
      await apiCall(app, 'PUT', `/${template.id}/answers`, {
        fieldId: 'f-required',
        value: 'A real answer.',
      }),
    ) as { document: { status: string }; progress: { filled: number } }

    expect(data.document.status).toBe('complete')
    expect(data.progress.filled).toBe(1)
  })

  test('PUT /:templateId/answers rejects unknown fields with ANSWER_FIELD_INVALID', async () => {
    const { user, template } = await enrolledFixture()
    const app = createPlaybookRoutes({ auth: stubAuth(user) })

    assertError(
      await apiCall(app, 'PUT', `/${template.id}/answers`, { fieldId: 'f-nope', value: 'x' }),
      'ANSWER_FIELD_INVALID',
    )
  })

  test('invalid template uuids 400 instead of leaking pg cast errors', async () => {
    const { user } = await enrolledFixture()
    const app = createPlaybookRoutes({ auth: stubAuth(user) })

    expect((await apiCall(app, 'GET', '/not-a-uuid/pages/pg-1')).status).toBe(400)
  })

  test('GET /:templateId/export returns print-ready HTML with the answers', async () => {
    const { user, template } = await enrolledFixture()
    const app = createPlaybookRoutes({ auth: stubAuth(user) })
    await apiCall(app, 'PUT', `/${template.id}/answers`, {
      fieldId: 'f-required',
      value: 'The exported answer.',
    })

    const response = await app.fetch(
      new Request(`http://localhost/${template.id}/export`, { method: 'GET' }),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    const html = await response.text()
    expect(html).toContain('The exported answer.')
    expect(html).toContain('@media print')
    expect(html).toMatch(/background:\s*#fff/i)
  })

  test('export is enrollment-gated', async () => {
    const { template } = await enrolledFixture()
    const stranger = await createTestUser()
    const app = createPlaybookRoutes({ auth: stubAuth(stranger!) })

    assertError(await apiCall(app, 'GET', `/${template.id}/export`), 'ENROLLMENT_REQUIRED')
  })
})
