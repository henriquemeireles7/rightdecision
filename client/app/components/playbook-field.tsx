/// <reference lib="dom" />
/**
 * One playbook field (ADR 20): visible label (never placeholder-as-label), an input
 * per kind — select/multi_select are calm radio/checkbox groups, never dropdowns —
 * exampleAnswer as quiet invitation text under empty fields, autosave on blur +
 * debounce with a quiet "Saved", and a gentle retry that never loses the value.
 * Deprecated fields with an existing answer render read-only with a soft note.
 */

import { useState } from 'preact/hooks'
import type { Scheduler } from '../lib/autosave'
import { useAutosave } from '../lib/autosave'
import type { PlaybookPageField } from '../lib/data'

type Props = {
  field: PlaybookPageField
  onSave: (value: string) => Promise<unknown>
  /** Injection for TESTS ONLY — production debounces on window timers. */
  scheduler?: Scheduler
}

const labelClass = 'block font-medium text-ink'
const inputClass =
  'mt-2 w-full rounded-sm border border-linen bg-surface-white px-3 py-2 text-ink placeholder:text-muted focus:border-gold'
const optionClass =
  'flex min-h-11 cursor-pointer items-center gap-3 rounded-sm border border-linen bg-surface-white px-3 py-2 text-body has-[:checked]:border-gold has-[:checked]:text-ink'

function SaveStatus({
  state,
  onRetry,
}: {
  state: ReturnType<typeof useAutosave>['state']
  onRetry: () => void
}) {
  if (state.kind === 'saved') {
    return (
      <p role="status" class="mt-1.5 text-xs text-muted">
        Saved
      </p>
    )
  }
  if (state.kind === 'error') {
    return (
      <p role="alert" class="mt-1.5 text-sm text-error">
        Couldn't save just now — your words are still here.{' '}
        <button type="button" onClick={onRetry} class="font-medium underline underline-offset-2">
          Try again
        </button>
      </p>
    )
  }
  // idle and pending render NOTHING — no spinners while someone is reflecting
  return null
}

function ExampleAnswer({ field, show }: { field: PlaybookPageField; show: boolean }) {
  if (!field.exampleAnswer || !show) return null
  return <p class="mt-1.5 text-sm italic text-muted">For example: {field.exampleAnswer}</p>
}

const autoResize = (el: HTMLTextAreaElement) => {
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

export function PlaybookField({ field, onSave, scheduler }: Props) {
  const inputId = `pb-field-${field.id}`
  const [value, setValue] = useState(field.answer?.value ?? '')
  // Empty values never save (answers can't be deleted) — resolve quietly instead.
  const autosave = useAutosave(
    (next: string) => (next.trim() === '' ? Promise.resolve() : onSave(next)),
    { scheduler },
  )

  if (field.deprecatedInVersion != null) {
    // Retired question: keep the member's words visible, never editable, never shaming.
    if (!field.answer) return null
    return (
      <div class="rounded-md border border-linen bg-sand/40 p-4">
        <p class={labelClass}>{field.label}</p>
        <p class="mt-2 whitespace-pre-wrap text-body">{field.answer.value}</p>
        <p class="mt-2 text-xs text-muted">
          This question has been retired — your answer stays saved.
        </p>
      </div>
    )
  }

  const handleText = (next: string) => {
    setValue(next)
    autosave.queue(next)
  }

  const pick = (next: string) => {
    setValue(next)
    autosave.queue(next)
    autosave.flush()
  }

  if (field.kind === 'select' || field.kind === 'multi_select') {
    const options = field.options ?? []
    const selected = new Set(value === '' ? [] : value.split(', '))
    const toggle = (option: string) => {
      const next = new Set(selected)
      if (next.has(option)) next.delete(option)
      else next.add(option)
      pick(options.filter((o) => next.has(o)).join(', '))
    }
    return (
      <fieldset>
        <legend class={labelClass}>{field.label}</legend>
        <div class="mt-2 space-y-2">
          {options.map((option) => (
            <label key={option} class={optionClass}>
              <input
                type={field.kind === 'select' ? 'radio' : 'checkbox'}
                name={inputId}
                value={option}
                checked={field.kind === 'select' ? value === option : selected.has(option)}
                onChange={() => (field.kind === 'select' ? pick(option) : toggle(option))}
                class="accent-gold"
              />
              {option}
            </label>
          ))}
        </div>
        <ExampleAnswer field={field} show={value === ''} />
        <SaveStatus state={autosave.state} onRetry={autosave.retry} />
      </fieldset>
    )
  }

  if (field.kind === 'scale_1_10') {
    return (
      <fieldset>
        <legend class={labelClass}>{field.label}</legend>
        <div class="mt-2 flex flex-wrap gap-1.5">
          {Array.from({ length: 10 }, (_, i) => `${i + 1}`).map((n) => (
            <label
              key={n}
              class="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-sm border border-linen bg-surface-white text-body has-[:checked]:border-gold has-[:checked]:bg-gold/15 has-[:checked]:font-medium has-[:checked]:text-ink"
            >
              <input
                type="radio"
                name={inputId}
                value={n}
                checked={value === n}
                onChange={() => pick(n)}
                class="sr-only"
              />
              {n}
            </label>
          ))}
        </div>
        <ExampleAnswer field={field} show={value === ''} />
        <SaveStatus state={autosave.state} onRetry={autosave.retry} />
      </fieldset>
    )
  }

  return (
    <div>
      <label class={labelClass} for={inputId}>
        {field.label}
      </label>
      {field.kind === 'long_text' ? (
        <textarea
          id={inputId}
          rows={4}
          value={value}
          placeholder={field.placeholder}
          class={`${inputClass} min-h-28 resize-none overflow-hidden`}
          onInput={(event) => {
            const el = event.currentTarget as HTMLTextAreaElement
            autoResize(el)
            handleText(el.value)
          }}
          onBlur={autosave.flush}
        />
      ) : (
        <input
          id={inputId}
          type={field.kind === 'date' ? 'date' : 'text'}
          value={value}
          placeholder={field.kind === 'date' ? undefined : field.placeholder}
          class={inputClass}
          onInput={(event) => handleText((event.currentTarget as HTMLInputElement).value)}
          onBlur={autosave.flush}
        />
      )}
      <ExampleAnswer field={field} show={value === ''} />
      <SaveStatus state={autosave.state} onRetry={autosave.retry} />
    </div>
  )
}
