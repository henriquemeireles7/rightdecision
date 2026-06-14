import { afterAll, beforeEach, describe, expect, it, mock } from 'bun:test'
import {
  clearDbOverride,
  clearEnvOverride,
  dbProxy,
  envProxy,
  mockSchema,
  setDbOverride,
  setEnvOverride,
} from '@/platform/test/mocks'

mock.module('@/platform/env', () => ({ env: envProxy }))
setEnvOverride({ DATABASE_URL: 'postgres://test' })

const mockUsersFindFirst = mock(() => Promise.resolve(null))
const mockProfileFindFirst = mock(() => Promise.resolve(null))
const mockProgressFindMany = mock(() => Promise.resolve([]))
const mockWinsFindMany = mock(() => Promise.resolve([]))
const mockBookmarksFindMany = mock(() => Promise.resolve([]))
const mockSubsFindMany = mock(() => Promise.resolve([]))
const mockDeleteWhere = mock(() => Promise.resolve())
const mockDelete = mock(() => ({ where: mockDeleteWhere }))

mock.module('@/platform/db/client', () => ({ db: dbProxy }))
setDbOverride({
  query: {
    users: { findFirst: mockUsersFindFirst },
    onboardingProfiles: { findFirst: mockProfileFindFirst },
    courseProgress: { findMany: mockProgressFindMany },
    wins: { findMany: mockWinsFindMany },
    bookmarks: { findMany: mockBookmarksFindMany },
    subscriptions: { findMany: mockSubsFindMany },
  },
  delete: mockDelete,
})

mock.module('@/platform/db/schema', () => mockSchema())

afterAll(() => {
  clearDbOverride()
  clearEnvOverride()
})

const { exportUserData, deleteUserAccount } = await import('./privacy')

describe('privacy', () => {
  beforeEach(() => {
    mockUsersFindFirst.mockReset()
    mockProfileFindFirst.mockReset()
    mockProgressFindMany.mockReset()
    mockWinsFindMany.mockReset()
    mockBookmarksFindMany.mockReset()
    mockSubsFindMany.mockReset()
    mockDelete.mockReset()
    mockDeleteWhere.mockReset()

    mockUsersFindFirst.mockResolvedValue(null as never)
    mockProfileFindFirst.mockResolvedValue(null as never)
    mockProgressFindMany.mockResolvedValue([] as never)
    mockWinsFindMany.mockResolvedValue([] as never)
    mockBookmarksFindMany.mockResolvedValue([] as never)
    mockSubsFindMany.mockResolvedValue([] as never)
    mockDelete.mockReturnValue({ where: mockDeleteWhere } as never)
  })

  describe('exportUserData', () => {
    it('returns all user data when user exists', async () => {
      mockUsersFindFirst.mockResolvedValueOnce({
        id: 'u1',
        email: 'test@example.com',
        name: 'Test',
        createdAt: new Date('2024-01-01'),
      } as never)

      const result = await exportUserData('u1')
      expect(result.user).toEqual({
        email: 'test@example.com',
        name: 'Test',
        createdAt: new Date('2024-01-01'),
      })
      expect(result.exportedAt).toBeDefined()
    })

    it('returns null user when user not found', async () => {
      const result = await exportUserData('missing')
      expect(result.user).toBeNull()
    })

    it('maps subscription data to safe fields only', async () => {
      mockSubsFindMany.mockResolvedValueOnce([
        {
          id: 'sub-1',
          status: 'active',
          currentPeriodEnd: new Date('2025-01-01'),
          createdAt: new Date('2024-01-01'),
          stripeCustomerId: 'cus_secret',
          stripeSubscriptionId: 'sub_secret',
        },
      ] as never)

      const result = await exportUserData('u1')
      expect(result.subscriptions).toEqual([
        {
          status: 'active',
          currentPeriodEnd: new Date('2025-01-01'),
          createdAt: new Date('2024-01-01'),
        },
      ])
      // Ensure sensitive fields are NOT included
      expect(result.subscriptions[0]).not.toHaveProperty('stripeCustomerId')
      expect(result.subscriptions[0]).not.toHaveProperty('stripeSubscriptionId')
    })
  })

  describe('deleteUserAccount', () => {
    it('deletes all user data and returns success', async () => {
      const result = await deleteUserAccount('u1')
      expect(result).toEqual({ deleted: true })
      // 6 delete calls: wins, bookmarks, courseProgress, onboardingProfiles, subscriptions, users
      expect(mockDelete).toHaveBeenCalledTimes(6)
    })
  })
})
