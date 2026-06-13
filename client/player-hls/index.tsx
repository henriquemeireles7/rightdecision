/// <reference lib="dom" />
/**
 * Lazy hls.js bundle entry — loaded at runtime by client/app/lib/hls-loader.ts via the
 * content-hash manifest, ONLY on the lesson route and ONLY without native HLS support.
 * Light build: captions are WebVTT side-files on a <track> element, never in-manifest.
 * Budget: ≤120KB gzipped (BUNDLE_BUDGETS in platform/scripts/harden-check.ts).
 */
export { default } from 'hls.js/dist/hls.light.mjs'
