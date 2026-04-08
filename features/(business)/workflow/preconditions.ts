import { and, eq, sql } from 'drizzle-orm'
import { db } from '@/platform/db/client'
import { clips, type pipelineRuns, posts } from '@/platform/db/schema'
import type { PipelineStatus } from './state-machine'

type PipelineRun = typeof pipelineRuns.$inferSelect

export function assertStatus(run: PipelineRun, expected: PipelineStatus | PipelineStatus[]): void {
  const allowed = Array.isArray(expected) ? expected : [expected]
  if (!allowed.includes(run.status as PipelineStatus)) {
    throw new PreconditionError(`Expected status ${allowed.join(' or ')}, got ${run.status}`)
  }
}

export function assertTranscriptExists(run: PipelineRun): void {
  if (!run.transcript || run.transcript.trim().length === 0) {
    throw new PreconditionError('Transcript is empty or missing')
  }
}

export async function assertApprovedClipsExist(pipelineRunId: string): Promise<void> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(clips)
    .where(and(eq(clips.pipelineRunId, pipelineRunId), eq(clips.approved, true)))
  if (!result[0] || result[0].count === 0) {
    throw new PreconditionError('No approved clips found for this pipeline run')
  }
}

export async function assertCutClipsExist(pipelineRunId: string): Promise<void> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(clips)
    .where(
      and(
        eq(clips.pipelineRunId, pipelineRunId),
        eq(clips.cutStatus, 'cut'),
        sql`${clips.storageUrl} IS NOT NULL`,
      ),
    )
  if (!result[0] || result[0].count === 0) {
    throw new PreconditionError('No cut clips with storage URLs found')
  }
}

export async function assertScheduledPostsExist(pipelineRunId: string): Promise<void> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(posts)
    .innerJoin(clips, eq(posts.clipId, clips.id))
    .where(and(eq(clips.pipelineRunId, pipelineRunId), eq(posts.status, 'scheduled')))
  if (!result[0] || result[0].count === 0) {
    throw new PreconditionError('No scheduled posts found for this pipeline run')
  }
}

export class PreconditionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PreconditionError'
  }
}
