import { describe, expect, test } from 'bun:test'
import {
  abandonedOnboardingEmail,
  inactivityReminderEmail,
  moduleCompletionEmail,
  passwordChangedEmail,
  passwordResetEmail,
  verificationEmail,
  welcomeEmail,
} from './auth-emails'

function assertValidEmail(email: { subject: string; html: string; text: string }) {
  expect(email.subject).toBeTruthy()
  expect(email.html).toContain('Right Decision') // layout header
  expect(email.html).toContain('#FAF8F5') // branded background
  expect(email.text).not.toContain('<') // no HTML in plain-text
  expect(email.text).toContain('Right Decision') // footer in plain-text
}

describe('verificationEmail', () => {
  test('returns valid branded email with verification link', () => {
    const email = verificationEmail({ name: 'Maria', url: 'https://app.com/verify?token=abc' })
    assertValidEmail(email)
    expect(email.subject).toContain('Verify')
    expect(email.html).toContain('Maria')
    expect(email.html).toContain('https://app.com/verify?token=abc')
    expect(email.html).toContain('24 hours')
    expect(email.text).toContain('[Verify')
  })
})

describe('welcomeEmail', () => {
  test('returns branded email for pro user with course link', () => {
    const email = welcomeEmail({
      name: 'Maria',
      hasSubscription: true,
      dashboardUrl: 'https://app.com/course',
      pricingUrl: 'https://app.com/pricing',
    })
    assertValidEmail(email)
    expect(email.subject).toContain('Welcome')
    expect(email.html).toContain('Maria')
    expect(email.html).toContain('https://app.com/course')
  })

  test('returns branded email for free user with pricing link', () => {
    const email = welcomeEmail({
      name: 'John',
      hasSubscription: false,
      dashboardUrl: 'https://app.com/course',
      pricingUrl: 'https://app.com/pricing',
    })
    assertValidEmail(email)
    expect(email.html).toContain('https://app.com/pricing')
  })
})

describe('passwordResetEmail', () => {
  test('returns branded email with reset link', () => {
    const email = passwordResetEmail({ name: 'Maria', url: 'https://app.com/reset?token=xyz' })
    assertValidEmail(email)
    expect(email.subject).toContain('Reset')
    expect(email.html).toContain('https://app.com/reset?token=xyz')
    expect(email.html).toContain('30 minutes')
    expect(email.html).toContain("didn't request")
  })
})

describe('passwordChangedEmail', () => {
  test('returns branded alert email with date and recovery link', () => {
    const email = passwordChangedEmail({
      name: 'Maria',
      date: '2026-04-07T12:00:00Z',
      forgotPasswordUrl: 'https://app.com/forgot',
    })
    assertValidEmail(email)
    expect(email.subject).toContain('password was changed')
    expect(email.html).toContain('2026-04-07')
    expect(email.html).toContain('https://app.com/forgot')
    expect(email.html).toContain('sessions')
  })
})

describe('inactivityReminderEmail', () => {
  test('returns branded nudge email', () => {
    const email = inactivityReminderEmail({ name: 'Maria' })
    assertValidEmail(email)
    expect(email.subject).toBeTruthy()
    expect(email.html).toContain('Maria')
  })
})

describe('moduleCompletionEmail', () => {
  test('returns branded completion email with module name', () => {
    const email = moduleCompletionEmail({ name: 'Maria', moduleName: 'The Decision' })
    assertValidEmail(email)
    expect(email.html).toContain('The Decision')
  })
})

describe('abandonedOnboardingEmail', () => {
  test('returns branded re-engagement email', () => {
    const email = abandonedOnboardingEmail()
    assertValidEmail(email)
    expect(email.subject).toBeTruthy()
  })
})
