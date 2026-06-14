import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { eq } from 'drizzle-orm'
import { db } from '@/platform/db/client'
import { aiUsage, programs } from '@/platform/db/schema'
import { env } from '@/platform/env'
import { PAID_PROGRAM_SLUG } from '@/platform/programs'
import { createTestEnrollment, createTestProgram, createTestUser } from '@/platform/test/factories'
import { setupTestDb, teardownTestDb } from '@/platform/test/setup'
import { monthlyTokenUsage, userPlan, writeUsage } from './budget'

beforeAll(setupTestDb)
afterAll(teardownTestDb)

async function ensurePaidProgram() {
  const [existing] = await db
    .select()
    .from(programs)
    .where(eq(programs.slug, PAID_PROGRAM_SLUG))
    .limit(1)
  if (existing) return existing
  return (await createTestProgram({ slug: PAID_PROGRAM_SLUG, tier: 'paid', status: 'active' }))!
}

describe('ai-chat budget: monthly token sum (NO materialized counter)', () => {
  test('sums input+output tokens for the current month across all kinds', async () => {
    const user = await createTestUser()
    await db.insert(aiUsage).values([
      { userId: user!.id, kind: 'chat', model: 'm', inputTokens: 100, outputTokens: 50 },
      { userId: user!.id, kind: 'interview', model: 'm', inputTokens: 30, outputTokens: 20 },
      { userId: user!.id, kind: 'distill', model: 'm', inputTokens: 10, outputTokens: 5 },
    ])
    expect(await monthlyTokenUsage(user!.id)).toBe(215)
  })

  test('a prior-month row does NOT count toward the current month', async () => {
    const user = await createTestUser()
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 2)
    await db.insert(aiUsage).values([
      {
        userId: user!.id,
        kind: 'chat',
        model: 'm',
        inputTokens: 9_000,
        outputTokens: 9_000,
        createdAt: lastMonth,
      },
      { userId: user!.id, kind: 'chat', model: 'm', inputTokens: 1, outputTokens: 1 },
    ])
    expect(await monthlyTokenUsage(user!.id)).toBe(2)
  })

  test('writeUsage persists a per-call row (kind/model/tokens)', async () => {
    const user = await createTestUser()
    await writeUsage(db, {
      userId: user!.id,
      kind: 'interview',
      model: 'claude-haiku-4-5',
      inputTokens: 7,
      outputTokens: 3,
    })
    const [row] = await db.select().from(aiUsage).where(eq(aiUsage.userId, user!.id)).limit(1)
    expect(row?.kind).toBe('interview')
    expect(row?.inputTokens).toBe(7)
    expect(row?.outputTokens).toBe(3)
  })
})

describe('ai-chat budget: plan resolution (paid vs free enforced separately)', () => {
  test('a user with an active paid enrollment is paid', async () => {
    const paid = await ensurePaidProgram()
    const user = await createTestUser()
    await createTestEnrollment(user!.id, paid.id, { status: 'active', source: 'purchase' })
    expect(await userPlan(user!.id)).toBe('paid')
  })

  test('a user without a paid enrollment is free', async () => {
    const user = await createTestUser()
    expect(await userPlan(user!.id)).toBe('free')
  })

  test('the budget ceiling differs by plan', () => {
    expect(env.AI_MONTHLY_TOKEN_BUDGET_PAID).toBeGreaterThan(env.AI_MONTHLY_TOKEN_BUDGET_FREE)
  })
})
