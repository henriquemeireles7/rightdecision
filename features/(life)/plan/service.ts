import { and, asc, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/platform/db/client'
import { planDecisions, plans } from '@/platform/db/schema'
import type { ErrorCode } from '@/platform/errors'
import { record } from '@/platform/events'

type ServiceError = { error: ErrorCode }
type Plan = typeof plans.$inferSelect
type PlanDecision = typeof planDecisions.$inferSelect

// ─── Input contracts (owned here; routes import them for zValidator) ───
export const createPlanSchema = z.object({
  title: z.string().min(1).max(200),
  horizonDays: z.number().int().min(1).max(3650).optional(),
  startDate: z.iso.date().optional(),
  targetDate: z.iso.date().optional(),
})
export const updatePlanSchema = createPlanSchema
  .extend({ status: z.enum(['active', 'completed', 'archived']) })
  .partial()

export const createDecisionSchema = z.object({
  title: z.string().min(1).max(200),
  detail: z.string().max(2000).optional(),
  targetDate: z.iso.date().optional(),
  sortOrder: z.number().int().min(0).optional(),
})
export const updateDecisionSchema = createDecisionSchema
  .extend({ status: z.enum(['pending', 'done']) })
  .partial()

export type CreatePlanInput = z.infer<typeof createPlanSchema>
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>
export type CreateDecisionInput = z.infer<typeof createDecisionSchema>
export type UpdateDecisionInput = z.infer<typeof updateDecisionSchema>

/** A member's plans, newest first (no decisions — the list view). */
export function listPlans(userId: string): Promise<Plan[]> {
  return db.select().from(plans).where(eq(plans.userId, userId)).orderBy(desc(plans.createdAt))
}

/** One plan + its dated decisions (board order). Wrong owner / missing → PLAN_NOT_FOUND. */
export async function getPlan(
  userId: string,
  planId: string,
): Promise<{ plan: Plan; decisions: PlanDecision[] } | ServiceError> {
  const [plan] = await db
    .select()
    .from(plans)
    .where(and(eq(plans.id, planId), eq(plans.userId, userId)))
    .limit(1)
  if (!plan) return { error: 'PLAN_NOT_FOUND' }
  const decisions = await db
    .select()
    .from(planDecisions)
    .where(eq(planDecisions.planId, planId))
    .orderBy(asc(planDecisions.sortOrder), asc(planDecisions.createdAt))
  return { plan, decisions }
}

/** Create a plan + its (non-decision) event in one transaction. */
export async function createPlan(userId: string, input: CreatePlanInput): Promise<{ plan: Plan }> {
  const plan = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(plans)
      .values({ userId, ...input })
      .returning()
    await record({ name: 'plan_created', properties: { planId: row!.id }, userId }, tx)
    return row!
  })
  return { plan }
}

/** Patch a member-owned plan. Wrong owner / missing → PLAN_NOT_FOUND. */
export async function updatePlan(
  userId: string,
  planId: string,
  patch: UpdatePlanInput,
): Promise<{ plan: Plan } | ServiceError> {
  const [row] = await db
    .update(plans)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(plans.id, planId), eq(plans.userId, userId)))
    .returning()
  if (!row) return { error: 'PLAN_NOT_FOUND' }
  return { plan: row }
}

/** Delete a member-owned plan (cascade removes its decisions). Missing → PLAN_NOT_FOUND. */
export async function deletePlan(
  userId: string,
  planId: string,
): Promise<{ id: string } | ServiceError> {
  const [row] = await db
    .delete(plans)
    .where(and(eq(plans.id, planId), eq(plans.userId, userId)))
    .returning({ id: plans.id })
  if (!row) return { error: 'PLAN_NOT_FOUND' }
  return { id: row.id }
}

/** Add a dated decision to a member-owned plan. Plan not owned/missing → PLAN_NOT_FOUND. */
export async function addDecision(
  userId: string,
  planId: string,
  input: CreateDecisionInput,
): Promise<{ decision: PlanDecision } | ServiceError> {
  const [plan] = await db
    .select({ id: plans.id })
    .from(plans)
    .where(and(eq(plans.id, planId), eq(plans.userId, userId)))
    .limit(1)
  if (!plan) return { error: 'PLAN_NOT_FOUND' }

  // userId is denormalized onto the decision here (== the owning plan's userId). This is
  // load-bearing: updateDecision/deleteDecision scope by (decisionId, userId) and never touch
  // planId/userId, so the two can never diverge.
  const [decision] = await db
    .insert(planDecisions)
    .values({ planId, userId, ...input })
    .returning()
  return { decision: decision! }
}

/**
 * Patch a member-owned decision. status drives completedAt: 'done' stamps it, 'pending' clears
 * it. Wrong owner / missing → PLAN_DECISION_NOT_FOUND.
 */
export async function updateDecision(
  userId: string,
  decisionId: string,
  patch: UpdateDecisionInput,
): Promise<{ decision: PlanDecision } | ServiceError> {
  const completedAt =
    patch.status === 'done' ? new Date() : patch.status === 'pending' ? null : undefined

  const [row] = await db
    .update(planDecisions)
    .set({
      ...patch,
      ...(completedAt !== undefined ? { completedAt } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(planDecisions.id, decisionId), eq(planDecisions.userId, userId)))
    .returning()
  if (!row) return { error: 'PLAN_DECISION_NOT_FOUND' }
  return { decision: row }
}

/** Delete a member-owned decision. Missing → PLAN_DECISION_NOT_FOUND. */
export async function deleteDecision(
  userId: string,
  decisionId: string,
): Promise<{ id: string } | ServiceError> {
  const [row] = await db
    .delete(planDecisions)
    .where(and(eq(planDecisions.id, decisionId), eq(planDecisions.userId, userId)))
    .returning({ id: planDecisions.id })
  if (!row) return { error: 'PLAN_DECISION_NOT_FOUND' }
  return { id: row.id }
}
