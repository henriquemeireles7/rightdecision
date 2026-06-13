/// <reference lib="dom" />
/**
 * Lives: schedule (local datetime → ISO instant), list with DERIVED states (upcoming /
 * awaiting replay / replay processing / replay ready / cancelled — never stored),
 * explicit cancellation (a human act — confirm dialog spells out the replays month
 * protocol), and the tus replay upload through the same injected uploader.
 */
import { useState } from 'preact/hooks'
import type { AdminLive, AdminProgram } from './data'
import { useData } from './data'
import { navigate } from './router'
import {
  buttonGhost,
  buttonPrimary,
  type ChipStatus,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  formatInstant,
  InlineError,
  InlineSuccess,
  inputClass,
  ListSkeleton,
  StatusChip,
  useAction,
  useLoad,
} from './ui'
import { VideoUpload } from './video-upload'

export type LiveState =
  | 'cancelled'
  | 'upcoming'
  | 'awaiting replay'
  | 'replay processing'
  | 'replay ready'

export function deriveLiveState(live: AdminLive, now: Date): LiveState {
  if (live.cancelledAt) return 'cancelled'
  if (new Date(live.scheduledAt) > now) return 'upcoming'
  if (live.replayStatus === 'processing') return 'replay processing'
  if (live.replayStatus === 'ready') return 'replay ready'
  return 'awaiting replay'
}

export function LivesScreen({ now = new Date() }: { now?: Date }) {
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
        title="Lives need a program first"
        body="Every live is scheduled for a program's members. Create a program, then schedule the first live."
        actionLabel="Go to Programs"
        onAction={() => navigate({ name: 'programs' })}
      />
    )
  }

  return <ProgramLives programs={programs.state.data.programs} now={now} />
}

function ProgramLives({ programs, now }: { programs: AdminProgram[]; now: Date }) {
  const data = useData()
  const [programId, setProgramId] = useState(programs[0]?.id ?? '')
  const { state, reload, setData } = useLoad(() => data.listLives(programId, 'all'), [programId])
  const schedule = useAction()
  const cancel = useAction()
  const [title, setTitle] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [cancelling, setCancelling] = useState<{ id: string; title: string } | null>(null)

  const programPicker = (
    <div class="max-w-xs">
      <label class="block text-xs font-medium text-body" for="lives-program">
        Program
      </label>
      <select
        id="lives-program"
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

  const lives = [...state.data.lives].sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))
  const replaceLive = (live: AdminLive) =>
    setData((d) => ({ lives: d.lives.map((l) => (l.id === live.id ? live : l)) }))
  const appendLive = (live: AdminLive) => setData((d) => ({ lives: [...d.lives, live] }))

  async function submitSchedule() {
    const result = await schedule.run(
      () =>
        data.scheduleLive({
          programId,
          title,
          scheduledAt: new Date(scheduledAt).toISOString(),
          ...(youtubeUrl.trim() !== '' ? { youtubeUrl: youtubeUrl.trim() } : {}),
        }),
      'Live scheduled.',
    )
    if (result) {
      appendLive(result.live)
      setTitle('')
      setScheduledAt('')
      setYoutubeUrl('')
    }
  }

  async function confirmCancel() {
    if (!cancelling) return
    const result = await cancel.run(() => data.cancelLive(cancelling.id), 'Live cancelled.')
    if (result) replaceLive(result.live)
    setCancelling(null)
  }

  return (
    <div class="space-y-6">
      <div class="flex items-end justify-between gap-4">
        <h1 class="font-display text-2xl text-ink">Lives</h1>
        {programPicker}
      </div>

      <form
        class="max-w-md space-y-3 rounded-md border border-linen bg-surface-white p-4"
        onSubmit={(e) => {
          e.preventDefault()
          void submitSchedule()
        }}
      >
        <h3 class="text-sm font-semibold text-ink">Schedule a live</h3>
        <div>
          <label class="block text-xs font-medium text-body" for="new-live-title">
            Live title
          </label>
          <input
            id="new-live-title"
            class={`mt-1 ${inputClass}`}
            value={title}
            onInput={(e) => setTitle((e.currentTarget as HTMLInputElement).value)}
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-body" for="new-live-time">
            Scheduled at
          </label>
          <input
            id="new-live-time"
            type="datetime-local"
            class={`mt-1 ${inputClass}`}
            value={scheduledAt}
            onInput={(e) => setScheduledAt((e.currentTarget as HTMLInputElement).value)}
          />
          <p class="mt-1 text-xs text-muted">Your local time — members see it in theirs.</p>
        </div>
        <div>
          <label class="block text-xs font-medium text-body" for="new-live-youtube">
            YouTube URL
          </label>
          <input
            id="new-live-youtube"
            class={`mt-1 ${inputClass}`}
            placeholder="https://youtube.com/live/… (unlisted)"
            value={youtubeUrl}
            onInput={(e) => setYoutubeUrl((e.currentTarget as HTMLInputElement).value)}
          />
        </div>
        <button
          type="submit"
          class={buttonPrimary}
          disabled={schedule.pending || title.trim() === '' || scheduledAt === ''}
        >
          {schedule.pending ? 'Scheduling…' : 'Schedule live'}
        </button>
        {schedule.success && <InlineSuccess message={schedule.success} />}
        {schedule.error && <InlineError error={schedule.error} />}
      </form>

      {lives.length === 0 ? (
        <p class="rounded-md border border-linen bg-surface-white px-4 py-6 text-sm text-body">
          No lives scheduled yet for this program — schedule the first one above. Replays live here
          too once you upload them.
        </p>
      ) : (
        <ul class="divide-y divide-linen rounded-md border border-linen bg-surface-white">
          {lives.map((live) => {
            const liveState = deriveLiveState(live, now)
            const canUploadReplay = liveState === 'awaiting replay'
            return (
              <li key={live.id} data-live-id={live.id} class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium text-ink">{live.title}</p>
                    <p class="text-xs text-muted">
                      {formatInstant(live.scheduledAt)}
                      {live.youtubeUrl ? ` · ${live.youtubeUrl}` : ''}
                    </p>
                  </div>
                  <StatusChip status={liveState as ChipStatus} />
                  {liveState === 'upcoming' && (
                    <button
                      type="button"
                      class={buttonGhost}
                      aria-label={`Cancel ${live.title}`}
                      onClick={() => setCancelling({ id: live.id, title: live.title })}
                    >
                      Cancel
                    </button>
                  )}
                </div>
                {canUploadReplay && (
                  <div class="mt-3 border-t border-linen pt-3">
                    <p class="mb-2 text-xs text-muted">
                      Upload the recording — it becomes the gated replay for members.
                    </p>
                    <VideoUpload
                      label="Replay recording"
                      status="none"
                      requestUploadUrl={(bytes) => data.requestReplayUploadUrl(live.id, bytes)}
                      onUploadComplete={() => replaceLive({ ...live, replayStatus: 'processing' })}
                    />
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {cancel.error && <InlineError error={cancel.error} />}

      {cancelling && (
        <ConfirmDialog
          title={`Cancel ${cancelling.title}?`}
          body="This is permanent — a cancelled live can't be rescheduled or get a replay (replays month protocol: members get the replay library that month instead). To run it later, schedule a new live."
          confirmLabel="Cancel the live"
          cancelLabel="Keep it"
          pending={cancel.pending}
          onCancel={() => setCancelling(null)}
          onConfirm={() => void confirmCancel()}
        />
      )}
    </div>
  )
}
