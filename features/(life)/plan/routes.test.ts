import { afterAll, describe, expect, test } from 'bun:test'
import { createTestUser } from '@/platform/test/factories'
import { apiCall, assertError, assertSuccess, stubAuth } from '@/platform/test/helpers'
import { setupTestDb, teardownTestDb } from '@/platform/test/setup'
import { createPlanRoutes } from './routes'

await setupTestDb()
afterAll(teardownTestDb)

const RANDOM_UUID = '11111111-1111-4111-8111-111111111111'

type PlanView = { id: string; title: string; status: string }
type DecisionView = { id: string; title: string; status: string; completedAt: string | null }

describe('integration: plan routes', () => {
  test('GET / requires authentication', async () => {
    assertError(await apiCall(createPlanRoutes(), 'GET', '/'), 'UNAUTHORIZED')
  })

  test('full lifecycle: create plan, add decision, fetch, complete, delete', async () => {
    const user = await createTestUser()
    const app = createPlanRoutes({ auth: stubAuth(user!) })

    const { plan } = assertSuccess(
      await apiCall(app, 'POST', '/', { title: 'Three-month reset', horizonDays: 90 }),
    ) as { plan: PlanView }
    expect(plan.title).toBe('Three-month reset')

    const list = assertSuccess(await apiCall(app, 'GET', '/')) as { plans: PlanView[] }
    expect(list.plans).toHaveLength(1)

    const { decision } = assertSuccess(
      await apiCall(app, 'POST', `/${plan.id}/decisions`, {
        title: 'Join a gym',
        targetDate: '2026-07-01',
      }),
    ) as { decision: DecisionView }
    expect(decision.completedAt).toBeNull()

    const fetched = assertSuccess(await apiCall(app, 'GET', `/${plan.id}`)) as {
      plan: PlanView
      decisions: DecisionView[]
    }
    expect(fetched.decisions).toHaveLength(1)

    const completed = assertSuccess(
      await apiCall(app, 'PATCH', `/decisions/${decision.id}`, { status: 'done' }),
    ) as { decision: DecisionView }
    expect(completed.decision.completedAt).not.toBeNull()

    expect((await apiCall(app, 'DELETE', `/decisions/${decision.id}`)).status).toBe(200)
    expect((await apiCall(app, 'DELETE', `/${plan.id}`)).status).toBe(200)
  })

  test('GET /:planId for a missing plan is PLAN_NOT_FOUND', async () => {
    const user = await createTestUser()
    const app = createPlanRoutes({ auth: stubAuth(user!) })
    assertError(await apiCall(app, 'GET', `/${RANDOM_UUID}`), 'PLAN_NOT_FOUND')
  })

  test('POST /:planId/decisions on a missing plan is PLAN_NOT_FOUND', async () => {
    const user = await createTestUser()
    const app = createPlanRoutes({ auth: stubAuth(user!) })
    assertError(
      await apiCall(app, 'POST', `/${RANDOM_UUID}/decisions`, { title: 'x' }),
      'PLAN_NOT_FOUND',
    )
  })

  test('PATCH /:planId updates status; foreign decision delete is PLAN_DECISION_NOT_FOUND', async () => {
    const user = await createTestUser()
    const app = createPlanRoutes({ auth: stubAuth(user!) })
    const { plan } = assertSuccess(await apiCall(app, 'POST', '/', { title: 'P' })) as {
      plan: PlanView
    }

    const patched = assertSuccess(
      await apiCall(app, 'PATCH', `/${plan.id}`, { status: 'archived' }),
    ) as { plan: PlanView }
    expect(patched.plan.status).toBe('archived')

    assertError(
      await apiCall(app, 'DELETE', `/decisions/${RANDOM_UUID}`),
      'PLAN_DECISION_NOT_FOUND',
    )
  })

  test('validation: empty title, bad status and non-uuid params are 400', async () => {
    const user = await createTestUser()
    const app = createPlanRoutes({ auth: stubAuth(user!) })
    expect((await apiCall(app, 'POST', '/', { title: '' })).status).toBe(400)
    const { plan } = assertSuccess(await apiCall(app, 'POST', '/', { title: 'P' })) as {
      plan: PlanView
    }
    expect((await apiCall(app, 'PATCH', `/${plan.id}`, { status: 'bogus' })).status).toBe(400)
    expect((await apiCall(app, 'GET', '/not-a-uuid')).status).toBe(400)
  })
})
