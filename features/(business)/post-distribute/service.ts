import { eq, and, inArray } from 'drizzle-orm'
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

  if (run.status !== 'metadata_ready' && run.status !== 'awaiting_metadata_approval') {
    return { error: 'CLIP_SELECT_INVALID_STATE' as const }
  }

  // Get scheduled posts for this pipeline run's clips
  const runClips = await db.query.clips.findMany({
    where: eq(clips.pipelineRunId, pipelineRunId),
  })
  const clipIds = runClips.map((c) => c.id)

  if (clipIds.length === 0) {
    return { error: 'NOT_FOUND' as const }
  }

  const scheduledPosts = await db.query.posts.findMany({
    where: and(eq(posts.status, 'scheduled'), inArray(posts.clipId, clipIds)),
  })

  if (scheduledPosts.length === 0) {
    return { error: 'NOT_FOUND' as const }
  }

  // Pre-load all clips into a map (avoid N+1)
  const clipMap = new Map(runClips.map((c) => [c.id, c]))

  // Atomic CAS: metadata_ready → posting
  assertTransition(run.status, 'posting')
  const [transitioned] = await db
    .update(pipelineRuns)
    .set({ status: 'posting' })
    .where(and(eq(pipelineRuns.id, pipelineRunId), eq(pipelineRuns.status, run.status)))
    .returning({ id: pipelineRuns.id })

  if (!transitioned) return { error: 'CLIP_SELECT_INVALID_STATE' as const }

  const results: Array<{ postId: string; success: boolean; error?: string }> = []

  for (const postRow of scheduledPosts) {
    try {
      const clip = clipMap.get(postRow.clipId)
      if (!clip) {
        await db.update(posts).set({ status: 'failed', failureReason: 'Clip not found' }).where(eq(posts.id, postRow.id))
        results.push({ postId: postRow.id, success: false, error: 'Clip not found' })
        continue
      }
      if (!clip.storageUrl) {
        await db.update(posts).set({ status: 'failed', failureReason: 'Clip has no storage URL' }).where(eq(posts.id, postRow.id))
        results.push({ postId: postRow.id, success: false, error: 'No clip storage URL' })
        continue
      }

      // Get signed URL for the clip (storageUrl is the R2 key)
      const signedUrl = await getSignedUrl(clip.storageUrl)

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

  if (failCount === scheduledPosts.length) {
    await db.update(pipelineRuns).set({ status: 'failed', stepFailedAt: 'post-distribute', clipsFailed: failCount }).where(eq(pipelineRuns.id, pipelineRunId))
    return { error: 'POST_PARTIAL_FAILURE' as const }
  }

  await db.update(pipelineRuns).set({
    status: 'posted',
    clipsPosted: successCount,
    clipsFailed: failCount,
  }).where(eq(pipelineRuns.id, pipelineRunId))

  if (failCount > 0 && successCount > 0) {
    return { posts: results, partial: true }
  }

  return { posts: results }
}
