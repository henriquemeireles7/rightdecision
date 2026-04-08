import { describe, expect, it } from 'bun:test'

const skip = !process.env.UPLOAD_POST_API_KEY

describe.skipIf(skip)('Upload-Post Integration', () => {
  it('lists profiles successfully', async () => {
    const { listProfiles } = await import('@/providers/social-posting')
    const profiles = await listProfiles()
    expect(Array.isArray(profiles)).toBe(true)
    for (const profile of profiles) {
      expect(profile).toHaveProperty('id')
      expect(profile).toHaveProperty('platform')
      expect(profile).toHaveProperty('handle')
    }
  })
})
