/// <reference lib="dom" />
/**
 * Playbook contents — the book's spine (ADR 20): serif book title, chapters with
 * page links and QUIET filled-of-total numerals (no bars, no percentages, no
 * gamification), the privacy reassurance line, and Export / Print (print-ready
 * HTML in a new tab, browser print-to-PDF).
 */
import { EmptyState, ErrorState, Skeleton } from '../components/states'
import { fetchPlaybook, type PlaybookDocument, playbookExportUrl } from '../lib/data'
import { useQuery } from '../lib/use-query'
import { Link } from '../router'

function SpineSkeleton() {
  return (
    <div class="space-y-6" role="presentation">
      <Skeleton class="h-9 w-64" />
      {[0, 1, 2].map((i) => (
        <div key={i} class="space-y-2">
          <Skeleton class="h-6 w-44" />
          <Skeleton class="h-12 w-full" />
          <Skeleton class="h-12 w-full" />
        </div>
      ))}
    </div>
  )
}

function Book({ doc }: { doc: PlaybookDocument }) {
  return (
    <section class="rounded-lg border border-linen bg-surface-white p-6 md:p-8">
      <div class="flex flex-wrap items-baseline justify-between gap-3">
        <h2 class="font-display text-3xl text-ink">{doc.title}</h2>
        <a
          href={playbookExportUrl(doc.templateId)}
          target="_blank"
          rel="noopener"
          class="min-h-11 rounded-sm border border-linen px-4 py-2 text-sm font-medium text-body motion-safe:transition-colors hover:border-gold hover:text-ink"
        >
          Export / Print
        </a>
      </div>
      <nav aria-label={`${doc.title} contents`} class="mt-6 space-y-6">
        {doc.progress.chapters.map((chapter) => (
          <div key={chapter.id}>
            <h3 class="font-display text-xl text-ink">{chapter.title}</h3>
            <ul class="mt-2 divide-y divide-linen border-t border-b border-linen">
              {chapter.pages.map((page) => (
                <li key={page.id}>
                  <Link
                    href={`/app/playbook/${doc.templateId}/${page.id}`}
                    class="flex min-h-11 items-center justify-between gap-4 px-1 py-3 text-body motion-safe:transition-colors hover:text-ink"
                  >
                    <span>{page.title}</span>
                    <span class="text-sm text-muted tabular-nums">
                      {page.filled} of {page.total}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </section>
  )
}

export function PlaybookPage() {
  const { state, retry } = useQuery(fetchPlaybook, [])

  return (
    <div class="mx-auto max-w-[var(--max-content)] px-4 py-8">
      <h1 class="font-display text-3xl text-ink">Playbook</h1>
      <p class="mt-1 text-sm text-muted">Only you and your AI see this.</p>
      <div class="mt-6 space-y-8">
        {state.status === 'loading' ? (
          <SpineSkeleton />
        ) : state.status === 'error' ? (
          <ErrorState what="We couldn't open your playbook" error={state.error} onRetry={retry} />
        ) : state.data.documents.length === 0 ? (
          <EmptyState
            title="Your playbook is on its way"
            body="Your playbook opens with your program. Once it does, every page will be waiting for your words."
            action={
              <Link
                href="/app"
                class="min-h-11 rounded-sm bg-gold px-6 py-2.5 font-medium text-ink motion-safe:transition-colors hover:bg-gold-hover"
              >
                Back to Home
              </Link>
            }
          />
        ) : (
          state.data.documents.map((doc) => <Book key={doc.templateId} doc={doc} />)
        )}
      </div>
    </div>
  )
}
