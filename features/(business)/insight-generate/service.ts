import { and, count, desc, gte, lte } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/platform/db/client'
import { insights, postAnalytics } from '@/platform/db/schema'

export const insightInputSchema = z.object({
  dateRange: z.object({
    from: z.string().datetime(),
    to: z.string().datetime(),
  }),
  recommendation: z.string().min(10),
  supportingData: z.record(z.string(), z.unknown()).optional(),
})

export type InsightInput = z.infer<typeof insightInputSchema>

export async function saveInsight(input: InsightInput) {
  const from = new Date(input.dateRange.from)
  const to = new Date(input.dateRange.to)

  // Check there's analytics data in range (both bounds)
  const [analyticsCount] = await db
    .select({ count: count() })
    .from(postAnalytics)
    .where(and(gte(postAnalytics.snapshotAt, from), lte(postAnalytics.snapshotAt, to)))

  if (!analyticsCount || analyticsCount.count === 0) {
    return { error: 'INSIGHT_NO_DATA' as const }
  }

  // Check minimum data threshold (7+ days)
  const daySpan = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)
  if (daySpan < 7) {
    return { error: 'INSIGHT_INSUFFICIENT_DATA' as const }
  }

  // Validate recommendation is non-empty
  if (!input.recommendation.trim()) {
    return { error: 'INSIGHT_VALIDATION_FAILED' as const }
  }

  const [insight] = await db
    .insert(insights)
    .values({
      dateRangeStart: from,
      dateRangeEnd: to,
      recommendation: input.recommendation,
      supportingData: input.supportingData ?? null,
    })
    .returning()

  return { insight: insight! }
}

export async function listInsights(page = 1, perPage = 20) {
  const offset = (page - 1) * perPage

  const [totalResult] = await db.select({ count: count() }).from(insights)
  const total = totalResult?.count ?? 0

  const items = await db.query.insights.findMany({
    orderBy: desc(insights.createdAt),
    limit: perPage,
    offset,
  })

  return { insights: items, total, page, perPage }
}
