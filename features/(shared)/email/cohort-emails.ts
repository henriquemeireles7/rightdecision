/**
 * Cohort-lifecycle emails (P4): welcome-on-join, starts-soon (T-1 day), upgrade nudge.
 * Sent by the drip scheduler (features/(shared)/drip-email) — gated behind the cohort
 * join flow, so the evergreen free-intro drips never see these.
 *
 * Copy rules (decisions/voice.md + Wave-2 copy rule): direct address, short sentences,
 * no hype words; the upgrade nudge sells ONLY what exists today (published modules +
 * monthly lives) plus the published drop schedule — never the full promised library.
 *
 * Design rule (binding for P4): text on gold is ink (#1A1714) — white-on-gold banned.
 * That's why these use their own CTA instead of layout.ts ctaButton (which predates the rule).
 */

import { emailLayout, escapeHtml } from './layout'

const FONT_STACK = "'Instrument Sans', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"

/** Gold CTA with INK text — never white-on-gold (P4 design requirement). */
function inkOnGoldCta(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
<tr><td style="background-color:#C4956A;border-radius:8px;padding:14px 28px;text-align:center;">
<a href="${url}" style="color:#1A1714;font-family:${FONT_STACK};font-size:16px;font-weight:600;text-decoration:none;display:inline-block;">${label}</a>
</td></tr>
</table>`
}

function greeting(name: string): string {
  const safe = escapeHtml(name).trim()
  return safe ? `Hi ${safe},` : 'Hi,'
}

/** Calendar date of the cohort start, as a human reads it in the cohort timezone. */
function formatStartDate(startsAt: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    timeZone: timezone,
  }).format(startsAt)
}

export function cohortWelcomeEmail(input: {
  name: string
  startsAt: Date
  timezone: string
  appUrl: string
  now: Date
}): { subject: string; html: string; text: string } {
  const date = formatStartDate(input.startsAt, input.timezone)
  const alreadyStarted = input.startsAt.getTime() <= input.now.getTime()

  const opener = alreadyStarted
    ? `<p>You're in. Your cohort started ${date}. You're not late &mdash; jump in.</p>`
    : `<p>You're in. Your cohort starts ${date}.</p>
<p>Here's the only thing you need to do before then: nothing. No prep. No workbook. Show up, watch, decide.</p>`

  const content = `<p>${greeting(input.name)}</p>
${opener}
<p>Most people collect courses. You're here to make one decision. That's the whole thing.</p>
${inkOnGoldCta('Go to your program', `${input.appUrl}/app`)}`

  const { html, text } = emailLayout(content, {
    preheader: alreadyStarted ? `Your cohort started ${date}` : `Your cohort starts ${date}`,
  })
  return { subject: "You're in", html, text }
}

export function cohortStartsSoonEmail(input: { name: string; appUrl: string }): {
  subject: string
  html: string
  text: string
} {
  const content = `<p>${greeting(input.name)}</p>
<p>Your cohort starts tomorrow.</p>
<p>One hour. One video. One decision. That's day one.</p>
<p>You've had this thing on your mind for a long time. Tomorrow you stop circling it.</p>
${inkOnGoldCta('Go to your program', `${input.appUrl}/app`)}`

  const { html, text } = emailLayout(content, { preheader: 'Your cohort starts tomorrow' })
  return { subject: 'Tomorrow.', html, text }
}

export function cohortUpgradeNudgeEmail(input: { name: string; appUrl: string }): {
  subject: string
  html: string
  text: string
} {
  const content = `<p>${greeting(input.name)}</p>
<p>You've seen how the free program works. Here's the honest version of what the paid one adds: every module published today, plus a live session with us every month. New modules arrive on a published schedule &mdash; you can see exactly what's coming before you pay a cent.</p>
<p>$197 for the year. 7-day money-back guarantee.</p>
<p>If the free cohort was enough, ignore this. If it cracked something open, this is where you keep going.</p>
${inkOnGoldCta('See the full program', `${input.appUrl}/api/checkout/redirect`)}`

  const { html, text } = emailLayout(content, {
    preheader: 'What the paid program actually adds',
  })
  return { subject: "What the free program can't do", html, text }
}
