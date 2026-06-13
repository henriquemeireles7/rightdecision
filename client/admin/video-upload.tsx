/// <reference lib="dom" />
/**
 * Direct-to-Stream tus upload component (lesson videos AND live replays — the caller maps
 * its status enum onto UploadStatus). The uploader is INJECTED via UploaderContext: real
 * tus-js-client in the bundle, a scripted fake in tests. Bytes never touch Hono.
 * Every state explains itself — an unexplained spinner is a support call.
 */
import { useRef, useState } from 'preact/hooks'
import { buttonGhost, buttonSecondary, describeError } from './ui'
import type { UploadHandle } from './uploader'
import { useUploader } from './uploader'

export type UploadStatus = 'none' | 'uploading' | 'processing' | 'ready' | 'error'

type Phase =
  | { name: 'idle'; error?: string }
  | { name: 'requesting' }
  | { name: 'uploading'; percent: number }
  | { name: 'paused'; percent: number }
  | { name: 'failed'; percent: number; message: string }
  | { name: 'done' }

const PROCESSING_COPY = "Processing — we'll mark it ready automatically. You can leave this page."

export function VideoUpload(props: {
  label: string
  status: UploadStatus
  requestUploadUrl: (
    uploadLengthBytes: number,
  ) => Promise<{ uploadUrl: string; streamVideoId: string }>
  onUploadComplete: () => void
}) {
  const uploader = useUploader()
  const [phase, setPhase] = useState<Phase>({ name: 'idle' })
  const handleRef = useRef<UploadHandle | null>(null)
  const percentRef = useRef(0)

  async function startUpload(file: File) {
    setPhase({ name: 'requesting' })
    let uploadUrl: string
    try {
      ;({ uploadUrl } = await props.requestUploadUrl(file.size))
    } catch (error) {
      const { message, detail } = describeError(error)
      setPhase({
        name: 'idle',
        error: `We couldn't start the upload — ${message}${detail ? ` (${detail})` : ''}. Check your connection and try again.`,
      })
      return
    }
    percentRef.current = 0
    setPhase({ name: 'uploading', percent: 0 })
    handleRef.current = uploader.upload(file, uploadUrl, {
      onProgress: (percent) => {
        percentRef.current = percent
        setPhase((p) =>
          p.name === 'uploading' || p.name === 'failed' ? { name: 'uploading', percent } : p,
        )
      },
      onSuccess: () => {
        setPhase({ name: 'done' })
        props.onUploadComplete()
      },
      onError: (error) => {
        setPhase({ name: 'failed', percent: percentRef.current, message: error.message })
      },
    })
  }

  const filePicker = (label: string) => (
    <label class={`${buttonSecondary} cursor-pointer`}>
      {label}
      <input
        type="file"
        accept="video/*"
        class="sr-only"
        onChange={(event) => {
          const file = (event.currentTarget as HTMLInputElement).files?.[0]
          if (file) void startUpload(file)
        }}
      />
    </label>
  )

  if (phase.name === 'requesting') {
    return (
      <div class="text-sm text-body" aria-busy="true">
        Preparing upload — asking the video service for an upload link…
      </div>
    )
  }

  if (phase.name === 'uploading' || phase.name === 'paused') {
    const paused = phase.name === 'paused'
    return (
      <div>
        <p class="text-sm font-medium text-ink">
          {paused ? 'Paused' : 'Uploading'} — {phase.percent}%
        </p>
        <div
          role="progressbar"
          aria-valuenow={phase.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${props.label} upload progress`}
          class="mt-2 h-2 w-full overflow-hidden rounded-full bg-sand"
        >
          <div class="h-full bg-gold" style={{ width: `${phase.percent}%` }} />
        </div>
        <p class="mt-1 text-xs text-muted">
          Keep this tab open while uploading. Pausing keeps your progress.
        </p>
        <div class="mt-3 flex gap-2">
          {paused ? (
            <button
              type="button"
              class={buttonSecondary}
              onClick={() => {
                handleRef.current?.resume()
                setPhase({ name: 'uploading', percent: phase.percent })
              }}
            >
              Resume
            </button>
          ) : (
            <button
              type="button"
              class={buttonSecondary}
              onClick={() => {
                handleRef.current?.pause()
                setPhase({ name: 'paused', percent: phase.percent })
              }}
            >
              Pause
            </button>
          )}
          <button
            type="button"
            class={buttonGhost}
            onClick={() => {
              handleRef.current?.abort()
              handleRef.current = null
              setPhase({ name: 'idle' })
            }}
          >
            Cancel upload
          </button>
        </div>
      </div>
    )
  }

  if (phase.name === 'failed') {
    return (
      <div role="alert">
        <p class="text-sm font-medium text-error">
          The upload failed at {phase.percent}% — {phase.message}
        </p>
        <p class="mt-1 text-sm text-body">
          Your progress is saved. Usually this is a connection hiccup — retrying continues where it
          stopped.
        </p>
        <button
          type="button"
          class={`${buttonSecondary} mt-3`}
          onClick={() => {
            handleRef.current?.resume()
            setPhase({ name: 'uploading', percent: phase.percent })
          }}
        >
          Try again
        </button>
      </div>
    )
  }

  if (phase.name === 'done') {
    return <p class="text-sm text-body">{PROCESSING_COPY}</p>
  }

  // idle — copy depends on what the server already knows about this video
  return (
    <div>
      {phase.error && (
        <p role="alert" class="mb-3 text-sm text-error">
          {phase.error}
        </p>
      )}
      {props.status === 'ready' && (
        <p class="mb-3 text-sm text-success">Video is ready and playable.</p>
      )}
      {props.status === 'processing' && <p class="mb-3 text-sm text-body">{PROCESSING_COPY}</p>}
      {props.status === 'uploading' && (
        <p class="mb-3 text-sm text-body">
          An upload was started but never finished. Pick the file again to restart it.
        </p>
      )}
      {props.status === 'error' && (
        <p class="mb-3 text-sm text-error">
          Something went wrong with the last video while the video service processed it. Upload the
          file again — if it keeps failing, the file itself may be the problem.
        </p>
      )}
      {props.status !== 'processing' &&
        filePicker(
          props.status === 'ready' ? 'Replace video' : `Upload ${props.label.toLowerCase()}`,
        )}
    </div>
  )
}
