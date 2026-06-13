/// <reference lib="dom" />
/**
 * AI cover generation + 4-candidate picker (ADR 18). The picker renders candidates
 * ALONGSIDE the existing covers of siblings — collection cohesion is judged in context,
 * never in isolation (hard requirement). Nothing persists until pickCover.
 */
import { useState } from 'preact/hooks'
import type { CoverTargetKind } from '@/features/(admin)/course-builder/covers'
import { useData } from './data'
import {
  buttonGhost,
  buttonPrimary,
  describeError,
  type ErrorDescription,
  InlineError,
  mediaUrl,
} from './ui'

export type CoverSibling = { id: string; title: string; key: string | null }

type GenState =
  | { status: 'idle' }
  | { status: 'generating' }
  | { status: 'failed'; error: ErrorDescription }
  | { status: 'picking'; candidates: string[] }

const ASPECT_CLASS: Record<CoverTargetKind, string> = {
  course: 'aspect-[2/3]',
  module: 'aspect-[2/3]',
  lesson: 'aspect-video',
}

export function CoverSection(props: {
  kind: CoverTargetKind
  targetId: string
  targetTitle: string
  currentKey: string | null
  siblings: CoverSibling[]
  onPicked: (key: string) => void
}) {
  const data = useData()
  const [subject, setSubject] = useState(props.targetTitle)
  const [gen, setGen] = useState<GenState>({ status: 'idle' })
  const [selected, setSelected] = useState<string | null>(null)
  const [pickPending, setPickPending] = useState(false)
  const [pickError, setPickError] = useState<ErrorDescription | null>(null)
  const [savedKey, setSavedKey] = useState<string | null>(null)

  const aspect = ASPECT_CLASS[props.kind]
  const heading = props.kind === 'lesson' ? 'Thumbnail' : 'Cover art'
  const currentKey = savedKey ?? props.currentKey

  async function generate() {
    setGen({ status: 'generating' })
    setSelected(null)
    setPickError(null)
    try {
      const result = await data.generateCovers({ kind: props.kind, id: props.targetId, subject })
      setGen({ status: 'picking', candidates: result.candidates })
    } catch (error) {
      setGen({ status: 'failed', error: describeError(error) })
    }
  }

  async function confirmPick() {
    if (!selected) return
    setPickPending(true)
    setPickError(null)
    try {
      await data.pickCover({ kind: props.kind, id: props.targetId, key: selected })
      setSavedKey(selected)
      setGen({ status: 'idle' })
      setSelected(null)
      props.onPicked(selected)
    } catch (error) {
      const { message, detail } = describeError(error)
      setPickError({
        message: `We couldn't save that cover — ${message}`,
        ...(detail ? { detail } : {}),
      })
    } finally {
      setPickPending(false)
    }
  }

  return (
    <section class="rounded-md border border-linen bg-surface-white p-5">
      <h3 class="text-sm font-semibold text-ink">{heading}</h3>

      <div class="mt-3 flex items-start gap-5">
        <div class={`${aspect} w-28 shrink-0 overflow-hidden rounded-md bg-sand`}>
          {currentKey ? (
            <img
              src={mediaUrl(currentKey)}
              alt="Current cover"
              class="h-full w-full object-cover"
            />
          ) : (
            <p class="flex h-full items-center justify-center px-2 text-center text-xs text-muted">
              No cover yet
            </p>
          )}
        </div>

        <div class="min-w-0 flex-1">
          <label
            class="block text-xs font-medium text-body"
            for={`cover-subject-${props.targetId}`}
          >
            Cover subject
          </label>
          <input
            id={`cover-subject-${props.targetId}`}
            class="mt-1 w-full max-w-sm rounded-sm border border-linen bg-surface-white px-3 py-2 text-sm text-ink focus:border-gold"
            value={subject}
            onInput={(e) => setSubject((e.currentTarget as HTMLInputElement).value)}
          />
          <p class="mt-1 text-xs text-muted">
            The subject is the only thing that varies — style stays consistent across the
            collection.
          </p>
          <button
            type="button"
            class={`${buttonPrimary} mt-3`}
            disabled={gen.status === 'generating' || subject.trim().length === 0}
            onClick={() => void generate()}
          >
            {gen.status === 'generating' ? 'Generating…' : 'Generate covers'}
          </button>
          {savedKey && gen.status === 'idle' && (
            <p role="status" class="mt-2 text-sm text-success">
              Cover saved.
            </p>
          )}
        </div>
      </div>

      {gen.status === 'generating' && (
        <div class="mt-5" aria-busy="true">
          <p class="text-sm text-body">
            Generating 4 covers — this takes a minute or two. Stay on this page.
          </p>
          <div class="mt-3 grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                data-skeleton-tile
                class={`${aspect} rounded-md bg-sand motion-safe:animate-pulse`}
              />
            ))}
          </div>
        </div>
      )}

      {gen.status === 'failed' && (
        <div role="alert" class="mt-5 rounded-md border border-error/40 bg-error/5 px-4 py-3">
          <p class="text-sm font-medium text-ink">
            We couldn't generate covers — {gen.error.message}
          </p>
          {gen.error.detail && <p class="mt-1 text-sm text-body">{gen.error.detail}</p>}
          <p class="mt-1 text-sm text-body">
            Nothing was saved. This is usually temporary — try again in a moment.
          </p>
          <button type="button" class={`${buttonGhost} mt-3`} onClick={() => void generate()}>
            Try again
          </button>
        </div>
      )}

      {gen.status === 'picking' && (
        <div data-cover-picker class="mt-5">
          <p class="text-sm text-body">
            Here are 4 options next to the covers this one will sit beside — pick the one that
            belongs to the family.
          </p>
          <div class="mt-3 flex flex-wrap items-end gap-3">
            {gen.candidates.map((key, index) => (
              <button
                key={key}
                type="button"
                aria-label={`Candidate ${index + 1}`}
                aria-pressed={selected === key}
                class={`w-28 overflow-hidden rounded-md border-2 ${
                  selected === key ? 'border-gold' : 'border-transparent hover:border-linen'
                }`}
                onClick={() => setSelected(key)}
              >
                <img
                  src={mediaUrl(key)}
                  alt={`Candidate ${index + 1}`}
                  class={`${aspect} w-full object-cover`}
                />
              </button>
            ))}
            <div class="mx-2 h-24 w-px self-center bg-linen" aria-hidden="true" />
            {props.siblings.map((sibling) => (
              <figure key={sibling.id} class="w-24">
                {sibling.key ? (
                  <img
                    src={mediaUrl(sibling.key)}
                    alt={sibling.title}
                    class={`${aspect} w-full rounded-md object-cover opacity-80`}
                  />
                ) : (
                  <div
                    class={`${aspect} flex w-full items-center justify-center rounded-md bg-sand`}
                  >
                    <span class="text-xs text-muted">No cover</span>
                  </div>
                )}
                <figcaption class="mt-1 truncate text-center text-xs text-muted">
                  {sibling.title}
                </figcaption>
              </figure>
            ))}
          </div>
          <div class="mt-4 flex items-center gap-3">
            <button
              type="button"
              class={buttonPrimary}
              disabled={!selected || pickPending}
              onClick={() => void confirmPick()}
            >
              {pickPending ? 'Saving…' : 'Use this cover'}
            </button>
            <button
              type="button"
              class={buttonGhost}
              disabled={pickPending}
              onClick={() => void generate()}
            >
              Generate 4 more
            </button>
          </div>
          {pickError && <InlineError error={pickError} />}
        </div>
      )}
    </section>
  )
}
