import { and, eq, lte } from 'drizzle-orm'
import { db } from '@/platform/db/client'
import { dripEmails, subscriptions } from '@/platform/db/schema'
import { sendEmail } from '@/providers/email'

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

    // Check-before-send: skip if user already paid
    if (await isUserPaid(drip.userId)) {
      await db.update(dripEmails).set({ status: 'skipped' }).where(eq(dripEmails.id, drip.id))
      continue
    }

    const template = DRIP_TEMPLATES[drip.emailIndex]
    if (!template) continue

    // Get user email
    const { users } = await import('@/platform/db/schema')
    const user = await db.query.users.findFirst({
      where: eq(users.id, drip.userId),
    })

    if (!user) continue

    try {
      const html = template
        .html(escapeHtml(user.name), drip.decisionText)
        .replace(/\{\{app_url\}\}/g, appUrl)
      const text = template.text(user.name, drip.decisionText).replace(/\{\{app_url\}\}/g, appUrl)

      await sendEmail(user.email, {
        subject: template.subject,
        html,
        text,
      })

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
