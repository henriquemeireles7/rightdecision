/// <reference lib="dom" />
/**
 * Shared admin UI primitives — the interaction-state vocabulary every screen uses:
 * skeleton (loading), EmptyState (day-one), ErrorState (what/why/how-to-fix + retry),
 * StatusChip (text labels, never color alone), ConfirmDialog (native <dialog>),
 * useLoad/useAction (loading + pending/error/success state machines).
 */
import type { ComponentChildren } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { ApiError } from '@/features/(shared)/api-client'
import type { Route } from './router'
import { navigate, routePath } from './router'

// ─── Buttons (gold contrast rule: text on gold is ALWAYS ink) ───

export const buttonPrimary =
  'inline-flex items-center gap-2 rounded-sm bg-gold px-4 py-2 text-sm font-medium text-ink hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-50'
export const buttonSecondary =
  'inline-flex items-center gap-2 rounded-sm bg-sand px-4 py-2 text-sm font-medium text-ink hover:bg-linen disabled:cursor-not-allowed disabled:opacity-50'
export const buttonGhost =
  'inline-flex items-center gap-2 rounded-sm border border-linen px-3 py-1.5 text-sm font-medium text-body hover:border-gold hover:text-ink disabled:cursor-not-allowed disabled:opacity-50'
export const buttonDanger =
  'inline-flex items-center gap-2 rounded-sm border border-error px-3 py-1.5 text-sm font-medium text-error hover:bg-error hover:text-surface-white disabled:cursor-not-allowed disabled:opacity-50'

export const inputClass =
  'w-full rounded-sm border border-linen bg-surface-white px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-gold'

// ─── Errors → human messages (what / why / how to fix) ───

export type ErrorDescription = { message: string; detail?: string }

export function describeError(error: unknown): ErrorDescription {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return {
        message: "We couldn't reach the server.",
        detail: 'Check your internet connection and try again.',
      }
    }
    return { message: error.message, ...(error.details ? { detail: error.details } : {}) }
  }
  if (error instanceof Error) return { message: error.message }
  return { message: 'Something unexpected went wrong. Try again.' }
}

// ─── Loading: skeletons (sand/linen, pinned heights — no CLS) ───

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <output aria-busy="true" aria-label="Loading" class="block space-y-2">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} data-skeleton-row class="h-12 rounded-md bg-sand motion-safe:animate-pulse" />
      ))}
    </output>
  )
}

// ─── Empty states: onboarding, not dead ends ───

export function EmptyState(props: {
  title: string
  body: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div class="rounded-md border border-linen bg-surface-white px-8 py-12 text-center">
      <h2 class="font-display text-xl text-ink">{props.title}</h2>
      <p class="mx-auto mt-2 max-w-md text-sm text-body">{props.body}</p>
      {props.actionLabel && props.onAction && (
        <button type="button" class={`${buttonPrimary} mt-6`} onClick={props.onAction}>
          {props.actionLabel}
        </button>
      )}
    </div>
  )
}

// ─── Error states: what happened → why → how to fix, always with retry ───

export function ErrorState(props: { message: string; detail?: string; onRetry: () => void }) {
  return (
    <div role="alert" class="rounded-md border border-error/40 bg-error/5 px-6 py-5">
      <p class="text-sm font-medium text-ink">{props.message}</p>
      {props.detail && <p class="mt-1 text-sm text-body">{props.detail}</p>}
      <button type="button" class={`${buttonSecondary} mt-4`} onClick={props.onRetry}>
        Try again
      </button>
    </div>
  )
}

/** Inline (non-blocking) mutation error under a form or button. */
export function InlineError({ error }: { error: ErrorDescription }) {
  return (
    <p role="alert" class="mt-2 text-sm text-error">
      {error.message}
      {error.detail ? ` — ${error.detail}` : ''}
    </p>
  )
}

export function InlineSuccess({ message }: { message: string }) {
  return (
    <p role="status" class="mt-2 text-sm text-success">
      {message}
    </p>
  )
}

// ─── Status chips: text label + tone, never color alone ───

type ChipTone = 'neutral' | 'info' | 'warning' | 'success' | 'error' | 'gold'

const TONE_CLASS: Record<ChipTone, string> = {
  neutral: 'bg-sand text-body',
  info: 'bg-info/15 text-ink',
  warning: 'bg-warning/20 text-ink',
  success: 'bg-success/15 text-ink',
  error: 'bg-error/15 text-error',
  gold: 'bg-gold/25 text-ink',
}

export function Chip({ label, tone }: { label: string; tone: ChipTone }) {
  return (
    <span
      class={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE_CLASS[tone]}`}
    >
      {label}
    </span>
  )
}

export type ChipStatus =
  | 'draft'
  | 'uploading'
  | 'processing'
  | 'ready'
  | 'error'
  | 'published'
  | 'active'
  | 'archived'
  | 'free'
  | 'paid'
  | 'upcoming'
  | 'cancelled'
  | 'replay ready'
  | 'replay processing'
  | 'awaiting replay'

const STATUS_CHIP: Record<ChipStatus, { label: string; tone: ChipTone }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  uploading: { label: 'Uploading', tone: 'info' },
  processing: { label: 'Processing', tone: 'warning' },
  ready: { label: 'Ready', tone: 'success' },
  error: { label: 'Error', tone: 'error' },
  published: { label: 'Published', tone: 'gold' },
  active: { label: 'Active', tone: 'success' },
  archived: { label: 'Archived', tone: 'neutral' },
  free: { label: 'Free', tone: 'neutral' },
  paid: { label: 'Paid', tone: 'gold' },
  upcoming: { label: 'Upcoming', tone: 'info' },
  cancelled: { label: 'Cancelled', tone: 'error' },
  'replay ready': { label: 'Replay ready', tone: 'success' },
  'replay processing': { label: 'Replay processing', tone: 'warning' },
  'awaiting replay': { label: 'Awaiting replay', tone: 'neutral' },
}

export function StatusChip({ status }: { status: ChipStatus }) {
  const chip = STATUS_CHIP[status]
  return <Chip label={chip.label} tone={chip.tone} />
}

// ─── Confirm dialog (native <dialog>, no custom overlay logic) ───

export function ConfirmDialog(props: {
  title: string
  body: string
  confirmLabel: string
  cancelLabel: string
  pending?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <dialog
      open
      class="fixed inset-0 z-40 m-auto w-full max-w-md rounded-lg border border-linen bg-surface-white p-6 shadow-lg"
    >
      <h2 class="font-display text-lg text-ink">{props.title}</h2>
      <p class="mt-2 text-sm text-body">{props.body}</p>
      <div class="mt-6 flex justify-end gap-3">
        <button
          type="button"
          class={buttonSecondary}
          disabled={props.pending}
          onClick={props.onCancel}
        >
          {props.cancelLabel}
        </button>
        <button
          type="button"
          class={buttonDanger}
          disabled={props.pending}
          onClick={props.onConfirm}
        >
          {props.pending ? 'Working…' : props.confirmLabel}
        </button>
      </div>
    </dialog>
  )
}

// ─── Media (R2 keys render through the gated signed-redirect route) ───

export function mediaUrl(key: string): string {
  return `/admin/media/${key}`
}

// ─── Navigation link (real href for semantics, SPA navigation on click) ───

export function RouteLink(props: {
  route: Route
  class?: string
  'aria-current'?: 'page'
  children: ComponentChildren
}) {
  return (
    <a
      href={routePath(props.route)}
      class={props.class}
      aria-current={props['aria-current']}
      onClick={(event) => {
        event.preventDefault()
        navigate(props.route)
      }}
    >
      {props.children}
    </a>
  )
}

// ─── Formatting ───

export function formatInstant(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
}

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─── useLoad: the list/detail loading state machine ───

export type LoadState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string; detail?: string }
  | { status: 'ready'; data: T }

export function useLoad<T>(load: () => Promise<T>, deps: ReadonlyArray<unknown>) {
  const [state, setState] = useState<LoadState<T>>({ status: 'loading' })
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let alive = true
    setState({ status: 'loading' })
    load()
      .then((data) => {
        if (alive) setState({ status: 'ready', data })
      })
      .catch((error: unknown) => {
        if (alive) setState({ status: 'error', ...describeError(error) })
      })
    return () => {
      alive = false
    }
  }, [...deps, tick])

  const reload = () => setTick((t) => t + 1)
  const setData = (update: (prev: T) => T) =>
    setState((s) => (s.status === 'ready' ? { status: 'ready', data: update(s.data) } : s))
  return { state, reload, setData }
}

// ─── AutosaveText: save-on-blur field with visible Saving…/Saved/error feedback ───

export function AutosaveText(props: {
  id: string
  label: string
  value: string | null
  multiline?: boolean
  placeholder?: string
  onSave: (value: string) => Promise<unknown>
}) {
  const [text, setText] = useState(props.value ?? '')
  const [feedback, setFeedback] = useState<
    | { kind: 'idle' }
    | { kind: 'saving' }
    | { kind: 'saved' }
    | { kind: 'error'; error: ErrorDescription }
  >({ kind: 'idle' })

  async function save() {
    if (text === (props.value ?? '') && feedback.kind !== 'error') return
    setFeedback({ kind: 'saving' })
    try {
      await props.onSave(text)
      setFeedback({ kind: 'saved' })
    } catch (error) {
      setFeedback({ kind: 'error', error: describeError(error) })
    }
  }

  const shared = {
    id: props.id,
    value: text,
    placeholder: props.placeholder,
    class: inputClass,
    onInput: (event: Event) =>
      setText((event.currentTarget as HTMLInputElement | HTMLTextAreaElement).value),
    onBlur: () => void save(),
  }

  return (
    <div>
      <label class="block text-xs font-medium text-body" for={props.id}>
        {props.label}
      </label>
      <div class="mt-1">
        {props.multiline ? <textarea rows={3} {...shared} /> : <input type="text" {...shared} />}
      </div>
      {feedback.kind === 'saving' && (
        <p role="status" class="mt-1 text-xs text-muted">
          Saving…
        </p>
      )}
      {feedback.kind === 'saved' && (
        <p role="status" class="mt-1 text-xs text-success">
          Saved
        </p>
      )}
      {feedback.kind === 'error' && (
        <p role="alert" class="mt-1 text-xs text-error">
          Couldn't save — {feedback.error.message}
          {feedback.error.detail ? ` (${feedback.error.detail})` : ''}. Click away to retry.
        </p>
      )}
    </div>
  )
}

// ─── useAction: the mutation state machine (pending/disabled + success + failure) ───

export function useAction() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<ErrorDescription | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function run<T>(fn: () => Promise<T>, successMessage?: string): Promise<T | undefined> {
    setPending(true)
    setError(null)
    setSuccess(null)
    try {
      const result = await fn()
      if (successMessage) setSuccess(successMessage)
      return result
    } catch (err) {
      setError(describeError(err))
      return undefined
    } finally {
      setPending(false)
    }
  }

  const reset = () => {
    setError(null)
    setSuccess(null)
  }

  return { run, pending, error, success, reset }
}
