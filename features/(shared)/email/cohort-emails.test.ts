import { describe, expect, test } from 'bun:test'
import { cohortStartsSoonEmail, cohortUpgradeNudgeEmail, cohortWelcomeEmail } from './cohort-emails'

const APP_URL = 'https://app.example.com'
const TIMEZONE = 'America/Sao_Paulo'
// First Monday of July 2026, 9:00 in São Paulo (UTC-3) = 12:00 UTC
const STARTS_AT = new Date('2026-07-06T12:00:00Z')
const NOW_BEFORE = new Date('2026-06-20T12:00:00Z')
const NOW_AFTER = new Date('2026-07-08T12:00:00Z')

describe('cohortWelcomeEmail', () => {
  test('renders the start date formatted in the cohort timezone', () => {
    const email = cohortWelcomeEmail({
      name: 'Maria',
      startsAt: STARTS_AT,
      timezone: TIMEZONE,
      appUrl: APP_URL,
      now: NOW_BEFORE,
    })
    expect(email.subject).toBe("You're in")
    expect(email.html).toContain('July 6')
    expect(email.html).toContain('Maria')
    expect(email.text).toContain('July 6')
  })

  test('upcoming cohort says "starts"; already-started cohort says "started" + jump in', () => {
    const upcoming = cohortWelcomeEmail({
      name: 'Maria',
      startsAt: STARTS_AT,
      timezone: TIMEZONE,
      appUrl: APP_URL,
      now: NOW_BEFORE,
    })
    const running = cohortWelcomeEmail({
      name: 'Maria',
      startsAt: STARTS_AT,
      timezone: TIMEZONE,
      appUrl: APP_URL,
      now: NOW_AFTER,
    })
    expect(upcoming.html).toContain('starts')
    expect(upcoming.html).not.toContain("You're not late")
    expect(running.html).toContain('started')
    expect(running.html).toContain("You're not late")
  })

  test('escapes HTML in the user name (XSS)', () => {
    const email = cohortWelcomeEmail({
      name: '<script>alert(1)</script>',
      startsAt: STARTS_AT,
      timezone: TIMEZONE,
      appUrl: APP_URL,
      now: NOW_BEFORE,
    })
    expect(email.html).not.toContain('<script>')
    expect(email.html).toContain('&lt;script&gt;')
  })

  test('links into the app', () => {
    const email = cohortWelcomeEmail({
      name: 'Maria',
      startsAt: STARTS_AT,
      timezone: TIMEZONE,
      appUrl: APP_URL,
      now: NOW_BEFORE,
    })
    expect(email.html).toContain(`${APP_URL}/app`)
    expect(email.text).toContain(`${APP_URL}/app`)
  })
})

describe('cohortStartsSoonEmail', () => {
  test('says tomorrow and links into the app', () => {
    const email = cohortStartsSoonEmail({ name: 'Maria', appUrl: APP_URL })
    expect(email.subject).toBe('Tomorrow.')
    expect(email.html.toLowerCase()).toContain('tomorrow')
    expect(email.html).toContain(`${APP_URL}/app`)
    expect(email.text.toLowerCase()).toContain('tomorrow')
  })

  test('escapes HTML in the user name', () => {
    const email = cohortStartsSoonEmail({ name: '<img onerror=x>', appUrl: APP_URL })
    expect(email.html).not.toContain('<img onerror=x>')
  })
})

describe('cohortUpgradeNudgeEmail', () => {
  test('sells only what exists (modules + monthly lives + published schedule) and links to checkout', () => {
    const email = cohortUpgradeNudgeEmail({ name: 'Maria', appUrl: APP_URL })
    expect(email.html).toContain('$197')
    expect(email.html.toLowerCase()).toContain('live')
    expect(email.html.toLowerCase()).toContain('published')
    expect(email.html).toContain(`${APP_URL}/api/checkout/redirect`)
    expect(email.text).toContain(`${APP_URL}/api/checkout/redirect`)
  })

  test('never promises the full future library (Wave-2 copy rule)', () => {
    const email = cohortUpgradeNudgeEmail({ name: 'Maria', appUrl: APP_URL })
    expect(email.html.toLowerCase()).not.toContain('full library')
    expect(email.html.toLowerCase()).not.toContain('lifetime')
  })
})

describe('design rules (binding for P4)', () => {
  test('CTA text on gold is ink (#1A1714) — white-on-gold banned', () => {
    for (const email of [
      cohortWelcomeEmail({
        name: 'M',
        startsAt: STARTS_AT,
        timezone: TIMEZONE,
        appUrl: APP_URL,
        now: NOW_BEFORE,
      }),
      cohortStartsSoonEmail({ name: 'M', appUrl: APP_URL }),
      cohortUpgradeNudgeEmail({ name: 'M', appUrl: APP_URL }),
    ]) {
      const cta = email.html.match(/<a [^>]*style="[^"]*"/g)?.join('\n') ?? ''
      expect(cta).toContain('#1A1714')
      expect(cta.toUpperCase()).not.toContain('COLOR:#FFFFFF')
    }
  })
})
