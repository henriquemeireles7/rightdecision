import { afterAll, describe, expect, it } from 'bun:test'

const skip =
  !process.env.CLOUDFLARE_ACCOUNT_ID ||
  !process.env.CLOUDFLARE_STREAM_API_TOKEN ||
  !process.env.CLOUDFLARE_STREAM_SIGNING_KEY_ID ||
  !process.env.CLOUDFLARE_STREAM_SIGNING_KEY_JWK

let createdVideoId: string | undefined

describe.skipIf(skip)('Cloudflare Stream Integration', () => {
  afterAll(async () => {
    // Best-effort cleanup of the placeholder video created by the tus test
    if (!createdVideoId) return
    try {
      await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/stream/${createdVideoId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_STREAM_API_TOKEN}` },
        },
      )
    } catch {
      /* cleanup best-effort */
    }
  })

  it('creates a tus direct upload URL', async () => {
    const { createTusUploadUrl } = await import('@/providers/video')
    const { uploadUrl, streamVideoId } = await createTusUploadUrl({
      uploadLengthBytes: 1024,
      name: `integration-test-${Date.now()}`,
      maxDurationSeconds: 60,
    })
    expect(uploadUrl).toStartWith('https://')
    expect(streamVideoId.length).toBeGreaterThan(0)
    createdVideoId = streamVideoId
  })

  it('fetches video details for the created upload', async () => {
    if (!createdVideoId) throw new Error('tus test did not run')
    const { getVideo } = await import('@/providers/video')
    const video = await getVideo(createdVideoId)
    expect(video.streamVideoId).toBe(createdVideoId)
    expect(video.readyToStream).toBe(false) // nothing uploaded yet
  })

  it('self-signs a playback token with the live signing key', async () => {
    const { signPlaybackToken } = await import('@/providers/video')
    const token = await signPlaybackToken(createdVideoId ?? 'placeholder-video-id', {
      expiresInSeconds: 60,
    })
    expect(token.split('.')).toHaveLength(3)
  })
})
