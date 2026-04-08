import { eq, and } from 'drizzle-orm'
import { db } from '@/platform/db/client'
import { pipelineRuns } from '@/platform/db/schema'
import { assertTransition, type PipelineStatus } from '@/features/(business)/workflow/state-machine'

/**
 * Atomic CAS state transition. Returns the run if successful, null if lost the race.
 * Combines assertTransition validation + WHERE status = ? + RETURNING.
 */
export async function transitionPipeline(
  runId: string,
  from: PipelineStatus,
  to: PipelineStatus,
  extraFields?: Record<string, unknown>,
): Promise<boolean> {
  assertTransition(from, to)
  const [transitioned] = await db
    .update(pipelineRuns)
    .set({ status: to, ...extraFields } as Record<string, unknown>)
    .where(and(eq(pipelineRuns.id, runId), eq(pipelineRuns.status, from)))
    .returning({ id: pipelineRuns.id })
  return !!transitioned
}

/**
 * Find a pipeline run and verify it's in one of the expected statuses.
 * Returns { run } on success, { error } on failure.
 */
export async function findRunInState(runId: string, ...allowedStatuses: PipelineStatus[]) {
  const run = await db.query.pipelineRuns.findFirst({
    where: eq(pipelineRuns.id, runId),
  })
  if (!run) return { error: 'NOT_FOUND' as const }
  if (!allowedStatuses.includes(run.status as PipelineStatus)) {
    return { error: 'PIPELINE_INVALID_STATE' as const }
  }
  return { run }
}
