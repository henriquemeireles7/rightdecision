/// <reference lib="dom" />
/**
 * The ADR 11 trust moment: distilled interview fields render as sand-tinted "suggested" cards
 * the user must EXPLICITLY accept. Accepting flips a field to a confirmed (gold-check) state;
 * only accepted fields are written to the playbook (source='interview', confirmedAt set). A
 * field is never filled before the user accepts — the visual proposed→confirmed distinction is
 * the whole point.
 */
import { useState } from 'preact/hooks'
import { confirmInterview } from '../lib/data'

export type SuggestedField = { fieldId: string; label: string; value: string }

type Props = {
  interviewId: string
  fields: SuggestedField[]
  onConfirmed?: (confirmedFieldIds: string[]) => void
}

export function InterviewConfirm({ interviewId, fields, onConfirmed }: Props) {
  // Default: every distilled field is pre-selected to accept; the user un-checks what's wrong.
  const [accepted, setAccepted] = useState<Set<string>>(new Set(fields.map((f) => f.fieldId)))
  const [confirmedIds, setConfirmedIds] = useState<string[] | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)

  if (fields.length === 0) {
    return (
      <div class="rounded-lg border border-linen bg-sand px-6 py-8 text-center">
        <p class="text-body">Nothing to suggest yet — keep talking and we'll pull it together.</p>
      </div>
    )
  }

  if (confirmedIds) {
    return (
      <div role="status" class="rounded-lg border border-gold bg-sand px-6 py-6 text-ink">
        <p class="font-display text-xl">Added to your playbook</p>
        <p class="mt-1 text-body">
          {confirmedIds.length} {confirmedIds.length === 1 ? 'answer' : 'answers'} saved. You can
          edit any of them anytime.
        </p>
      </div>
    )
  }

  const toggle = (fieldId: string) =>
    setAccepted((prev) => {
      const next = new Set(prev)
      if (next.has(fieldId)) next.delete(fieldId)
      else next.add(fieldId)
      return next
    })

  async function accept() {
    if (saving) return
    setSaving(true)
    setError(false)
    try {
      const ids = [...accepted]
      const result = await confirmInterview(interviewId, ids)
      setConfirmedIds(result.confirmedFieldIds)
      onConfirmed?.(result.confirmedFieldIds)
    } catch {
      setError(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div class="space-y-4">
      <div>
        <h2 class="font-display text-2xl text-ink">Here's what I heard</h2>
        <p class="mt-1 text-body">
          Nothing is saved yet. Keep what's right, drop what's not — then add it to your playbook.
        </p>
      </div>

      <ul class="space-y-3">
        {fields.map((field) => {
          const isAccepted = accepted.has(field.fieldId)
          return (
            <li key={field.fieldId}>
              <label
                // Proposed = sand-tinted "suggested"; accepted = gold ring (the trust flip).
                class={`flex cursor-pointer gap-3 rounded-lg border px-4 py-3 ${
                  isAccepted ? 'border-gold bg-sand' : 'border-linen bg-surface-white'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isAccepted}
                  onChange={() => toggle(field.fieldId)}
                  class="mt-1 h-5 w-5 accent-[var(--color-gold)]"
                  aria-label={`Accept suggestion for ${field.label}`}
                />
                <span class="flex-1">
                  <span class="block text-sm font-medium text-muted">
                    {field.label}
                    {!isAccepted ? (
                      <span class="ml-2 rounded-sm bg-sand px-1.5 py-0.5 text-xs text-body">
                        suggested
                      </span>
                    ) : null}
                  </span>
                  <span class="mt-0.5 block text-ink">{field.value}</span>
                </span>
              </label>
            </li>
          )
        })}
      </ul>

      {error ? (
        <p role="alert" class="text-sm text-error">
          That didn't save. Try once more.
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => void accept()}
        disabled={saving || accepted.size === 0}
        class="min-h-11 rounded-sm bg-gold px-6 py-2 font-medium text-ink motion-safe:transition-colors hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {accepted.size === 0 ? 'Pick at least one' : `Add ${accepted.size} to my playbook`}
      </button>
    </div>
  )
}
