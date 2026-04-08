import { and, eq, inArray } from 'drizzle-orm'
import { failPipeline, findRunInState, transitionPipeline } from '@/features/(business)/workflow/transitions'
import { workflowConfigSchema } from '@/features/(business)/workflow/config'
import { db } from '@/platform/db/client'
import { clips, pipelineRuns, posts } from '@/platform/db/schema'
import { ProviderError } from '@/providers/errors'
import { track } from '@/providers/analytics'
import { post as uploadPost } from '@/providers/social-posting'
import { getSignedUrl } from '@/providers/storage'

export async function distributePostsForRun(pipelineRunId: string) {
  const found = await findRunInState(pipelineRunId, 'metadata_ready', 'awaiting_metadata_approval')
  if ('error' in found) return found
  const { run } = found

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
  if (!(await transitionPipeline(pipelineRunId, run.status, 'posting'))) {
    return { error: 'PIPELINE_INVALID_STATE' as const }
  }

  // Dry-run: skip actual posting, mark all as posted
  const config = workflowConfigSchema.safeParse(run.config)
  if (config.success && config.data.dryRun) {
    for (const postRow of scheduledPosts) {
      await db
        .update(posts)
        .set({ status: 'posted', postedAt: new Date() })
        .where(eq(posts.id, postRow.id))
    }
    await db
      .update(pipelineRuns)
      .set({ status: 'posted', clipsPosted: scheduledPosts.length })
      .where(and(eq(pipelineRuns.id, pipelineRunId), eq(pipelineRuns.status, 'posting')))

    return {
      posts: scheduledPosts.map((p) => ({ postId: p.id, success: true })),
      dryRun: true,
    }
  }

  const results: Array<{ postId: string; success: boolean; error?: string }> = []

  for (const postRow of scheduledPosts) {
    try {
      const clip = clipMap.get(postRow.clipId)
      if (!clip) {
        await db
          .update(posts)
          .set({ status: 'failed', failureReason: 'Clip not found' })
          .where(eq(posts.id, postRow.id))
        results.push({ postId: postRow.id, success: false, error: 'Clip not found' })
        continue
      }
      if (!clip.storageUrl) {
        await db
          .update(posts)
          .set({ status: 'failed', failureReason: 'Clip has no storage URL' })
          .where(eq(posts.id, postRow.id))
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

      await db
        .update(posts)
        .set({
          status: 'posted',
          uploadPostId: result.id,
          uploadPostResponse: result,
          postedAt: new Date(),
        })
        .where(eq(posts.id, postRow.id))

      track('content_distributed', { platform: postRow.platformName, status: 'posted' })
      results.push({ postId: postRow.id, success: true })
    } catch (error) {
      const reason =
        error instanceof ProviderError
          ? `${error.provider}.${error.operation}: ${error.statusCode}`
          : String(error)
      await db
        .update(posts)
        .set({
          status: 'failed',
          failureReason: reason,
          retryCount: postRow.retryCount + 1,
        })
        .where(eq(posts.id, postRow.id))
      results.push({ postId: postRow.id, success: false, error: reason })
    }
  }

  const successCount = results.filter((r) => r.success).length
  const failCount = results.filter((r) => !r.success).length

  if (failCount === scheduledPosts.length) {
    await failPipeline(pipelineRunId, 'post-distribute', `All ${failCount} posts failed`)
    return { error: 'POST_PARTIAL_FAILURE' as const }
  }

  // CAS: only update if still in posting state
  await db
    .update(pipelineRuns)
    .set({
      status: 'posted',
      clipsPosted: successCount,
      clipsFailed: failCount,
    })
    .where(and(eq(pipelineRuns.id, pipelineRunId), eq(pipelineRuns.status, 'posting')))

  if (failCount > 0 && successCount > 0) {
    return { posts: results, partial: true }
  }

  return { posts: results }
}
