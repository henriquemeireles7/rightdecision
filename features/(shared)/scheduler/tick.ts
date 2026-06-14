import { cohortAutoCreationJob, enrollmentExpirySweepJob, processPendingDripsJob } from './jobs'

export type SchedulerJob = {
  name: string
  run: (now: Date) => Promise<number>
}

/** All recurring jobs, in run order. Every job MUST be idempotent (see CLAUDE.md). */
export const jobs: readonly SchedulerJob[] = [
  { name: 'processPendingDrips', run: processPendingDripsJob },
  { name: 'cohortAutoCreation', run: cohortAutoCreationJob },
  { name: 'enrollmentExpirySweep', run: enrollmentExpirySweepJob },
]

/**
 * Runs all jobs sequentially. One job's failure never stops the others (log + continue).
 * This is the tested seam — the 1-min setInterval wiring lives in app.ts ONLY.
 */
export async function tick(now: Date, jobsToRun: readonly SchedulerJob[] = jobs): Promise<void> {
  for (const job of jobsToRun) {
    try {
      await job.run(now)
    } catch (error) {
      console.error(`[scheduler] job "${job.name}" failed:`, error)
    }
  }
}
