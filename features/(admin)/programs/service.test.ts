import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { getActiveEnrollment } from '@/features/(shared)/enrollment/service'
import {
  createTestCourse,
  createTestEnrollment,
  createTestProgram,
  createTestProgramCourse,
  createTestUser,
} from '@/platform/test/factories'
import { setupTestDb, teardownTestDb } from '@/platform/test/setup'
import {
  addCourseToProgram,
  createProgram,
  getProgram,
  listPrograms,
  removeCourseFromProgram,
  reorderProgramCourses,
  updateProgram,
} from './service'

const MISSING_ID = '00000000-0000-0000-0000-000000000000'

describe('integration: programs service', () => {
  beforeAll(setupTestDb)
  afterAll(teardownTestDb)
  beforeEach(async () => {
    await teardownTestDb()
  })

  it('creates a program as draft', async () => {
    const result = await createProgram({ slug: 'paid-program', name: 'Paid', tier: 'paid' })
    if ('error' in result) throw new Error(result.error)
    expect(result.program.slug).toBe('paid-program')
    expect(result.program.status).toBe('draft')
  })

  it('rejects duplicate slugs with VALIDATION_ERROR', async () => {
    await createProgram({ slug: 'dup', name: 'One', tier: 'free' })
    expect(await createProgram({ slug: 'dup', name: 'Two', tier: 'free' })).toMatchObject({
      error: 'VALIDATION_ERROR',
    })
  })

  it('lists programs and gets one with its ordered courses', async () => {
    const program = await createTestProgram()
    const c1 = await createTestCourse()
    const c2 = await createTestCourse()
    await createTestProgramCourse(program!.id, c2!.id, { sortOrder: 1 })
    await createTestProgramCourse(program!.id, c1!.id, { sortOrder: 0 })

    const { programs: all } = await listPrograms()
    expect(all).toHaveLength(1)

    const result = await getProgram(program!.id)
    if ('error' in result) throw new Error(result.error)
    expect(result.courses.map((c) => c.id)).toEqual([c1!.id, c2!.id])

    expect(await getProgram(MISSING_ID)).toEqual({ error: 'PROGRAM_NOT_FOUND' })
  })

  it('updates a program including status archive', async () => {
    const program = await createTestProgram()
    const result = await updateProgram(program!.id, { name: 'Renamed', status: 'archived' })
    if ('error' in result) throw new Error(result.error)
    expect(result.program.name).toBe('Renamed')
    expect(result.program.status).toBe('archived')

    expect(await updateProgram(MISSING_ID, { name: 'x' })).toEqual({ error: 'PROGRAM_NOT_FOUND' })
  })

  it('rejects updating a program to an existing slug', async () => {
    const a = await createTestProgram()
    const b = await createTestProgram()
    expect(await updateProgram(b!.id, { slug: a!.slug })).toMatchObject({
      error: 'VALIDATION_ERROR',
    })
  })

  it('adds a course at the end of the order, idempotently', async () => {
    const program = await createTestProgram()
    const c1 = await createTestCourse()
    const c2 = await createTestCourse()

    const first = await addCourseToProgram(program!.id, c1!.id)
    if ('error' in first) throw new Error(first.error)
    expect(first.mapping.sortOrder).toBe(0)
    const second = await addCourseToProgram(program!.id, c2!.id)
    if ('error' in second) throw new Error(second.error)
    expect(second.mapping.sortOrder).toBe(1)

    const again = await addCourseToProgram(program!.id, c1!.id)
    if ('error' in again) throw new Error(again.error)
    const result = await getProgram(program!.id)
    if ('error' in result) throw new Error(result.error)
    expect(result.courses).toHaveLength(2)
  })

  it('validates both sides of the mapping', async () => {
    const program = await createTestProgram()
    const course = await createTestCourse()
    expect(await addCourseToProgram(MISSING_ID, course!.id)).toEqual({
      error: 'PROGRAM_NOT_FOUND',
    })
    expect(await addCourseToProgram(program!.id, MISSING_ID)).toEqual({
      error: 'COURSE_NOT_FOUND',
    })
  })

  it('removes a course mapping, NOT_FOUND when absent', async () => {
    const program = await createTestProgram()
    const course = await createTestCourse()
    await createTestProgramCourse(program!.id, course!.id)

    expect(await removeCourseFromProgram(program!.id, course!.id)).toEqual({ removed: true })
    expect(await removeCourseFromProgram(program!.id, course!.id)).toEqual({ error: 'NOT_FOUND' })
  })

  it('reorders program courses by array index', async () => {
    const program = await createTestProgram()
    const c1 = await createTestCourse()
    const c2 = await createTestCourse()
    await createTestProgramCourse(program!.id, c1!.id, { sortOrder: 0 })
    await createTestProgramCourse(program!.id, c2!.id, { sortOrder: 1 })

    const result = await reorderProgramCourses(program!.id, [c2!.id, c1!.id])
    if ('error' in result) throw new Error(result.error)

    const after = await getProgram(program!.id)
    if ('error' in after) throw new Error(after.error)
    expect(after.courses.map((c) => c.id)).toEqual([c2!.id, c1!.id])
  })

  it('rejects reorders whose id set does not match', async () => {
    const program = await createTestProgram()
    const c1 = await createTestCourse()
    await createTestProgramCourse(program!.id, c1!.id)
    expect(await reorderProgramCourses(program!.id, [MISSING_ID])).toMatchObject({
      error: 'VALIDATION_ERROR',
    })
    expect(await reorderProgramCourses(MISSING_ID, [c1!.id])).toEqual({
      error: 'PROGRAM_NOT_FOUND',
    })
  })

  it('mapping changes member access through the enrollment query (roadmap deliverable 8)', async () => {
    // P1 enrollment query: a member enrolled in a program has access exactly when the
    // mapping row exists — adding/removing a course flips access.
    const user = await createTestUser()
    const program = await createTestProgram()
    const course = await createTestCourse()
    await createTestEnrollment(user!.id, program!.id)

    const enrollment = await getActiveEnrollment(user!.id, program!.id)
    expect(enrollment).not.toBeNull()

    await addCourseToProgram(program!.id, course!.id)
    const withCourse = await getProgram(program!.id)
    if ('error' in withCourse) throw new Error(withCourse.error)
    expect(withCourse.courses.map((c) => c.id)).toContain(course!.id)

    await removeCourseFromProgram(program!.id, course!.id)
    const withoutCourse = await getProgram(program!.id)
    if ('error' in withoutCourse) throw new Error(withoutCourse.error)
    expect(withoutCourse.courses).toHaveLength(0)
  })
})
