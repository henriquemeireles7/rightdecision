/// <reference lib="dom" />
/**
 * One playbook page (ADR 20): ONE scrollable screen-length section in the 640px
 * reading column — serif page heading, instruction prose leading, fields with
 * autosave, and book navigation (previous/next page + back to contents). The
 * book feeling comes from typography and structure; there is no page-flip.
 */
import { useState } from 'preact/hooks'
import { InterviewPanel } from '../components/interview-panel'
import { PlaybookField } from '../components/playbook-field'
import { ErrorState, Skeleton } from '../components/states'
import type { Scheduler } from '../lib/autosave'
import { fetchPlaybook, fetchPlaybookPage, savePlaybookAnswer } from '../lib/data'
import { useQuery } from '../lib/use-query'
import { Link } from '../router'

type Props = {
  templateId: string
  pageId: string
  /** Injection for TESTS ONLY — production debounces on window timers. */
  scheduler?: Scheduler
}

function PageSkeleton() {
  return (
    <div class="space-y-6" role="presentation">
      <Skeleton class="h-5 w-32" />
      <Skeleton class="h-9 w-64" />
      <Skeleton class="h-20 w-full" />
      <Skeleton class="h-28 w-full" />
      <Skeleton class="h-28 w-full" />
    </div>
  )
}

type SpineEntry = { id: string; title: string }

/** The book's page order, flattened from the contents spine. */
function flattenSpine(
  playbook: Awaited<ReturnType<typeof fetchPlaybook>>,
  templateId: string,
): SpineEntry[] {
  const doc = playbook.documents.find((d) => d.templateId === templateId)
  if (!doc) return []
  return doc.progress.chapters.flatMap((chapter) =>
    chapter.pages.map((page) => ({ id: page.id, title: page.title })),
  )
}

type ReadyData = Awaited<ReturnType<typeof fetchPlaybookPage>>

/**
 * The interview is an ALTERNATIVE path to the same fields as the typed form (ADR 11). Only
 * fields the interview can distill into are offered — select/scale/date kinds answer better by
 * tapping, so the entry covers the free-text kinds (the ones a spoken answer fits).
 */
function interviewableFields(page: ReadyData) {
  return page.page.fields
    .filter((f) => f.kind === 'short_text' || f.kind === 'long_text')
    .map((f) => ({ id: f.id, label: f.label }))
}

/** The ready body: typed fields + the interview entry/panel + book nav. Hooks live here. */
function PageBody({
  templateId,
  pageId,
  scheduler,
  page,
  prev,
  next,
  onConfirmed,
}: {
  templateId: string
  pageId: string
  scheduler?: Scheduler
  page: ReadyData
  prev?: SpineEntry
  next?: SpineEntry
  onConfirmed: () => void
}) {
  const [interviewing, setInterviewing] = useState(false)
  const offerable = interviewableFields(page)

  return (
    <article>
      <p class="text-sm text-muted">{page.chapter.title}</p>
      <h1 class="mt-1 font-display text-3xl text-ink">{page.page.title}</h1>
      {page.page.instruction ? (
        <p class="mt-4 text-lg leading-relaxed text-body">{page.page.instruction}</p>
      ) : null}

      {/* Interview entry — a calm alternative to typing; never disrupts the typed fields below. */}
      {offerable.length > 0 ? (
        <div class="mt-6">
          {interviewing ? (
            <InterviewPanel
              documentId={page.document.id}
              pageId={pageId}
              fields={offerable}
              onClose={() => setInterviewing(false)}
              onConfirmed={() => {
                setInterviewing(false)
                onConfirmed()
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setInterviewing(true)}
              class="min-h-11 rounded-sm border border-gold bg-sand px-5 py-2.5 text-sm font-medium text-ink motion-safe:transition-colors hover:bg-gold/15"
            >
              Fill this in with a few questions
            </button>
          )}
        </div>
      ) : null}

      <div class="mt-8 space-y-8">
        {page.page.fields.map((field) => (
          <PlaybookField
            key={field.id}
            field={field}
            scheduler={scheduler}
            onSave={(value) => savePlaybookAnswer(templateId, field.id, value)}
          />
        ))}
      </div>

      <nav
        aria-label="Book navigation"
        class="mt-12 flex items-stretch justify-between gap-4 border-t border-linen pt-6"
      >
        {prev ? (
          <Link
            href={`/app/playbook/${templateId}/${prev.id}`}
            class="flex min-h-11 flex-col justify-center py-2 text-left motion-safe:transition-colors hover:text-ink"
          >
            <span class="text-xs text-muted">Previous</span>
            <span class="font-medium text-body">{prev.title}</span>
          </Link>
        ) : (
          <span aria-hidden="true" />
        )}
        {next ? (
          <Link
            href={`/app/playbook/${templateId}/${next.id}`}
            class="flex min-h-11 flex-col items-end justify-center py-2 text-right motion-safe:transition-colors hover:text-ink"
          >
            <span class="text-xs text-muted">Next</span>
            <span class="font-medium text-body">{next.title}</span>
          </Link>
        ) : (
          <span aria-hidden="true" />
        )}
      </nav>
    </article>
  )
}

export function PlaybookPageView({ templateId, pageId, scheduler }: Props) {
  const { state, retry } = useQuery(
    () => Promise.all([fetchPlaybookPage(templateId, pageId), fetchPlaybook()]),
    [templateId, pageId],
  )

  return (
    <div class="mx-auto max-w-[var(--max-reading)] px-4 py-8">
      <div class="flex items-baseline justify-between gap-4">
        <Link
          href="/app/playbook"
          class="min-h-11 py-2 text-sm font-medium text-body motion-safe:transition-colors hover:text-ink"
        >
          Contents
        </Link>
        <p class="text-sm text-muted">Only you and your AI see this.</p>
      </div>

      <div class="mt-6">
        {state.status === 'loading' ? (
          <PageSkeleton />
        ) : state.status === 'error' ? (
          <ErrorState what="We couldn't open this page" error={state.error} onRetry={retry} />
        ) : (
          (() => {
            const [page, playbook] = state.data
            const spine = flattenSpine(playbook, templateId)
            const index = spine.findIndex((entry) => entry.id === pageId)
            const prev = index > 0 ? spine[index - 1] : undefined
            const next = index >= 0 ? spine[index + 1] : undefined

            return (
              <PageBody
                templateId={templateId}
                pageId={pageId}
                scheduler={scheduler}
                page={page}
                prev={prev}
                next={next}
                onConfirmed={retry}
              />
            )
          })()
        )}
      </div>
    </div>
  )
}
