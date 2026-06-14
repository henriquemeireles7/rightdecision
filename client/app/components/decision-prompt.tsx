/// <reference lib="dom" />
/**
 * The decision prompt — an INLINE panel below the player on cream, never a modal
 * (ADR 1). Locked until video end; one question + a free-text commitment; submitting
 * completes the lesson. Confirmation is sage-green and quiet, with the visible
 * "Decisions made" count (fetched from the catalog read model).
 */
import { useEffect, useState } from 'preact/hooks'
import { answerDecisionPrompt, countDecisionsMade, fetchCatalog } from '../lib/data'

type DecisionPromptProps = {
  lessonId: string
  prompt: string
  /** Unlocks at video end (or skip-to-end) — parent owns the player events. */
  enabled: boolean
  initialAnswer: string | null
  initialCompletedAt: string | null
}

function DecisionsMadeCount() {
  const [count, setCount] = useState<number | null>(null)
  useEffect(() => {
    let cancelled = false
    fetchCatalog()
      .then((catalog) => {
        if (!cancelled) setCount(countDecisionsMade(catalog))
      })
      .catch(() => {
        // count is celebration, not function — stay quiet on failure
      })
    return () => {
      cancelled = true
    }
  }, [])
  if (count === null) return null
  return (
    <p class="mt-2 text-sm font-medium text-success">
      Decisions made: <span class="tabular-nums">{count}</span>
    </p>
  )
}

export function DecisionPrompt({
  lessonId,
  prompt,
  enabled,
  initialAnswer,
  initialCompletedAt,
}: DecisionPromptProps) {
  const [answer, setAnswer] = useState('')
  const [savedAnswer, setSavedAnswer] = useState<string | null>(
    initialCompletedAt || initialAnswer ? initialAnswer : null,
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(false)

  const handleSubmit = async (event: Event) => {
    event.preventDefault()
    const trimmed = answer.trim()
    if (!trimmed || submitting) return
    setSubmitting(true)
    setError(false)
    try {
      const result = await answerDecisionPrompt(lessonId, trimmed)
      setSavedAnswer(result.promptAnswer ?? trimmed)
    } catch {
      setError(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section aria-label="Your decision" class="mx-auto max-w-[640px] px-4 py-10">
      <h2 class="font-display text-2xl text-ink">Your decision</h2>
      <p class="mt-2 text-lg text-body">{prompt}</p>

      {savedAnswer !== null ? (
        <div class="mt-6 rounded-md border-l-4 border-success bg-sand p-4" role="status">
          <p class="font-medium text-success">Decision recorded.</p>
          <p class="mt-2 whitespace-pre-wrap text-ink">{savedAnswer}</p>
          <DecisionsMadeCount />
        </div>
      ) : (
        <form onSubmit={handleSubmit} class="mt-6">
          {!enabled ? (
            <p class="mb-3 text-sm text-muted">Finish the video to unlock your decision.</p>
          ) : null}
          <label for="decision-answer" class="block text-sm font-medium text-ink">
            What will you do?
          </label>
          <textarea
            id="decision-answer"
            value={answer}
            disabled={!enabled || submitting}
            maxLength={2000}
            rows={4}
            onInput={(event) => setAnswer((event.target as HTMLTextAreaElement).value)}
            class="mt-2 w-full rounded-sm border border-linen bg-surface-white p-3 text-ink disabled:cursor-not-allowed disabled:opacity-60"
          />
          {error ? (
            <p role="alert" class="mt-2 text-sm text-error">
              We couldn't save your decision — the connection may have dropped. Your text is still
              here; try submitting again.
            </p>
          ) : null}
          <button
            type="submit"
            disabled={!enabled || submitting || answer.trim().length === 0}
            class="mt-4 min-h-11 rounded-sm bg-gold px-6 py-2.5 font-medium text-ink motion-safe:transition-colors hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Make it real'}
          </button>
        </form>
      )}
    </section>
  )
}
