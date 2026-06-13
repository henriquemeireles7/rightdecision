import { describe, expect, test } from 'bun:test'
import { checkoutRoutes } from './create-checkout'

// bun-types requires a fn arg on test.todo; this stub never runs unless `bun test --todo`,
// in which case it throws so the case stays reported as TODO (not false-green).
const unimplemented = () => {
  throw new Error('not implemented — needs a Stripe-client seam')
}

describe('checkout route', () => {
  // The route is wired and reachable; this asserts its shape without a live Stripe call.
  test('exposes a reachable Hono app', () => {
    expect(typeof checkoutRoutes.request).toBe('function')
  })

  // Behavior that needs a Stripe-client seam to test without a leak-prone mock.module
  // (payments has no DI seam here). Tracked rather than asserted as false-green:
  test.todo('GET /redirect 303-redirects to the created Stripe session url', unimplemented)
  test.todo('GET /redirect falls back to PUBLIC_APP_URL when session.url is null', unimplemented)
  test.todo(
    'GET /redirect 303-redirects to ?error=checkout_failed when Stripe throws',
    unimplemented,
  )
  test.todo('POST / returns { url } on success and PAYMENT_FAILED on Stripe error', unimplemented)
})
