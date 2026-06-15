import { afterAll, describe, expect, test } from 'bun:test'
import { eq } from 'drizzle-orm'
import { events } from '@/platform/db/schema'
import { createTestUser } from '@/platform/test/factories'
import { setupTestDb, teardownTestDb, testDb } from '@/platform/test/setup'
import { createAspiration, deleteAspiration, listAspirations, updateAspiration } from './service'

await setupTestDb()
afterAll(teardownTestDb)

describe('integration: aspirations service', () => {
  test('createAspiration persists the row and records a PII-free event', async () => {
    const user = await createTestUser()
    const { aspiration } = await createAspiration(user!.id, {
      lifeArea: 'home',
      title: 'Dream house by the sea',
      dream: 'A bright house with a garden',
      current: 'A small rental',
      nextStep: 'Visit three neighborhoods',
      imageUrl: 'https://example.com/house.jpg',
      link: 'https://example.com/listing',
    })

    expect(aspiration.title).toBe('Dream house by the sea')
    expect(aspiration.userId).toBe(user!.id)

    const [event] = await testDb.select().from(events).where(eq(events.userId, user!.id))
    expect(event?.name).toBe('aspiration_created')
    expect(event?.isDecision).toBe(false)
    // PII rule: only ids + enums in the spine, never the title/dream text.
    expect(event?.properties).toEqual({ aspirationId: aspiration.id, lifeArea: 'home' })
    expect(JSON.stringify(event?.properties)).not.toContain('Dream house')
  })

  test('listAspirations returns the member rows in board order (sortOrder then oldest)', async () => {
    const user = await createTestUser()
    await createAspiration(user!.id, { lifeArea: 'career', title: 'Second', sortOrder: 2 })
    await createAspiration(user!.id, { lifeArea: 'health', title: 'First', sortOrder: 1 })

    const list = await listAspirations(user!.id)
    expect(list.map((a) => a.title)).toEqual(['First', 'Second'])
  })

  test('listAspirations is scoped per user', async () => {
    const a = await createTestUser()
    const b = await createTestUser()
    await createAspiration(a!.id, { lifeArea: 'money', title: 'A only' })

    expect(await listAspirations(b!.id)).toHaveLength(0)
  })

  test('updateAspiration patches a member-owned row', async () => {
    const user = await createTestUser()
    const { aspiration } = await createAspiration(user!.id, {
      lifeArea: 'growth',
      title: 'Learn piano',
    })

    const result = await updateAspiration(user!.id, aspiration.id, { nextStep: 'Book a lesson' })
    expect('aspiration' in result && result.aspiration.nextStep).toBe('Book a lesson')
  })

  test('updateAspiration on another user’s row returns ASPIRATION_NOT_FOUND', async () => {
    const owner = await createTestUser()
    const other = await createTestUser()
    const { aspiration } = await createAspiration(owner!.id, {
      lifeArea: 'other',
      title: 'Private',
    })

    expect(await updateAspiration(other!.id, aspiration.id, { title: 'Hacked' })).toEqual({
      error: 'ASPIRATION_NOT_FOUND',
    })
  })

  test('deleteAspiration removes a member-owned row; second delete is not found', async () => {
    const user = await createTestUser()
    const { aspiration } = await createAspiration(user!.id, {
      lifeArea: 'experiences',
      title: 'See the northern lights',
    })

    expect(await deleteAspiration(user!.id, aspiration.id)).toEqual({ id: aspiration.id })
    expect(await deleteAspiration(user!.id, aspiration.id)).toEqual({
      error: 'ASPIRATION_NOT_FOUND',
    })
  })
})
