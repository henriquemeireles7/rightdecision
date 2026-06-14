/// <reference lib="dom" />
/**
 * Journal — today's morning/evening cards (prompts from the API, autosave on
 * blur + debounce) above a day-grouped history with CUMULATIVE counts only:
 * "47 mornings · 31 evenings · 52 days". No flames, no streaks, no shame —
 * streak-guilt is hustle-culture, the brand's enemy. entryDate is the member's
 * LOCAL calendar day, computed client-side and sent explicitly.
 */
import { useState } from 'preact/hooks'
import { ErrorState, Skeleton } from '../components/states'
import type { Scheduler } from '../lib/autosave'
import { useAutosave } from '../lib/autosave'
import { fetchJournal, type JournalEntry, saveJournalEntry } from '../lib/data'
import { todayLocalDate } from '../lib/format'
import { useQuery } from '../lib/use-query'

const RANGE_DAYS = 30

/** Local calendar day `days` ago as YYYY-MM-DD (range paging). */
function localDateDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return todayLocalDate(d)
}

/** 'YYYY-MM-DD' → "Wednesday, June 10" via LOCAL date fields (never UTC parsing). */
function formatEntryDay(entryDate: string): string {
  const [y, m, d] = entryDate.split('-').map(Number)
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date(y as number, (m as number) - 1, d as number))
}

function JournalSkeleton() {
  return (
    <div class="space-y-4" role="presentation">
      <Skeleton class="h-40 w-full" />
      <Skeleton class="h-40 w-full" />
      <Skeleton class="h-5 w-56" />
      <Skeleton class="h-24 w-full" />
    </div>
  )
}

const KIND_LABEL = { morning: 'Morning', evening: 'Evening' } as const

function TodayCard({
  kind,
  prompt,
  initial,
  scheduler,
}: {
  kind: 'morning' | 'evening'
  prompt: string
  initial: string
  scheduler?: Scheduler
}) {
  const [value, setValue] = useState(initial)
  const autosave = useAutosave(
    (content: string) =>
      content.trim() === ''
        ? Promise.resolve()
        : saveJournalEntry({ entryDate: todayLocalDate(), kind, content }),
    { scheduler },
  )
  const inputId = `journal-${kind}`

  return (
    <section class="rounded-lg border border-linen bg-surface-white p-5">
      <label class="block font-medium text-ink" for={inputId}>
        {KIND_LABEL[kind]}
      </label>
      <p class="mt-1 text-body">{prompt}</p>
      <textarea
        id={inputId}
        rows={4}
        value={value}
        class="mt-3 min-h-24 w-full resize-none overflow-hidden rounded-sm border border-linen bg-surface-white px-3 py-2 text-ink focus:border-gold"
        onInput={(event) => {
          const el = event.currentTarget as HTMLTextAreaElement
          el.style.height = 'auto'
          el.style.height = `${el.scrollHeight}px`
          setValue(el.value)
          autosave.queue(el.value)
        }}
        onBlur={autosave.flush}
      />
      {autosave.state.kind === 'saved' ? (
        <p role="status" class="mt-1.5 text-xs text-muted">
          Saved
        </p>
      ) : autosave.state.kind === 'error' ? (
        <p role="alert" class="mt-1.5 text-sm text-error">
          Couldn't save just now — your words are still here.{' '}
          <button
            type="button"
            onClick={autosave.retry}
            class="font-medium underline underline-offset-2"
          >
            Try again
          </button>
        </p>
      ) : null}
    </section>
  )
}

function History({ entries, today }: { entries: JournalEntry[]; today: string }) {
  const past = entries.filter((entry) => entry.entryDate !== today)
  if (past.length === 0) {
    return (
      <p class="mt-4 text-body">
        Your first entry starts the story. The history of your days will gather here.
      </p>
    )
  }

  const byDay = new Map<string, JournalEntry[]>()
  for (const entry of past) {
    const group = byDay.get(entry.entryDate) ?? []
    group.push(entry)
    byDay.set(entry.entryDate, group)
  }

  return (
    <div class="mt-4 space-y-6">
      {[...byDay.entries()].map(([day, dayEntries]) => (
        <section key={day}>
          <h3 class="font-display text-lg text-ink">{formatEntryDay(day)}</h3>
          <ul class="mt-2 space-y-3">
            {dayEntries.map((entry) => (
              <li key={entry.id} class="rounded-md border border-linen bg-surface-white p-4">
                <p class="text-xs font-medium text-muted">{KIND_LABEL[entry.kind]}</p>
                {entry.prompt ? <p class="mt-1 text-sm text-muted">{entry.prompt}</p> : null}
                <p class="mt-2 whitespace-pre-wrap text-body">{entry.content}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

export function JournalPage({ scheduler }: { scheduler?: Scheduler }) {
  const [rangePages, setRangePages] = useState(1)
  const from = localDateDaysAgo(RANGE_DAYS * rangePages - 1)
  const { state, retry } = useQuery(() => fetchJournal({ from }), [from])
  const today = todayLocalDate()

  return (
    <div class="mx-auto max-w-[var(--max-reading)] px-4 py-8">
      <h1 class="font-display text-3xl text-ink">Journal</h1>
      <div class="mt-6">
        {state.status === 'loading' ? (
          <JournalSkeleton />
        ) : state.status === 'error' ? (
          <ErrorState what="We couldn't open your journal" error={state.error} onRetry={retry} />
        ) : (
          (() => {
            const { entries, counts, prompts } = state.data
            const todayFor = (kind: 'morning' | 'evening') =>
              entries.find((entry) => entry.entryDate === today && entry.kind === kind)?.content ??
              ''
            return (
              <div>
                <div class="space-y-4">
                  <TodayCard
                    kind="morning"
                    prompt={prompts.morning}
                    initial={todayFor('morning')}
                    scheduler={scheduler}
                  />
                  <TodayCard
                    kind="evening"
                    prompt={prompts.evening}
                    initial={todayFor('evening')}
                    scheduler={scheduler}
                  />
                </div>

                <div class="mt-10 border-t border-linen pt-6">
                  <p class="text-sm text-muted tabular-nums">
                    {counts.totalMornings} mornings · {counts.totalEvenings} evenings ·{' '}
                    {counts.totalDaysJournaled} days
                  </p>
                  <History entries={entries} today={today} />
                  <button
                    type="button"
                    onClick={() => setRangePages((pages) => pages + 1)}
                    class="mt-6 min-h-11 rounded-sm border border-linen px-4 py-2 text-sm font-medium text-body motion-safe:transition-colors hover:border-gold hover:text-ink"
                  >
                    Show earlier entries
                  </button>
                </div>
              </div>
            )
          })()
        )}
      </div>
    </div>
  )
}
