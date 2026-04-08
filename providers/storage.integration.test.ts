import { afterAll, describe, expect, it } from 'bun:test'

const skip = !process.env.R2_ACCESS_KEY_ID

const TEST_KEY = `test/integration-${Date.now()}`
const TEST_DATA = Buffer.from(`integration-test-${Date.now()}`)

describe.skipIf(skip)('R2 Storage Integration', () => {
  afterAll(async () => {
    try {
      const { remove } = await import('@/providers/storage')
      await remove(TEST_KEY)
    } catch {
      /* cleanup best-effort */
    }
  })

  it('uploads a file to R2', async () => {
    const { upload } = await import('@/providers/storage')
    const key = await upload(TEST_KEY, TEST_DATA, 'text/plain')
    expect(key).toBe(TEST_KEY)
  })

  it('downloads the uploaded file and content matches', async () => {
    const { download } = await import('@/providers/storage')
    const data = await download(TEST_KEY)
    expect(Buffer.from(data).equals(TEST_DATA)).toBe(true)
  })

  it('generates a signed URL', async () => {
    const { getSignedUrl } = await import('@/providers/storage')
    const url = await getSignedUrl(TEST_KEY)
    expect(url).toContain('https://')
  })

  it('returns ProviderError 404 for missing key', async () => {
    const { download } = await import('@/providers/storage')
    const { ProviderError } = await import('@/providers/errors')
    try {
      await download('test/nonexistent-key-that-does-not-exist')
      expect(true).toBe(false) // should not reach
    } catch (error) {
      expect(error).toBeInstanceOf(ProviderError)
      expect((error as InstanceType<typeof ProviderError>).statusCode).toBe(404)
    }
  })

  it('deletes the test file', async () => {
    const { remove } = await import('@/providers/storage')
    await remove(TEST_KEY)
    // Verify deletion by trying to download
    const { download } = await import('@/providers/storage')
    const { ProviderError } = await import('@/providers/errors')
    try {
      await download(TEST_KEY)
      expect(true).toBe(false)
    } catch (error) {
      expect(error).toBeInstanceOf(ProviderError)
    }
  })
})
