import { afterAll, describe, expect, test } from 'bun:test'
import { createTestUser } from '@/platform/test/factories'
import { apiCall, assertError, assertSuccess, stubAuth } from '@/platform/test/helpers'
import { setupTestDb, teardownTestDb } from '@/platform/test/setup'
import { createJournalRoutes } from './routes'

await setupTestDb()
afterAll(teardownTestDb)

describe('integration: journal routes', () => {
  test('GET / requires authentication', async () => {
    assertError(await apiCall(createJournalRoutes(), 'GET', '/'), 'UNAUTHORIZED')
  })

  test('PUT /entries saves; second PUT same day is an update, not a 409', async () => {
    const user = await createTestUser()
    const app = createJournalRoutes({ auth: stubAuth(user!) })
    const body = { entryDate: '2026-06-13', kind: 'morning', content: 'first version' }

    const first = assertSuccess(await apiCall(app, 'PUT', '/entries', body)) as {
      created: boolean
      entry: { prompt: string }
    }
    expect(first.created).toBe(true)
    expect(first.entry.prompt.length).toBeGreaterThan(0)

    const second = assertSuccess(
      await apiCall(app, 'PUT', '/entries', { ...body, content: 'edited version' }),
    ) as { created: boolean; entry: { content: string } }
    expect(second.created).toBe(false)
    expect(second.entry.content).toBe('edited version')
  })

  test('PUT /entries rejects a non-date entryDate (client must send a calendar date)', async () => {
    const user = await createTestUser()
    const app = createJournalRoutes({ auth: stubAuth(user!) })

    const response = await apiCall(app, 'PUT', '/entries', {
      entryDate: '2026-06-13T10:00:00Z', // timestamp, not a calendar date
      kind: 'morning',
      content: 'x',
    })

    expect(response.status).toBe(400)
  })

  test('GET / returns entries, counts and prompts — and never a streak field', async () => {
    const user = await createTestUser()
    const app = createJournalRoutes({ auth: stubAuth(user!) })
    await apiCall(app, 'PUT', '/entries', {
      entryDate: '2026-06-12',
      kind: 'evening',
      content: 'done',
    })

    const response = await apiCall(app, 'GET', '/?from=2026-06-01&to=2026-06-30')

    const data = assertSuccess(response) as {
      entries: unknown[]
      counts: Record<string, number>
      prompts: { morning: string; evening: string }
    }
    expect(data.entries).toHaveLength(1)
    expect(data.counts).toEqual({ totalMornings: 0, totalEvenings: 1, totalDaysJournaled: 1 })
    expect(data.prompts.morning.length).toBeGreaterThan(0)
    expect(JSON.stringify(response.body).toLowerCase()).not.toContain('streak')
  })
})
