import { beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { ProviderError } from '@/providers/errors'

mock.module('@/platform/env', () => ({
  env: {
    WHISPER_MODEL_PATH: 'models/ggml-large-v3.bin',
  },
}))

// Helper to create a mock process
function mockProc(exitCode: number, stdout = '', stderr = '') {
  return {
    exited: Promise.resolve(exitCode),
    stdout: new Response(stdout).body as ReadableStream,
    stderr: new Response(stderr).body as ReadableStream,
    kill: mock(() => {}),
  }
}

describe('providers/transcription', () => {
  let spawnSpy: ReturnType<typeof spyOn>

  beforeEach(() => {
    spawnSpy = spyOn(Bun, 'spawn')
  })

  it('returns timestamped transcript on success', async () => {
    const transcript = '[00:00:01] Hello world\n[00:00:05] This is a test'
    spawnSpy.mockReturnValueOnce(mockProc(0, transcript) as never)

    const { transcribe } = await import('./transcription')
    const result = await transcribe('/tmp/video.mp4')
    expect(result).toBe(transcript)
    expect(spawnSpy).toHaveBeenCalledTimes(1)
  })

  it('throws ProviderError on non-zero exit code', async () => {
    spawnSpy.mockReturnValueOnce(mockProc(1, '', 'Segfault') as never)

    const { transcribe } = await import('./transcription')
    try {
      await transcribe('/tmp/video.mp4')
      expect(true).toBe(false) // should not reach
    } catch (error) {
      expect(error).toBeInstanceOf(ProviderError)
      expect((error as ProviderError).statusCode).toBe(500)
    }
  })

  it('throws ProviderError when output is empty', async () => {
    spawnSpy.mockReturnValueOnce(mockProc(0, '   \n  ') as never)

    const { transcribe } = await import('./transcription')
    try {
      await transcribe('/tmp/silence.mp4')
      expect(true).toBe(false)
    } catch (error) {
      expect(error).toBeInstanceOf(ProviderError)
      expect((error as ProviderError).statusCode).toBe(422)
    }
  })

  it('throws ProviderError when spawn throws', async () => {
    spawnSpy.mockImplementationOnce(() => {
      throw new Error('whisper-cpp not found')
    })

    const { transcribe } = await import('./transcription')
    try {
      await transcribe('/tmp/video.mp4')
      expect(true).toBe(false)
    } catch (error) {
      expect(error).toBeInstanceOf(ProviderError)
      expect((error as ProviderError).statusCode).toBe(500)
    }
  })
})
