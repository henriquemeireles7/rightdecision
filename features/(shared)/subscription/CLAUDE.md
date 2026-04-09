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
| handle-webhook.ts | webhookRoutes |
| helpers.ts | getUserForSubscription |
| require-subscription.ts | requireActiveSubscription |

## Internal Dependencies
- features/(shared)
- platform/auth
- platform/db
- platform/env
- platform/errors
- platform/server
- platform/types
- providers/analytics
- providers/email
- providers/payments

<!-- Generated: 2026-04-09T09:30:25.857Z -->
