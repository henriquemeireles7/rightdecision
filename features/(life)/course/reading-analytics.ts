import { and, eq, sql } from 'drizzle-orm'
import { db } from '@/platform/db/client'
import { readingAnalytics } from '@/platform/db/schema'

export async function logReading(
  userId: string,
  classId: string,
  courseSlug: string,
  timeSpentSec: number,
  scrollDepth: number,
) {
  const completedAt = scrollDepth >= 90 ? new Date() : null

  await db
    .insert(readingAnalytics)
    .values({ userId, classId, courseSlug, timeSpentSec, scrollDepth, completedAt })
    .onConflictDoUpdate({
      target: [readingAnalytics.userId, readingAnalytics.classId],
      set: {
        timeSpentSec: sql`${readingAnalytics.timeSpentSec} + ${timeSpentSec}`,
        scrollDepth: sql`GREATEST(${readingAnalytics.scrollDepth}, ${scrollDepth})`,
        completedAt: completedAt
          ? sql`COALESCE(${readingAnalytics.completedAt}, ${completedAt})`
          : sql`${readingAnalytics.completedAt}`,
        updatedAt: new Date(),
      },
    })
}

export async function getReadingStats(userId: string, courseSlug?: string) {
  const conditions = [eq(readingAnalytics.userId, userId)]
  if (courseSlug) conditions.push(eq(readingAnalytics.courseSlug, courseSlug))

  const rows = await db.query.readingAnalytics.findMany({
    where: and(...conditions),
  })

  const totalTimeSec = rows.reduce((sum, r) => sum + r.timeSpentSec, 0)
  const classesRead = rows.filter((r) => r.completedAt).length

  return {
    totalTimeMin: Math.round(totalTimeSec / 60),
    classesRead,
    avgTimePerClass: classesRead > 0 ? Math.round(totalTimeSec / classesRead / 60) : 0,
  }
}
