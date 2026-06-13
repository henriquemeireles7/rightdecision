import { randomUUID } from 'node:crypto'
import { and, eq, inArray } from 'drizzle-orm'
import { db } from '@/platform/db/client'
import { clips, pipelineRuns, posts } from '@/platform/db/schema'
import type { ErrorCode } from '@/platform/errors'
import { ProviderError } from '@/providers/errors'
import { getUploadUrl } from '@/providers/storage'

type ServiceError = { error: ErrorCode; details?: string }

type Run = typeof pipelineRuns.$inferSelect
type Clip = typeof clips.$inferSelect
type Post = typeof posts.$inferSelect

const SUPPORTED_EXTENSIONS = ['mp4', 'webm', 'wav', 'mp3', 'ogg', 'm4a']

/**
 * Keep only characters the transcribe service's validator accepts (alphanumerics + `._-`),
 * so the generated R2 key (`pipeline/<uuid>/<name>`) ingests cleanly. Never let a client-
 * controlled filename shape the path.
 */
function sanitizeFileName(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() ?? ''
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/^\.+/, '')
  return cleaned.length > 0 ? cleaned : 'video'
}

function extensionOf(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() ?? ''
}

/**
 * Presigned PUT for direct-to-R2 video ingest. Returns the storage KEY (not a public URL) —
 * the same key is then handed to POST /api/pipeline-runs as `videoUrl` to start the run.
 */
export async function requestVideoUploadUrl(input: {
  fileName: string
  mimeType: string
}): Promise<{ uploadUrl: string; fileKey: string } | ServiceError> {
  if (!SUPPORTED_EXTENSIONS.includes(extensionOf(input.fileName))) {
    return {
      error: 'TRANSCRIBE_INVALID_FORMAT',
      details: `Unsupported video format. Use one of: ${SUPPORTED_EXTENSIONS.join(', ')}.`,
    }
  }
  const fileKey = `pipeline/${randomUUID()}/${sanitizeFileName(input.fileName)}`
  try {
    const uploadUrl = await getUploadUrl(fileKey, input.mimeType)
    return { uploadUrl, fileKey }
  } catch (error) {
    if (error instanceof ProviderError) {
      return { error: 'INTERNAL_ERROR', details: `Upload URL presign failed: ${error.message}` }
    }
    throw error
  }
}

/**
 * Aggregated run detail: the run row + its clips + the posts for those clips. The existing
 * GET /api/pipeline-runs/:id returns only the run row (and truncates the transcript), and
 * there is NO existing endpoint that lists posts per run — the dashboard needs all three in
 * one read.
 */
export async function getRunDetail(
  runId: string,
): Promise<{ run: Run; clips: Clip[]; posts: Post[] } | ServiceError> {
  const run = await db.query.pipelineRuns.findFirst({ where: eq(pipelineRuns.id, runId) })
  if (!run) return { error: 'NOT_FOUND' }

  const runClips = await db
    .select()
    .from(clips)
    .where(eq(clips.pipelineRunId, runId))
    .orderBy(clips.sourceTimestampStart)

  const clipIds = runClips.map((c) => c.id)
  const runPosts = clipIds.length
    ? await db.select().from(posts).where(inArray(posts.clipId, clipIds))
    : []

  return { run, clips: runClips, posts: runPosts }
}

/**
 * The APPROVAL-GATE setter — the only production writer of `clips.approved`. A clip is
 * distributable ONLY once this flips it to true (clip-cut + post-distribute enforce that
 * downstream). Scoped to (runId, clipId) so a clip can't be approved against the wrong run.
 */
export async function setClipApproval(
  runId: string,
  clipId: string,
  approved: boolean,
): Promise<{ clip: Clip } | ServiceError> {
  const [updated] = await db
    .update(clips)
    .set({ approved, updatedAt: new Date() })
    .where(and(eq(clips.id, clipId), eq(clips.pipelineRunId, runId)))
    .returning()
  if (!updated) return { error: 'POST_CLIP_NOT_FOUND' }
  return { clip: updated }
}
