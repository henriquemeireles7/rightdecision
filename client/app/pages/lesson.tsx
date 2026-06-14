/// <reference lib="dom" />
/**
 * Lesson page — ink canvas player (ADR 19) with signed Stream playback, captions
 * toggle, heartbeat batching to /api/watch-events, and the inline decision prompt
 * below on cream (unlocks at video end). VIDEO_NOT_READY renders the processing
 * state; warm chrome stays everywhere outside the canvas.
 */
import { useEffect, useMemo, useState } from 'preact/hooks'
import { ApiError } from '@/features/(shared)/api-client'
import { DecisionPrompt } from '../components/decision-prompt'
import { PlayerCanvas, ProcessingCanvas } from '../components/player-canvas'
import { ErrorState, Skeleton } from '../components/states'
import { getAppConfig } from '../config'
import { fetchLesson } from '../lib/data'
import { formatDuration } from '../lib/format'
import { createHeartbeatBatcher } from '../lib/heartbeats'
import { hlsManifestUrl, streamCaptionsUrl, streamPosterUrl } from '../lib/media'
import { useQuery } from '../lib/use-query'
import { Link } from '../router'

function LessonSkeleton() {
  return (
    <div>
      <div class="w-full bg-ink">
        <div class="mx-auto max-w-[1000px] md:px-6 md:py-6">
          <div class="aspect-video w-full" aria-label="Loading lesson" role="status" />
        </div>
      </div>
      <div class="mx-auto max-w-[640px] space-y-3 px-4 py-10">
        <Skeleton class="h-8 w-2/3" />
        <Skeleton class="h-5 w-full" />
        <Skeleton class="h-5 w-1/2" />
      </div>
    </div>
  )
}

export function LessonPage({ lessonId }: { lessonId: string }) {
  const { state, retry } = useQuery(() => fetchLesson(lessonId), [lessonId])
  const [ended, setEnded] = useState(false)
  const batcher = useMemo(
    () => createHeartbeatBatcher(),
    // a new buffer per lesson — heartbeats must never leak across lessons
    [lessonId],
  )

  const ready = state.status === 'ready'
  useEffect(() => {
    if (!ready) return
    batcher.start()
    return () => batcher.stop()
  }, [ready, batcher])

  if (state.status === 'loading') return <LessonSkeleton />

  if (state.status === 'error') {
    if (state.error instanceof ApiError && state.error.code === 'VIDEO_NOT_READY') {
      return (
        <div>
          <ProcessingCanvas message="This video is still processing. It usually takes a few minutes — check back shortly." />
          <div class="mx-auto max-w-[640px] px-4 py-10">
            <Link href="/app" class="font-medium text-gold-hover underline underline-offset-2">
              Back to your library
            </Link>
          </div>
        </div>
      )
    }
    return (
      <div class="px-4 py-16">
        <ErrorState what="We couldn't load this lesson" error={state.error} onRetry={retry} />
      </div>
    )
  }

  const { lesson, playbackToken } = state.data
  const customerCode = getAppConfig().streamCustomerCode

  return (
    <div>
      {customerCode ? (
        <PlayerCanvas
          src={hlsManifestUrl(customerCode, playbackToken)}
          poster={streamPosterUrl(customerCode, playbackToken)}
          captionsSrc={lesson.captionsReady ? streamCaptionsUrl(customerCode, playbackToken) : null}
          onEnded={() => setEnded(true)}
          onTimeUpdate={(seconds) => batcher.record(lessonId, Math.floor(seconds))}
        />
      ) : (
        <ProcessingCanvas message="Playback isn't configured yet. We're on it — try again soon." />
      )}

      <div class="mx-auto max-w-[640px] px-4 pt-10">
        <h1 class="font-display text-3xl text-ink">{lesson.title}</h1>
        <p class="mt-1 text-sm text-muted">{formatDuration(lesson.durationSeconds)}</p>
        {lesson.description ? <p class="mt-4 text-body">{lesson.description}</p> : null}
      </div>

      {lesson.decisionPrompt ? (
        <DecisionPrompt
          lessonId={lessonId}
          prompt={lesson.decisionPrompt}
          enabled={ended || Boolean(state.data.progress?.completedAt)}
          initialAnswer={state.data.promptAnswer}
          initialCompletedAt={state.data.progress?.completedAt ?? null}
        />
      ) : null}
    </div>
  )
}
