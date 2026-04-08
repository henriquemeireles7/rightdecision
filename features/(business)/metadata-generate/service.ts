import { eq, and } from 'drizzle-orm'
import { db } from '@/platform/db/client'
import { pipelineRuns, clips, posts, platformAccounts } from '@/platform/db/schema'
import { assertTransition } from '@/features/(business)/workflow/state-machine'
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
  const run = await db.query.pipelineRuns.findFirst({
    where: eq(pipelineRuns.id, pipelineRunId),
  })

  if (!run) return { error: 'NOT_FOUND' as const }

  if (run.status !== 'cut' && run.status !== 'generating_metadata') {
    return { error: 'CLIP_SELECT_INVALID_STATE' as const }
  }

  // Atomic CAS: cut → generating_metadata
  assertTransition(run.status, 'generating_metadata')
  const [transitioned] = await db
    .update(pipelineRuns)
    .set({ status: 'generating_metadata' })
    .where(and(eq(pipelineRuns.id, pipelineRunId), eq(pipelineRuns.status, run.status)))
    .returning({ id: pipelineRuns.id })

  if (!transitioned) return { error: 'CLIP_SELECT_INVALID_STATE' as const }

  // Validate platform accounts exist and check char limits
  const accounts = await db.query.platformAccounts.findMany()
  const accountMap = new Map(accounts.map((a) => [a.id, a]))

  for (const item of metadataItems) {
    const account = accountMap.get(item.platformAccountId)
    if (!account) {
      return { error: 'METADATA_UNKNOWN_PLATFORM' as const }
    }
    if (account.charLimit && item.description.length > account.charLimit) {
      return { error: 'METADATA_CHAR_LIMIT_EXCEEDED' as const }
    }
  }

  // Insert posts (skip duplicates)
  const createdPosts = []
  for (const item of metadataItems) {
    const account = accountMap.get(item.platformAccountId)!
    // Check for existing (idempotency)
    const existing = await db.query.posts.findFirst({
      where: and(eq(posts.clipId, item.clipId), eq(posts.platformAccountId, item.platformAccountId)),
    })
    if (existing) {
      createdPosts.push(existing)
      continue
    }

    const [post] = await db
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
    createdPosts.push(post!)
  }

  // Transition: generating_metadata → metadata_ready
  await db.update(pipelineRuns).set({ status: 'metadata_ready' }).where(eq(pipelineRuns.id, pipelineRunId))

  return { posts: createdPosts }
}
