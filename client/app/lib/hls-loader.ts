/// <reference lib="dom" />
/**
 * Lazy hls.js loader — the ONLY path to hls.js from the shell bundle. Resolves the
 * player-hls bundle URL from the manifest (window.__APP_CONFIG__) and dynamic-imports
 * it at runtime, so the lesson route pays the cost and the /app shell stays ≤100KB.
 * Returns null when unavailable (native HLS or a friendly error state takes over).
 */
import type HlsType from 'hls.js'
import { getAppConfig } from '../config'

type HlsClass = typeof HlsType

let cached: Promise<HlsClass | null> | null = null

/** Injection for TESTS ONLY — production resolves through the manifest. */
export function resetHlsLoaderForTests() {
  cached = null
}

export function loadHls(): Promise<HlsClass | null> {
  if (!cached) {
    const url = getAppConfig().manifest['player-hls']
    cached = url
      ? import(/* webpackIgnore: true */ url)
          .then((mod: { default: HlsClass }) => mod.default)
          .catch(() => null)
      : Promise.resolve(null)
  }
  return cached
}
