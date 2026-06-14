/// <reference lib="dom" />
/**
 * bun test preload (bunfig.toml [test].preload) — SPA test harness.
 *
 * Registers a happy-dom global DOM so component tests (@testing-library/preact)
 * run without a browser. Preload runs for EVERY `bun test` invocation, so two
 * guards keep server tests unaffected:
 *
 * 1. Bun's native fetch primitives (fetch, Request, Response, Headers, ...)
 *    are captured BEFORE registration and restored onto globalThis AFTER —
 *    happy-dom would otherwise replace them with its own implementations,
 *    breaking Hono `app.fetch(new Request(...))` server tests.
 * 2. Opt-out escape hatch: HAPPY_DOM=0 skips registration entirely.
 *
 * The happy-dom `window` object keeps its own implementations internally, so
 * DOM rendering is unaffected by the restore.
 */
import { GlobalRegistrator } from '@happy-dom/global-registrator'

const optOut = Bun.env.HAPPY_DOM === '0'

if (!optOut && typeof document === 'undefined') {
  // t3-env captures isServer (typeof window === 'undefined') at createEnv()
  // time. Evaluate the real env module BEFORE happy-dom defines window —
  // otherwise every server-side env access in tests throws
  // "Attempted to access a server-side environment variable on the client".
  await import('../env')

  const native = {
    fetch: globalThis.fetch,
    Request: globalThis.Request,
    Response: globalThis.Response,
    Headers: globalThis.Headers,
    FormData: globalThis.FormData,
    Blob: globalThis.Blob,
    File: globalThis.File,
    URL: globalThis.URL,
    URLSearchParams: globalThis.URLSearchParams,
    AbortController: globalThis.AbortController,
    AbortSignal: globalThis.AbortSignal,
    WebSocket: globalThis.WebSocket,
    TextEncoder: globalThis.TextEncoder,
    TextDecoder: globalThis.TextDecoder,
    // Stream primitives: happy-dom ships versions whose WritableStream lacks
    // getWriter(), which breaks Hono streamSSE (server-side SSE, e.g. ai-chat).
    // Restore Bun's natives so server stream tests work under the DOM preload.
    ReadableStream: globalThis.ReadableStream,
    WritableStream: globalThis.WritableStream,
    TransformStream: globalThis.TransformStream,
  }

  GlobalRegistrator.register()

  // Restore Bun natives — server tests depend on Bun's Request/Response identity.
  Object.assign(globalThis, native)
}
