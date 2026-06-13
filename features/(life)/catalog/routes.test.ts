import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import {
  createTestCourse,
  createTestEnrollment,
  createTestLesson,
  createTestModule,
  createTestProgram,
  createTestProgramCourse,
  createTestUser,
} from '@/platform/test/factories'
import { apiCall, assertError, assertSuccess, stubAuth } from '@/platform/test/helpers'
import { setupTestDb, teardownTestDb } from '@/platform/test/setup'
import { createCatalogRoutes } from './routes'

describe('integration: catalog routes', () => {
  beforeAll(setupTestDb)
  afterAll(teardownTestDb)

  test('GET / requires authentication', async () => {
    const app = createCatalogRoutes()

    assertError(await apiCall(app, 'GET', '/'), 'UNAUTHORIZED')
  })

  test('GET / returns the program-aware catalog for the user', async () => {
    const user = await createTestUser()
    const program = await createTestProgram()
    const course = await createTestCourse()
    await createTestProgramCourse(program!.id, course!.id)
    const courseModule = await createTestModule(course!.id)
    await createTestLesson(courseModule!.id, { status: 'published' })
    await createTestEnrollment(user!.id, program!.id)
    const app = createCatalogRoutes({ auth: stubAuth(user!) })

    const response = await apiCall(app, 'GET', '/')

    const data = assertSuccess(response) as {
      programs: Array<{ id: string; unlocked: boolean }>
      continueWatching: unknown[]
      cohortStartsAt: string | null
    }
    expect(data.programs.find((p) => p.id === program!.id)?.unlocked).toBe(true)
    expect(data.continueWatching).toEqual([])
    expect(data.cohortStartsAt).toBeNull()
  })
})
