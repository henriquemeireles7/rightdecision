/**
 * Stripe subscription → paid enrollment wiring (P4, eng-schema table 3).
 *
 * Paid enrollments are EVERGREEN: programId = the paid program (PAID_PROGRAM_SLUG from
 * platform/programs.ts), cohortId NULL, source 'purchase', stripeSubscriptionId set.
 *
 * Called from handle-webhook.ts. Webhook-level idempotency is the webhookEvents
 * INSERT-first dedup; every function here is ADDITIONALLY idempotent on its own
 * (upsert + status guards) so out-of-order or overlapping events stay safe.
 *
 * Reported-not-enrolled paths (mirrors the M8 migration script):
 * - NULL-userId subscription (webhook-before-linkage): logged, no enrollment. The next
 *   'customer.subscription.updated' after linkage — or the M8 script — picks it up.
 * - Missing paid program: a webhook NEVER creates programs; run seed/M8 before cutover.
 */

import { and, eq, ne } from 'drizzle-orm'
import { grantEnrollment } from '@/features/(shared)/enrollment/service'
import { db } from '@/platform/db/client'
import { enrollments, programs, subscriptions } from '@/platform/db/schema'
import { record } from '@/platform/events'
import { PAID_PROGRAM_SLUG } from '@/platform/programs'

export type PaidEnrollmentSyncResult =
  | { enrolled: true; enrollmentId: string; changed: boolean }
  | {
      enrolled: false
      reason: 'subscription_not_found' | 'user_not_linked' | 'paid_program_missing'
    }

export type SubscriptionEnrollmentSyncResult = {
  action: 'granted' | 'skipped' | 'expiry_scheduled' | 'revoked' | 'none'
  updated: number
}

/**
 * Ensure the linked user holds an active evergreen paid enrollment.
 * Records enrollment_created (new row) / enrollment_upgraded (became active-paid) —
 * and checkout_completed when the trigger was a completed checkout — only when the
 * sync actually changed something, so re-runs never duplicate events.
 */
export async function syncPaidEnrollment(
  stripeSubscriptionId: string,
  opts: { checkoutCompleted?: boolean } = {},
): Promise<PaidEnrollmentSyncResult> {
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId),
  })
  if (!subscription) {
    console.warn(`[enrollment-sync] No subscription row for ${stripeSubscriptionId} — reported`)
    return { enrolled: false, reason: 'subscription_not_found' }
  }
  if (!subscription.userId) {
    // Webhook-before-linkage edge: REPORTED, never enrolled (eng-schema M8 rule).
    console.warn(
      `[enrollment-sync] Subscription ${stripeSubscriptionId} has no linked user — reported, not enrolled`,
    )
    return { enrolled: false, reason: 'user_not_linked' }
  }
  const userId = subscription.userId

  const paidProgram = await db.query.programs.findFirst({
    where: eq(programs.slug, PAID_PROGRAM_SLUG),
  })
  if (!paidProgram) {
    console.error(
      `[enrollment-sync] Paid program '${PAID_PROGRAM_SLUG}' missing — run seed/migration before cutover; reported, not enrolled`,
    )
    return { enrolled: false, reason: 'paid_program_missing' }
  }

  const existing = await db.query.enrollments.findFirst({
    where: and(eq(enrollments.userId, userId), eq(enrollments.programId, paidProgram.id)),
  })
  const alreadyActivePurchase =
    existing?.status === 'active' &&
    existing.stripeSubscriptionId === stripeSubscriptionId &&
    existing.expiresAt === null

  const enrollment = await grantEnrollment({
    userId,
    programId: paidProgram.id,
    source: 'purchase',
    stripeSubscriptionId,
  })
  if (enrollment.expiresAt !== null) {
    // grantEnrollment never touches expiresAt — reactivation must clear a scheduled expiry
    await db
      .update(enrollments)
      .set({ expiresAt: null, updatedAt: new Date() })
      .where(eq(enrollments.id, enrollment.id))
  }

  const changed = !alreadyActivePurchase
  if (changed) {
    if (!existing) {
      await record({
        name: 'enrollment_created',
        properties: {
          enrollmentId: enrollment.id,
          programId: paidProgram.id,
          enrollmentSource: 'purchase',
        },
        userId,
      })
    }
    await record({
      name: 'enrollment_upgraded',
      properties: { enrollmentId: enrollment.id, programId: paidProgram.id },
      userId,
    })
    if (opts.checkoutCompleted) {
      await record({ name: 'checkout_completed', properties: {}, userId })
    }
  }
  return { enrolled: true, enrollmentId: enrollment.id, changed }
}

/** checkout.session.completed → paid enrollment + checkout_completed funnel event. */
export async function syncEnrollmentForCheckoutCompleted(
  stripeSubscriptionId: string,
): Promise<PaidEnrollmentSyncResult> {
  return syncPaidEnrollment(stripeSubscriptionId, { checkoutCompleted: true })
}

/** Revoke every non-revoked enrollment carrying this subscription; record enrollment_revoked. */
async function revokePaidEnrollment(
  stripeSubscriptionId: string,
): Promise<SubscriptionEnrollmentSyncResult> {
  const revoked = await db
    .update(enrollments)
    .set({ status: 'revoked', updatedAt: new Date() })
    .where(
      and(
        eq(enrollments.stripeSubscriptionId, stripeSubscriptionId),
        ne(enrollments.status, 'revoked'),
      ),
    )
    .returning({
      id: enrollments.id,
      programId: enrollments.programId,
      userId: enrollments.userId,
    })
  for (const row of revoked) {
    await record({
      name: 'enrollment_revoked',
      properties: { enrollmentId: row.id, programId: row.programId },
      userId: row.userId,
    })
  }
  return { action: 'revoked', updated: revoked.length }
}

/**
 * customer.subscription.updated → enrollment state, mirroring the webhook's existing
 * status mapping ('active' | 'past_due' | 'cancelled'):
 * - cancelled (canceled/unpaid)       → revoke now
 * - active + cancel_at_period_end     → expiresAt = period end (P1 sweep expires it)
 * - active, no scheduled cancellation → (re)grant + clear any scheduled expiry
 * - past_due                          → leave alone (grace, like legacy access)
 */
export async function syncEnrollmentForSubscriptionUpdate(input: {
  stripeSubscriptionId: string
  status: 'active' | 'past_due' | 'cancelled'
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: Date
}): Promise<SubscriptionEnrollmentSyncResult> {
  if (input.status === 'cancelled') {
    return revokePaidEnrollment(input.stripeSubscriptionId)
  }
  if (input.status === 'active' && input.cancelAtPeriodEnd) {
    // Schedule expiry on any non-revoked enrollment for this subscription (not just
    // 'active' — a past_due row that recovers must still expire at period end).
    const updated = await db
      .update(enrollments)
      .set({ expiresAt: input.currentPeriodEnd, updatedAt: new Date() })
      .where(
        and(
          eq(enrollments.stripeSubscriptionId, input.stripeSubscriptionId),
          ne(enrollments.status, 'revoked'),
        ),
      )
      .returning({ id: enrollments.id })
    return { action: 'expiry_scheduled', updated: updated.length }
  }
  if (input.status === 'active') {
    const result = await syncPaidEnrollment(input.stripeSubscriptionId)
    return result.enrolled
      ? { action: 'granted', updated: result.changed ? 1 : 0 }
      : { action: 'skipped', updated: 0 }
  }
  // past_due: grace — the subscription may still recover
  return { action: 'none', updated: 0 }
}

/** customer.subscription.deleted (hard cancel) → revoke now. */
export async function syncEnrollmentForSubscriptionDeleted(
  stripeSubscriptionId: string,
): Promise<SubscriptionEnrollmentSyncResult> {
  return revokePaidEnrollment(stripeSubscriptionId)
}
