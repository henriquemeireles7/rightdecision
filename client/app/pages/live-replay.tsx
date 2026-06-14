/// <reference lib="dom" />
/**
 * Live replay — gated Stream playback in the same ink canvas as lessons (ADR 3/19).
 * VIDEO_NOT_READY (processing/cancelled/missing replay) renders the processing state.
 */
import { ApiError } from '@/features/(shared)/api-client'
import { PlayerCanvas, ProcessingCanvas } from '../components/player-canvas'
import { ErrorState } from '../components/states'
import { getAppConfig } from '../config'
import { fetchLiveReplay } from '../lib/data'
import { hlsManifestUrl, streamPosterUrl } from '../lib/media'
import { useQuery } from '../lib/use-query'
import { Link } from '../router'

export function LiveReplayPage({ liveId }: { liveId: string }) {
  const { state, retry } = useQuery(() => fetchLiveReplay(liveId), [liveId])
  const customerCode = getAppConfig().streamCustomerCode

  if (state.status === 'loading') {
    return (
      <div class="w-full bg-ink">
        <div class="mx-auto max-w-[1000px] md:px-6 md:py-6">
          <div class="aspect-video w-full" aria-label="Loading replay" role="status" />
        </div>
      </div>
    )
  }

  if (state.status === 'error') {
    if (state.error instanceof ApiError && state.error.code === 'VIDEO_NOT_READY') {
      return (
        <div>
          <ProcessingCanvas message="The replay is still processing. It's usually ready within a day of the live." />
          <div class="mx-auto max-w-[640px] px-4 py-10">
            <Link
              href="/app/lives"
              class="font-medium text-gold-hover underline underline-offset-2"
            >
              Back to Lives
            </Link>
          </div>
        </div>
      )
    }
    return (
      <div class="px-4 py-16">
        <ErrorState what="We couldn't load this replay" error={state.error} onRetry={retry} />
      </div>
    )
  }

  if (!customerCode) {
    return (
      <ProcessingCanvas message="Playback isn't configured yet. We're on it — try again soon." />
    )
  }

  return (
    <div>
      <PlayerCanvas
        src={hlsManifestUrl(customerCode, state.data.playbackToken)}
        poster={streamPosterUrl(customerCode, state.data.playbackToken)}
      />
      <div class="mx-auto max-w-[640px] px-4 py-10">
        <Link href="/app/lives" class="font-medium text-gold-hover underline underline-offset-2">
          Back to Lives
        </Link>
      </div>
    </div>
  )
}
