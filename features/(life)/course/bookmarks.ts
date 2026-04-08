import { and, eq } from 'drizzle-orm'
import { db } from '@/platform/db/client'
import { bookmarks } from '@/platform/db/schema'

export async function toggleBookmark(userId: string, classId: string) {
  const existing = await db.query.bookmarks.findFirst({
    where: and(eq(bookmarks.userId, userId), eq(bookmarks.classId, classId)),
  })

  if (existing) {
    await db.delete(bookmarks).where(eq(bookmarks.id, existing.id))
    return { bookmarked: false }
  }

  await db.insert(bookmarks).values({ userId, classId }).onConflictDoNothing()
  return { bookmarked: true }
}

export async function getUserBookmarks(userId: string) {
  return db.query.bookmarks.findMany({
    where: eq(bookmarks.userId, userId),
    orderBy: (b, { desc }) => [desc(b.createdAt)],
  })
}

export async function isBookmarked(userId: string, classId: string) {
  const bookmark = await db.query.bookmarks.findFirst({
    where: and(eq(bookmarks.userId, userId), eq(bookmarks.classId, classId)),
  })
  return !!bookmark
}
