import { describe, expect, test } from 'bun:test'
import {
  accessRevokedEmail,
  paymentConfirmationEmail,
  paymentFailedEmail,
  renewalReceiptEmail,
  renewalReminderEmail,
  subscriptionCancelledEmail,
} from './payment-emails'

function assertValidEmail(email: { subject: string; html: string; text: string }) {
  expect(email.subject).toBeTruthy()
  expect(email.html).toContain('Right Decision')
  expect(email.html).toContain('#FAF8F5')
  expect(email.text).not.toContain('<')
  expect(email.text).toContain('Right Decision')
}

describe('paymentConfirmationEmail', () => {
  test('returns branded receipt + first lesson CTA', () => {
    const email = paymentConfirmationEmail({
      name: 'Maria',
      amount: '$197.00',
      renewalDate: 'April 7, 2027',
      firstLessonUrl: 'https://app.com/course/01',
    })
    assertValidEmail(email)
    expect(email.subject).toContain("You're in")
    expect(email.html).toContain('$197.00')
    expect(email.html).toContain('April 7, 2027')
    expect(email.html).toContain('https://app.com/course/01')
    expect(email.html).toContain('Act 1')
  })
})

describe('renewalReceiptEmail', () => {
  test('returns branded renewal receipt', () => {
    const email = renewalReceiptEmail({
      name: 'Maria',
      amount: '$197.00',
      cardLast4: '4242',
      nextRenewalDate: 'April 7, 2028',
      portalUrl: 'https://billing.stripe.com/p/xxx',
    })
    assertValidEmail(email)
    expect(email.subject).toContain('renewed')
    expect(email.html).toContain('4242')
    expect(email.html).toContain('April 7, 2028')
    expect(email.html).toContain('https://billing.stripe.com/p/xxx')
  })
})

describe('paymentFailedEmail', () => {
  test('returns helpful non-alarming email with portal link', () => {
    const email = paymentFailedEmail({
      name: 'Maria',
      amount: '$197.00',
      portalUrl: 'https://billing.stripe.com/p/xxx',
    })
    assertValidEmail(email)
    expect(email.subject).toContain("didn't go through")
    expect(email.html).toContain('This happens')
    expect(email.html).toContain('14 days')
    expect(email.html).toContain('https://billing.stripe.com/p/xxx')
  })
})

describe('renewalReminderEmail', () => {
  test('returns transparent reminder with card info and portal links', () => {
    const email = renewalReminderEmail({
      name: 'Maria',
      amount: '$197.00',
      renewalDate: 'April 7, 2027',
      cardBrand: 'Visa',
      cardLast4: '4242',
      portalUrl: 'https://billing.stripe.com/p/xxx',
    })
    assertValidEmail(email)
    expect(email.subject).toContain('7 days')
    expect(email.html).toContain('Visa')
    expect(email.html).toContain('4242')
    expect(email.html).toContain('April 7, 2027')
  })
})

describe('subscriptionCancelledEmail', () => {
  test('returns respectful cancellation email with resubscribe link', () => {
    const email = subscriptionCancelledEmail({
      name: 'Maria',
      periodEndDate: 'April 7, 2027',
      pricingUrl: 'https://app.com/pricing',
    })
    assertValidEmail(email)
    expect(email.subject).toContain('cancelled')
    expect(email.html).toContain('April 7, 2027')
    expect(email.html).toContain('https://app.com/pricing')
    expect(email.html).toContain('Reply')
  })
})

describe('accessRevokedEmail', () => {
  test('returns matter-of-fact revocation with reactivation link', () => {
    const email = accessRevokedEmail({ name: 'Maria', reactivateUrl: 'https://app.com/pricing' })
    assertValidEmail(email)
    expect(email.subject).toContain('paused')
    expect(email.html).toContain('multiple attempts')
    expect(email.html).toContain('https://app.com/pricing')
  })
})
