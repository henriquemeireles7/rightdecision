/// <reference lib="dom" />
/**
 * Materials: direct-to-R2 upload via presigned PUT (bytes never touch Hono — PutFile is
 * injected so tests script progress/failure), list, delete. Attaching materials to a
 * program happens on the program detail screen, where the context lives.
 */
import { useState } from 'preact/hooks'
import { useData } from './data'
import {
  buttonGhost,
  buttonPrimary,
  ConfirmDialog,
  describeError,
  EmptyState,
  ErrorState,
  formatBytes,
  formatInstant,
  InlineSuccess,
  inputClass,
  ListSkeleton,
  useAction,
  useLoad,
} from './ui'
import { usePutFile } from './uploader'

type UploadPhase =
  | { name: 'idle'; error?: string }
  | { name: 'presigning' }
  | { name: 'putting'; percent: number }
  | { name: 'recording' }

export function MaterialsScreen() {
  const data = useData()
  const putFile = usePutFile()
  const { state, reload, setData } = useLoad(() => data.listMaterials(), [])
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [phase, setPhase] = useState<UploadPhase>({ name: 'idle' })
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const del = useAction()
  const [deleting, setDeleting] = useState<{ id: string; title: string } | null>(null)

  async function upload() {
    if (!file) return
    setUploadSuccess(null)

    setPhase({ name: 'presigning' })
    let uploadUrl: string
    let fileKey: string
    try {
      ;({ uploadUrl, fileKey } = await data.requestMaterialUploadUrl({
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
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
        error: `${message} — the file never reached storage. Check your connection and try again.`,
      })
      return
    }

    setPhase({ name: 'recording' })
    try {
      const result = await data.createMaterial({
        title: title.trim() || file.name,
        fileKey,
        fileSizeBytes: file.size,
        mimeType: file.type || 'application/octet-stream',
      })
      setData((d) => ({ materials: [result.material, ...d.materials] }))
      setFile(null)
      setTitle('')
      setPhase({ name: 'idle' })
      setUploadSuccess('Material uploaded.')
    } catch (error) {
      const { message, detail } = describeError(error)
      setPhase({
        name: 'idle',
        error: `The file uploaded, but we couldn't save its record — ${message}${detail ? ` (${detail})` : ''}. Try the upload again.`,
      })
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    const id = deleting.id
    const result = await del.run(() => data.deleteMaterial(id), 'Material deleted.')
    if (result) setData((d) => ({ materials: d.materials.filter((m) => m.id !== id) }))
    setDeleting(null)
  }

  if (state.status === 'loading') return <ListSkeleton rows={4} />
  if (state.status === 'error')
    return <ErrorState message={state.message} detail={state.detail} onRetry={reload} />

  const busy = phase.name !== 'idle'

  const uploadForm = (
    <div class="max-w-md rounded-md border border-linen bg-surface-white p-4">
      <h3 class="text-sm font-semibold text-ink">Upload a material</h3>
      {phase.name === 'idle' && phase.error && (
        <p role="alert" class="mt-2 text-sm text-error">
          {phase.error}
        </p>
      )}
      {!busy && (
        <div class="mt-3 space-y-3">
          <label class={`${buttonGhost} cursor-pointer`}>
            {file ? `File: ${file.name}` : 'Choose a file'}
            <input
              type="file"
              class="sr-only"
              onChange={(event) => {
                const picked = (event.currentTarget as HTMLInputElement).files?.[0] ?? null
                setFile(picked)
                if (picked) setTitle(picked.name.replace(/\.[^.]+$/, ''))
              }}
            />
          </label>
          {file && (
            <div>
              <label class="block text-xs font-medium text-body" for="material-title">
                Title
              </label>
              <input
                id="material-title"
                class={`mt-1 ${inputClass}`}
                value={title}
                onInput={(e) => setTitle((e.currentTarget as HTMLInputElement).value)}
              />
            </div>
          )}
          <button
            type="button"
            class={buttonPrimary}
            disabled={!file}
            onClick={() => void upload()}
          >
            Upload material
          </button>
          {uploadSuccess && <InlineSuccess message={uploadSuccess} />}
        </div>
      )}
      {phase.name === 'presigning' && (
        <p class="mt-3 text-sm text-body" aria-busy="true">
          Preparing upload — asking storage for an upload link…
        </p>
      )}
      {phase.name === 'putting' && (
        <div class="mt-3" aria-busy="true">
          <p class="text-sm font-medium text-ink">Uploading — {phase.percent}%</p>
          <div
            role="progressbar"
            aria-valuenow={phase.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Material upload progress"
            class="mt-2 h-2 w-full overflow-hidden rounded-full bg-sand"
          >
            <div class="h-full bg-gold" style={{ width: `${phase.percent}%` }} />
          </div>
        </div>
      )}
      {phase.name === 'recording' && (
        <p class="mt-3 text-sm text-body" aria-busy="true">
          Almost done — saving the material record…
        </p>
      )}
    </div>
  )

  if (state.data.materials.length === 0) {
    return (
      <div class="space-y-4">
        <EmptyState
          title="No materials yet"
          body="Workbooks, checklists, PDFs — upload your first material here, then attach it to a program."
        />
        {uploadForm}
      </div>
    )
  }

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="font-display text-2xl text-ink">Materials</h1>
      </div>
      {uploadForm}
      <ul class="divide-y divide-linen rounded-md border border-linen bg-surface-white">
        {state.data.materials.map((material) => (
          <li key={material.id} class="flex items-center gap-3 px-4 py-3">
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-ink">{material.title}</p>
              <p class="text-xs text-muted">
                {material.mimeType ?? 'file'} · {formatBytes(material.fileSizeBytes)} · added{' '}
                {formatInstant(material.createdAt)}
              </p>
            </div>
            <button
              type="button"
              class={buttonGhost}
              aria-label={'Delete '.concat(material.title)}
              disabled={del.pending}
              onClick={() => setDeleting({ id: material.id, title: material.title })}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
      {del.error && (
        <p role="alert" class="text-sm text-error">
          {del.error.message}
          {del.error.detail ? ` — ${del.error.detail}` : ''}
        </p>
      )}

      {deleting && (
        <ConfirmDialog
          title={'Delete '.concat(deleting.title, '?')}
          body="This removes the file and detaches it from every program. It can't be undone."
          confirmLabel="Delete material"
          cancelLabel="Keep it"
          pending={del.pending}
          onCancel={() => setDeleting(null)}
          onConfirm={() => void confirmDelete()}
        />
      )}
    </div>
  )
}
