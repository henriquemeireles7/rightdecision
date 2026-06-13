/// <reference lib="dom" />
/**
 * Boot config injected by the /app SSR shell (features/(life)/app-shell/routes.tsx)
 * as window.__APP_CONFIG__. PUBLIC values only — manifest + Stream customer code.
 */

export type AppConfig = {
  /** Content-hashed bundle URLs from public/build/manifest.json (e.g. 'player-hls'). */
  manifest: Record<string, string>
  /** Cloudflare Stream customer code — playback/embed domain. Null when unconfigured. */
  streamCustomerCode: string | null
}

export function getAppConfig(): AppConfig {
  const injected = (window as { __APP_CONFIG__?: Partial<AppConfig> }).__APP_CONFIG__
  return {
    manifest: injected?.manifest ?? {},
    streamCustomerCode: injected?.streamCustomerCode ?? null,
  }
}
