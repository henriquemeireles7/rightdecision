/// <reference lib="dom" />
/**
 * The interview-mode panel (P6, ADR 11): a page-scoped text Q&A that DISTILLS into the page's
 * fields for the user to CONFIRM — the trust moment. It is an ALTERNATIVE path to the same
 * fields the typed playbook form fills; it never disrupts the typed fill-in.
 *
 * Flow (mirrors the interview state machine, features/(life)/interview):
 *   startInterview → walk one scripted question per field (each turn persisted via the plain
 *   request/response /messages POST — NOT SSE, the interview endpoint is non-streamed) →
 *   distillInterview → render <InterviewConfirm> with the distilled values as sand-tinted
 *   "suggested" fields. NOTHING is written to the playbook until the user explicitly accepts in
 *   InterviewConfirm (which calls confirm). INTERVIEW_INVALID_STATE / network errors surface as
 *   a calm error state with retry — never a crash.
 *
 * Panel, not route (documented in client/app/CLAUDE.md): the flow is page-scoped and short, the
 * /app shell is ~22KB gzipped (no lazy-load budget pressure), and a panel keeps the interview
 * co-located with the page whose fields it fills — no extra router state to thread documentId
 * through. It renders in-place above the typed fields.
 */
import { useEffect, useRef, useState } from 'preact/hooks'
import { ApiError } from '@/features/(shared)/api-client'
import { distillInterview, sendInterviewMessage, startInterview } from '../lib/data'
import { InterviewConfirm, type SuggestedField } from './interview-confirm'
import { ErrorState, Skeleton } from './states'

/** A page field the interview can fill — its id + human label (the scripted question text). */
export type InterviewField = { id: string; label: string }

type Props = {
  documentId: string
  pageId: string
  fields: InterviewField[]
  /** Called after the user confirms — the page refetches so confirmed answers show. */
  onConfirmed?: (confirmedFieldIds: string[]) => void
  /** The user backed out (abandon affordance) — return to the typed fields. */
  onClose?: () => void
}

type Phase =
  | { kind: 'starting' }
  | { kind: 'error'; error: ApiError; retry: () => void }
  | { kind: 'asking'; interviewId: string; index: number }
  | { kind: 'distilling'; interviewId: string }
  | { kind: 'confirm'; interviewId: string; suggested: SuggestedField[] }

const toApiError = (err: unknown): ApiError =>
  err instanceof ApiError
    ? err
    : new ApiError('INTERNAL_ERROR', 0, err instanceof Error ? err.message : 'Request failed')

/** Phrase a field label as a gentle question (no AI call — the script is the field set). */
function questionFor(field: InterviewField): string {
  return field.label
}

export function InterviewPanel({ documentId, pageId, fields, onConfirmed, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>({ kind: 'starting' })
  const [answer, setAnswer] = useState('')
  const [busy, setBusy] = useState(false)
  // Guard the start effect against double-invocation (StrictMode / re-render) per interview mount.
  const startedRef = useRef(false)

  function begin() {
    startedRef.current = true
    setPhase({ kind: 'starting' })
    startInterview({ documentId, pageId })
      .then(async (res) => {
        const interviewId = res.interview.id
        // Post the first question as an assistant turn, then open the loop.
        if (fields[0]) {
          await sendInterviewMessage(interviewId, 'assistant', questionFor(fields[0]))
        }
        setPhase({ kind: 'asking', interviewId, index: 0 })
      })
      .catch((err) => {
        startedRef.current = false
        setPhase({
          kind: 'error',
          error: toApiError(err),
          retry: () => {
            if (!startedRef.current) begin()
          },
        })
      })
  }

  useEffect(() => {
    // documentId/pageId identify the mount; the ref guards against a double start.
    if (startedRef.current) return
    begin()
  }, [documentId, pageId])

  if (phase.kind === 'starting') {
    return (
      <div class="rounded-lg border border-linen bg-sand p-6" aria-busy="true">
        <Skeleton class="h-6 w-2/3" label="Starting the interview" />
        <Skeleton class="mt-3 h-24 w-full" />
      </div>
    )
  }

  if (phase.kind === 'error') {
    return (
      <ErrorState
        what="We couldn't run the interview just now"
        error={phase.error}
        onRetry={phase.retry}
      />
    )
  }

  if (phase.kind === 'confirm') {
    return (
      <section
        class="rounded-lg border border-linen bg-cream p-6"
        aria-label="Confirm your answers"
      >
        <InterviewConfirm
          interviewId={phase.interviewId}
          fields={phase.suggested}
          onConfirmed={onConfirmed}
        />
      </section>
    )
  }

  if (phase.kind === 'distilling') {
    return (
      <div class="rounded-lg border border-linen bg-sand p-6" aria-busy="true">
        <p class="text-body">
          <span class="motion-safe:animate-pulse">Pulling your answers together…</span>
        </p>
      </div>
    )
  }

  // phase.kind === 'asking'
  const interviewId = phase.interviewId
  const index = phase.index
  const field = fields[index]
  const isLast = index >= fields.length - 1

  async function submit() {
    if (busy) return
    const trimmed = answer.trim()
    if (!trimmed) return
    setBusy(true)
    try {
      await sendInterviewMessage(interviewId, 'user', trimmed)
      setAnswer('')
      if (!isLast) {
        const nextField = fields[index + 1]
        if (nextField) {
          await sendInterviewMessage(interviewId, 'assistant', questionFor(nextField))
        }
        setPhase({ kind: 'asking', interviewId, index: index + 1 })
        setBusy(false)
        return
      }
      // Last answer in — distill, then hand off to the confirm step.
      setPhase({ kind: 'distilling', interviewId })
      const result = await distillInterview(interviewId)
      const suggested: SuggestedField[] = Object.entries(result.distilledFields).map(
        ([fieldId, value]) => ({
          fieldId,
          label: fields.find((f) => f.id === fieldId)?.label ?? fieldId,
          value,
        }),
      )
      setPhase({ kind: 'confirm', interviewId, suggested })
    } catch (err) {
      setPhase({
        kind: 'error',
        error: toApiError(err),
        retry: () => setPhase({ kind: 'asking', interviewId, index }),
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section class="rounded-lg border border-linen bg-cream p-6" aria-label="Interview">
      <div class="flex items-baseline justify-between gap-4">
        <p class="text-sm text-muted">
          Question {index + 1} of {fields.length}
        </p>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            class="min-h-11 py-2 text-sm text-body motion-safe:transition-colors hover:text-ink"
          >
            Back to typing
          </button>
        ) : null}
      </div>

      {/* The question is announced politely; the panel asks one field at a time. */}
      <div aria-live="polite">
        <p class="mt-2 font-display text-2xl text-ink">{field ? questionFor(field) : ''}</p>
      </div>

      <form
        class="mt-4"
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
      >
        <label class="sr-only" for="interview-answer">
          Your answer
        </label>
        <textarea
          id="interview-answer"
          value={answer}
          disabled={busy}
          rows={3}
          placeholder="Say it plainly — your words are enough."
          onInput={(e) => setAnswer((e.target as HTMLTextAreaElement).value)}
          class="w-full resize-none rounded-md border border-linen bg-surface-white px-3 py-2 text-ink placeholder:text-muted focus:border-gold disabled:opacity-60"
        />
        <div class="mt-3 flex justify-end">
          <button
            type="submit"
            disabled={busy || answer.trim().length === 0}
            class="min-h-11 rounded-sm bg-gold px-6 py-2 font-medium text-ink motion-safe:transition-colors hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLast ? 'Done' : 'Next'}
          </button>
        </div>
      </form>
    </section>
  )
}
