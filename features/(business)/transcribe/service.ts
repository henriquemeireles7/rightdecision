import { randomUUID } from 'node:crypto'
import { unlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { count, desc, eq } from 'drizzle-orm'
import {
  failPipeline,
  findRunInState,
  transitionPipeline,
} from '@/features/(business)/workflow/transitions'
import { db } from '@/platform/db/client'
import { clips, pipelineRuns } from '@/platform/db/schema'
import { track } from '@/providers/analytics'
import { ProviderError } from '@/providers/errors'
import { download } from '@/providers/storage'
import { transcribe as whisperTranscribe } from '@/providers/transcription'

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

  // Reject path traversal and non-alphanumeric keys
  if (videoUrl.includes('..') || videoUrl.startsWith('/') || /[^a-zA-Z0-9._\-/]/.test(videoUrl)) {
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
  const found = await findRunInState(runId, 'queued')
  if ('error' in found) return found
  const { run } = found

  if (!(await transitionPipeline(runId, run.status, 'transcribing', { startedAt: new Date() }))) {
    return { error: 'PIPELINE_INVALID_STATE' as const }
  }

  // Fire-and-forget background processing
  transcribeInBackground(runId, run.inputVideoUrl).catch((err) =>
    failPipeline(runId, 'transcribe', String(err)),
  )

  return { run: { id: runId, status: 'transcribing' as const } }
}

async function transcribeInBackground(runId: string, inputVideoUrl: string): Promise<void> {
  const tempPath = join(tmpdir(), `transcribe-${randomUUID()}.${getExtension(inputVideoUrl)}`)

  try {
    const key = inputVideoUrl
    let videoData: Buffer
    try {
      videoData = await download(key)
    } catch (error) {
      if (error instanceof ProviderError && error.statusCode === 404) {
        await failPipeline(runId, 'transcribe', 'Video not found in storage')
        return
      }
      throw error
    }

    track('content_uploaded', { type: 'video', size: videoData.length })
    await writeFile(tempPath, videoData)

    const transcript = await whisperTranscribe(tempPath)

    // Save transcript via transitionPipeline (records step timing)
    await transitionPipeline(runId, 'transcribing', 'transcribed', { transcript })
  } finally {
    try {
      await unlink(tempPath)
    } catch {
      /* ignore cleanup errors */
    }
  }
}

export async function getPipelineRun(runId: string) {
  const run = await db.query.pipelineRuns.findFirst({
    where: eq(pipelineRuns.id, runId),
  })
  if (!run) return { error: 'NOT_FOUND' as const }
  return {
    run: {
      ...run,
      transcript: run.transcript ? run.transcript.slice(0, 500) : null,
    },
  }
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
