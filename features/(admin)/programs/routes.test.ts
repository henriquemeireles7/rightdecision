import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { asUser, installTestAuth } from '@/features/(admin)/test-helpers'

installTestAuth()

import { createTestCourse, createTestProgram, createTestUser } from '@/platform/test/factories'
import { apiCall, assertError, assertSuccess } from '@/platform/test/helpers'
import { setupTestDb, teardownTestDb } from '@/platform/test/setup'

const { adminProgramsRoutes } = await import('./routes')
const app = adminProgramsRoutes

describe('integration: programs routes', () => {
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

  it('creates, lists, gets and updates programs', async () => {
    const createRes = await apiCall(
      app,
      'POST',
      '/',
      { slug: 'free-monthly', name: 'Free Monthly', tier: 'free' },
      asUser(adminId),
    )
    expect(createRes.status).toBe(201)
    const program = (createRes.body as { data: { program: { id: string } } }).data.program

    assertSuccess(await apiCall(app, 'GET', '/', undefined, asUser(adminId)))
    assertSuccess(await apiCall(app, 'GET', `/${program.id}`, undefined, asUser(adminId)))
    assertSuccess(
      await apiCall(app, 'PATCH', `/${program.id}`, { status: 'active' }, asUser(adminId)),
    )
  })

  it('manages the program_courses mapping', async () => {
    const program = await createTestProgram()
    const c1 = await createTestCourse()
    const c2 = await createTestCourse()

    const addRes = await apiCall(
      app,
      'POST',
      `/${program!.id}/courses`,
      { courseId: c1!.id },
      asUser(adminId),
    )
    expect(addRes.status).toBe(201)
    await apiCall(app, 'POST', `/${program!.id}/courses`, { courseId: c2!.id }, asUser(adminId))

    assertSuccess(
      await apiCall(
        app,
        'POST',
        `/${program!.id}/courses/reorder`,
        { courseIds: [c2!.id, c1!.id] },
        asUser(adminId),
      ),
    )

    const getRes = await apiCall(app, 'GET', `/${program!.id}`, undefined, asUser(adminId))
    const data = assertSuccess(getRes) as { courses: Array<{ id: string }> }
    expect(data.courses.map((c) => c.id)).toEqual([c2!.id, c1!.id])

    assertSuccess(
      await apiCall(app, 'DELETE', `/${program!.id}/courses/${c1!.id}`, undefined, asUser(adminId)),
    )
  })

  it('400s invalid input', async () => {
    expect((await apiCall(app, 'POST', '/', { name: 'no slug' }, asUser(adminId))).status).toBe(400)
    expect(
      (await apiCall(app, 'POST', '/', { slug: 's', name: 'n', tier: 'gold' }, asUser(adminId)))
        .status,
    ).toBe(400)
    expect((await apiCall(app, 'GET', '/nope', undefined, asUser(adminId))).status).toBe(400)
  })

  it('404s a missing program mapping target', async () => {
    const course = await createTestCourse()
    assertError(
      await apiCall(
        app,
        'POST',
        '/00000000-0000-0000-0000-000000000000/courses',
        { courseId: course!.id },
        asUser(adminId),
      ),
      'PROGRAM_NOT_FOUND',
    )
  })
})
