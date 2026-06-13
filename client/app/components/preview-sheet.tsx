/// <reference lib="dom" />
/**
 * Module preview sheet — native <dialog>, never custom overlay logic.
 * Locked modules: description + lesson TITLES + upgrade CTA (a locked card tap is
 * never a dead end). Unlocked modules: the lesson list IS the navigation.
 * The upgrade CTA is gold with INK text (gold contrast rule).
 */
import { useEffect, useRef } from 'preact/hooks'
import { type CatalogLesson, type CatalogModule, isUnlockedLesson } from '../lib/data'
import { formatDuration } from '../lib/format'
import { Link } from '../router'

type PreviewSheetProps = {
  module: CatalogModule
  locked: boolean
  onClose: () => void
}

function LessonRow({ lesson, onClose }: { lesson: CatalogLesson; onClose: () => void }) {
  if (!isUnlockedLesson(lesson)) {
    return <li class="py-2.5 text-body">{lesson.title}</li>
  }
  const completed = Boolean(lesson.progress?.completedAt)
  const processing = lesson.videoStatus !== 'ready'
  if (processing) {
    return (
      <li class="flex min-h-11 items-center justify-between gap-3 py-2.5 text-body">
        <span>{lesson.title}</span>
        <span class="shrink-0 rounded-full bg-sand px-3 py-1 text-xs text-muted">Processing</span>
      </li>
    )
  }
  return (
    <li>
      <Link
        href={`/app/lessons/${lesson.id}`}
        onClick={() => onClose()}
        class="flex min-h-11 items-center justify-between gap-3 rounded-sm py-2.5 text-ink motion-safe:transition-colors hover:text-gold-hover"
      >
        <span>{lesson.title}</span>
        <span class="shrink-0 text-sm text-muted">
          {completed ? (
            <span class="text-success">Done</span>
          ) : (
            formatDuration(lesson.durationSeconds)
          )}
        </span>
      </Link>
    </li>
  )
}

export function PreviewSheet({ module: courseModule, locked, onClose }: PreviewSheetProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (typeof dialog.showModal === 'function' && !dialog.open) {
      try {
        dialog.showModal()
      } catch {
        dialog.setAttribute('open', '')
      }
    } else if (!dialog.open) {
      dialog.setAttribute('open', '')
    }
  }, [])

  return (
    <dialog
      ref={ref}
      aria-label={courseModule.title}
      onClose={onClose}
      class="m-auto w-[calc(100vw-2rem)] max-w-[560px] rounded-lg border border-linen bg-cream p-0 text-ink backdrop:bg-ink/40"
    >
      <div class="max-h-[80vh] overflow-y-auto p-6">
        <div class="flex items-start justify-between gap-4">
          <h2 class="font-display text-2xl text-ink">{courseModule.title}</h2>
          <button
            type="button"
            aria-label="Close preview"
            onClick={() => {
              const dialog = ref.current
              // dialog.close() fires the close event → onClose; fall back when unsupported
              if (dialog && typeof dialog.close === 'function') dialog.close()
              else onClose()
            }}
            class="min-h-11 min-w-11 rounded-full text-body motion-safe:transition-colors hover:bg-sand"
          >
            ✕
          </button>
        </div>
        {courseModule.description ? <p class="mt-2 text-body">{courseModule.description}</p> : null}
        <h3 class="mt-6 text-sm font-medium uppercase tracking-wide text-muted">Lessons</h3>
        <ul class="mt-2 divide-y divide-linen">
          {courseModule.lessons.map((lesson) => (
            <LessonRow key={lesson.id} lesson={lesson} onClose={onClose} />
          ))}
        </ul>
        {locked ? (
          <div class="mt-6 border-t border-linen pt-6 text-center">
            <p class="text-body">This module is part of the full program.</p>
            <a
              href="/api/checkout/redirect"
              class="mt-4 inline-block min-h-11 rounded-sm bg-gold px-6 py-2.5 font-medium text-ink motion-safe:transition-colors hover:bg-gold-hover"
            >
              Unlock the full program
            </a>
          </div>
        ) : null}
      </div>
    </dialog>
  )
}
