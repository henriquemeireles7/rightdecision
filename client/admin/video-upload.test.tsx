import '@/platform/test/dom-preload'

import { afterEach, describe, expect, test } from 'bun:test'
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/preact'
import type { Uploader, UploadHandlers } from './uploader'
import { UploaderContext } from './uploader'
import { VideoUpload } from './video-upload'

afterEach(cleanup)

/** Scripted fake uploader — tests drive progress/failure/success by hand. NO real uploads. */
function fakeUploader() {
  const uploads: Array<{ file: File; url: string; handlers: UploadHandlers }> = []
  const calls = { pause: 0, resume: 0, abort: 0 }
  const uploader: Uploader = {
    upload(file, url, handlers) {
      uploads.push({ file, url, handlers })
      return {
        pause: () => {
          calls.pause += 1
        },
        resume: () => {
          calls.resume += 1
        },
        abort: () => {
          calls.abort += 1
        },
      }
    },
  }
  return { uploader, uploads, calls }
}

function renderUpload(options: {
  uploader: Uploader
  status?: 'none' | 'uploading' | 'processing' | 'ready' | 'error'
  requestUploadUrl?: (bytes: number) => Promise<{ uploadUrl: string; streamVideoId: string }>
  onUploadComplete?: () => void
}) {
  const requested: number[] = []
  const requestUploadUrl =
    options.requestUploadUrl ??
    (async (bytes: number) => {
      requested.push(bytes)
      return { uploadUrl: 'https://stream.example/one-time', streamVideoId: 'sv-1' }
    })
  const view = render(
    <UploaderContext.Provider value={options.uploader}>
      <VideoUpload
        label="Lesson video"
        status={options.status ?? 'none'}
        requestUploadUrl={requestUploadUrl}
        onUploadComplete={options.onUploadComplete ?? (() => {})}
      />
    </UploaderContext.Provider>,
  )
  return { ...view, requested }
}

function pickFile(container: Element, file: File) {
  const input = container.querySelector('input[type="file"]')
  if (!input) throw new Error('No file input rendered')
  Object.defineProperty(input, 'files', { value: [file], configurable: true })
  fireEvent.change(input)
}

const mp4 = () => new File(['0123456789'], 'lesson.mp4', { type: 'video/mp4' })

describe('component: VideoUpload', () => {
  test('picking a file requests a tus URL with the file size, then uploads to it', async () => {
    const { uploader, uploads } = fakeUploader()
    const { container, requested } = renderUpload({ uploader })
    pickFile(container, mp4())
    await waitFor(() => expect(uploads.length).toBe(1))
    expect(requested).toEqual([10])
    expect(uploads[0]?.url).toBe('https://stream.example/one-time')
    expect(uploads[0]?.file.name).toBe('lesson.mp4')
  })

  test('progress renders a labelled percent (no unexplained spinner)', async () => {
    const { uploader, uploads } = fakeUploader()
    const { container, getByRole } = renderUpload({ uploader })
    pickFile(container, mp4())
    await waitFor(() => expect(uploads.length).toBe(1))
    act(() => uploads[0]?.handlers.onProgress(42))
    const bar = getByRole('progressbar')
    expect(bar.getAttribute('aria-valuenow')).toBe('42')
    expect(container.textContent).toContain('42%')
    expect(container.textContent).toContain('Uploading')
  })

  test('pause and resume drive the upload handle', async () => {
    const { uploader, uploads, calls } = fakeUploader()
    const { container, getByRole } = renderUpload({ uploader })
    pickFile(container, mp4())
    await waitFor(() => expect(uploads.length).toBe(1))
    fireEvent.click(getByRole('button', { name: 'Pause' }))
    expect(calls.pause).toBe(1)
    fireEvent.click(getByRole('button', { name: 'Resume' }))
    expect(calls.resume).toBe(1)
  })

  test('failure explains what happened and Try again resumes the same upload', async () => {
    const { uploader, uploads, calls } = fakeUploader()
    const { container, getByRole, getByText } = renderUpload({ uploader })
    pickFile(container, mp4())
    await waitFor(() => expect(uploads.length).toBe(1))
    act(() => uploads[0]?.handlers.onError(new Error('tus: connection lost')))
    expect(getByText(/upload failed/i)).toBeTruthy()
    expect(container.textContent).toContain('tus: connection lost')
    fireEvent.click(getByRole('button', { name: 'Try again' }))
    expect(calls.resume).toBe(1)
    // back in uploading state — progress events render again
    act(() => uploads[0]?.handlers.onProgress(55))
    expect(container.textContent).toContain('55%')
  })

  test('success flips to processing copy and notifies the parent', async () => {
    const { uploader, uploads } = fakeUploader()
    let completed = 0
    const { container } = renderUpload({
      uploader,
      onUploadComplete: () => {
        completed += 1
      },
    })
    pickFile(container, mp4())
    await waitFor(() => expect(uploads.length).toBe(1))
    act(() => uploads[0]?.handlers.onSuccess())
    expect(completed).toBe(1)
    expect(container.textContent).toContain("Processing — we'll mark it ready automatically")
  })

  test('upload-URL request failure is an actionable error, not a dead spinner', async () => {
    const { uploader, uploads } = fakeUploader()
    const { container, findByText } = renderUpload({
      uploader,
      requestUploadUrl: async () => {
        throw new Error('VIDEO_UPLOAD_FAILED')
      },
    })
    pickFile(container, mp4())
    expect(await findByText(/couldn't start the upload/i)).toBeTruthy()
    expect(uploads.length).toBe(0)
    // the file picker is back — she can try again
    expect(container.querySelector('input[type="file"]')).not.toBeNull()
  })

  test('status=ready shows the replace affordance instead of first-upload copy', () => {
    const { uploader } = fakeUploader()
    const { container } = renderUpload({ uploader, status: 'ready' })
    expect(container.textContent).toContain('Video is ready')
    expect(container.textContent).toContain('Replace video')
  })

  test('status=processing without an active upload still explains itself', () => {
    const { uploader } = fakeUploader()
    const { container } = renderUpload({ uploader, status: 'processing' })
    expect(container.textContent).toContain("Processing — we'll mark it ready automatically")
  })

  test('status=error invites a fresh upload', () => {
    const { uploader } = fakeUploader()
    const { container } = renderUpload({ uploader, status: 'error' })
    expect(container.textContent).toContain('Something went wrong with the last video')
    expect(container.querySelector('input[type="file"]')).not.toBeNull()
  })
})
