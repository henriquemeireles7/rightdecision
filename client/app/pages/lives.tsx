/// <reference lib="dom" />
/**
 * ONE Lives section (ADR 3) — list with derived states: upcoming (static per-minute
 * countdown + calendar link), live-now (unlisted YouTube embed), replay-ready (plays
 * via Stream like a lesson), cancelled (quiet notice, never a silent skip).
 */
import { useEffect, useState } from 'preact/hooks'
import { EmptyState, ErrorState, Skeleton } from '../components/states'
import { fetchLives, type LiveItem } from '../lib/data'
import { calendarUrl, formatCountdown, formatScheduled, youtubeEmbedUrl } from '../lib/format'
import { useQuery } from '../lib/use-query'
import { Link } from '../router'

/** Re-renders once a minute — countdown text stays static between ticks (no animation). */
function useMinuteNow(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(interval)
  }, [])
  return now
}

function LivesSkeleton() {
  return (
    <div class="space-y-4" role="presentation">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} class="h-36 w-full" />
      ))}
    </div>
  )
}

function LiveCard({ live, now }: { live: LiveItem; now: Date }) {
  const embed = live.state === 'live-now' ? youtubeEmbedUrl(live.youtubeUrl) : null
  return (
    <article
      aria-label={live.title}
      class="rounded-lg border border-linen bg-surface-white p-5 motion-safe:transition-colors"
    >
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="font-display text-2xl text-ink">{live.title}</h2>
        {live.state === 'live-now' ? (
          <span class="rounded-full bg-gold px-3 py-1 text-sm font-medium text-ink">Live now</span>
        ) : null}
      </div>
      <p class="mt-1 text-sm text-muted">{formatScheduled(live.scheduledAt)}</p>
      {live.description ? <p class="mt-3 text-body">{live.description}</p> : null}

      {live.state === 'upcoming' ? (
        <div class="mt-4 flex flex-wrap items-center gap-4">
          <p class="font-medium text-ink">{formatCountdown(new Date(live.scheduledAt), now)}</p>
          <a
            href={calendarUrl(live.title, live.scheduledAt, live.description ?? undefined)}
            target="_blank"
            rel="noreferrer"
            class="min-h-11 rounded-sm border border-linen bg-sand px-4 py-2 font-medium text-ink motion-safe:transition-colors hover:border-gold"
          >
            Add to calendar
          </a>
        </div>
      ) : null}

      {live.state === 'live-now' ? (
        embed ? (
          <iframe
            src={embed}
            title={live.title}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            class="mt-4 aspect-video w-full rounded-md border border-linen"
          />
        ) : (
          <p class="mt-4 text-body">
            We're live, but the stream link isn't available here. Refresh in a moment.
          </p>
        )
      ) : null}

      {live.state === 'replay-ready' ? (
        <Link
          href={`/app/lives/${live.id}`}
          class="mt-4 inline-block min-h-11 rounded-sm bg-gold px-6 py-2.5 font-medium text-ink motion-safe:transition-colors hover:bg-gold-hover"
        >
          Watch the replay
        </Link>
      ) : null}

      {live.state === 'cancelled' ? (
        <p class="mt-4 text-muted">This session was cancelled. We'll see you at the next one.</p>
      ) : null}
    </article>
  )
}

export function LivesPage() {
  const { state, retry } = useQuery(fetchLives, [])
  const now = useMinuteNow()

  return (
    <div class="mx-auto max-w-[800px] px-4 py-8">
      <h1 class="font-display text-3xl text-ink">Lives</h1>
      <div class="mt-6">
        {state.status === 'loading' ? (
          <LivesSkeleton />
        ) : state.status === 'error' ? (
          <ErrorState
            what="We couldn't load your live sessions"
            error={state.error}
            onRetry={retry}
          />
        ) : state.data.lives.length === 0 ? (
          <EmptyState
            title="No live sessions yet"
            body="When your next live is scheduled it will appear here, with a calendar link so you never miss it."
            action={
              <Link href="/app" class="font-medium text-gold-hover underline underline-offset-2">
                Back to your library
              </Link>
            }
          />
        ) : (
          <ul class="space-y-4">
            {state.data.lives.map((live) => (
              <li key={live.id}>
                <LiveCard live={live} now={now} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
