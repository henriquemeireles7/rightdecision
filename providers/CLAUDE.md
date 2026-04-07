# providers

## Purpose
Thin wrappers around external services. One file per capability, named by WHAT it does, not WHO provides it.

## Critical Rules
- ALWAYS name files by capability: `payments.ts`, `email.ts` — NEVER by vendor (`stripe.ts`, `resend.ts`)
- Each provider is ONE file with ONE default export (the client) + named exports for helpers
- ALWAYS import env vars from `platform/env.ts` — NEVER use `process.env`
- Providers are the ONLY place that imports vendor SDKs (Stripe, Resend, etc.)
- Features import from `providers/` — NEVER import vendor SDKs directly in `features/`
- When swapping vendors, only the provider file changes — the interface stays the same

## payments.ts (Stripe)
- Docs: https://docs.stripe.com/api
- Exports: `payments` (Stripe client), `plans` (price config), `PlanId` type
- Checkout: `payments.checkout.sessions.create()` with `mode: 'payment'`
- Webhooks: `payments.webhooks.constructEvent()` for signature verification
- Plans config is a const object — add new plans here, not in feature code
- Prices are in cents (19700 = $197.00)

## email.ts (Resend)
- Docs: https://resend.com/docs/api-reference
- Exports: `email` (Resend client), `sendEmail()` helper
- From address: `Right Decision <hello@rightdecision.com>` — hardcoded, do not change without approval
- Use `sendEmail(to, subject, html)` helper — NEVER call `email.emails.send()` directly from features
- HTML emails only (no plain text fallback needed for now)

## Imports (use from other modules)
```ts
import { payments, plans } from '@/providers/payments'
import type { PlanId } from '@/providers/payments'
import { sendEmail } from '@/providers/email'
```

## Recipe: New Provider
```ts
// providers/capability-name.ts (named by WHAT, not WHO)
import { env } from '@/platform/env'

const client = new VendorSDK(env.VENDOR_API_KEY)
export { client as capabilityName }

export async function doThing(params: Params) {
  return client.method(params)
}
```
Then: add env var to `platform/env.ts`, add provider section to this CLAUDE.md.

## Verify
```sh
bunx tsc --noEmit providers/*.ts
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| email.ts | email, sendEmail |
| payments.ts | payments, plans, PlanId |

## Internal Dependencies
- platform/env

<!-- Generated: 2026-04-06T23:27:10.500Z -->
