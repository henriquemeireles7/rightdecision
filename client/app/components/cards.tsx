/// <reference lib="dom" />
/**
 * Poster cards (2:3, 1px linen border, title BELOW the card in Instrument Serif ink —
 * never overlaid) and 16:9 continue-watching cards. Locked cards keep their full-color
 * cover and carry the ink-on-cream pill badge — never grayscale or blur (Lock-State UX).
 * Hover = gold border + subtle shadow. No zoom, no expand.
 */
import { progressPercent } from '../lib/format'
import { coverUrl } from '../lib/media'
import { Link } from '../router'

/** Ink-on-cream pill — the lock marker. Text on cream is ink (never on gold here). */
export function PillBadge({ label }: { label: string }) {
  return (
    <span class="rounded-full border border-linen bg-cream px-3 py-1 text-xs font-medium text-ink">
      {label}
    </span>
  )
}

type CoverProps = { imageKey: string | null | undefined; title: string; aspect: string }

/** Cover image with a warm placeholder fallback — light covers get a linen edge. */
function Cover({ imageKey, title, aspect }: CoverProps) {
  const url = coverUrl(imageKey)
  return (
    <div class={`${aspect} w-full overflow-hidden rounded-md border border-linen bg-sand`}>
      {url ? (
        <img src={url} alt="" loading="lazy" class="h-full w-full object-cover" />
      ) : (
        <div aria-hidden="true" class="flex h-full w-full items-center justify-center">
          <span class="font-display text-3xl text-linen">{title.charAt(0)}</span>
        </div>
      )}
    </div>
  )
}

type PosterCardProps = {
  title: string
  coverImageKey: string | null | undefined
  badge?: string
  meta?: string
  onOpen: () => void
}

/** 2:3 poster card as a button (sheet opener). 44px+ target, gold hover border. */
export function PosterCard({ title, coverImageKey, badge, meta, onOpen }: PosterCardProps) {
  return (
    <button type="button" onClick={onOpen} class="group block w-36 text-left md:w-44">
      <div class="relative rounded-md motion-safe:transition-shadow group-hover:shadow-md [&>div]:group-hover:border-gold">
        <Cover imageKey={coverImageKey} title={title} aspect="aspect-[2/3]" />
        {badge ? (
          <span class="absolute left-2 top-2">
            <PillBadge label={badge} />
          </span>
        ) : null}
      </div>
      <span class="mt-2 block font-display text-lg leading-tight text-ink">{title}</span>
      {meta ? <span class="mt-1 block text-sm text-muted">{meta}</span> : null}
    </button>
  )
}

type ContinueCardProps = {
  title: string
  thumbnailKey: string | null
  secondsWatched: number
  durationSeconds: number | null
  href: string
}

/** 16:9 continue-watching card with a gold resume bar. */
export function ContinueCard({
  title,
  thumbnailKey,
  secondsWatched,
  durationSeconds,
  href,
}: ContinueCardProps) {
  const percent = progressPercent(secondsWatched, durationSeconds)
  return (
    <Link href={href} class="group block w-60 md:w-72">
      <div class="relative rounded-md motion-safe:transition-shadow group-hover:shadow-md [&>div]:group-hover:border-gold">
        <Cover imageKey={thumbnailKey} title={title} aspect="aspect-video" />
        {percent > 0 ? (
          <div class="absolute inset-x-2 bottom-2 h-1 overflow-hidden rounded-full bg-cream/80">
            <div class="h-full bg-gold" style={{ width: `${percent}%` }} />
          </div>
        ) : null}
      </div>
      <span class="mt-2 block font-display text-lg leading-tight text-ink">{title}</span>
      <span class="mt-1 block text-sm text-muted">Resume watching</span>
    </Link>
  )
}
