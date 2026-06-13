# subscription

## Purpose
Stripe checkout + webhook handling. Creates purchases on successful payment.

## Critical Rules
- NEVER use raw `c.json()` — use `success()` for data, `throwError()` for errors
- ALWAYS verify webhook signature before processing events (Stripe signature header)
- ALWAYS normalize email: `.toLowerCase().trim()` before storing
- ALWAYS use `onConflictDoNothing({ target: purchases.stripeSessionId })` to prevent duplicate purchases
- Webhook handler: only process `checkout.session.completed` with `payment_status === 'paid'`
- NEVER import Stripe directly — use `payments` from `providers/payments`
- P4 paid-enrollment wiring lives in `enrollment-sync.ts` (NOT inline in the webhook):
  checkout completed / subscription active → evergreen paid enrollment (cohortId NULL,
  source 'purchase', slug from `@/platform/programs` PAID_PROGRAM_SLUG);
  cancel-at-period-end → enrollment expiresAt (P1 sweep expires it); hard cancel → revoke.
- Idempotency dedup: INSERT-first `onConflictDoNothing(...).returning({ id })` and check
  `.length === 0` — postgres-js reports affected rows as `.count`, NEVER `.rowCount`
  (`.rowCount` is always `undefined` and silently disables the guard). Same rule for the
  `/complete` atomic-link race guard.
- The dedup claim is RELEASED (row deleted) if the handler throws, so a transient failure
  is retried by Stripe instead of silently dropped. Therefore: `safeEnrollmentSync` (swallow)
  is only for the grant/active paths that self-heal on the next subscription event; the
  `customer.subscription.deleted` REVOKE is NOT swallowed — there is no later event to
  self-heal a missed revoke, so a failure must surface and retry (revoke is idempotent).
- Stripe API version is PINNED in `providers/payments.ts` (`STRIPE_API_VERSION` =
  '2026-03-25.dahlia'). On that version `current_period_end` lives on the subscription ITEM
  (use `subscriptionPeriodEnd(sub)`), and `invoice.subscription` moved under
  `invoice.parent.subscription_details` (use `invoiceSubscriptionId(invoice)`). NEVER read
  those fields top-level. Lifecycle email amounts come from the invoice/session via
  `formatStripeAmount`, NEVER hardcoded.
- `/complete` grants the paid enrollment itself (`syncEnrollmentForCheckoutCompleted`) after
  linking — the checkout webhook fires once and may run before the account exists.
- NULL-userId subscriptions (webhook-before-linkage) are REPORTED, never enrolled —
  same rule as the M8 migration script. A webhook NEVER creates the paid program.

## Recipe: New Webhook Event Handler
```ts
// Inside webhookRoutes handler, add a new event type:
if (event.type === 'customer.subscription.updated') {
  const subscription = event.data.object
  // ... handle the event ...
  return success(c, { received: true })
}
```
ALWAYS verify signature is checked before this code runs (it's handled at the top of the handler).

## Verify
```sh
bun test features/subscription/
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| complete-checkout.ts | completeCheckoutRoutes |
| create-checkout.ts | checkoutRoutes |
| customer-portal.ts | portalRoutes |
| enrollment-sync.ts | PaidEnrollmentSyncResult, SubscriptionEnrollmentSyncResult, syncPaidEnrollment, syncEnrollmentForCheckoutCompleted, syncEnrollmentForSubscriptionUpdate, syncEnrollmentForSubscriptionDeleted |
| handle-webhook.ts | webhookRoutes |
| helpers.ts | getUserForSubscription |
| require-subscription.ts | requireActiveSubscription |

## Internal Dependencies
- features/(shared)
- platform/auth
- platform/db
- platform/env
- platform/errors
- platform/events
- platform/programs
- platform/server
- platform/types
- providers/analytics
- providers/email
- providers/payments

<!-- Generated: 2026-06-12T23:31:24.932Z -->
