import { afterAll, describe, expect, test } from 'bun:test'
import { eq } from 'drizzle-orm'
import { events } from '@/platform/db/schema'
import { createTestUser } from '@/platform/test/factories'
import { setupTestDb, teardownTestDb, testDb } from '@/platform/test/setup'
import {
  createHabit,
  deleteHabit,
  getHabitLogs,
  listHabits,
  logHabit,
  updateHabit,
} from './service'

await setupTestDb()
afterAll(teardownTestDb)

describe('integration: routine service', () => {
  test('createHabit + listHabits hides archived unless asked, scoped per user', async () => {
    const user = await createTestUser()
    const { habit: a } = await createHabit(user!.id, {
      name: 'Train',
      lifeArea: 'health',
      intention: 'mobility + strength + cardio',
      sortOrder: 1,
    })
    await createHabit(user!.id, { name: 'Read', sortOrder: 2 })
    await updateHabit(user!.id, a.id, { isArchived: true })

    const active = await listHabits(user!.id)
    expect(active.map((h) => h.name)).toEqual(['Read'])

    const all = await listHabits(user!.id, { includeArchived: true })
    expect(all.map((h) => h.name)).toEqual(['Train', 'Read'])

    const other = await createTestUser()
    expect(await listHabits(other!.id)).toHaveLength(0)
  })

  test('updateHabit / deleteHabit on a foreign habit is HABIT_NOT_FOUND', async () => {
    const owner = await createTestUser()
    const other = await createTestUser()
    const { habit } = await createHabit(owner!.id, { name: 'Meditate' })

    expect(await updateHabit(other!.id, habit.id, { name: 'x' })).toEqual({
      error: 'HABIT_NOT_FOUND',
    })
    expect(await deleteHabit(other!.id, habit.id)).toEqual({ error: 'HABIT_NOT_FOUND' })
  })

  test('logHabit: first log inserts + records one event; same-day re-log updates with no event', async () => {
    const user = await createTestUser()
    const { habit } = await createHabit(user!.id, { name: 'Walk' })

    const first = await logHabit(user!.id, habit.id, { logDate: '2026-06-15', note: 'morning' })
    expect('log' in first && first.created).toBe(true)

    const second = await logHabit(user!.id, habit.id, {
      logDate: '2026-06-15',
      done: false,
      note: 'skipped',
    })
    expect('log' in second && second.created).toBe(false)
    expect('log' in second && second.log.done).toBe(false)

    const logged = await testDb.select().from(events).where(eq(events.userId, user!.id))
    expect(logged).toHaveLength(1)
    expect(logged[0]?.name).toBe('habit_logged')
    expect(logged[0]?.properties).toEqual({ habitId: habit.id, logDate: '2026-06-15' })
  })

  test('logHabit on a foreign / missing habit is HABIT_NOT_FOUND', async () => {
    const owner = await createTestUser()
    const other = await createTestUser()
    const { habit } = await createHabit(owner!.id, { name: 'Sleep' })
    expect(await logHabit(other!.id, habit.id, { logDate: '2026-06-15' })).toEqual({
      error: 'HABIT_NOT_FOUND',
    })
  })

  test('getHabitLogs returns range-filtered logs; foreign habit is HABIT_NOT_FOUND', async () => {
    const user = await createTestUser()
    const { habit } = await createHabit(user!.id, { name: 'Stretch' })
    await logHabit(user!.id, habit.id, { logDate: '2026-06-10' })
    await logHabit(user!.id, habit.id, { logDate: '2026-06-20' })

    const ranged = await getHabitLogs(user!.id, habit.id, { from: '2026-06-15', to: '2026-06-30' })
    expect('logs' in ranged && ranged.logs.map((l) => l.logDate)).toEqual(['2026-06-20'])

    const all = await getHabitLogs(user!.id, habit.id)
    expect('logs' in all && all.logs).toHaveLength(2)

    const other = await createTestUser()
    expect(await getHabitLogs(other!.id, habit.id)).toEqual({ error: 'HABIT_NOT_FOUND' })
  })

  test('deleteHabit cascades to its logs', async () => {
    const user = await createTestUser()
    const { habit } = await createHabit(user!.id, { name: 'Temp' })
    await logHabit(user!.id, habit.id, { logDate: '2026-06-15' })

    expect(await deleteHabit(user!.id, habit.id)).toEqual({ id: habit.id })
    expect(await getHabitLogs(user!.id, habit.id)).toEqual({ error: 'HABIT_NOT_FOUND' })
  })
})
