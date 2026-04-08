import { eq, and } from 'drizzle-orm'
import { db } from '@/platform/db/client'
import { pipelineRuns, clips, posts } from '@/platform/db/schema'
import { assertTransition } from '@/features/(business)/workflow/state-machine'
import { post as uploadPost } from '@/providers/social-posting'
import { getSignedUrl } from '@/providers/storage'
import { ProviderError } from '@/providers/errors'

export async function distributePostsForRun(pipelineRunId: string) {
  const run = await db.query.pipelineRuns.findFirst({
    where: eq(pipelineRuns.id, pipelineRunId),
  })

  if (!run) return { error: 'NOT_FOUND' as const }

  if (run.status !== 'metadata_ready' && run.status !== 'awaiting_metadata_approval' && run.status !== 'posting') {
    return { error: 'CLIP_SELECT_INVALID_STATE' as const }
  }

  // Get scheduled posts
  const scheduledPosts = await db.query.posts.findMany({
    where: eq(posts.status, 'scheduled'),
  })

  if (scheduledPosts.length === 0) {
    return { error: 'NOT_FOUND' as const }
  }

  // Transition: metadata_ready → posting
  assertTransition(run.status, 'posting')
  await db.update(pipelineRuns).set({ status: 'posting' }).where(eq(pipelineRuns.id, pipelineRunId))

  const results: Array<{ postId: string; success: boolean; error?: string }> = []

  for (const postRow of scheduledPosts) {
    try {
      // Get clip storage URL
      const clip = await db.query.clips.findFirst({
        where: eq(clips.id, postRow.clipId),
      })
      if (!clip?.storageUrl) {
        await db.update(posts).set({ status: 'failed', failureReason: 'Clip has no storage URL' }).where(eq(posts.id, postRow.id))
        results.push({ postId: postRow.id, success: false, error: 'No clip storage URL' })
        continue
      }

      // Get signed URL for the clip
      const key = new URL(clip.storageUrl).pathname.slice(1)
      const signedUrl = await getSignedUrl(key)

      // Post via Upload-Post
      const result = await uploadPost(
        signedUrl,
        postRow.description ?? '',
        postRow.hashtags ?? [],
        postRow.platformAccountId,
      )

      await db.update(posts).set({
        status: 'posted',
        uploadPostId: result.id,
        uploadPostResponse: result,
        postedAt: new Date(),
      }).where(eq(posts.id, postRow.id))

      results.push({ postId: postRow.id, success: true })
    } catch (error) {
      const reason = error instanceof ProviderError ? `${error.provider}.${error.operation}: ${error.statusCode}` : String(error)
      await db.update(posts).set({
        status: 'failed',
        failureReason: reason,
        retryCount: postRow.retryCount + 1,
      }).where(eq(posts.id, postRow.id))
      results.push({ postId: postRow.id, success: false, error: reason })
    }
  }

  const successCount = results.filter((r) => r.success).length
  const failCount = results.filter((r) => !r.success).length

  await db.update(pipelineRuns).set({
    status: 'posted',
    clipsPosted: successCount,
    clipsFailed: failCount,
  }).where(eq(pipelineRuns.id, pipelineRunId))

  if (failCount > 0 && successCount > 0) {
    return { posts: results, partial: true }
  }
  if (failCount === scheduledPosts.length) {
    await db.update(pipelineRuns).set({ status: 'failed', stepFailedAt: 'post-distribute' }).where(eq(pipelineRuns.id, pipelineRunId))
    return { error: 'POST_PARTIAL_FAILURE' as const }
  }

  return { posts: results }
}
