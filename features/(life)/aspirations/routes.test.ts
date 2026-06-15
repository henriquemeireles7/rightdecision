import { afterAll, describe, expect, test } from 'bun:test'
import { createTestUser } from '@/platform/test/factories'
import { apiCall, assertError, assertSuccess, stubAuth } from '@/platform/test/helpers'
import { setupTestDb, teardownTestDb } from '@/platform/test/setup'
import { createAspirationsRoutes } from './routes'

await setupTestDb()
afterAll(teardownTestDb)

type AspirationView = { id: string; title: string; lifeArea: string; nextStep: string | null }

describe('integration: aspirations routes', () => {
  test('GET / requires authentication', async () => {
    assertError(await apiCall(createAspirationsRoutes(), 'GET', '/'), 'UNAUTHORIZED')
  })

  test('POST / creates and GET / lists it', async () => {
    const user = await createTestUser()
    const app = createAspirationsRoutes({ auth: stubAuth(user!) })

    const create = await apiCall(app, 'POST', '/', {
      lifeArea: 'relationships',
      title: 'Closer family',
      dream: 'Sunday dinners with everyone',
    })
    const { aspiration } = assertSuccess(create) as { aspiration: AspirationView }
    expect(aspiration.title).toBe('Closer family')

    const list = assertSuccess(await apiCall(app, 'GET', '/')) as { aspirations: AspirationView[] }
    expect(list.aspirations).toHaveLength(1)
    expect(list.aspirations[0]?.id).toBe(aspiration.id)
  })

  test('POST / rejects a missing title and a non-URL link', async () => {
    const user = await createTestUser()
    const app = createAspirationsRoutes({ auth: stubAuth(user!) })

    expect((await apiCall(app, 'POST', '/', { lifeArea: 'health' })).status).toBe(400)
    expect(
      (await apiCall(app, 'POST', '/', { lifeArea: 'health', title: 'x', link: 'not-a-url' }))
        .status,
    ).toBe(400)
    expect((await apiCall(app, 'POST', '/', { lifeArea: 'not-an-area', title: 'x' })).status).toBe(
      400,
    )
  })

  test('PATCH /:id updates the owner row; another user gets ASPIRATION_NOT_FOUND', async () => {
    const owner = await createTestUser()
    const ownerApp = createAspirationsRoutes({ auth: stubAuth(owner!) })
    const { aspiration } = assertSuccess(
      await apiCall(ownerApp, 'POST', '/', { lifeArea: 'career', title: 'Lead a team' }),
    ) as { aspiration: AspirationView }

    const patched = assertSuccess(
      await apiCall(ownerApp, 'PATCH', `/${aspiration.id}`, { nextStep: 'Ask for the role' }),
    ) as { aspiration: AspirationView }
    expect(patched.aspiration.nextStep).toBe('Ask for the role')

    const other = await createTestUser()
    const otherApp = createAspirationsRoutes({ auth: stubAuth(other!) })
    assertError(
      await apiCall(otherApp, 'PATCH', `/${aspiration.id}`, { title: 'Hijack' }),
      'ASPIRATION_NOT_FOUND',
    )
  })

  test('DELETE /:id removes the owner row; deleting again is ASPIRATION_NOT_FOUND', async () => {
    const user = await createTestUser()
    const app = createAspirationsRoutes({ auth: stubAuth(user!) })
    const { aspiration } = assertSuccess(
      await apiCall(app, 'POST', '/', { lifeArea: 'money', title: 'Emergency fund' }),
    ) as { aspiration: AspirationView }

    expect((await apiCall(app, 'DELETE', `/${aspiration.id}`)).status).toBe(200)
    assertError(await apiCall(app, 'DELETE', `/${aspiration.id}`), 'ASPIRATION_NOT_FOUND')
  })

  test('PATCH /:id rejects a non-uuid id', async () => {
    const user = await createTestUser()
    const app = createAspirationsRoutes({ auth: stubAuth(user!) })
    expect((await apiCall(app, 'PATCH', '/not-a-uuid', { title: 'x' })).status).toBe(400)
  })
})
