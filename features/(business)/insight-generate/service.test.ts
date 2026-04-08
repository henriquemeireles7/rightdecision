import { describe, it, expect, mock, beforeEach } from 'bun:test'

mock.module('@/platform/env', () => ({ env: { DATABASE_URL: 'postgres://test' } }))

const mockSelectCount = mock(() => Promise.resolve([{ count: 100 }]))
const mockInsertReturning = mock(() => Promise.resolve([{ id: 'insight-1', recommendation: 'Post more TikToks' }]))
const mockFindMany = mock(() => Promise.resolve([]))

mock.module('@/platform/db/client', () => ({
  db: {
    select: () => ({ from: () => ({ where: () => mockSelectCount() }) }),
    insert: () => ({ values: () => ({ returning: () => mockInsertReturning() }) }),
    query: { insights: { findMany: () => mockFindMany() } },
  },
}))

mock.module('@/platform/db/schema', () => ({
  insights: { createdAt: 'created_at' },
  postAnalytics: { snapshotAt: 'snapshot_at' },
}))

const { saveInsight, listInsights } = await import('./service')

describe('features/(business)/insight-generate/service', () => {
  beforeEach(() => {
    mockSelectCount.mockReset()
    mockInsertReturning.mockReset()
    mockSelectCount.mockResolvedValue([{ count: 100 }] as never)
    mockInsertReturning.mockResolvedValue([{ id: 'insight-1', recommendation: 'Post more TikToks' }] as never)
  })

  it('saves a valid insight', async () => {
    const result = await saveInsight({
      dateRange: { from: '2026-03-01T00:00:00Z', to: '2026-03-15T00:00:00Z' },
      recommendation: 'Post more TikToks — engagement is 3x higher than Instagram',
    })
    expect(result).toHaveProperty('insight')
  })

  it('returns INSIGHT_NO_DATA when no analytics exist', async () => {
    mockSelectCount.mockResolvedValueOnce([{ count: 0 }] as never)
    const result = await saveInsight({
      dateRange: { from: '2026-03-01T00:00:00Z', to: '2026-03-15T00:00:00Z' },
      recommendation: 'Some recommendation here',
    })
    expect(result).toEqual({ error: 'INSIGHT_NO_DATA' })
  })

  it('returns INSIGHT_INSUFFICIENT_DATA for < 7 days', async () => {
    const result = await saveInsight({
      dateRange: { from: '2026-03-01T00:00:00Z', to: '2026-03-03T00:00:00Z' },
      recommendation: 'Some recommendation here',
    })
    expect(result).toEqual({ error: 'INSIGHT_INSUFFICIENT_DATA' })
  })

  it('returns INSIGHT_VALIDATION_FAILED for empty recommendation', async () => {
    const result = await saveInsight({
      dateRange: { from: '2026-03-01T00:00:00Z', to: '2026-03-15T00:00:00Z' },
      recommendation: '          ',
    })
    expect(result).toEqual({ error: 'INSIGHT_VALIDATION_FAILED' })
  })
})
