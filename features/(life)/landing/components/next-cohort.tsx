interface NextCohortNoticeProps {
  startsAt: Date
  timezone: string
}

/**
 * "Next free cohort starts {date}" slot (P4) — rendered only when the landing route
 * passes a date (V2_ENROLLMENT_CUTOVER on). Pure SSR like the rest of the landing:
 * the <time datetime> carries the raw instant so any future client code can localize
 * via Intl; the visible text is a server-side fallback in the cohort timezone.
 * Static text by design — no countdown, no motion (reduced-motion rule).
 */
export function NextCohortNotice({ startsAt, timezone }: NextCohortNoticeProps) {
  const formatted = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    timeZone: timezone,
  }).format(startsAt)

  return (
    <section class="bg-cream pb-[48px]">
      <div class="max-w-[800px] mx-auto px-4 text-center">
        <p class="text-sm text-muted">
          Next free cohort starts{' '}
          <time datetime={startsAt.toISOString()} class="text-ink font-semibold">
            {formatted}
          </time>
          . One decision. You bring it, we break it down.
        </p>
      </div>
    </section>
  )
}
