import { afterAll, beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test'

const actualStorage = await import('@/providers/storage')
const mockGetUploadUrl = mock(() => Promise.resolve('https://r2.test/presigned-put'))
mock.module('@/providers/storage', () => ({
  ...actualStorage,
  getUploadUrl: mockGetUploadUrl,
}))

import { materials, programMaterials } from '@/platform/db/schema'
import {
  createTestCourse,
  createTestLesson,
  createTestMaterial,
  createTestModule,
  createTestProgram,
} from '@/platform/test/factories'
import { setupTestDb, teardownTestDb, testDb } from '@/platform/test/setup'
import { ProviderError } from '@/providers/errors'

const {
  addMaterialToProgram,
  createMaterial,
  deleteMaterial,
  listMaterials,
  listProgramMaterials,
  removeMaterialFromProgram,
  requestMaterialUploadUrl,
  updateMaterial,
} = await import('./service')

const MISSING_ID = '00000000-0000-0000-0000-000000000000'

describe('integration: materials service', () => {
  beforeAll(setupTestDb)
  afterAll(teardownTestDb)
  beforeEach(async () => {
    await teardownTestDb()
    mockGetUploadUrl.mockClear()
    mockGetUploadUrl.mockResolvedValue('https://r2.test/presigned-put')
  })

  it('issues a presigned PUT URL with a server-generated key', async () => {
    const result = await requestMaterialUploadUrl({
      fileName: 'Workbook Final.pdf',
      mimeType: 'application/pdf',
    })
    if ('error' in result) throw new Error(result.error)
    expect(result.uploadUrl).toBe('https://r2.test/presigned-put')
    expect(result.fileKey).toMatch(/^materials\/[0-9a-f-]{36}\/Workbook-Final\.pdf$/)
    expect(mockGetUploadUrl).toHaveBeenCalledWith(result.fileKey, 'application/pdf')
  })

  it('sanitizes hostile filenames into safe keys', async () => {
    const result = await requestMaterialUploadUrl({
      fileName: '../../etc/passwd',
      mimeType: 'text/plain',
    })
    if ('error' in result) throw new Error(result.error)
    expect(result.fileKey).not.toContain('..')
    expect(result.fileKey.split('/').every((seg) => seg !== '..' && seg !== '')).toBe(true)
  })

  it('maps presign provider failure to INTERNAL_ERROR', async () => {
    mockGetUploadUrl.mockRejectedValueOnce(
      new ProviderError('r2', 'getUploadUrl', 500, 'down') as never,
    )
    const result = await requestMaterialUploadUrl({
      fileName: 'a.pdf',
      mimeType: 'application/pdf',
    })
    expect(result).toMatchObject({ error: 'INTERNAL_ERROR' })
  })

  it('creates, lists, updates and deletes a material', async () => {
    const createResult = await createMaterial({
      title: 'Workbook',
      fileKey: 'materials/x/workbook.pdf',
      fileSizeBytes: 1234,
      mimeType: 'application/pdf',
    })
    if ('error' in createResult) throw new Error(createResult.error)
    const material = createResult.material
    expect(material.title).toBe('Workbook')

    const { materials: listed } = await listMaterials()
    expect(listed).toHaveLength(1)

    const updateResult = await updateMaterial(material.id, { title: 'Workbook v2' })
    if ('error' in updateResult) throw new Error(updateResult.error)
    expect(updateResult.material.title).toBe('Workbook v2')

    const deleteResult = await deleteMaterial(material.id)
    expect(deleteResult).toEqual({ deleted: true })
    const remaining = await testDb.select().from(materials)
    expect(remaining).toHaveLength(0)
  })

  it('returns NOT_FOUND for missing materials', async () => {
    expect(await updateMaterial(MISSING_ID, { title: 'x' })).toEqual({ error: 'NOT_FOUND' })
    expect(await deleteMaterial(MISSING_ID)).toEqual({ error: 'NOT_FOUND' })
  })

  it('attaches a material to a lesson, rejecting missing lessons', async () => {
    const course = await createTestCourse()
    const mod = await createTestModule(course!.id)
    const lesson = await createTestLesson(mod!.id)

    const attached = await createMaterial({
      title: 'Attached',
      fileKey: 'materials/x/a.pdf',
      lessonId: lesson!.id,
    })
    if ('error' in attached) throw new Error(attached.error)
    expect(attached.material.lessonId).toBe(lesson!.id)

    expect(
      await createMaterial({ title: 'Bad', fileKey: 'materials/x/b.pdf', lessonId: MISSING_ID }),
    ).toEqual({ error: 'LESSON_NOT_FOUND' })

    const material = await createTestMaterial()
    expect(await updateMaterial(material!.id, { lessonId: MISSING_ID })).toEqual({
      error: 'LESSON_NOT_FOUND',
    })
    const detach = await updateMaterial(attached.material.id, { lessonId: null })
    if ('error' in detach) throw new Error(detach.error)
    expect(detach.material.lessonId).toBeNull()
  })

  it('maps materials to programs idempotently', async () => {
    const program = await createTestProgram()
    const material = await createTestMaterial()

    const first = await addMaterialToProgram(program!.id, material!.id)
    if ('error' in first) throw new Error(first.error)
    const second = await addMaterialToProgram(program!.id, material!.id)
    if ('error' in second) throw new Error(second.error)

    const mappings = await testDb.select().from(programMaterials)
    expect(mappings).toHaveLength(1)

    const listResult = await listProgramMaterials(program!.id)
    if ('error' in listResult) throw new Error(listResult.error)
    expect(listResult.materials.map((m) => m.id)).toEqual([material!.id])
  })

  it('validates program and material existence when mapping', async () => {
    const program = await createTestProgram()
    const material = await createTestMaterial()
    expect(await addMaterialToProgram(MISSING_ID, material!.id)).toEqual({
      error: 'PROGRAM_NOT_FOUND',
    })
    expect(await addMaterialToProgram(program!.id, MISSING_ID)).toEqual({ error: 'NOT_FOUND' })
    expect(await listProgramMaterials(MISSING_ID)).toEqual({ error: 'PROGRAM_NOT_FOUND' })
  })

  it('removes a program mapping, NOT_FOUND when absent', async () => {
    const program = await createTestProgram()
    const material = await createTestMaterial()
    await addMaterialToProgram(program!.id, material!.id)

    expect(await removeMaterialFromProgram(program!.id, material!.id)).toEqual({ removed: true })
    expect(await removeMaterialFromProgram(program!.id, material!.id)).toEqual({
      error: 'NOT_FOUND',
    })
  })
})
