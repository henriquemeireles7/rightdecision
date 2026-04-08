import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { mockSchema } from '@/platform/test/mocks'

mock.module('@/platform/env', () => ({
  env: { DATABASE_URL: 'postgres://test', ONBOARDING_SESSION_TTL_HOURS: 24 },
}))

const mockFindMany = mock(() => Promise.resolve([]))
const mockFindFirst = mock(() => Promise.resolve(null))
const mockUpdateSet = mock(() => ({ where: mock(() => Promise.resolve()) }))
const mockUpdate = mock(() => ({ set: mockUpdateSet }))

mock.module('@/platform/db/client', () => ({
  db: {
    query: {
      subscriptions: { findMany: mockFindMany },
      onboardingSessions: { findFirst: mockFindFirst },
    },
    update: mockUpdate,
    insert: mock(() => ({
      values: mock(() => ({ returning: mock(() => Promise.resolve([{ id: 'p1' }])) })),
    })),
    delete: mock(() => ({ where: mock(() => Promise.resolve()) })),
  },
}))

mock.module('@/platform/db/schema', () => mockSchema())

// Mock the consumeSession dependency
const mockConsumeSession = mock(() => Promise.resolve(null))
mock.module('./session', () => ({
  consumeSession: mockConsumeSession,
}))

const { linkAccountAfterCreation } = await import('./link-subscription')

describe('link-subscription', () => {
  beforeEach(() => {
    mockFindMany.mockReset()
    mockUpdate.mockReset()
    mockUpdateSet.mockReset()
    mockConsumeSession.mockReset()

    mockUpdate.mockReturnValue({ set: mockUpdateSet } as never)
    mockUpdateSet.mockReturnValue({ where: mock(() => Promise.resolve()) } as never)
  })

  it('links subscription when unlinked subs exist', async () => {
    mockFindMany.mockResolvedValueOnce([
      { id: 'sub-1', userId: null, stripeSubscriptionId: 'stripe_sub_1' },
    ] as never)

    const result = await linkAccountAfterCreation('u1', 'test@example.com')
    expect(result.subscriptionLinked).toBe(true)
    expect(mockUpdate).toHaveBeenCalled()
  })

  it('does not link when no unlinked subscriptions', async () => {
    mockFindMany.mockResolvedValueOnce([] as never)

    const result = await linkAccountAfterCreation('u1', 'test@example.com')
    expect(result.subscriptionLinked).toBe(false)
  })

  it('consumes onboarding session when sessionId provided', async () => {
    mockFindMany.mockResolvedValueOnce([] as never)
    mockConsumeSession.mockResolvedValueOnce({ profileId: 'p1' } as never)

    const result = await linkAccountAfterCreation('u1', 'test@example.com', 'session-1')
    expect(result.profileCreated).toBe(true)
    expect(mockConsumeSession).toHaveBeenCalledWith('session-1', 'u1')
  })

  it('does not consume session when no sessionId', async () => {
    mockFindMany.mockResolvedValueOnce([] as never)

    const result = await linkAccountAfterCreation('u1', 'test@example.com')
    expect(result.profileCreated).toBe(false)
    expect(mockConsumeSession).not.toHaveBeenCalled()
  })

  it('sets profileCreated false when consumeSession returns null', async () => {
    mockFindMany.mockResolvedValueOnce([] as never)
    mockConsumeSession.mockResolvedValueOnce(null as never)

    const result = await linkAccountAfterCreation('u1', 'test@example.com', 'session-1')
    expect(result.profileCreated).toBe(false)
  })

  it('links the most recent unlinked subscription', async () => {
    mockFindMany.mockResolvedValueOnce([
      { id: 'sub-old', userId: null },
      { id: 'sub-new', userId: null },
    ] as never)

    const result = await linkAccountAfterCreation('u1', 'test@example.com')
    expect(result.subscriptionLinked).toBe(true)
  })
})
