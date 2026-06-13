/// <reference lib="dom" />
/**
 * Cohort management: the cron auto-creates first-Monday cohorts (suggestion banner shows
 * the next one); manual create/override is for FUTURE cohorts only — the API refuses edits
 * to started cohorts (founder decision) and we surface that refusal verbatim.
 */
import { useState } from 'preact/hooks'
import type { AdminCohort, AdminProgram } from './data'
import { useData } from './data'
import { navigate } from './router'
import {
  buttonGhost,
  buttonPrimary,
  EmptyState,
  ErrorState,
  formatInstant,
  InlineError,
  InlineSuccess,
  inputClass,
  ListSkeleton,
  useAction,
  useLoad,
} from './ui'

/** upcoming/past derives from startsAt vs now — never stored (TD-1). */
export function splitCohorts(
  cohorts: AdminCohort[],
  now: Date,
): { upcoming: AdminCohort[]; past: AdminCohort[] } {
  const upcoming = cohorts.filter((c) => new Date(c.startsAt) >= now)
  const past = cohorts.filter((c) => new Date(c.startsAt) < now)
  upcoming.sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  past.sort((a, b) => b.startsAt.localeCompare(a.startsAt))
  return { upcoming, past }
}

export function CohortsScreen({ now = new Date() }: { now?: Date }) {
  const data = useData()
  const programs = useLoad(() => data.listPrograms(), [])

  if (programs.state.status === 'loading') return <ListSkeleton rows={3} />
  if (programs.state.status === 'error')
    return (
      <ErrorState
        message={programs.state.message}
        detail={programs.state.detail}
        onRetry={programs.reload}
      />
    )
  if (programs.state.data.programs.length === 0) {
    return (
      <EmptyState
        title="Cohorts need a program first"
        body="Cohorts belong to a program. Create your free cohort program, then come back here."
        actionLabel="Go to Programs"
        onAction={() => navigate({ name: 'programs' })}
      />
    )
  }

  return <ProgramCohorts programs={programs.state.data.programs} now={now} />
}

function ProgramCohorts({ programs, now }: { programs: AdminProgram[]; now: Date }) {
  const data = useData()
  const [programId, setProgramId] = useState(programs[0]?.id ?? '')
  const { state, reload, setData } = useLoad(
    () => Promise.all([data.listCohorts(programId, 'all'), data.suggestCohorts()]),
    [programId],
  )
  const create = useAction()
  const update = useAction()
  const [title, setTitle] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [editing, setEditing] = useState<{ id: string; title: string; startsAt: string } | null>(
    null,
  )

  const programPicker = (
    <div class="max-w-xs">
      <label class="block text-xs font-medium text-body" for="cohorts-program">
        Program
      </label>
      <select
        id="cohorts-program"
        class={`mt-1 ${inputClass}`}
        value={programId}
        onChange={(e) => setProgramId((e.currentTarget as HTMLSelectElement).value)}
      >
        {programs.map((program) => (
          <option key={program.id} value={program.id}>
            {program.name}
          </option>
        ))}
      </select>
    </div>
  )

  if (state.status === 'loading')
    return (
      <div class="space-y-4">
        {programPicker}
        <ListSkeleton rows={4} />
      </div>
    )
  if (state.status === 'error')
    return (
      <div class="space-y-4">
        {programPicker}
        <ErrorState message={state.message} detail={state.detail} onRetry={reload} />
      </div>
    )

  const [{ cohorts }, { suggestions }] = state.data
  const { upcoming, past } = splitCohorts(cohorts, now)
  const nextSuggestion = suggestions[0]

  const appendCohort = (cohort: AdminCohort) =>
    setData(([list, s]) => [{ cohorts: [...list.cohorts, cohort] }, s])
  const replaceCohort = (cohort: AdminCohort) =>
    setData(([list, s]) => [
      { cohorts: list.cohorts.map((c) => (c.id === cohort.id ? cohort : c)) },
      s,
    ])

  async function submitCreate() {
    const result = await create.run(
      () =>
        data.createCohort({
          programId,
          title,
          startsAt: new Date(startsAt).toISOString(),
        }),
      'Cohort created.',
    )
    if (result) {
      appendCohort(result.cohort)
      setTitle('')
      setStartsAt('')
    }
  }

  async function submitEdit() {
    if (!editing) return
    const result = await update.run(
      () =>
        data.updateCohort(editing.id, {
          title: editing.title,
          startsAt: new Date(editing.startsAt).toISOString(),
        }),
      'Cohort updated.',
    )
    if (result) {
      replaceCohort(result.cohort)
      setEditing(null)
    }
  }

  /** datetime-local value (local time, minutes precision) from an ISO instant. */
  const toLocalInput = (iso: string) => {
    const date = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  const cohortRow = (cohort: AdminCohort, locked: boolean) => (
    <li key={cohort.id} class="flex items-center gap-3 px-4 py-3">
      <div class="min-w-0 flex-1">
        <p class="text-sm font-medium text-ink">{cohort.title}</p>
        <p class="text-xs text-muted">Starts {formatInstant(cohort.startsAt)}</p>
      </div>
      {locked ? (
        <span class="text-xs text-muted">
          Started — locked. Changing a running cohort is a founder decision.
        </span>
      ) : (
        <button
          type="button"
          class={buttonGhost}
          aria-label={`Edit ${cohort.title}`}
          onClick={() =>
            setEditing({
              id: cohort.id,
              title: cohort.title,
              startsAt: toLocalInput(cohort.startsAt),
            })
          }
        >
          Edit
        </button>
      )}
    </li>
  )

  return (
    <div class="space-y-6">
      <div class="flex items-end justify-between gap-4">
        <h1 class="font-display text-2xl text-ink">Cohorts</h1>
        {programPicker}
      </div>

      {nextSuggestion && (
        <p class="rounded-md border border-info/30 bg-info/10 px-4 py-3 text-sm text-ink">
          Next auto-created cohort: <strong>{nextSuggestion.title}</strong> —{' '}
          {formatInstant(nextSuggestion.startsAt)}. It will be created automatically on schedule;
          nothing to do.
        </p>
      )}

      {cohorts.length === 0 ? (
        <p class="rounded-md border border-linen bg-surface-white px-4 py-6 text-sm text-body">
          No cohorts yet for this program. Monthly cohorts are created automatically on the first
          Monday — or create one manually below.
        </p>
      ) : (
        <>
          <section>
            <h2 class="text-sm font-semibold text-ink">Upcoming</h2>
            {upcoming.length === 0 ? (
              <p class="mt-2 text-sm text-body">
                Nothing scheduled yet — the next auto-created cohort will appear here.
              </p>
            ) : (
              <ul class="mt-2 divide-y divide-linen rounded-md border border-linen bg-surface-white">
                {upcoming.map((cohort) => cohortRow(cohort, false))}
              </ul>
            )}
          </section>
          <section>
            <h2 class="text-sm font-semibold text-ink">Past</h2>
            {past.length === 0 ? (
              <p class="mt-2 text-sm text-body">No past cohorts yet.</p>
            ) : (
              <ul class="mt-2 divide-y divide-linen rounded-md border border-linen bg-surface-white">
                {past.map((cohort) => cohortRow(cohort, true))}
              </ul>
            )}
          </section>
        </>
      )}

      {editing && (
        <form
          class="max-w-md space-y-3 rounded-md border border-linen bg-surface-white p-4"
          onSubmit={(e) => {
            e.preventDefault()
            void submitEdit()
          }}
        >
          <h3 class="text-sm font-semibold text-ink">Edit cohort</h3>
          <div>
            <label class="block text-xs font-medium text-body" for="edit-cohort-title">
              Edit title
            </label>
            <input
              id="edit-cohort-title"
              class={`mt-1 ${inputClass}`}
              value={editing.title}
              onInput={(e) =>
                setEditing({ ...editing, title: (e.currentTarget as HTMLInputElement).value })
              }
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-body" for="edit-cohort-starts">
              Edit start time
            </label>
            <input
              id="edit-cohort-starts"
              type="datetime-local"
              class={`mt-1 ${inputClass}`}
              value={editing.startsAt}
              onInput={(e) =>
                setEditing({ ...editing, startsAt: (e.currentTarget as HTMLInputElement).value })
              }
            />
          </div>
          <div class="flex gap-2">
            <button type="submit" class={buttonPrimary} disabled={update.pending}>
              {update.pending ? 'Saving…' : 'Save cohort'}
            </button>
            <button type="button" class={buttonGhost} onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
          {update.error && <InlineError error={update.error} />}
        </form>
      )}

      <form
        class="max-w-md space-y-3 rounded-md border border-linen bg-surface-white p-4"
        onSubmit={(e) => {
          e.preventDefault()
          void submitCreate()
        }}
      >
        <h3 class="text-sm font-semibold text-ink">Create a cohort manually</h3>
        <p class="text-xs text-muted">
          Only needed for special cohorts — the monthly one is created for you. Past cohorts can't
          be edited later, so double-check the date.
        </p>
        <div>
          <label class="block text-xs font-medium text-body" for="new-cohort-title">
            Cohort title
          </label>
          <input
            id="new-cohort-title"
            class={`mt-1 ${inputClass}`}
            value={title}
            onInput={(e) => setTitle((e.currentTarget as HTMLInputElement).value)}
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-body" for="new-cohort-starts">
            Starts at
          </label>
          <input
            id="new-cohort-starts"
            type="datetime-local"
            class={`mt-1 ${inputClass}`}
            value={startsAt}
            onInput={(e) => setStartsAt((e.currentTarget as HTMLInputElement).value)}
          />
        </div>
        <button
          type="submit"
          class={buttonPrimary}
          disabled={create.pending || title.trim() === '' || startsAt === ''}
        >
          {create.pending ? 'Creating…' : 'Create cohort'}
        </button>
        {create.success && <InlineSuccess message={create.success} />}
        {create.error && <InlineError error={create.error} />}
      </form>
    </div>
  )
}
