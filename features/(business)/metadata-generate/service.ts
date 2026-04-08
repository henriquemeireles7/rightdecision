import { eq, and } from 'drizzle-orm'
import { db } from '@/platform/db/client'
import { pipelineRuns, clips, posts, platformAccounts } from '@/platform/db/schema'
import { findRunInState, transitionPipeline } from '@/features/(business)/workflow/transitions'
import { z } from 'zod'

export const metadataItemSchema = z.object({
  clipId: z.string().uuid(),
  platformAccountId: z.string().uuid(),
  description: z.string().min(1),
  hashtags: z.array(z.string()).optional(),
  cta: z.string().optional(),
})

export type MetadataItem = z.infer<typeof metadataItemSchema>

export const metadataInputSchema = z.object({
  pipelineRunId: z.string().uuid(),
  metadata: z.array(metadataItemSchema).min(1),
})

export async function saveMetadata(pipelineRunId: string, metadataItems: MetadataItem[]) {
  const found = await findRunInState(pipelineRunId, 'cut', 'generating_metadata')
  if ('error' in found) return found
  const { run } = found

  // Atomic CAS: cut → generating_metadata
  if (!await transitionPipeline(pipelineRunId, run.status, 'generating_metadata')) {
    return { error: 'PIPELINE_INVALID_STATE' as const }
  }

  // Validate platform accounts exist and check char limits BEFORE any writes
  const accounts = await db.query.platformAccounts.findMany()
  const accountMap = new Map(accounts.map((a) => [a.id, a]))

  for (const item of metadataItems) {
    const account = accountMap.get(item.platformAccountId)
    if (!account) {
      // Rollback: set status back to cut
      await db.update(pipelineRuns).set({ status: 'cut' }).where(eq(pipelineRuns.id, pipelineRunId))
      return { error: 'METADATA_UNKNOWN_PLATFORM' as const }
    }
    if (account.charLimit && item.description.length > account.charLimit) {
      await db.update(pipelineRuns).set({ status: 'cut' }).where(eq(pipelineRuns.id, pipelineRunId))
      return { error: 'METADATA_CHAR_LIMIT_EXCEEDED' as const }
    }
  }

  // Insert posts + transition in transaction (prevents orphaned posts)
  const createdPosts = await db.transaction(async (tx) => {
    const results = []
    for (const item of metadataItems) {
      const account = accountMap.get(item.platformAccountId)!
      // Check for existing (idempotency)
      const existing = await tx.query.posts.findFirst({
        where: and(eq(posts.clipId, item.clipId), eq(posts.platformAccountId, item.platformAccountId)),
      })
      if (existing) {
        results.push(existing)
        continue
      }

      const [post] = await tx
        .insert(posts)
        .values({
          clipId: item.clipId,
          platformAccountId: item.platformAccountId,
          platformName: account.platform,
          description: item.description,
          hashtags: item.hashtags ?? null,
          cta: item.cta ?? null,
          status: 'scheduled',
        })
        .returning()
      results.push(post!)
    }

    // CAS: only update if still generating_metadata
    await tx.update(pipelineRuns).set({ status: 'metadata_ready' }).where(and(eq(pipelineRuns.id, pipelineRunId), eq(pipelineRuns.status, 'generating_metadata')))

    return results
  })

  return { posts: createdPosts }
}
