import { afterAll, describe, expect, test } from 'bun:test'
import { createTestUser } from '@/platform/test/factories'
import { apiCall, assertError, assertSuccess, stubAuth } from '@/platform/test/helpers'
import { setupTestDb, teardownTestDb } from '@/platform/test/setup'
import { createRoutineRoutes } from './routes'

await setupTestDb()
afterAll(teardownTestDb)

const RANDOM_UUID = '22222222-2222-4222-8222-222222222222'

type HabitView = { id: string; name: string; isArchived: boolean }
type LogView = { id: string; logDate: string; done: boolean }

describe('integration: routine routes', () => {
  test('GET / requires authentication', async () => {
    assertError(await apiCall(createRoutineRoutes(), 'GET', '/'), 'UNAUTHORIZED')
  })

  test('create habit, log a day (idempotent), fetch logs, archive, delete', async () => {
    const user = await createTestUser()
    const app = createRoutineRoutes({ auth: stubAuth(user!) })

    const { habit } = assertSuccess(
      await apiCall(app, 'POST', '/', { name: 'Train', lifeArea: 'health' }),
    ) as { habit: HabitView }
    expect(habit.name).toBe('Train')

    const first = assertSuccess(
      await apiCall(app, 'PUT', `/${habit.id}/logs`, { logDate: '2026-06-15' }),
    ) as { log: LogView; created: boolean }
    expect(first.created).toBe(true)

    const second = assertSuccess(
      await apiCall(app, 'PUT', `/${habit.id}/logs`, { logDate: '2026-06-15', done: false }),
    ) as { created: boolean }
    expect(second.created).toBe(false)

    const logs = assertSuccess(
      await apiCall(app, 'GET', `/${habit.id}/logs?from=2026-06-01&to=2026-06-30`),
    ) as { logs: LogView[] }
    expect(logs.logs).toHaveLength(1)

    const archived = assertSuccess(
      await apiCall(app, 'PATCH', `/${habit.id}`, { isArchived: true }),
    ) as { habit: HabitView }
    expect(archived.habit.isArchived).toBe(true)

    // default list hides archived; includeArchived shows it
    expect(
      (assertSuccess(await apiCall(app, 'GET', '/')) as { habits: HabitView[] }).habits,
    ).toHaveLength(0)
    expect(
      (
        assertSuccess(await apiCall(app, 'GET', '/?includeArchived=true')) as {
          habits: HabitView[]
        }
      ).habits,
    ).toHaveLength(1)

    expect((await apiCall(app, 'DELETE', `/${habit.id}`)).status).toBe(200)
  })

  test('logging / reading / deleting a missing habit is HABIT_NOT_FOUND', async () => {
    const user = await createTestUser()
    const app = createRoutineRoutes({ auth: stubAuth(user!) })
    assertError(
      await apiCall(app, 'PUT', `/${RANDOM_UUID}/logs`, { logDate: '2026-06-15' }),
      'HABIT_NOT_FOUND',
    )
    assertError(await apiCall(app, 'GET', `/${RANDOM_UUID}/logs`), 'HABIT_NOT_FOUND')
    assertError(await apiCall(app, 'DELETE', `/${RANDOM_UUID}`), 'HABIT_NOT_FOUND')
  })

  test('validation: empty name, bad logDate and non-uuid params are 400', async () => {
    const user = await createTestUser()
    const app = createRoutineRoutes({ auth: stubAuth(user!) })
    expect((await apiCall(app, 'POST', '/', { name: '' })).status).toBe(400)
    const { habit } = assertSuccess(await apiCall(app, 'POST', '/', { name: 'X' })) as {
      habit: HabitView
    }
    expect((await apiCall(app, 'PUT', `/${habit.id}/logs`, { logDate: 'June 15' })).status).toBe(
      400,
    )
    expect((await apiCall(app, 'PATCH', '/not-a-uuid', { name: 'y' })).status).toBe(400)
  })
})
