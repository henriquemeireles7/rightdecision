import { eq, and, gte } from 'drizzle-orm'
import { db } from '@/platform/db/client'
import { posts, postAnalytics } from '@/platform/db/schema'
import { getMetrics } from '@/providers/social-analytics'
import { ProviderError } from '@/providers/errors'

export async function collectAnalytics(postIds?: string[]) {
  // Default: all posted posts from last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  let targetPosts
  if (postIds && postIds.length > 0) {
    targetPosts = []
    for (const id of postIds) {
      const post = await db.query.posts.findFirst({ where: eq(posts.id, id) })
      if (post) targetPosts.push(post)
    }
  } else {
    targetPosts = await db.query.posts.findMany({
      where: and(eq(posts.status, 'posted'), gte(posts.postedAt, sevenDaysAgo)),
    })
  }

  if (targetPosts.length === 0) {
    return { collected: 0, errors: 0 }
  }

  let collected = 0
  let errors = 0

  for (const post of targetPosts) {
    if (!post.uploadPostId) {
      errors++
      continue
    }

    try {
      const metrics = await getMetrics(post.uploadPostId)

      await db.insert(postAnalytics).values({
        postId: post.id,
        views: metrics.views ?? 0,
        likes: metrics.likes ?? 0,
        comments: metrics.comments ?? 0,
        shares: metrics.shares ?? 0,
        saves: metrics.saves ?? 0,
        impressions: metrics.impressions ?? 0,
        reach: metrics.reach ?? 0,
      })

      collected++
    } catch (error) {
      if (error instanceof ProviderError && (error.statusCode === 404 || error.statusCode === 410)) {
        // Post deleted from platform
        await db.update(posts).set({ status: 'deleted' }).where(eq(posts.id, post.id))
      }
      errors++
    }
  }

  return { collected, errors }
}
