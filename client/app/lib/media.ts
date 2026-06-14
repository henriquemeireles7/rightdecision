/// <reference lib="dom" />
/**
 * Media URL builders: R2 cover keys go through the session-gated /app/media/*
 * signed-redirect route; Stream playback URLs are built from the signed token
 * (the token replaces the video id on the customer playback domain).
 */

/** Catalog cover/thumbnail R2 key → the app-shell signed-redirect URL. */
export function coverUrl(key: string | null | undefined): string | null {
  if (!key) return null
  const encoded = key.split('/').map(encodeURIComponent).join('/')
  return `/app/media/${encoded}`
}

const streamBase = (customerCode: string) => `https://customer-${customerCode}.cloudflarestream.com`

/** HLS manifest for a signed playback token. */
export function hlsManifestUrl(customerCode: string, playbackToken: string): string {
  return `${streamBase(customerCode)}/${playbackToken}/manifest/video.m3u8`
}

/** Poster frame for the player. */
export function streamPosterUrl(customerCode: string, playbackToken: string): string {
  return `${streamBase(customerCode)}/${playbackToken}/thumbnails/thumbnail.jpg`
}

/** WebVTT caption side-file (every published lesson ships an English track). */
export function streamCaptionsUrl(customerCode: string, playbackToken: string): string {
  return `${streamBase(customerCode)}/${playbackToken}/captions/en`
}
