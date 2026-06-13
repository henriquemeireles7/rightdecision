import { and, eq, gte, sql } from 'drizzle-orm'
import type { MiddlewareHandler } from 'hono'
import { createMiddleware } from 'hono/factory'
import { db } from '@/platform/db/client'
import { aiUsage, enrollments, programs } from '@/platform/db/schema'
import { env } from '@/platform/env'
import { throwError } from '@/platform/errors'
import type { DbOrTx } from '@/platform/events'
import { track } from '@/platform/events'
import { PAID_PROGRAM_SLUG } from '@/platform/programs'
import type { AppEnv } from '@/platform/types'
import type { AiKind } from '@/providers/ai'

export type Plan = 'paid' | 'free'

/** First day of the current calendar month (server clock — budgets are monthly windows). */
function monthStart(now = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

/**
 * The user's plan. Paid = an ACTIVE enrollment in the paid program; everything else is free.
 * Paid and free budgets are enforced SEPARATELY (different ceilings).
 */
export async function userPlan(userId: string): Promise<Plan> {
  const [row] = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .innerJoin(programs, eq(programs.id, enrollments.programId))
    .where(
      and(
        eq(enrollments.userId, userId),
        eq(programs.slug, PAID_PROGRAM_SLUG),
        eq(enrollments.status, 'active'),
      ),
    )
    .limit(1)
  return row ? 'paid' : 'free'
}

/** The plan's monthly token ceiling (declared in P1 env.ts). */
export function budgetForPlan(plan: Plan): number {
  return plan === 'paid' ? env.AI_MONTHLY_TOKEN_BUDGET_PAID : env.AI_MONTHLY_TOKEN_BUDGET_FREE
}

/**
 * Current-month token usage = sum(input+output) over (userId, createdAt >= month start).
 * Computed by SUM() on demand (ADR 10) — NO materialized counter until measurably slow.
 */
export async function monthlyTokenUsage(userId: string, now = new Date()): Promise<number> {
  const [row] = await db
    .select({
      total:
        sql<number>`coalesce(sum(${aiUsage.inputTokens} + ${aiUsage.outputTokens}), 0)`.mapWith(
          Number,
        ),
    })
    .from(aiUsage)
    .where(and(eq(aiUsage.userId, userId), gte(aiUsage.createdAt, monthStart(now))))
  return row?.total ?? 0
}

export type WriteUsageInput = {
  userId: string
  conversationId?: string | null
  messageId?: string | null
  kind: AiKind | 'cover_gen'
  model: string
  inputTokens: number
  outputTokens: number
}

/** Persist ONE per-call ai_usage row (kind/model/tokens). Joins a tx when given one. */
export async function writeUsage(dbOrTx: DbOrTx, input: WriteUsageInput): Promise<void> {
  await dbOrTx.insert(aiUsage).values({
    userId: input.userId,
    conversationId: input.conversationId ?? null,
    messageId: input.messageId ?? null,
    kind: input.kind,
    model: input.model,
    inputTokens: input.inputTokens,
    outputTokens: input.outputTokens,
  })
}

/** True when the user is at/over their monthly ceiling — the graceful-ceiling gate. */
export async function isOverBudget(userId: string, now = new Date()): Promise<boolean> {
  const plan = await userPlan(userId)
  const used = await monthlyTokenUsage(userId, now)
  return used >= budgetForPlan(plan)
}

/**
 * Enforcement middleware: before an AI call, if the user is at/over their monthly ceiling,
 * record `ai_budget_hit` (telemetry) and 429 with AI_BUDGET_EXCEEDED. The route/UI maps that
 * to a warm message — never a raw error. Paid and free ceilings are enforced separately.
 */
export function enforceAiBudget(): MiddlewareHandler<AppEnv> {
  return createMiddleware<AppEnv>(async (c, next) => {
    const user = c.get('user')
    if (await isOverBudget(user.id)) {
      await track({ name: 'ai_budget_hit', properties: {}, userId: user.id })
      return throwError(c, 'AI_BUDGET_EXCEEDED')
    }
    await next()
  })
}
