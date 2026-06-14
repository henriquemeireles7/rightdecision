import { describe, test } from 'bun:test'

// bun-types requires a fn arg on test.todo; this stub is never run unless `bun test --todo`
// is passed, in which case it throws so the case stays reported as TODO (not false-green).
const unimplemented = () => {
  throw new Error('not implemented — see PRD Section 3 flow')
}

/**
 * E2E flow tests — document the 4 main user flows from PRD Section 3.
 *
 * These are intentionally UNIMPLEMENTED: every case is a `test.todo(...)` so the runner
 * reports them as TODO (not as passing) until the real flow tests land. They were
 * previously bound to a `() => expect(true).toBe(true)` placeholder, which reported as
 * false-green (passing while asserting nothing). Keep this file — it is the living index
 * of intended PRD flows; convert a todo to a real `test(...)` when you implement it
 * (run with DATABASE_URL=... bun test tests/flows/).
 */

describe('Flow 0: Payment → Account → Dashboard', () => {
  test.todo('POST /api/checkout creates Stripe session', unimplemented)
  test.todo('Webhook creates subscription with null userId', unimplemented)
  test.todo('Account creation links subscription by email', unimplemented)
  test.todo('Onboarding session consumed into profile', unimplemented)
  test.todo('Dashboard shows decision anchor with throughline', unimplemented)
})

describe('Flow 1: Course Consumption', () => {
  test.todo('Free user sees Module 0 + Module 1', unimplemented)
  test.todo('Free user gets SUBSCRIPTION_REQUIRED on Module 2', unimplemented)
  test.todo('Paid user sees all modules', unimplemented)
  test.todo('POST /api/progress/v2/complete marks class done', unimplemented)
  test.todo('GET /api/progress/v2 returns correct percentages', unimplemented)
  test.todo('Module progress calculates per-module %', unimplemented)
})

describe('Flow 2: AI Skill Marking', () => {
  test.todo('Practical class shows exercise header', unimplemented)
  test.todo('Mark complete on practical class works', unimplemented)
  test.todo('Progress updates after practical completion', unimplemented)
})

describe('Flow 3: Win Writing', () => {
  test.todo('GET /api/wins/feed returns public feed', unimplemented)
  test.todo('POST /api/wins creates a win (auth required)', unimplemented)
  test.todo('Win description stripped of HTML tags', unimplemented)
  test.todo('Rate limit: 4th win in a day returns WIN_RATE_LIMITED', unimplemented)
  test.todo('GET /api/wins/mine returns only user wins', unimplemented)
  test.todo('Public feed hides seed wins after 20+ real wins', unimplemented)
})

describe('Flow 4: Free → Paid Upgrade', () => {
  test.todo('Free user progress preserved after upgrade', unimplemented)
  test.todo('Expired subscription blocks modules 2-9', unimplemented)
  test.todo('Re-subscription restores access', unimplemented)
})

describe('Edge Cases', () => {
  test.todo('Onboarding session resume from cookie', unimplemented)
  test.todo('Expired onboarding session returns ONBOARDING_SESSION_EXPIRED', unimplemented)
  test.todo('Duplicate subscription (same stripe_subscription_id) no error', unimplemented)
  test.todo('Account deletion removes all user data', unimplemented)
  test.todo('Data export returns complete JSON', unimplemented)
})
