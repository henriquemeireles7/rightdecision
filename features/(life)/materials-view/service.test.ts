import { afterAll, beforeEach, describe, expect, mock, test } from 'bun:test'
import {
  createTestEnrollment,
  createTestMaterial,
  createTestProgram,
  createTestProgramMaterial,
  createTestUser,
} from '@/platform/test/factories'
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

const { getMaterialDownloadUrl, listMaterials, programIdsForMaterial } = await import('./service')

await setupTestDb()
afterAll(teardownTestDb)

describe('integration: materials-view listMaterials', () => {
  test('lists the enrolled programs materials, deduplicated, without fileKey', async () => {
    const user = await createTestUser()
    const programA = await createTestProgram()
    const programB = await createTestProgram()
    const otherProgram = await createTestProgram()
    await createTestEnrollment(user!.id, programA!.id)
    await createTestEnrollment(user!.id, programB!.id)

    const shared = await createTestMaterial() // mapped to BOTH enrolled programs
    await createTestProgramMaterial(programA!.id, shared!.id)
    await createTestProgramMaterial(programB!.id, shared!.id)
    const own = await createTestMaterial()
    await createTestProgramMaterial(programA!.id, own!.id)
    const foreign = await createTestMaterial()
    await createTestProgramMaterial(otherProgram!.id, foreign!.id)

    const materialsList = await listMaterials(user!.id)

    const ids = materialsList.map((m) => m.id)
    expect(ids).toContain(own!.id)
    expect(ids).not.toContain(foreign!.id)
    expect(ids.filter((id) => id === shared!.id).length).toBe(1) // deduplicated
    // The signed URL is the only download path — never leak R2 keys
    expect(materialsList.some((m) => 'fileKey' in m)).toBe(false)
  })

  test('expired enrollment sees nothing', async () => {
    const user = await createTestUser()
    const program = await createTestProgram()
    await createTestEnrollment(user!.id, program!.id, {
      expiresAt: new Date(Date.now() - 60_000),
    })
    const material = await createTestMaterial()
    await createTestProgramMaterial(program!.id, material!.id)

    expect(await listMaterials(user!.id)).toEqual([])
  })
})

describe('integration: materials-view getMaterialDownloadUrl', () => {
  beforeEach(() => {
    getSignedUrlMock.mockClear()
  })

  test('signs a download URL for an enrolled user', async () => {
    const user = await createTestUser()
    const program = await createTestProgram()
    await createTestEnrollment(user!.id, program!.id)
    const material = await createTestMaterial({ fileKey: 'materials/workbook.pdf' })
    await createTestProgramMaterial(program!.id, material!.id)

    const result = await getMaterialDownloadUrl(user!.id, material!.id)

    if ('error' in result) throw new Error(`unexpected error ${result.error}`)
    expect(result.data.url).toBe('https://r2.example.com/signed')
    expect(getSignedUrlMock).toHaveBeenCalledWith('materials/workbook.pdf')
    expect(result.data.title).toBe(material!.title)
  })

  test('STORAGE_UNAVAILABLE when signing throws — clean 503, never a raw 500', async () => {
    const user = await createTestUser()
    const program = await createTestProgram()
    await createTestEnrollment(user!.id, program!.id)
    const material = await createTestMaterial({ fileKey: 'materials/workbook.pdf' })
    await createTestProgramMaterial(program!.id, material!.id)

    getSignedUrlMock.mockImplementationOnce(() => Promise.reject(new Error('R2 down')))
    expect(await getMaterialDownloadUrl(user!.id, material!.id)).toEqual({
      error: 'STORAGE_UNAVAILABLE',
    })
  })

  test('ENROLLMENT_REQUIRED without access — never signs', async () => {
    const user = await createTestUser()
    const program = await createTestProgram()
    const material = await createTestMaterial()
    await createTestProgramMaterial(program!.id, material!.id)

    expect(await getMaterialDownloadUrl(user!.id, material!.id)).toEqual({
      error: 'ENROLLMENT_REQUIRED',
    })
    expect(getSignedUrlMock).not.toHaveBeenCalled()
  })

  test('NOT_FOUND for unknown material ids', async () => {
    const user = await createTestUser()

    expect(await getMaterialDownloadUrl(user!.id, '00000000-0000-4000-8000-000000000000')).toEqual({
      error: 'NOT_FOUND',
    })
  })
})

describe('integration: programIdsForMaterial', () => {
  test('resolves every program the material is mapped to; [] for unknown', async () => {
    const programA = await createTestProgram()
    const programB = await createTestProgram()
    const material = await createTestMaterial()
    await createTestProgramMaterial(programA!.id, material!.id)
    await createTestProgramMaterial(programB!.id, material!.id)

    const ids = await programIdsForMaterial(material!.id)
    expect(ids.sort()).toEqual([programA!.id, programB!.id].sort())

    expect(await programIdsForMaterial('00000000-0000-4000-8000-000000000000')).toEqual([])
  })
})
