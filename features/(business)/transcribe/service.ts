import { eq, desc, count } from 'drizzle-orm'
import { db } from '@/platform/db/client'
import { pipelineRuns, clips } from '@/platform/db/schema'
import { assertTransition } from '@/features/(business)/workflow/state-machine'
import { transcribe as whisperTranscribe } from '@/providers/transcription'
import { download } from '@/providers/storage'
import { ProviderError } from '@/providers/errors'
import { writeFile, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { randomUUID } from 'node:crypto'

const SUPPORTED_FORMATS = ['mp4', 'webm', 'wav', 'mp3', 'ogg', 'm4a']

function getExtension(url: string): string {
  const path = url.split('?')[0] ?? url
  const ext = path.split('.').pop()?.toLowerCase() ?? ''
  return ext
}

export async function startTranscription(videoUrl: string, config?: Record<string, unknown>) {
  const ext = getExtension(videoUrl)
  if (!SUPPORTED_FORMATS.includes(ext)) {
    return { error: 'TRANSCRIBE_INVALID_FORMAT' as const }
  }

  const [run] = await db
    .insert(pipelineRuns)
    .values({
      inputVideoUrl: videoUrl,
      status: 'queued',
      config: config ?? {},
    })
    .returning()

  return { run: run! }
}

export async function processTranscription(runId: string) {
  const run = await db.query.pipelineRuns.findFirst({
    where: eq(pipelineRuns.id, runId),
  })

  if (!run) return { error: 'NOT_FOUND' as const }

  // Transition: queued → transcribing
  assertTransition(run.status, 'transcribing')
  await db
    .update(pipelineRuns)
    .set({ status: 'transcribing', startedAt: new Date() })
    .where(eq(pipelineRuns.id, runId))

  // Download video to temp file
  const tempPath = join(tmpdir(), `transcribe-${randomUUID()}.${getExtension(run.inputVideoUrl)}`)

  try {
    // inputVideoUrl is the R2 object key (e.g., "episodes/video.mp4")
    const key = run.inputVideoUrl
    let videoData: Buffer
    try {
      videoData = await download(key)
    } catch (error) {
      if (error instanceof ProviderError && error.statusCode === 404) {
        await db
          .update(pipelineRuns)
          .set({ status: 'failed', stepFailedAt: 'transcribe', errorMessage: 'Video not found in storage' })
          .where(eq(pipelineRuns.id, runId))
        return { error: 'TRANSCRIBE_VIDEO_NOT_FOUND' as const }
      }
      throw error
    }

    await writeFile(tempPath, videoData)

    // Run Whisper
    let transcript: string
    try {
      transcript = await whisperTranscribe(tempPath)
    } catch (error) {
      if (error instanceof ProviderError) {
        const errorCode = error.statusCode === 504 ? 'TRANSCRIBE_TIMEOUT' : error.statusCode === 422 ? 'TRANSCRIBE_EMPTY_RESULT' : 'TRANSCRIBE_PROCESSING_FAILED'
        await db
          .update(pipelineRuns)
          .set({ status: 'failed', stepFailedAt: 'transcribe', errorMessage: String(error.rawResponse) })
          .where(eq(pipelineRuns.id, runId))
        return { error: errorCode as 'TRANSCRIBE_TIMEOUT' | 'TRANSCRIBE_EMPTY_RESULT' | 'TRANSCRIBE_PROCESSING_FAILED' }
      }
      throw error
    }

    // Save transcript
    await db
      .update(pipelineRuns)
      .set({ status: 'transcribed', transcript })
      .where(eq(pipelineRuns.id, runId))

    const updated = await db.query.pipelineRuns.findFirst({
      where: eq(pipelineRuns.id, runId),
    })

    return { run: updated! }
  } finally {
    // Always clean up temp file
    try { await unlink(tempPath) } catch { /* ignore */ }
  }
}

export async function getPipelineRun(runId: string) {
  const run = await db.query.pipelineRuns.findFirst({
    where: eq(pipelineRuns.id, runId),
  })
  if (!run) return { error: 'NOT_FOUND' as const }
  return { run }
}

export async function listPipelineRuns(page = 1, perPage = 20) {
  const offset = (page - 1) * perPage

  const [totalResult] = await db.select({ count: count() }).from(pipelineRuns)
  const total = totalResult?.count ?? 0

  const runs = await db.query.pipelineRuns.findMany({
    orderBy: desc(pipelineRuns.createdAt),
    limit: perPage,
    offset,
  })

  return { runs, total, page, perPage }
}

export async function getClipsForRun(runId: string) {
  const run = await db.query.pipelineRuns.findFirst({
    where: eq(pipelineRuns.id, runId),
  })
  if (!run) return { error: 'NOT_FOUND' as const }

  const runClips = await db.query.clips.findMany({
    where: eq(clips.pipelineRunId, runId),
    orderBy: (c, { asc }) => [asc(c.sourceTimestampStart)],
  })

  return { clips: runClips }
}
