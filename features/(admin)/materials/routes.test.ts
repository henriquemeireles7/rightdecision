import { afterAll, beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test'
import { asUser, installTestAuth } from '@/features/(admin)/test-helpers'

installTestAuth()

const actualStorage = await import('@/providers/storage')
mock.module('@/providers/storage', () => ({
  ...actualStorage,
  getUploadUrl: mock(() => Promise.resolve('https://r2.test/put')),
}))

import { createTestMaterial, createTestProgram, createTestUser } from '@/platform/test/factories'
import { apiCall, assertError, assertSuccess } from '@/platform/test/helpers'
import { setupTestDb, teardownTestDb } from '@/platform/test/setup'

const { adminMaterialsRoutes } = await import('./routes')
const app = adminMaterialsRoutes

describe('integration: materials routes', () => {
  let adminId: string
  beforeAll(setupTestDb)
  afterAll(teardownTestDb)
  beforeEach(async () => {
    await teardownTestDb()
    const admin = await createTestUser({ role: 'admin' })
    adminId = admin!.id
  })

  it('gates: 401 without session, 403 for non-admin', async () => {
    assertError(await apiCall(app, 'GET', '/'), 'UNAUTHORIZED')
    assertError(await apiCall(app, 'GET', '/', undefined, asUser('u', 'pro')), 'FORBIDDEN')
  })

  it('issues an upload URL, creates and lists materials', async () => {
    const uploadRes = await apiCall(
      app,
      'POST',
      '/upload-url',
      { fileName: 'guide.pdf', mimeType: 'application/pdf' },
      asUser(adminId),
    )
    const upload = assertSuccess(uploadRes) as { uploadUrl: string; fileKey: string }
    expect(upload.uploadUrl).toBe('https://r2.test/put')

    const createRes = await apiCall(
      app,
      'POST',
      '/',
      { title: 'Guide', fileKey: upload.fileKey, fileSizeBytes: 10, mimeType: 'application/pdf' },
      asUser(adminId),
    )
    expect(createRes.status).toBe(201)

    const listRes = await apiCall(app, 'GET', '/', undefined, asUser(adminId))
    const data = assertSuccess(listRes) as { materials: unknown[] }
    expect(data.materials).toHaveLength(1)
  })

  it('400s invalid input', async () => {
    expect((await apiCall(app, 'POST', '/upload-url', {}, asUser(adminId))).status).toBe(400)
    expect((await apiCall(app, 'POST', '/', { title: 'x' }, asUser(adminId))).status).toBe(400)
    expect(
      (await apiCall(app, 'PATCH', '/not-a-uuid', { title: 'x' }, asUser(adminId))).status,
    ).toBe(400)
  })

  it('updates, deletes and maps materials to programs', async () => {
    const material = await createTestMaterial()
    const program = await createTestProgram()

    assertSuccess(
      await apiCall(app, 'PATCH', `/${material!.id}`, { title: 'Renamed' }, asUser(adminId)),
    )
    const mapRes = await apiCall(
      app,
      'POST',
      `/programs/${program!.id}`,
      { materialId: material!.id },
      asUser(adminId),
    )
    expect(mapRes.status).toBe(201)
    const listRes = await apiCall(
      app,
      'GET',
      `/programs/${program!.id}`,
      undefined,
      asUser(adminId),
    )
    const mapped = assertSuccess(listRes) as { materials: Array<{ id: string }> }
    expect(mapped.materials.map((m) => m.id)).toEqual([material!.id])

    assertSuccess(
      await apiCall(
        app,
        'DELETE',
        `/programs/${program!.id}/${material!.id}`,
        undefined,
        asUser(adminId),
      ),
    )
    assertSuccess(await apiCall(app, 'DELETE', `/${material!.id}`, undefined, asUser(adminId)))
  })
})
