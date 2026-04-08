import { eq } from 'drizzle-orm'
import { db } from '@/platform/db/client'
import { pipelineRuns, clips } from '@/platform/db/schema'
import { assertTransition } from '@/features/(business)/workflow/state-machine'
import { z } from 'zod'

export const clipDefinitionSchema = z.object({
  sourceTimestampStart: z.number().int().min(0),
  sourceTimestampEnd: z.number().int().min(1),
  score: z.number().int().min(1).max(10).optional(),
  suggestedTitle: z.string().min(1).optional(),
  transcriptSnippet: z.string().optional(),
  platformFit: z.array(z.string()).optional(),
})

export type ClipDefinition = z.infer<typeof clipDefinitionSchema>

export const clipSelectInputSchema = z.object({
  pipelineRunId: z.string().uuid(),
  clips: z.array(clipDefinitionSchema).min(1),
})

export async function saveClipSelections(pipelineRunId: string, clipDefs: ClipDefinition[]) {
  // Find the pipeline run
  const run = await db.query.pipelineRuns.findFirst({
    where: eq(pipelineRuns.id, pipelineRunId),
  })

  if (!run) return { error: 'NOT_FOUND' as const }

  // Check state
  if (run.status !== 'transcribed' && run.status !== 'selecting') {
    return { error: 'CLIP_SELECT_INVALID_STATE' as const }
  }

  // Check transcript exists
  if (!run.transcript?.trim()) {
    return { error: 'CLIP_SELECT_NO_TRANSCRIPT' as const }
  }

  // Validate timestamps against video duration
  if (run.durationSeconds) {
    const invalid = clipDefs.find((c) => c.sourceTimestampEnd > run.durationSeconds!)
    if (invalid) {
      return { error: 'CLIP_SELECT_INVALID_TIMESTAMPS' as const }
    }
  }

  // Validate clip data
  for (const clip of clipDefs) {
    if (clip.sourceTimestampEnd <= clip.sourceTimestampStart) {
      return { error: 'CLIP_SELECT_VALIDATION_FAILED' as const }
    }
  }

  // Transition: transcribed → selecting
  assertTransition(run.status, 'selecting')
  await db
    .update(pipelineRuns)
    .set({ status: 'selecting' })
    .where(eq(pipelineRuns.id, pipelineRunId))

  // Delete existing clips (re-selection safe)
  await db.delete(clips).where(eq(clips.pipelineRunId, pipelineRunId))

  // Insert new clips
  const newClips = await db
    .insert(clips)
    .values(
      clipDefs.map((c) => ({
        pipelineRunId,
        sourceTimestampStart: c.sourceTimestampStart,
        sourceTimestampEnd: c.sourceTimestampEnd,
        duration: c.sourceTimestampEnd - c.sourceTimestampStart,
        score: c.score ?? null,
        suggestedTitle: c.suggestedTitle ?? null,
        transcriptSnippet: c.transcriptSnippet ?? null,
        platformFit: c.platformFit ?? null,
        approved: false,
        cutStatus: 'pending' as const,
      })),
    )
    .returning()

  // Transition: selecting → selected
  await db
    .update(pipelineRuns)
    .set({ status: 'selected', clipsGenerated: newClips.length })
    .where(eq(pipelineRuns.id, pipelineRunId))

  return { clips: newClips }
}
