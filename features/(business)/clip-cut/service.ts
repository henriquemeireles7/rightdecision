import { eq, and } from 'drizzle-orm'
import { db } from '@/platform/db/client'
import { pipelineRuns, clips } from '@/platform/db/schema'
import { assertTransition } from '@/features/(business)/workflow/state-machine'
import { download, upload } from '@/providers/storage'
import { ProviderError } from '@/providers/errors'
import { writeFile, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { randomUUID } from 'node:crypto'

async function cutClipWithFfmpeg(videoPath: string, outputPath: string, start: number, duration: number): Promise<void> {
  const proc = Bun.spawn(
    ['ffmpeg', '-y', '-i', videoPath, '-ss', String(start), '-t', String(duration), '-c', 'copy', outputPath],
    { stdout: 'pipe', stderr: 'pipe' },
  )
  const exitCode = await proc.exited
  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text()
    throw new Error(`ffmpeg failed (exit ${exitCode}): ${stderr}`)
  }
}

export async function cutClipsForRun(pipelineRunId: string) {
  const run = await db.query.pipelineRuns.findFirst({
    where: eq(pipelineRuns.id, pipelineRunId),
  })

  if (!run) return { error: 'NOT_FOUND' as const }

  if (run.status !== 'selected' && run.status !== 'awaiting_clip_approval' && run.status !== 'cutting') {
    return { error: 'CLIP_SELECT_INVALID_STATE' as const }
  }

  // Get approved clips (or all if auto-approve)
  const clipList = await db.query.clips.findMany({
    where: and(eq(clips.pipelineRunId, pipelineRunId), eq(clips.approved, true)),
  })

  if (clipList.length === 0) {
    return { error: 'CLIP_CUT_NO_APPROVED_CLIPS' as const }
  }

  // Transition to cutting
  assertTransition(run.status, 'cutting')
  await db.update(pipelineRuns).set({ status: 'cutting' }).where(eq(pipelineRuns.id, pipelineRunId))

  // Download source video
  const key = new URL(run.inputVideoUrl).pathname.slice(1)
  const ext = run.inputVideoUrl.split('.').pop()?.split('?')[0] ?? 'mp4'
  const tempVideoPath = join(tmpdir(), `source-${randomUUID()}.${ext}`)

  let videoData: Buffer
  try {
    videoData = await download(key)
  } catch (error) {
    if (error instanceof ProviderError && error.statusCode === 404) {
      await db.update(pipelineRuns).set({ status: 'failed', stepFailedAt: 'clip-cut', errorMessage: 'Source video not found' }).where(eq(pipelineRuns.id, pipelineRunId))
      return { error: 'CLIP_CUT_VIDEO_NOT_FOUND' as const }
    }
    throw error
  }

  await writeFile(tempVideoPath, videoData)

  const results: Array<{ clipId: string; success: boolean; error?: string }> = []
  const tempFiles: string[] = [tempVideoPath]

  try {
    for (const clip of clipList) {
      const outputPath = join(tmpdir(), `clip-${clip.id}.${ext}`)
      tempFiles.push(outputPath)

      try {
        await cutClipWithFfmpeg(tempVideoPath, outputPath, clip.sourceTimestampStart, clip.duration)

        const clipFile = await Bun.file(outputPath).arrayBuffer()
        const storageKey = `clips/${pipelineRunId}/${clip.id}.${ext}`
        const storageUrl = await upload(storageKey, Buffer.from(clipFile), `video/${ext}`)

        await db.update(clips).set({ cutStatus: 'cut', storageUrl }).where(eq(clips.id, clip.id))
        results.push({ clipId: clip.id, success: true })
      } catch (error) {
        await db.update(clips).set({ cutStatus: 'failed' }).where(eq(clips.id, clip.id))
        results.push({ clipId: clip.id, success: false, error: String(error) })
      }
    }

    const successCount = results.filter((r) => r.success).length
    const failCount = results.filter((r) => !r.success).length

    await db.update(pipelineRuns).set({
      status: 'cut',
      clipsApproved: clipList.length,
      clipsFailed: failCount,
    }).where(eq(pipelineRuns.id, pipelineRunId))

    if (failCount > 0 && successCount > 0) {
      return { clips: results, partial: true }
    }
    if (failCount === clipList.length) {
      await db.update(pipelineRuns).set({ status: 'failed', stepFailedAt: 'clip-cut', errorMessage: 'All clips failed to cut' }).where(eq(pipelineRuns.id, pipelineRunId))
      return { error: 'CLIP_CUT_PROCESSING_FAILED' as const }
    }

    return { clips: results }
  } finally {
    for (const f of tempFiles) {
      try { await unlink(f) } catch { /* ignore */ }
    }
  }
}
