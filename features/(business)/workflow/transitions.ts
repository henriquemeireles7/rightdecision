import { and, eq, sql } from 'drizzle-orm'
import { assertTransition, type PipelineStatus } from '@/features/(business)/workflow/state-machine'
import { db } from '@/platform/db/client'
import { pipelineRuns } from '@/platform/db/schema'

const PROCESSING_STATES: PipelineStatus[] = [
  'transcribing', 'selecting', 'cutting', 'generating_metadata', 'posting', 'analyzing',
]

const STEP_NAMES: Partial<Record<PipelineStatus, string>> = {
  transcribing: 'transcribe',
  selecting: 'clip-select',
  cutting: 'clip-cut',
  generating_metadata: 'metadata-generate',
  posting: 'post-distribute',
  analyzing: 'analytics-collect',
}

/**
 * Atomic CAS state transition with automatic step timing.
 * - Transitioning TO a processing state records startedAt
 * - Transitioning FROM a processing state records completedAt + durationMs
 */
export async function transitionPipeline(
  runId: string,
  from: PipelineStatus,
  to: PipelineStatus,
  extraFields?: Record<string, unknown>,
): Promise<boolean> {
  assertTransition(from, to)

  // Build timing update
  const now = new Date().toISOString()
  let timingUpdate: Record<string, unknown> | undefined

  if (PROCESSING_STATES.includes(to)) {
    // Starting a processing step
    const stepName = STEP_NAMES[to]!
    timingUpdate = { [stepName]: { startedAt: now } }
  } else if (PROCESSING_STATES.includes(from)) {
    // Completing a processing step: read current timing to calculate duration
    const stepName = STEP_NAMES[from]!
    const run = await db.query.pipelineRuns.findFirst({
      where: eq(pipelineRuns.id, runId),
      columns: { stepTimings: true },
    })
    const existing = (run?.stepTimings as Record<string, { startedAt: string }>) ?? {}
    const startedAt = existing[stepName]?.startedAt
    const durationMs = startedAt ? Date.now() - new Date(startedAt).getTime() : undefined
    timingUpdate = { [stepName]: { startedAt, completedAt: now, durationMs } }
  }

  // Merge timing into stepTimings jsonb
  const fields: Record<string, unknown> = { status: to, ...extraFields }
  if (timingUpdate) {
    fields.stepTimings = sql`COALESCE(step_timings, '{}'::jsonb) || ${JSON.stringify(timingUpdate)}::jsonb`
  }

  const [transitioned] = await db
    .update(pipelineRuns)
    .set(fields as Record<string, unknown>)
    .where(and(eq(pipelineRuns.id, runId), eq(pipelineRuns.status, from)))
    .returning({ id: pipelineRuns.id })
  return !!transitioned
}

/**
 * Mark a pipeline run as failed. CAS: skips if already failed or completed.
 * Use this instead of manually updating pipelineRuns.status = 'failed'.
 */
export async function failPipeline(runId: string, step: string, message: string): Promise<void> {
  const run = await db.query.pipelineRuns.findFirst({
    where: eq(pipelineRuns.id, runId),
  })
  if (!run || run.status === 'failed' || run.status === 'completed') return

  await db
    .update(pipelineRuns)
    .set({
      status: 'failed',
      stepFailedAt: step,
      errorMessage: message,
    } as Record<string, unknown>)
    .where(and(eq(pipelineRuns.id, runId), eq(pipelineRuns.status, run.status as PipelineStatus)))
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
