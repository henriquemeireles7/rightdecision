# auth

## Purpose
SSR auth pages and their page routes: login, forgot-password, reset-password, verify-email, and
the post-purchase account-creation page. These are server-rendered Preact pages with small inline
`<script>` islands that talk to Better Auth's `/api/auth/*` endpoints directly (sign-in, social).
Better Auth itself (sessions, tokens, CSRF) lives in platform/auth — this folder is only the UI.

## Critical Rules
- NEVER hardcode the post-login redirect — read `?next`, VALIDATE it with `safeNextPath` (same-origin
  relative path only; reject `//host`, schemes, backslash/control chars), default to `/course`.
  Apply to BOTH the email/password success redirect AND the Google social `callbackURL`.
- NEVER implement auth logic here (hashing, sessions, tokens) — call `/api/auth/*` (Better Auth).
- Inline scripts are best-effort UI glue: keep error handling, but do NOT `console.*` in shipped
  client scripts (the Stop hook warns on it).
- ALWAYS render through `renderPage()` from platform/server/render; pages stay thin wiring.
- ALWAYS use design tokens (bg-cream, text-ink, bg-accent/bg-gold) — text on gold is ink.
- Email inputs normalize before submit (`.trim().toLowerCase()`); password min length 8.

## Imports (use from other modules)
```ts
import { authPageRoutes } from '@/features/(life)/auth/routes'
import { LoginPage, safeNextPath } from '@/features/(life)/auth/login'
```

## Recipe: New auth page
```tsx
// 1. <name>.tsx — SSR Preact page; inline <script> island posts to /api/auth/* if needed.
// 2. Wire a GET route in routes.tsx via renderPage(<Page/>, { title, description }).
// 3. Any redirect target from a query param goes through safeNextPath (open-redirect guard).
```

## Verify
```sh
bun test "features/(life)/auth" && bunx tsc --noEmit
```
