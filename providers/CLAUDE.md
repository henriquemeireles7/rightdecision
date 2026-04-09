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
- ALWAYS throw ProviderError on failure — NEVER let raw SDK/HTTP errors leak to features
- ProviderError shape: `{ provider: string, operation: string, statusCode: number, rawResponse: unknown }`
- Feature layer catches ProviderError and maps to the appropriate throwError() code

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
- From address: `Right Decision <henry@rightdecision.io>` — hardcoded, do not change without approval
- Use `sendEmail(to, subject, html)` helper — NEVER call `email.emails.send()` directly from features
- HTML emails only (no plain text fallback needed for now)

## Imports (use from other modules)
```ts
import { payments, plans } from '@/providers/payments'
import type { PlanId } from '@/providers/payments'
import { sendEmail } from '@/providers/email'
```

## ProviderError Pattern
All BD pipeline providers throw ProviderError instead of raw SDK errors:
```ts
export class ProviderError extends Error {
  constructor(
    public provider: string,
    public operation: string,
    public statusCode: number,
    public rawResponse: unknown,
  ) {
    super(`${provider}.${operation} failed (${statusCode})`)
    this.name = 'ProviderError'
  }
}
```
Export ProviderError from `providers/errors.ts`. Features catch it and map to throwError() codes.

## Recipe: New Provider
```ts
// providers/capability-name.ts (named by WHAT, not WHO)
import { env } from '@/platform/env'
import { ProviderError } from '@/providers/errors'

const client = new VendorSDK(env.VENDOR_API_KEY)
export { client as capabilityName }

export async function doThing(params: Params) {
  try {
    return await client.method(params)
  } catch (error) {
    throw new ProviderError('capability', 'doThing', 500, error)
  }
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
<<<<<<< HEAD
| ai.ts | generateSuggestions |
| analytics.ts | track, identify, shutdown |
| content.ts | ClassType, DecisionBlockDef, ContentSegment, CourseClass, CourseModule, Course, splitIntoSegments, resolveClassId, getClass, getModule, getAllModules, getClassesByCourse, searchClasses, getTotalClasses, getCourse, getAllCourses |
=======
| analytics.ts | track, identify, shutdown |
| content.ts | ClassType, CourseClass, CourseModule, Course, resolveClassId, getClass, getModule, getAllModules, getClassesByCourse, searchClasses, getTotalClasses, getCourse, getAllCourses |
>>>>>>> origin/master
| email.ts | email, sendEmail |
| errors.ts | ProviderError |
| indexnow.ts | submitUrls, loadSubmittedLog, saveSubmittedLog, getUnsubmittedUrls |
| markdown.ts | BlogPostFrontmatter, ConceptFrontmatter, LegalFrontmatter, BlogPost, Concept, Legal, renderCourseMarkdown, parseFrontmatter, renderMarkdown, calculateReadTime, ParsedContentItem, ParsedContentFull, listContentFiles, getContentFile |
<<<<<<< HEAD
| payments.ts | payments, plans, PlanInterval, PlanId, intervalFromPriceId |
=======
| payments.ts | payments, plans, PlanId |
| profile.ts | QuickRef, ProfileData, ProfileReport, listProfiles, readProfile, getHealthScore, validateProfiles |
>>>>>>> origin/master
| search-console.ts | isConfigured, getAccessToken, InspectionResult, inspectUrl, AnalyticsRow, getSearchAnalytics |
| social-analytics.ts | PostMetrics, getMetrics |
| social-posting.ts | PostResult, Profile, post, getPostStatus, listProfiles |
| storage.ts | upload, download, getSignedUrl, remove |
| transcription.ts | transcribe |

## Internal Dependencies
- platform/env
- providers/errors

<<<<<<< HEAD
<!-- Generated: 2026-04-09T09:30:25.865Z -->
=======
<!-- Generated: 2026-04-09T08:16:27.993Z -->
>>>>>>> origin/master
