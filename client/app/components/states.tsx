/**
 * The three non-success states every screen ships (Design Requirement 1):
 * skeletons (sand/linen, PINNED aspect ratios — zero CLS), warm empty states with a
 * primary action, and what/why/how error states with retry. Never humor in errors.
 */
import type { ComponentChildren } from 'preact'
import type { ApiError } from '@/features/(shared)/api-client'

type SkeletonProps = { class?: string; label?: string }

/** Sand block placeholder — pass a pinned aspect/size class to prevent CLS. */
export function Skeleton({ class: className = '', label }: SkeletonProps) {
  const classes = `rounded-md bg-sand motion-safe:animate-pulse ${className}`
  if (label) return <div role="status" aria-label={label} class={classes} />
  return <div aria-hidden="true" class={classes} />
}

/** A rail of poster-shaped skeletons under a heading-shaped bar. */
export function RailSkeleton({ cards = 4, aspect = 'aspect-[2/3]' }) {
  return (
    <div class="space-y-3" role="presentation">
      <Skeleton class="h-7 w-48" />
      <div class="flex gap-4 overflow-hidden">
        {Array.from({ length: cards }, (_, i) => (
          <div key={i} class="w-36 shrink-0 space-y-2 md:w-44">
            <Skeleton class={aspect} />
            <Skeleton class="h-5 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )
}

type EmptyStateProps = {
  title: string
  body: string
  action?: ComponentChildren
}

/** Warm empty state — what the member CAN do, never a dead end. */
export function EmptyState({ title, body, action }: EmptyStateProps) {
  return (
    <div class="mx-auto max-w-[480px] rounded-lg border border-linen bg-sand px-6 py-12 text-center">
      <h2 class="font-display text-2xl text-ink">{title}</h2>
      <p class="mt-2 text-body">{body}</p>
      {action ? <div class="mt-6 flex justify-center">{action}</div> : null}
    </div>
  )
}

type ErrorStateProps = {
  /** What happened, in plain words. */
  what: string
  error?: ApiError
  onRetry?: () => void
}

const whyFor = (error?: ApiError): string => {
  if (!error || error.status === 0) return 'Your connection may have dropped for a moment.'
  if (error.status >= 500) return 'Something went wrong on our side — not yours.'
  if (error.code === 'ENROLLMENT_REQUIRED')
    return 'This content belongs to a program you have not joined yet.'
  return 'The request could not be completed.'
}

/** Three-part error: what happened → why → how to fix. Terracotta, no humor. */
export function ErrorState({ what, error, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      class="mx-auto max-w-[480px] rounded-lg border border-error/40 bg-sand px-6 py-10 text-center"
    >
      <h2 class="font-display text-xl text-error">{what}</h2>
      <p class="mt-2 text-body">{whyFor(error)}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          class="mt-6 min-h-11 rounded-sm bg-gold px-6 py-2 font-medium text-ink motion-safe:transition-colors hover:bg-gold-hover"
        >
          Try again
        </button>
      ) : (
        <p class="mt-4 text-sm text-muted">Refresh the page to try again.</p>
      )}
    </div>
  )
}
