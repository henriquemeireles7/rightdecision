import { beforeEach, describe, expect, it, mock } from 'bun:test'

mock.module('@/platform/env', () => ({
	env: { DATABASE_URL: 'postgres://test' },
}))

// Mock DB
const mockExecute = mock(() => Promise.resolve([{ result: 1 }]))
mock.module('@/platform/db/client', () => ({
	db: { execute: mockExecute },
}))

// Mock storage
const mockUpload = mock(() => Promise.resolve('test/health-check'))
const mockDownload = mock(() => Promise.resolve(Buffer.from('health')))
const mockRemove = mock(() => Promise.resolve())
mock.module('@/providers/storage', () => ({
	upload: mockUpload,
	download: mockDownload,
	remove: mockRemove,
}))

// Mock social-posting (include all exports to avoid breaking other test files)
const mockListProfiles = mock(() => Promise.resolve([{ id: '1', platform: 'instagram', handle: 'test' }]))
mock.module('@/providers/social-posting', () => ({
	listProfiles: mockListProfiles,
	post: mock(() => Promise.resolve({ id: 'test', status: 'queued' })),
	getPostStatus: mock(() => Promise.resolve({ id: 'test', status: 'queued' })),
}))

const { checkHealth } = await import('./service')

describe('features/(business)/health/service', () => {
	beforeEach(() => {
		mockExecute.mockReset()
		mockUpload.mockReset()
		mockDownload.mockReset()
		mockRemove.mockReset()
		mockListProfiles.mockReset()

		mockExecute.mockResolvedValue([{ result: 1 }])
		mockUpload.mockResolvedValue('test/health-check')
		mockDownload.mockResolvedValue(Buffer.from('health'))
		mockRemove.mockResolvedValue(undefined)
		mockListProfiles.mockResolvedValue([{ id: '1', platform: 'instagram', handle: 'test' }])
	})

	it('returns healthy when all providers are up', async () => {
		const result = await checkHealth(true)
		expect(result.status).toBe('healthy')
		expect(result.providers.db.ok).toBe(true)
		expect(result.providers.r2.ok).toBe(true)
		expect(result.providers.uploadPost.ok).toBe(true)
	})

	it('returns degraded when one provider is down', async () => {
		mockExecute.mockRejectedValueOnce(new Error('DB connection refused'))

		const result = await checkHealth(true)
		expect(result.status).toBe('degraded')
		expect(result.providers.db.ok).toBe(false)
		expect(result.providers.db.error).toContain('DB connection refused')
		expect(result.providers.r2.ok).toBe(true)
	})

	it('returns degraded when R2 is down', async () => {
		mockUpload.mockRejectedValueOnce(new Error('R2 auth failed'))

		const result = await checkHealth(true)
		expect(result.status).toBe('degraded')
		expect(result.providers.r2.ok).toBe(false)
	})

	it('returns degraded when Upload-Post is down', async () => {
		mockListProfiles.mockRejectedValueOnce(new Error('API key invalid'))

		const result = await checkHealth(true)
		expect(result.status).toBe('degraded')
		expect(result.providers.uploadPost.ok).toBe(false)
	})

	it('includes latency for each provider', async () => {
		const result = await checkHealth(true)
		expect(result.providers.db.latencyMs).toBeGreaterThanOrEqual(0)
		expect(result.providers.r2.latencyMs).toBeGreaterThanOrEqual(0)
		expect(result.providers.uploadPost.latencyMs).toBeGreaterThanOrEqual(0)
	})

	it('cleans up R2 test file even when download fails', async () => {
		mockDownload.mockRejectedValueOnce(new Error('download failed'))

		await checkHealth(true)
		expect(mockRemove).toHaveBeenCalled()
	})
})
