/// <reference lib="dom" />
/**
 * The injected uploader seam for direct-to-Stream tus uploads (NEVER proxied through Hono).
 * Production uses tus-js-client against the one-time uploadUrl from the API; tests inject a
 * scripted fake that drives progress/retry/failure — no real uploads in CI.
 */
import { createContext } from 'preact'
import { useContext } from 'preact/hooks'
import * as tus from 'tus-js-client'

export type UploadHandlers = {
  onProgress: (percent: number) => void
  onSuccess: () => void
  onError: (error: Error) => void
}

export type UploadHandle = {
  /** Stops sending bytes; tus keeps the offset so resume() continues where it left off. */
  pause: () => void
  resume: () => void
  /** Terminates the upload for good. */
  abort: () => void
}

export type Uploader = {
  upload: (file: File, uploadUrl: string, handlers: UploadHandlers) => UploadHandle
}

/** Cloudflare Stream requires chunk sizes in 256KiB multiples; 50MiB is their recommendation. */
const CHUNK_SIZE = 50 * 1024 * 1024
const RETRY_DELAYS_MS = [0, 1000, 3000, 5000]

export function createTusUploader(UploadCtor: typeof tus.Upload = tus.Upload): Uploader {
  return {
    upload(file, uploadUrl, handlers) {
      const upload = new UploadCtor(file, {
        uploadUrl,
        chunkSize: CHUNK_SIZE,
        retryDelays: RETRY_DELAYS_MS,
        metadata: { filename: file.name, filetype: file.type },
        onProgress: (bytesSent, bytesTotal) => {
          handlers.onProgress(bytesTotal > 0 ? Math.round((bytesSent / bytesTotal) * 100) : 0)
        },
        onSuccess: () => handlers.onSuccess(),
        onError: (error) =>
          handlers.onError(error instanceof Error ? error : new Error(String(error))),
      })
      upload.start()
      return {
        pause: () => {
          void upload.abort()
        },
        resume: () => upload.start(),
        abort: () => {
          void upload.abort(true)
        },
      }
    },
  }
}

/** Injected via context: app boot provides the real tus uploader, tests provide fakes. */
export const UploaderContext = createContext<Uploader>(createTusUploader())

export function useUploader(): Uploader {
  return useContext(UploaderContext)
}

export type PutFile = (
  url: string,
  file: File,
  onProgress: (percent: number) => void,
) => Promise<void>

/**
 * Direct-to-R2 presigned PUT (materials). XHR because fetch has no upload progress.
 * This is a cloud upload, not an API call — api-client rules do not apply here.
 */
export const putFileWithProgress: PutFile = (url, file, onProgress) =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    if (file.type) xhr.setRequestHeader('Content-Type', file.type)
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100))
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(`The file upload was rejected (HTTP ${xhr.status})`))
    }
    xhr.onerror = () => reject(new Error('The file upload failed — check your connection'))
    xhr.send(file)
  })

export const PutFileContext = createContext<PutFile>(putFileWithProgress)

export function usePutFile(): PutFile {
  return useContext(PutFileContext)
}
