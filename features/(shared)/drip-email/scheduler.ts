import { and, eq, lte } from 'drizzle-orm'
import {
  cohortStartsSoonEmail,
  cohortUpgradeNudgeEmail,
  cohortWelcomeEmail,
} from '@/features/(shared)/email/cohort-emails'
import { db } from '@/platform/db/client'
import { dripEmails, subscriptions } from '@/platform/db/schema'
import { env } from '@/platform/env'
import { sendEmail } from '@/providers/email'
import { COHORT_DRIP_BASE_INDEX, COHORT_DRIP_INDEXES } from './cohort-drips'

const DRIP_INTERVALS_HOURS = [24, 72, 168] // 24h, 72h, 7 days

/** Schedule 3 drip emails for a user who completed the free intro. */
export async function scheduleDripSequence(userId: string, decisionText: string): Promise<void> {
  const now = new Date()

  for (let i = 0; i < DRIP_INTERVALS_HOURS.length; i++) {
    const scheduledAt = new Date(now.getTime() + DRIP_INTERVALS_HOURS[i]! * 60 * 60 * 1000)

    await db
      .insert(dripEmails)
      .values({
        userId,
        emailIndex: i,
        decisionText,
        scheduledAt,
      })
      .onConflictDoNothing() // idempotent: don't re-schedule if already exists
  }
}

/** Check-before-send: query subscriptions, skip if user converted to paid. */
async function isUserPaid(userId: string): Promise<boolean> {
  const sub = await db.query.subscriptions.findFirst({
    where: and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')),
  })
  return !!sub
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

const DRIP_TEMPLATES = [
  {
    subject: 'Did you act on your decision?',
    html: (name: string, decision: string) => `
      <p>Hi${name ? ` ${name}` : ''},</p>
      <p>Yesterday you made a decision:</p>
      <blockquote style="border-left: 3px solid #C4956A; padding-left: 16px; margin: 16px 0; font-style: italic;">
        "${escapeHtml(decision)}"
      </blockquote>
      <p>Did you act on it? Even one small step counts.</p>
      <p>The methodology works because decisions without action are just intentions. The full program breaks your decision into daily actions across 9 modules.</p>
      <p><a href="{{app_url}}/free" style="color: #C4956A;">Continue your journey →</a></p>
    `,
    text: (name: string, decision: string) =>
      `Hi${name ? ` ${name}` : ''},\n\nYesterday you made a decision: "${decision}"\n\nDid you act on it? Even one small step counts.\n\nContinue your journey: {{app_url}}/free`,
  },
  {
    subject: 'The constraint you identified is real',
    html: (name: string, decision: string) => `
      <p>Hi${name ? ` ${name}` : ''},</p>
      <p>Three days ago, you identified your constraint and made this decision:</p>
      <blockquote style="border-left: 3px solid #C4956A; padding-left: 16px; margin: 16px 0; font-style: italic;">
        "${escapeHtml(decision)}"
      </blockquote>
      <p>Most people stall here. Not because they lack motivation, but because one decision needs to be broken down into daily actions. That's exactly what the full program does.</p>
      <p><a href="{{app_url}}/free" style="color: #C4956A;">See what comes next →</a></p>
    `,
    text: (name: string, decision: string) =>
      `Hi${name ? ` ${name}` : ''},\n\nThree days ago, you made this decision: "${decision}"\n\nMost people stall here. The full program breaks it into daily actions.\n\nSee what comes next: {{app_url}}/free`,
  },
  {
    subject: 'Your decision is still waiting',
    html: (name: string, decision: string) => `
      <p>Hi${name ? ` ${name}` : ''},</p>
      <p>A week ago, you said:</p>
      <blockquote style="border-left: 3px solid #C4956A; padding-left: 16px; margin: 16px 0; font-style: italic;">
        "${escapeHtml(decision)}"
      </blockquote>
      <p>That decision is still yours. The constraint hasn't changed. The question is whether you're ready to act on it systematically.</p>
      <p>The Right Decision program takes the constraint you identified and decomposes it into 9 modules of clear, daily actions. No motivation needed. Just structure.</p>
      <p><a href="{{app_url}}/free" style="color: #C4956A;">Start the full program →</a></p>
    `,
    text: (name: string, decision: string) =>
      `Hi${name ? ` ${name}` : ''},\n\nA week ago, you said: "${decision}"\n\nThat decision is still yours. The full program decomposes it into 9 modules of daily actions.\n\nStart the full program: {{app_url}}/free`,
  },
]

/**
 * Render a cohort-lifecycle drip (emailIndex 100+, P4). decisionText carries the
 * cohort-start instant as an ISO string (documented column reuse — see CLAUDE.md).
 * Returns null for corrupt instants or unknown cohort indexes — the caller marks
 * the row 'skipped' so it never retries forever.
 */
function renderCohortDrip(
  emailIndex: number,
  input: { name: string; startsAtIso: string; appUrl: string },
): { subject: string; html: string; text: string } | null {
  const startsAt = new Date(input.startsAtIso)
  if (Number.isNaN(startsAt.getTime())) return null

  switch (emailIndex) {
    case COHORT_DRIP_INDEXES.welcome:
      return cohortWelcomeEmail({
        name: input.name,
        startsAt,
        timezone: env.COHORT_TIMEZONE,
        appUrl: input.appUrl,
        now: new Date(),
      })
    case COHORT_DRIP_INDEXES.startsSoon:
      return cohortStartsSoonEmail({ name: input.name, appUrl: input.appUrl })
    case COHORT_DRIP_INDEXES.upgradeNudge:
      return cohortUpgradeNudgeEmail({ name: input.name, appUrl: input.appUrl })
    default:
      return null
  }
}

/** Process all pending drip emails that are due. Called by cron. */
export async function processPendingDrips(appUrl: string): Promise<number> {
  const now = new Date()

  const pending = await db.query.dripEmails.findMany({
    where: and(eq(dripEmails.status, 'pending'), lte(dripEmails.scheduledAt, now)),
  })

  let sent = 0

  const MAX_RETRY_MS = 48 * 60 * 60 * 1000 // Give up after 48 hours past scheduled time

  for (const drip of pending) {
    // Give up on emails that have been pending too long (permanent failures)
    if (now.getTime() - drip.scheduledAt.getTime() > MAX_RETRY_MS) {
      await db.update(dripEmails).set({ status: 'skipped' }).where(eq(dripEmails.id, drip.id))
      console.warn(`[drip-email] Giving up on drip ${drip.id} — exceeded 48h retry window`)
      continue
    }

    const isCohortDrip = drip.emailIndex >= COHORT_DRIP_BASE_INDEX

    // Check-before-send: every free-intro drip skips for paid users, but among cohort
    // drips only the upgrade nudge does (a welcome to a paid user is fine — P4).
    const paidCheckApplies = !isCohortDrip || drip.emailIndex === COHORT_DRIP_INDEXES.upgradeNudge
    if (paidCheckApplies && (await isUserPaid(drip.userId))) {
      await db.update(dripEmails).set({ status: 'skipped' }).where(eq(dripEmails.id, drip.id))
      continue
    }

    const template = isCohortDrip ? undefined : DRIP_TEMPLATES[drip.emailIndex]
    if (!isCohortDrip && !template) continue

    // Get user email
    const { users } = await import('@/platform/db/schema')
    const user = await db.query.users.findFirst({
      where: eq(users.id, drip.userId),
    })

    if (!user) continue

    let message: { subject: string; html: string; text: string }
    if (isCohortDrip) {
      const rendered = renderCohortDrip(drip.emailIndex, {
        name: user.name,
        startsAtIso: drip.decisionText,
        appUrl,
      })
      if (!rendered) {
        // Corrupt cohort instant or unknown cohort index — never retry forever
        await db.update(dripEmails).set({ status: 'skipped' }).where(eq(dripEmails.id, drip.id))
        console.warn(`[drip-email] Skipping unrenderable cohort drip ${drip.id}`)
        continue
      }
      message = rendered
    } else if (template) {
      message = {
        subject: template.subject,
        html: template
          .html(escapeHtml(user.name), drip.decisionText)
          .replace(/\{\{app_url\}\}/g, appUrl),
        text: template.text(user.name, drip.decisionText).replace(/\{\{app_url\}\}/g, appUrl),
      }
    } else {
      continue
    }

    try {
      await sendEmail(user.email, message)

      await db
        .update(dripEmails)
        .set({ status: 'sent', sentAt: new Date() })
        .where(eq(dripEmails.id, drip.id))

      sent++
    } catch (error) {
      console.error(`[drip-email] Failed to send drip ${drip.id}:`, error)
      // Don't mark as failed — will retry on next cron run
    }
  }

  return sent
}
