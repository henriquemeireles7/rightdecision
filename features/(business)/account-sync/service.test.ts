import { beforeEach, describe, expect, it, mock } from 'bun:test'

mock.module('@/platform/env', () => ({
  env: { DATABASE_URL: 'postgres://test' },
}))

const mockFindFirst = mock(() => Promise.resolve(null))
const mockInsertValues = mock(() => Promise.resolve())
const mockUpdateSet = mock(() => ({ where: mock(() => Promise.resolve()) }))

const mockFindMany = mock(() => Promise.resolve([]))

mock.module('@/platform/db/client', () => ({
  db: {
    query: {
      platformAccounts: { findFirst: () => mockFindFirst(), findMany: () => mockFindMany() },
    },
    insert: () => ({ values: mockInsertValues }),
    update: () => ({ set: mockUpdateSet }),
  },
}))

import { mockSchema } from '@/features/(business)/test-helpers'

mock.module('@/platform/db/schema', () => ({
  ...mockSchema(),
  platformAccounts: Symbol('platformAccounts'),
}))

const mockListProfiles = mock(() =>
  Promise.resolve([
    { id: 'prof-1', platform: 'instagram', handle: '@testaccount' },
    { id: 'prof-2', platform: 'tiktok', handle: '@tiktest' },
  ]),
)
mock.module('@/providers/social-posting', () => ({
  listProfiles: mockListProfiles,
  post: mock(() => Promise.resolve({ id: 'test', status: 'queued' })),
  getPostStatus: mock(() => Promise.resolve({ id: 'test', status: 'queued' })),
}))

const { syncPlatformAccounts, listPlatformAccounts } = await import('./service')

describe('features/(business)/account-sync/service', () => {
  beforeEach(() => {
    mockFindFirst.mockReset()
    mockListProfiles.mockReset()
    mockInsertValues.mockReset()

    mockFindFirst.mockResolvedValue(null)
    mockListProfiles.mockResolvedValue([
      { id: 'prof-1', platform: 'instagram', handle: '@testaccount' },
      { id: 'prof-2', platform: 'tiktok', handle: '@tiktest' },
    ])
  })

  it('creates new accounts for profiles not in DB', async () => {
    const result = await syncPlatformAccounts()
    expect(result.synced).toBe(2)
    expect(result.created).toBe(2)
    expect(result.updated).toBe(0)
    expect(mockInsertValues).toHaveBeenCalledTimes(2)
  })

  it('updates existing accounts when profile already exists', async () => {
    mockFindFirst.mockResolvedValue({
      id: 'existing-1',
      platform: 'instagram',
      uploadPostProfileId: 'prof-1',
    } as never)

    const result = await syncPlatformAccounts()
    expect(result.updated).toBe(2)
    expect(result.created).toBe(0)
  })

  it('handles empty profile list', async () => {
    mockListProfiles.mockResolvedValueOnce([])
    const result = await syncPlatformAccounts()
    expect(result.synced).toBe(0)
    expect(result.created).toBe(0)
    expect(result.updated).toBe(0)
  })

  it('handles Upload-Post API errors', async () => {
    mockListProfiles.mockRejectedValueOnce(new Error('API down'))
    await expect(syncPlatformAccounts()).rejects.toThrow('API down')
  })

  it('lists active platform accounts', async () => {
    mockFindMany.mockResolvedValueOnce([
      { id: 'acc-1', platform: 'instagram', accountHandle: '@test', isActive: true },
    ] as never)
    const accounts = await listPlatformAccounts()
    expect(accounts).toHaveLength(1)
    expect(mockFindMany).toHaveBeenCalled()
  })
})
