/**
 * Existing-subscriber auto-enrollment at V2 cutover (eng-schema M8).
 *
 * Enrolls subscriptions with status in (active, past_due, trialing) whose
 * currentPeriodEnd is null or within the 30-day grace window into the paid
 * program. NULL-userId rows (webhook-before-linkage) are REPORTED, never enrolled.
 *
 * NEVER a Drizzle migration. Idempotent via the enrollments (userId, programId)
 * unique index + onConflictDoNothing — run twice = zero new rows.
 *
 * Program slug decision: the paid program is looked up by slug
 * 'life-decisions-paid'. If absent, a clearly-named DRAFT placeholder is
 * created under that slug so the founder reviews/renames it in admin before
 * activation — enrollment rows point at the right program either way.
 *
 * Usage: bun run platform/scripts/migrate-subscribers-to-enrollments.ts [--dry-run]
 */

import { and, eq, gt, inArray, isNull, or } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '@/platform/db/schema'
import { enrollments, programs, subscriptions } from '@/platform/db/schema'

type Db = PostgresJsDatabase<typeof schema>

export const PAID_PROGRAM_SLUG = 'life-decisions-paid'
export const GRACE_PERIOD_DAYS = 30

const DAY_MS = 24 * 60 * 60 * 1000

export type OrphanedSubscription = {
  subscriptionId: string
  stripeSubscriptionId: string
  stripeCustomerId: string
  status: string
}

export type MigrationReport = {
  dryRun: boolean
  /** Eligible subscription rows (including orphans and duplicates per user). */
  eligible: number
  /** Enrollments created (or that would be created under --dry-run). */
  enrolled: number
  /** Users already enrolled in the paid program (no-op). */
  skippedExisting: number
  /** NULL-userId subscriptions — reported, never enrolled. */
  orphaned: OrphanedSubscription[]
  programId: string | null
  /** True when the placeholder paid program was (or would be) created. */
  programCreated: boolean
}

/** Look up the paid program by slug; create a clearly-named draft placeholder if absent. */
export async function ensurePaidProgram(db: Db): Promise<{ id: string; created: boolean }> {
  const existing = await db.query.programs.findFirst({
    where: eq(programs.slug, PAID_PROGRAM_SLUG),
  })
  if (existing) return { id: existing.id, created: false }

  const [created] = await db
    .insert(programs)
    .values({
      slug: PAID_PROGRAM_SLUG,
      name: 'Life Decisions (Paid) — migration placeholder',
      description:
        'Placeholder created by migrate-subscribers-to-enrollments. Review name, description and content in admin before activating.',
      tier: 'paid',
      status: 'draft',
    })
    .returning({ id: programs.id })
  if (!created) throw new Error('Failed to create the placeholder paid program')
  return { id: created.id, created: true }
}

export async function migrateSubscribersToEnrollments(
  db: Db,
  opts: { dryRun?: boolean; now?: Date } = {},
): Promise<MigrationReport> {
  const dryRun = opts.dryRun ?? false
  const now = opts.now ?? new Date()
  const graceCutoff = new Date(now.getTime() - GRACE_PERIOD_DAYS * DAY_MS)

  const eligibleSubs = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        inArray(subscriptions.status, ['active', 'past_due', 'trialing']),
        or(isNull(subscriptions.currentPeriodEnd), gt(subscriptions.currentPeriodEnd, graceCutoff)),
      ),
    )

  const orphaned: OrphanedSubscription[] = eligibleSubs
    .filter((sub) => sub.userId === null)
    .map((sub) => ({
      subscriptionId: sub.id,
      stripeSubscriptionId: sub.stripeSubscriptionId,
      stripeCustomerId: sub.stripeCustomerId,
      status: sub.status,
    }))

  // Dedupe by userId — a user with several eligible subscriptions gets exactly one enrollment.
  const byUser = new Map<string, { userId: string; stripeSubscriptionId: string }>()
  for (const sub of eligibleSubs) {
    if (sub.userId !== null && !byUser.has(sub.userId)) {
      byUser.set(sub.userId, { userId: sub.userId, stripeSubscriptionId: sub.stripeSubscriptionId })
    }
  }
  const candidates = [...byUser.values()]

  if (dryRun) {
    const program = await db.query.programs.findFirst({
      where: eq(programs.slug, PAID_PROGRAM_SLUG),
    })
    let skippedExisting = 0
    if (program && candidates.length > 0) {
      const existing = await db
        .select({ userId: enrollments.userId })
        .from(enrollments)
        .where(
          and(
            eq(enrollments.programId, program.id),
            inArray(
              enrollments.userId,
              candidates.map((c) => c.userId),
            ),
          ),
        )
      skippedExisting = existing.length
    }
    return {
      dryRun: true,
      eligible: eligibleSubs.length,
      enrolled: candidates.length - skippedExisting,
      skippedExisting,
      orphaned,
      programId: program?.id ?? null,
      programCreated: !program,
    }
  }

  const { id: programId, created: programCreated } = await ensurePaidProgram(db)

  let enrolled = 0
  if (candidates.length > 0) {
    const inserted = await db
      .insert(enrollments)
      .values(
        candidates.map((candidate) => ({
          userId: candidate.userId,
          programId,
          cohortId: null, // paid = evergreen, no cohort
          status: 'active' as const,
          source: 'migration' as const,
          stripeSubscriptionId: candidate.stripeSubscriptionId,
        })),
      )
      .onConflictDoNothing({ target: [enrollments.userId, enrollments.programId] })
      .returning({ id: enrollments.id })
    enrolled = inserted.length
  }

  return {
    dryRun: false,
    eligible: eligibleSubs.length,
    enrolled,
    skippedExisting: candidates.length - enrolled,
    orphaned,
    programId,
    programCreated,
  }
}

export function formatMigrationReport(report: MigrationReport): string[] {
  const lines: string[] = []
  if (report.dryRun) lines.push('DRY RUN — no writes performed.')
  lines.push(
    `Eligible subscription rows: ${report.eligible}`,
    `Enrollments ${report.dryRun ? 'that would be created' : 'created'}: ${report.enrolled}`,
    `Already enrolled (skipped): ${report.skippedExisting}`,
    `Paid program: ${report.programId ?? '(none yet)'} (${PAID_PROGRAM_SLUG})${
      report.programCreated
        ? ` — placeholder ${report.dryRun ? 'would be created' : 'created'}, review in admin`
        : ''
    }`,
  )
  if (report.orphaned.length > 0) {
    lines.push(
      `NULL-userId subscriptions REPORTED, NOT enrolled (${report.orphaned.length}) — link these users first:`,
    )
    for (const orphan of report.orphaned) {
      lines.push(
        `  - subscription ${orphan.subscriptionId} stripe=${orphan.stripeSubscriptionId} customer=${orphan.stripeCustomerId} status=${orphan.status}`,
      )
    }
  } else {
    lines.push('No NULL-userId subscriptions found.')
  }
  return lines
}

if (import.meta.main) {
  const { db } = await import('@/platform/db/client')
  migrateSubscribersToEnrollments(db, { dryRun: Bun.argv.includes('--dry-run') })
    .then((report) => {
      for (const line of formatMigrationReport(report)) console.log(line)
      process.exit(0)
    })
    .catch((err) => {
      console.error('Migration failed:', err)
      process.exit(1)
    })
}
