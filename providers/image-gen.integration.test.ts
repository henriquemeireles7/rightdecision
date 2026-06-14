import { describe, expect, it } from 'bun:test'

const skip = !process.env.IMAGE_GEN_API_KEY

describe.skipIf(skip)('Image Generation Integration', () => {
  it(
    'generates a 2:3 cover image and returns non-empty bytes',
    async () => {
      const { generateCoverImage } = await import('@/providers/image-gen')
      const bytes = await generateCoverImage({
        subject: 'a single ceramic cup of coffee on a wooden desk at sunrise',
        aspect: '2:3',
      })
      expect(bytes).toBeInstanceOf(Uint8Array)
      expect(bytes.length).toBeGreaterThan(1000)
    },
    { timeout: 120_000 },
  )
})
