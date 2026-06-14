import { afterAll, describe, expect, mock, test } from 'bun:test'
import { setV2CutoverOverrideForTests } from '@/platform/auth/enrollment'
import {
  createTestEnrollment,
  createTestMaterial,
  createTestProgram,
  createTestProgramMaterial,
  createTestUser,
} from '@/platform/test/factories'
import { apiCall, assertError, assertSuccess, stubAuth } from '@/platform/test/helpers'
import { setupTestDb, teardownTestDb } from '@/platform/test/setup'
import * as realStorage from '@/providers/storage'

const getSignedUrlMock = mock((_key: string) => Promise.resolve('https://r2.example.com/signed'))
mock.module('@/providers/storage', () => ({
  ...realStorage,
  getSignedUrl: getSignedUrlMock,
}))
afterAll(() => {
  mock.module('@/providers/storage', () => realStorage)
})

const { createMaterialsViewRoutes } = await import('./routes')

await setupTestDb()
setV2CutoverOverrideForTests(true)
afterAll(() => {
  setV2CutoverOverrideForTests(undefined)
  return teardownTestDb()
})

describe('integration: materials-view routes', () => {
  test('GET / requires authentication', async () => {
    const app = createMaterialsViewRoutes()

    assertError(await apiCall(app, 'GET', '/'), 'UNAUTHORIZED')
  })

  test('GET / lists the enrolled programs materials', async () => {
    const user = await createTestUser()
    const program = await createTestProgram()
    await createTestEnrollment(user!.id, program!.id)
    const material = await createTestMaterial()
    await createTestProgramMaterial(program!.id, material!.id)
    const app = createMaterialsViewRoutes({ auth: stubAuth(user!) })

    const response = await apiCall(app, 'GET', '/')

    const data = assertSuccess(response) as { materials: Array<{ id: string }> }
    expect(data.materials.map((m) => m.id)).toContain(material!.id)
  })

  test('GET /:id/download-url returns a signed URL for an enrolled user', async () => {
    const user = await createTestUser()
    const program = await createTestProgram()
    await createTestEnrollment(user!.id, program!.id)
    const material = await createTestMaterial()
    await createTestProgramMaterial(program!.id, material!.id)
    const app = createMaterialsViewRoutes({ auth: stubAuth(user!) })

    const response = await apiCall(app, 'GET', `/${material!.id}/download-url`)

    const data = assertSuccess(response) as { url: string }
    expect(data.url).toBe('https://r2.example.com/signed')
  })

  test('GET /:id/download-url is enrollment-gated', async () => {
    const stranger = await createTestUser()
    const program = await createTestProgram()
    const material = await createTestMaterial()
    await createTestProgramMaterial(program!.id, material!.id)
    const app = createMaterialsViewRoutes({ auth: stubAuth(stranger!) })

    assertError(await apiCall(app, 'GET', `/${material!.id}/download-url`), 'ENROLLMENT_REQUIRED')
  })

  test('GET /:id/download-url rejects invalid uuids with 400', async () => {
    const user = await createTestUser()
    const app = createMaterialsViewRoutes({ auth: stubAuth(user!) })

    expect((await apiCall(app, 'GET', '/not-a-uuid/download-url')).status).toBe(400)
  })
})
