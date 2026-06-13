import '@/platform/test/dom-preload'

import { describe, expect, test } from 'bun:test'
import type { UploadHandlers } from './uploader'
import { createTusUploader } from './uploader'

/** Minimal fake of tus-js-client's Upload class — records construction + lifecycle calls. */
class FakeTusUpload {
  static instances: FakeTusUpload[] = []
  started = 0
  aborted: Array<boolean | undefined> = []
  constructor(
    readonly file: unknown,
    // biome-ignore lint/suspicious/noExplicitAny: mirrors tus-js-client's loose options bag in a test fake
    readonly options: Record<string, any>,
  ) {
    FakeTusUpload.instances.push(this)
  }
  start() {
    this.started += 1
  }
  abort(shouldTerminate?: boolean) {
    this.aborted.push(shouldTerminate)
    return Promise.resolve()
  }
}

function handlers(): UploadHandlers & { progress: number[]; succeeded: number; errors: Error[] } {
  const h = {
    progress: [] as number[],
    succeeded: 0,
    errors: [] as Error[],
    onProgress(percent: number) {
      h.progress.push(percent)
    },
    onSuccess() {
      h.succeeded += 1
    },
    onError(error: Error) {
      h.errors.push(error)
    },
  }
  return h
}

describe('client/admin uploader: createTusUploader', () => {
  test('starts a tus upload against the one-time uploadUrl with file metadata', () => {
    FakeTusUpload.instances = []
    const uploader = createTusUploader(FakeTusUpload as never)
    const file = new File(['abc'], 'lesson.mp4', { type: 'video/mp4' })
    uploader.upload(file, 'https://upload.example/one-time', handlers())

    const instance = FakeTusUpload.instances[0]
    if (!instance) throw new Error('Upload was not constructed')
    expect(instance.file).toBe(file)
    expect(instance.options.uploadUrl).toBe('https://upload.example/one-time')
    expect(instance.options.metadata).toEqual({ filename: 'lesson.mp4', filetype: 'video/mp4' })
    expect(Array.isArray(instance.options.retryDelays)).toBe(true)
    expect(instance.started).toBe(1)
  })

  test('maps tus progress bytes to whole percent', () => {
    FakeTusUpload.instances = []
    const uploader = createTusUploader(FakeTusUpload as never)
    const h = handlers()
    uploader.upload(new File(['x'], 'a.mp4', { type: 'video/mp4' }), 'https://u', h)
    const instance = FakeTusUpload.instances[0]
    if (!instance) throw new Error('Upload was not constructed')
    instance.options.onProgress(50, 200)
    instance.options.onProgress(200, 200)
    expect(h.progress).toEqual([25, 100])
  })

  test('forwards success and wraps non-Error failures', () => {
    FakeTusUpload.instances = []
    const uploader = createTusUploader(FakeTusUpload as never)
    const h = handlers()
    uploader.upload(new File(['x'], 'a.mp4', { type: 'video/mp4' }), 'https://u', h)
    const instance = FakeTusUpload.instances[0]
    if (!instance) throw new Error('Upload was not constructed')
    instance.options.onSuccess()
    instance.options.onError('boom')
    expect(h.succeeded).toBe(1)
    expect(h.errors[0]).toBeInstanceOf(Error)
    expect(h.errors[0]?.message).toContain('boom')
  })

  test('handle pause/resume/abort map to tus abort()/start()/abort(true)', () => {
    FakeTusUpload.instances = []
    const uploader = createTusUploader(FakeTusUpload as never)
    const handle = uploader.upload(
      new File(['x'], 'a.mp4', { type: 'video/mp4' }),
      'https://u',
      handlers(),
    )
    const instance = FakeTusUpload.instances[0]
    if (!instance) throw new Error('Upload was not constructed')
    handle.pause()
    handle.resume()
    handle.abort()
    expect(instance.aborted).toEqual([undefined, true])
    expect(instance.started).toBe(2) // initial start + resume
  })
})
