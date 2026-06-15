import { afterAll, describe, expect, test } from 'bun:test'
import { eq } from 'drizzle-orm'
import { events } from '@/platform/db/schema'
import { createTestUser } from '@/platform/test/factories'
import { setupTestDb, teardownTestDb, testDb } from '@/platform/test/setup'
import {
  addDecision,
  createPlan,
  deleteDecision,
  deletePlan,
  getPlan,
  listPlans,
  updateDecision,
  updatePlan,
} from './service'

await setupTestDb()
afterAll(teardownTestDb)

describe('integration: plan service', () => {
  test('createPlan persists and records a PII-free plan_created event', async () => {
    const user = await createTestUser()
    const { plan } = await createPlan(user!.id, { title: 'Get fit by summer', horizonDays: 90 })

    expect(plan.title).toBe('Get fit by summer')
    expect(plan.status).toBe('active')
    expect(plan.horizonDays).toBe(90)

    const [event] = await testDb.select().from(events).where(eq(events.userId, user!.id))
    expect(event?.name).toBe('plan_created')
    expect(event?.isDecision).toBe(false)
    expect(event?.properties).toEqual({ planId: plan.id })
  })

  test('listPlans is scoped per user, newest first', async () => {
    const user = await createTestUser()
    await createPlan(user!.id, { title: 'Older' })
    await createPlan(user!.id, { title: 'Newer' })
    const other = await createTestUser()
    await createPlan(other!.id, { title: 'Theirs' })

    expect((await listPlans(user!.id)).map((p) => p.title)).toEqual(['Newer', 'Older'])
    expect((await listPlans(other!.id)).map((p) => p.title)).toEqual(['Theirs'])
  })

  test('getPlan returns the plan with its decisions in board order', async () => {
    const user = await createTestUser()
    const { plan } = await createPlan(user!.id, { title: 'Launch' })
    await addDecision(user!.id, plan.id, { title: 'Second', sortOrder: 2 })
    await addDecision(user!.id, plan.id, { title: 'First', sortOrder: 1, targetDate: '2026-09-01' })

    const result = await getPlan(user!.id, plan.id)
    expect('plan' in result && result.decisions.map((d) => d.title)).toEqual(['First', 'Second'])
  })

  test('getPlan for another user is PLAN_NOT_FOUND', async () => {
    const owner = await createTestUser()
    const other = await createTestUser()
    const { plan } = await createPlan(owner!.id, { title: 'Private' })
    expect(await getPlan(other!.id, plan.id)).toEqual({ error: 'PLAN_NOT_FOUND' })
  })

  test('updatePlan patches; wrong owner is PLAN_NOT_FOUND', async () => {
    const owner = await createTestUser()
    const other = await createTestUser()
    const { plan } = await createPlan(owner!.id, { title: 'Draft' })

    const ok = await updatePlan(owner!.id, plan.id, { status: 'completed' })
    expect('plan' in ok && ok.plan.status).toBe('completed')
    expect(await updatePlan(other!.id, plan.id, { title: 'x' })).toEqual({
      error: 'PLAN_NOT_FOUND',
    })
  })

  test('deletePlan cascades to its decisions; second delete is PLAN_NOT_FOUND', async () => {
    const user = await createTestUser()
    const { plan } = await createPlan(user!.id, { title: 'Temp' })
    await addDecision(user!.id, plan.id, { title: 'child' })

    expect(await deletePlan(user!.id, plan.id)).toEqual({ id: plan.id })
    expect(await getPlan(user!.id, plan.id)).toEqual({ error: 'PLAN_NOT_FOUND' })
    expect(await deletePlan(user!.id, plan.id)).toEqual({ error: 'PLAN_NOT_FOUND' })
  })

  test('addDecision to another user’s plan is PLAN_NOT_FOUND', async () => {
    const owner = await createTestUser()
    const other = await createTestUser()
    const { plan } = await createPlan(owner!.id, { title: 'Mine' })
    expect(await addDecision(other!.id, plan.id, { title: 'sneaky' })).toEqual({
      error: 'PLAN_NOT_FOUND',
    })
  })

  test('updateDecision: done stamps completedAt, pending clears it, detail-only leaves it', async () => {
    const user = await createTestUser()
    const { plan } = await createPlan(user!.id, { title: 'P' })
    const added = await addDecision(user!.id, plan.id, { title: 'D' })
    const decisionId = 'decision' in added ? added.decision.id : ''

    const done = await updateDecision(user!.id, decisionId, { status: 'done' })
    expect('decision' in done && done.decision.completedAt).not.toBeNull()

    const reopened = await updateDecision(user!.id, decisionId, { status: 'pending' })
    expect('decision' in reopened && reopened.decision.completedAt).toBeNull()

    const renamed = await updateDecision(user!.id, decisionId, { detail: 'note only' })
    expect('decision' in renamed && renamed.decision.completedAt).toBeNull()
    expect('decision' in renamed && renamed.decision.detail).toBe('note only')
  })

  test('updateDecision / deleteDecision on a foreign decision is PLAN_DECISION_NOT_FOUND', async () => {
    const owner = await createTestUser()
    const other = await createTestUser()
    const { plan } = await createPlan(owner!.id, { title: 'P' })
    const added = await addDecision(owner!.id, plan.id, { title: 'D' })
    const decisionId = 'decision' in added ? added.decision.id : ''

    expect(await updateDecision(other!.id, decisionId, { status: 'done' })).toEqual({
      error: 'PLAN_DECISION_NOT_FOUND',
    })
    expect(await deleteDecision(other!.id, decisionId)).toEqual({
      error: 'PLAN_DECISION_NOT_FOUND',
    })
    expect(await deleteDecision(owner!.id, decisionId)).toEqual({ id: decisionId })
  })
})
