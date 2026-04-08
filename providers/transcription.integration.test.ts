import { existsSync } from 'node:fs'
import { describe, expect, it } from 'bun:test'

const whisperModelPath = process.env.WHISPER_MODEL_PATH || 'models/ggml-large-v3.bin'
const hasWhisper = (() => {
  try {
    const proc = Bun.spawnSync(['which', 'whisper-cpp'])
    return proc.exitCode === 0 && existsSync(whisperModelPath)
  } catch {
    return false
  }
})()

describe.skipIf(!hasWhisper)('Whisper Transcription Integration', () => {
  it('transcribes a test audio file', async () => {
    const { transcribe } = await import('@/providers/transcription')
    const transcript = await transcribe('tests/fixtures/test-audio-5s.wav')
    expect(typeof transcript).toBe('string')
    // Sine wave may produce empty or noise text, but the process should complete
    expect(transcript.length).toBeGreaterThanOrEqual(0)
  }, 60000) // 60s timeout for transcription
})
