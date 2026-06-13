/// <reference lib="dom" />
/**
 * Distribution screens (Project 7) — admin UI over the EXISTING BD video→clips→social pipeline.
 * Nothing here touches the pipeline; it wires to the already-mounted endpoints + the admin glue
 * module. Two screens: the runs list with the upload + flow chooser, and the per-run dashboard
 * with clip review/approval and distribute. Every screen ships loading/empty/error/success and
 * pending mutation states — an unexplained spinner is a support call.
 */
import { useState } from 'preact/hooks'
import type {
  DistributionClip,
  DistributionFlow,
  DistributionRun,
  DistributionRunDetail,
} from './data'
import { useData } from './data'
import { navigate } from './router'
import {
  buttonGhost,
  buttonPrimary,
  buttonSecondary,
  Chip,
  describeError,
  EmptyState,
  ErrorState,
  formatInstant,
  InlineError,
  InlineSuccess,
  ListSkeleton,
  RouteLink,
  useAction,
  useLoad,
} from './ui'
import { usePutFile } from './uploader'

// ─── Pipeline step model (the run status enum → an ordered, human step rail) ───

export const PIPELINE_STEPS = [
  { key: 'transcribe', label: 'Transcribe' },
  { key: 'select', label: 'Select clips' },
  { key: 'cut', label: 'Cut clips' },
  { key: 'metadata', label: 'Metadata' },
  { key: 'distribute', label: 'Distribute' },
] as const

export type StepKey = (typeof PIPELINE_STEPS)[number]['key']
export type StepState = 'done' | 'active' | 'failed' | 'pending'

/** Which step each run status sits AT (the step currently running or just completed). */
const STATUS_STEP: Record<string, { step: StepKey; phase: 'running' | 'done' }> = {
  queued: { step: 'transcribe', phase: 'running' },
  transcribing: { step: 'transcribe', phase: 'running' },
  transcribed: { step: 'transcribe', phase: 'done' },
  selecting: { step: 'select', phase: 'running' },
  selected: { step: 'select', phase: 'done' },
  awaiting_clip_approval: { step: 'select', phase: 'done' },
  cutting: { step: 'cut', phase: 'running' },
  cut: { step: 'cut', phase: 'done' },
  generating_metadata: { step: 'metadata', phase: 'running' },
  metadata_ready: { step: 'metadata', phase: 'done' },
  awaiting_metadata_approval: { step: 'metadata', phase: 'done' },
  posting: { step: 'distribute', phase: 'running' },
  posted: { step: 'distribute', phase: 'done' },
  analyzing: { step: 'distribute', phase: 'done' },
  completed: { step: 'distribute', phase: 'done' },
}

const STEP_FAIL_KEY: Record<string, StepKey> = {
  transcribe: 'transcribe',
  select: 'select',
  'clip-select': 'select',
  cut: 'cut',
  'clip-cut': 'cut',
  metadata: 'metadata',
  'metadata-generate': 'metadata',
  distribute: 'distribute',
  'post-distribute': 'distribute',
}

/** Map a run (status + optional stepFailedAt) to a state per step in the rail. Pure → tested. */
export function stepStates(run: {
  status: string
  stepFailedAt?: string | null
}): Record<StepKey, StepState> {
  const order = PIPELINE_STEPS.map((s) => s.key)
  const result = Object.fromEntries(order.map((k) => [k, 'pending'])) as Record<StepKey, StepState>

  if (run.status === 'failed') {
    const failedStep = run.stepFailedAt ? STEP_FAIL_KEY[run.stepFailedAt] : undefined
    const failIndex = failedStep ? order.indexOf(failedStep) : 0
    order.forEach((k, i) => {
      if (i < failIndex) result[k] = 'done'
      else if (i === failIndex) result[k] = 'failed'
    })
    return result
  }

  const at = STATUS_STEP[run.status]
  if (!at) return result
  const atIndex = order.indexOf(at.step)
  order.forEach((k, i) => {
    if (i < atIndex) result[k] = 'done'
    else if (i === atIndex) result[k] = at.phase === 'done' ? 'done' : 'active'
  })
  return result
}

const FLOWS: Array<{ value: DistributionFlow; label: string; hint: string }> = [
  {
    value: 'short',
    label: 'Short clips',
    hint: 'Cut into clips for TikTok, Instagram Reels and YouTube Shorts.',
  },
  { value: 'long', label: 'Full episode', hint: 'Publish the long video to YouTube.' },
]

// ─── Runs list + upload + flow chooser ───

const SUPPORTED = ['mp4', 'webm', 'wav', 'mp3', 'ogg', 'm4a']

type UploadPhase =
  | { name: 'idle'; error?: string }
  | { name: 'presigning' }
  | { name: 'putting'; percent: number }
  | { name: 'starting' }

export function DistributionScreen() {
  const data = useData()
  const putFile = usePutFile()
  const { state, reload } = useLoad(() => data.listRuns(), [])
  const [formOpen, setFormOpen] = useState(false)
  const [flow, setFlow] = useState<DistributionFlow>('short')
  const [file, setFile] = useState<File | null>(null)
  const [phase, setPhase] = useState<UploadPhase>({ name: 'idle' })

  function extOf(name: string) {
    return name.split('.').pop()?.toLowerCase() ?? ''
  }

  async function startUpload() {
    if (!file) return
    if (!SUPPORTED.includes(extOf(file.name))) {
      setPhase({
        name: 'idle',
        error: `That file type isn't supported. Upload one of: ${SUPPORTED.join(', ')}.`,
      })
      return
    }

    setPhase({ name: 'presigning' })
    let uploadUrl: string
    let fileKey: string
    try {
      ;({ uploadUrl, fileKey } = await data.requestVideoUploadUrl({
        fileName: file.name,
        mimeType: file.type || 'video/mp4',
      }))
    } catch (error) {
      const { message, detail } = describeError(error)
      setPhase({
        name: 'idle',
        error: `We couldn't prepare the upload — ${message}${detail ? ` (${detail})` : ''}. Nothing was uploaded; try again.`,
      })
      return
    }

    setPhase({ name: 'putting', percent: 0 })
    try {
      await putFile(uploadUrl, file, (percent) => setPhase({ name: 'putting', percent }))
    } catch (error) {
      const { message } = describeError(error)
      setPhase({
        name: 'idle',
        error: `${message} — the video never reached storage. Check your connection and try again.`,
      })
      return
    }

    setPhase({ name: 'starting' })
    try {
      const { run } = await data.startRun({ videoUrl: fileKey, flow })
      await data.processRun(run.id)
      navigate({ name: 'distribution-run', runId: run.id })
    } catch (error) {
      const { message, detail } = describeError(error)
      setPhase({
        name: 'idle',
        error: `The video uploaded, but we couldn't start the pipeline — ${message}${detail ? ` (${detail})` : ''}. Try again.`,
      })
    }
  }

  const busy = phase.name !== 'idle'

  const form = (
    <div class="max-w-lg space-y-4 rounded-md border border-linen bg-surface-white p-5">
      <h3 class="text-sm font-semibold text-ink">New distribution run</h3>

      <fieldset class="space-y-2" disabled={busy}>
        <legend class="text-xs font-medium text-body">What should we make from this video?</legend>
        {FLOWS.map((option) => {
          const selected = flow === option.value
          return (
            <label
              key={option.value}
              class={`flex cursor-pointer items-start gap-3 rounded-sm border px-3 py-2 ${
                selected ? 'border-gold bg-gold/20 text-ink' : 'border-linen hover:border-gold'
              }`}
            >
              <input
                type="radio"
                name="flow"
                class="mt-1"
                checked={selected}
                value={option.value}
                onChange={() => setFlow(option.value)}
              />
              <span>
                <span class="block text-sm font-medium text-ink">{option.label}</span>
                <span class="block text-xs text-muted">{option.hint}</span>
              </span>
            </label>
          )
        })}
      </fieldset>

      {phase.name === 'idle' && phase.error && (
        <p role="alert" class="text-sm text-error">
          {phase.error}
        </p>
      )}

      {!busy && (
        <div class="space-y-3">
          <label class={`${buttonGhost} cursor-pointer`}>
            {file ? `Video: ${file.name}` : 'Choose a video'}
            <input
              type="file"
              accept="video/*"
              class="sr-only"
              onChange={(event) =>
                setFile((event.currentTarget as HTMLInputElement).files?.[0] ?? null)
              }
            />
          </label>
          <div class="flex gap-2">
            <button
              type="button"
              class={buttonPrimary}
              disabled={!file}
              onClick={() => void startUpload()}
            >
              Upload and start
            </button>
            <button type="button" class={buttonGhost} onClick={() => setFormOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {phase.name === 'presigning' && (
        <p class="text-sm text-body" aria-busy="true">
          Preparing upload — asking storage for an upload link…
        </p>
      )}
      {phase.name === 'putting' && (
        <div aria-busy="true">
          <p class="text-sm font-medium text-ink">Uploading — {phase.percent}%</p>
          <div
            role="progressbar"
            aria-valuenow={phase.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Video upload progress"
            class="mt-2 h-2 w-full overflow-hidden rounded-full bg-sand"
          >
            <div class="h-full bg-gold" style={{ width: `${phase.percent}%` }} />
          </div>
          <p class="mt-1 text-xs text-muted">Keep this tab open while the video uploads.</p>
        </div>
      )}
      {phase.name === 'starting' && (
        <p class="text-sm text-body" aria-busy="true">
          Almost there — starting the pipeline…
        </p>
      )}
    </div>
  )

  if (state.status === 'loading') return <ListSkeleton rows={4} />
  if (state.status === 'error')
    return <ErrorState message={state.message} detail={state.detail} onRetry={reload} />

  const runs = state.data

  if (runs.length === 0) {
    return (
      <div class="space-y-4">
        {!formOpen && (
          <EmptyState
            title="No videos yet"
            body="Upload your first video and we'll turn it into clips ready to post. Pick a flow, drop the file, and the pipeline takes it from there."
            actionLabel="Upload your first video"
            onAction={() => setFormOpen(true)}
          />
        )}
        {formOpen && form}
      </div>
    )
  }

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="font-display text-2xl text-ink">Distribution</h1>
        {!formOpen && (
          <button type="button" class={buttonPrimary} onClick={() => setFormOpen(true)}>
            New run
          </button>
        )}
      </div>
      {formOpen && form}
      <ul class="divide-y divide-linen rounded-md border border-linen bg-surface-white">
        {runs.map((run) => (
          <RunRow key={run.id} run={run} />
        ))}
      </ul>
    </div>
  )
}

function RunRow({ run }: { run: DistributionRun }) {
  const failed = run.status === 'failed'
  return (
    <li class="flex items-center justify-between gap-3 px-4 py-3">
      <RouteLink
        route={{ name: 'distribution-run', runId: run.id }}
        class="min-w-0 flex-1 text-sm font-medium text-ink hover:text-gold-hover"
      >
        <span class="block truncate">{run.inputVideoUrl}</span>
        <span class="text-xs font-normal text-muted">Started {formatInstant(run.createdAt)}</span>
      </RouteLink>
      <Chip
        label={failed ? 'Failed' : run.status.replace(/_/g, ' ')}
        tone={failed ? 'error' : run.status === 'completed' ? 'success' : 'info'}
      />
    </li>
  )
}

// ─── Run detail: status dashboard + clip review/approval + distribute ───

const FAILURE_FIX: Record<StepKey, string> = {
  transcribe:
    'The video may not have reached storage or the format is unsupported. Re-upload the file and start a new run.',
  select: 'Clip selection failed. Re-run selection from the pipeline, then refresh.',
  cut: 'Cutting a clip failed — usually a bad timestamp or a corrupt source. Re-cut from the pipeline.',
  metadata: 'Metadata generation failed. Regenerate metadata, then refresh.',
  distribute:
    'Posting to a platform failed — often an expired account connection. Re-sync accounts and distribute again.',
}

export function DistributionRunScreen({ runId }: { runId: string }) {
  const data = useData()
  const { state, reload, setData } = useLoad(() => data.getRun(runId), [runId])

  if (state.status === 'loading') return <ListSkeleton rows={6} />
  if (state.status === 'error')
    return <ErrorState message={state.message} detail={state.detail} onRetry={reload} />

  const detail = state.data
  const { run, clips } = detail
  const states = stepStates(run)
  const approvedCount = clips.filter((c) => c.approved).length

  const setClip = (clipId: string, update: (c: DistributionClip) => DistributionClip) =>
    setData((d: DistributionRunDetail) => ({
      ...d,
      clips: d.clips.map((c) => (c.id === clipId ? update(c) : c)),
    }))

  return (
    <div class="space-y-8">
      <nav class="text-xs text-muted">
        <RouteLink route={{ name: 'distribution' }} class="hover:text-ink">
          Distribution
        </RouteLink>
        <span> / run</span>
      </nav>

      <header class="space-y-1">
        <h1 class="break-all font-display text-xl text-ink">{run.inputVideoUrl}</h1>
        <p class="text-xs text-muted">Started {formatInstant(run.createdAt)}</p>
      </header>

      <StepRail run={run} states={states} fix={FAILURE_FIX} />

      <ClipReview
        runId={runId}
        clips={clips}
        approvedCount={approvedCount}
        onApprovalChange={setClip}
      />
    </div>
  )
}

function StepRail({
  run,
  states,
  fix,
}: {
  run: { status: string; stepFailedAt?: string | null; errorMessage?: string | null }
  states: Record<StepKey, StepState>
  fix: Record<StepKey, string>
}) {
  return (
    <section>
      <h2 class="font-display text-lg text-ink">Pipeline status</h2>
      <ol class="mt-3 space-y-2">
        {PIPELINE_STEPS.map((step) => {
          const s = states[step.key]
          return (
            <li
              key={step.key}
              class="flex flex-col gap-1 rounded-md border border-linen bg-surface-white px-4 py-3"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-ink">{step.label}</span>
                <StepChip state={s} />
              </div>
              {s === 'failed' && (
                <div role="alert" class="text-sm">
                  <p class="text-error">{run.errorMessage ?? 'This step failed.'}</p>
                  <p class="mt-1 text-body">{fix[step.key]}</p>
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function StepChip({ state }: { state: StepState }) {
  if (state === 'done') return <Chip label="Done" tone="success" />
  if (state === 'active') return <Chip label="In progress" tone="warning" />
  if (state === 'failed') return <Chip label="Failed" tone="error" />
  return <Chip label="Waiting" tone="neutral" />
}

function ClipReview({
  runId,
  clips,
  approvedCount,
  onApprovalChange,
}: {
  runId: string
  clips: DistributionClip[]
  approvedCount: number
  onApprovalChange: (clipId: string, update: (c: DistributionClip) => DistributionClip) => void
}) {
  const data = useData()
  const distribute = useAction()

  if (clips.length === 0) {
    return (
      <section>
        <h2 class="font-display text-lg text-ink">Clips</h2>
        <p class="mt-3 rounded-md border border-linen bg-surface-white px-4 py-6 text-sm text-body">
          No clips yet — they'll appear here once the pipeline has selected them. Refresh once
          selection finishes.
        </p>
      </section>
    )
  }

  return (
    <section>
      <div class="flex items-center justify-between">
        <h2 class="font-display text-lg text-ink">Review clips</h2>
        <span class="text-xs text-muted">
          {approvedCount} of {clips.length} approved
        </span>
      </div>
      <p class="mt-1 text-sm text-body">
        Nothing posts until you approve it. Approve the clips you want, then distribute.
      </p>

      <ul class="mt-3 space-y-2">
        {clips.map((clip) => (
          <ClipRow key={clip.id} runId={runId} clip={clip} onApprovalChange={onApprovalChange} />
        ))}
      </ul>

      <div class="mt-5 border-t border-linen pt-4">
        <button
          type="button"
          class={buttonPrimary}
          disabled={distribute.pending || approvedCount === 0}
          onClick={() =>
            void distribute.run(
              () => data.distribute(runId),
              'Approved clips sent to your platforms.',
            )
          }
        >
          {distribute.pending
            ? 'Distributing…'
            : `Distribute ${approvedCount} approved clip${approvedCount === 1 ? '' : 's'}`}
        </button>
        {approvedCount === 0 && (
          <p class="mt-2 text-xs text-muted">
            Approve at least one clip to enable distribution — the gate stays closed until then.
          </p>
        )}
        {distribute.error && <InlineError error={distribute.error} />}
        {distribute.success && <InlineSuccess message={distribute.success} />}
      </div>
    </section>
  )
}

function ClipRow({
  runId,
  clip,
  onApprovalChange,
}: {
  runId: string
  clip: DistributionClip
  onApprovalChange: (clipId: string, update: (c: DistributionClip) => DistributionClip) => void
}) {
  const data = useData()
  const action = useAction()

  async function setApproval(approved: boolean) {
    const result = await action.run(() => data.setClipApproval(runId, clip.id, approved))
    if (result) onApprovalChange(clip.id, (c) => ({ ...c, approved: result.clip.approved }))
  }

  return (
    <li class="rounded-md border border-linen bg-surface-white px-4 py-3">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-ink">
            {clip.suggestedTitle ?? 'Untitled clip'}
            {clip.approved && (
              <span class="ml-2">
                <Chip label="Approved" tone="success" />
              </span>
            )}
          </p>
          <p class="text-xs text-muted">
            {clip.sourceTimestampStart}s–{clip.sourceTimestampEnd}s
            {clip.score != null ? ` · score ${clip.score}/10` : ''}
          </p>
          {clip.transcriptSnippet && (
            <p class="mt-1 line-clamp-2 text-sm text-body">{clip.transcriptSnippet}</p>
          )}
        </div>
        <div class="flex shrink-0 gap-2">
          {clip.approved ? (
            <button
              type="button"
              class={buttonGhost}
              disabled={action.pending}
              aria-label={`Reject ${clip.suggestedTitle ?? 'clip'}`}
              onClick={() => void setApproval(false)}
            >
              {action.pending ? 'Working…' : 'Reject'}
            </button>
          ) : (
            <button
              type="button"
              class={buttonSecondary}
              disabled={action.pending}
              aria-label={`Approve ${clip.suggestedTitle ?? 'clip'}`}
              onClick={() => void setApproval(true)}
            >
              {action.pending ? 'Working…' : 'Approve'}
            </button>
          )}
        </div>
      </div>
      {action.error && <InlineError error={action.error} />}
    </li>
  )
}
