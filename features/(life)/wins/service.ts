import { and, count, desc, eq, gte, sql } from 'drizzle-orm'
import { db } from '@/platform/db/client'
import { wins } from '@/platform/db/schema'
import { env } from '@/platform/env'

export type LifeArea = 'health' | 'relationships' | 'career' | 'money'

export async function createWin(userId: string, lifeArea: LifeArea, description: string) {
  // Rate limit check
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [todayCount] = await db
    .select({ count: count() })
    .from(wins)
    .where(and(eq(wins.userId, userId), gte(wins.createdAt, today)))

  if (todayCount && todayCount.count >= env.WIN_RATE_LIMIT_PER_DAY) {
    return { error: 'WIN_RATE_LIMITED' as const }
  }

  // Enforce plain text (strip any HTML tags)
  const cleanDescription = description.replace(/<[^>]*>/g, '').trim()

  if (cleanDescription.length > 280) {
    return { error: 'WIN_TOO_LONG' as const }
  }

  const [win] = await db
    .insert(wins)
    .values({
      userId,
      lifeArea,
      description: cleanDescription,
    })
    .returning()

  return { win: win! }
}

export async function getPublicFeed(lifeArea?: LifeArea, limit = 50, offset = 0) {
  // Count real (non-seed) wins
  const [realCount] = await db
    .select({ count: count() })
    .from(wins)
    .where(eq(wins.isSeed, false))

  const showSeeds = !realCount || realCount.count < 20

  const conditions = []
  if (!showSeeds) {
    conditions.push(eq(wins.isSeed, false))
  }
  if (lifeArea) {
    conditions.push(eq(wins.lifeArea, lifeArea))
  }

  const feed = await db
    .select({
      id: wins.id,
      lifeArea: wins.lifeArea,
      description: wins.description,
      isSeed: wins.isSeed,
      // Round timestamp to nearest hour for privacy
      createdAt: sql<string>`date_trunc('hour', ${wins.createdAt})`,
    })
    .from(wins)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(wins.createdAt))
    .limit(limit)
    .offset(offset)

  return feed
}

export async function getMyWins(userId: string) {
  return db.query.wins.findMany({
    where: eq(wins.userId, userId),
    orderBy: (w, { desc }) => [desc(w.createdAt)],
  })
}
