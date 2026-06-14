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
- Providers NEVER import other providers — image-gen.ts returns bytes; the CALLER uploads via storage.ts (TD-8)
- Optional-env providers (R2_*, CLOUDFLARE_*, IMAGE_GEN_*) throw ProviderError at runtime when vars are absent — schema stays optional so dev/CI boot without secrets
- Integration tests live in `*.integration.test.ts` and ALWAYS use `describe.skipIf(!process.env.THE_KEY)` so they skip in CI (see storage.integration.test.ts)

## ai.ts (Anthropic — chat, distillation, suggestions)
- Docs: this repo's claude-api skill. Model IDs pinned in `AI_MODELS` (LARGE=`claude-opus-4-8`,
  SMALL=`claude-haiku-4-5`). Swap a model HERE, not in features.
- Exports: `chat` (AsyncIterable<ChatChunk>), `distill`, `generateSuggestions`, `modelForKind`,
  `AI_MODELS`, types `AiKind`/`ChatChunk`/`ChatParams`/`ChatMessage`/`DistillResult`.
- **SSE seam (DX Convention 4):** `chat(params)` is an `AsyncIterable<ChatChunk>` — it yields
  `{type:'text'}` chunks as the model streams, then exactly ONE terminal
  `{type:'done', inputTokens, outputTokens, model}`. The FEATURE layer owns persist-on-completion
  (a pure function); a mid-stream throw (severed socket) propagates and the feature persists NOTHING.
  The Hono route is thin streamSSE piping. ALL stream tests iterate a FIXTURE AsyncIterable injected
  at the feature layer — the live socket is NEVER hit in CI (it lives behind the env/key seam).
- **Model tiering (ADR 10):** `modelForKind(kind)` returns LARGE for `'chat'` (advice), SMALL for
  `'interview'|'distill'|'suggestion'`. The $197/yr COGS ceiling demands cheap kinds never hit large.
- `distill(system, transcript)` is a single (non-streamed) SMALL-model call returning
  `{ fields, inputTokens, outputTokens, model }` via structured outputs; returns empty fields on any
  failure (the interview simply yields no suggestions).

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

## video.ts (Cloudflare Stream)
- Docs: https://developers.cloudflare.com/stream/
- Exports: `createTusUploadUrl`, `getVideo`, `signPlaybackToken`, `verifyWebhookSignature`, `parseWebhookEvent`, `generateCaptions`
- Uploads: tus direct creator upload — `createTusUploadUrl()` returns `{ uploadUrl, streamVideoId }` from the `Location` + `stream-media-id` response headers (eng-schema M5)
- Playback: `signPlaybackToken()` self-signs a JWT via jose with `CLOUDFLARE_STREAM_SIGNING_KEY_ID` + base64 `CLOUDFLARE_STREAM_SIGNING_KEY_JWK` — NEVER call the Cloudflare API per playback (TD-6)
- Webhooks: `verifyWebhookSignature()` checks Stream's `Webhook-Signature: time=...,sig1=...` header — HMAC-SHA256 of `${time}.${body}`, constant-time compare, timestamps older than 5 min rejected (S4)
- Captions: `generateCaptions()` hits Stream's `captions/{lang}/generate` endpoint (AI-generated captions)
- All functions throw ProviderError when CLOUDFLARE_* env vars are absent (optional-env pattern, like storage.ts)

## image-gen.ts (cover art generation, ADR 18)
- Returns RAW BYTES (`Uint8Array`) — NEVER uploads, NEVER imports providers/storage; the calling feature owns storage (TD-8)
- `MASTER_PROMPT` is the versioned master cover prompt (bump `COVER_PROMPT_VERSION` on any change) — module subject is the ONLY variable
- Palette-locked warm family with hex anchors; painterly editorial illustration, scene/object-based; NO text/typography, NO human faces, NO purple/neon/blue-dominant
- Aspects: `'2:3'` (module covers) and `'16:9'` (lesson thumbnails) — fixed crops happen downstream
- Vendor swap surface is ONE function (`generateCoverImage`) behind `IMAGE_GEN_API_KEY` — change the endpoint/model constants, the interface stays

## storage.ts (R2)
- `getSignedUrl()` = presigned GET; `getUploadUrl()` = presigned PUT (eng-schema M5)
- `getUploadUrl()` rejects path-traversal keys (`..` segments, leading `/`, backslashes, NUL) with ProviderError 400

## Imports (use from other modules)
```ts
import { payments, plans } from '@/providers/payments'
import type { PlanId } from '@/providers/payments'
import { sendEmail } from '@/providers/email'
import { createTusUploadUrl, signPlaybackToken, verifyWebhookSignature, parseWebhookEvent } from '@/providers/video'
import { generateCoverImage, MASTER_PROMPT } from '@/providers/image-gen'
import { getUploadUrl } from '@/providers/storage'
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
| ai.ts | AI_MODELS, AiKind, modelForKind, ChatRole, ChatMessage, ChatChunk, ChatParams, DistillResult, distill, generateSuggestions |
| analytics.ts | track, identify, shutdown |
| content.ts | ClassType, DecisionBlockDef, ContentSegment, CourseClass, CourseModule, Course, splitIntoSegments, getClass, getModule, getAllModules, getClassesByCourse, searchClasses, getTotalClasses, getCourse, getAllCourses |
| email.ts | email, sendEmail |
| errors.ts | ProviderError |
| image-gen.ts | COVER_PROMPT_VERSION, MASTER_PROMPT, CoverImageOptions, generateCoverImage |
| indexnow.ts | submitUrls, loadSubmittedLog, saveSubmittedLog, getUnsubmittedUrls |
| markdown.ts | BlogPostFrontmatter, ConceptFrontmatter, MethodFrontmatter, HandbookFrontmatter, GuideFrontmatter, HelpFrontmatter, ChangelogFrontmatter, LegalFrontmatter, renderCourseMarkdown, parseFrontmatter, renderMarkdown, calculateReadTime, ContentHeading, ParsedContentItem, listContentFiles, getContentFile |
| payments.ts | payments, plans, intervalFromPriceId |
| profile.ts | listProfiles, readProfile, getHealthScore, validateProfiles |
| search-console.ts | isConfigured, getAccessToken, inspectUrl, getSearchAnalytics |
| social-analytics.ts | getMetrics |
| social-posting.ts | post, getPostStatus, listProfiles |
| storage.ts | upload, download, getSignedUrl, getUploadUrl, remove |
| transcription.ts | transcribe |
| video.ts | TusUploadOptions, createTusUploadUrl, getVideo, StreamVideo, AccessRule, PlaybackTokenOptions, signPlaybackToken, verifyWebhookSignature, StreamWebhookEvent, parseWebhookEvent, CaptionGeneration, generateCaptions |

## Internal Dependencies
- platform/env
- providers/errors

<!-- Generated: 2026-06-13T02:53:44.062Z -->
