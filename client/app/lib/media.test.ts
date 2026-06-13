import { describe, expect, test } from 'bun:test'
import { coverUrl, hlsManifestUrl, streamCaptionsUrl, streamPosterUrl } from './media'

describe('unit: media URLs', () => {
  test('coverUrl routes R2 keys through the signed-redirect endpoint', () => {
    expect(coverUrl('covers/modules/abc/cover.png')).toBe('/app/media/covers/modules/abc/cover.png')
  })

  test('coverUrl encodes unsafe characters per segment, keeping slashes', () => {
    expect(coverUrl('covers/a b/c#d.png')).toBe('/app/media/covers/a%20b/c%23d.png')
  })

  test('coverUrl is null for missing keys (placeholder renders instead)', () => {
    expect(coverUrl(null)).toBeNull()
    expect(coverUrl('')).toBeNull()
  })

  test('stream URLs put the signed token on the customer playback domain', () => {
    expect(hlsManifestUrl('c0de', 'tok.en')).toBe(
      'https://customer-c0de.cloudflarestream.com/tok.en/manifest/video.m3u8',
    )
    expect(streamPosterUrl('c0de', 'tok.en')).toBe(
      'https://customer-c0de.cloudflarestream.com/tok.en/thumbnails/thumbnail.jpg',
    )
    expect(streamCaptionsUrl('c0de', 'tok.en')).toBe(
      'https://customer-c0de.cloudflarestream.com/tok.en/captions/en',
    )
  })
})
