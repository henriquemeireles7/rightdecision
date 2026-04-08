import { env } from '@/platform/env'
import { ProviderError } from '@/providers/errors'

const TIMEOUT_MS = 10 * 60 * 1000 // 10 minutes

export async function transcribe(videoPath: string): Promise<string> {
  try {
    const proc = Bun.spawn(
      [
        'whisper-cpp',
        '--model', env.WHISPER_MODEL_PATH,
        '--output-format', 'txt',
        '--timestamps',
        videoPath,
      ],
      { stdout: 'pipe', stderr: 'pipe' },
    )

    const result = await Promise.race([
      proc.exited,
      new Promise<never>((_, reject) =>
        setTimeout(() => {
          proc.kill()
          reject(new ProviderError('whisper', 'transcribe', 504, 'Transcription timed out'))
        }, TIMEOUT_MS),
      ),
    ])

    if (result !== 0) {
      const stderr = await new Response(proc.stderr).text()
      throw new ProviderError('whisper', 'transcribe', 500, stderr || `Exit code: ${result}`)
    }

    const output = await new Response(proc.stdout).text()
    const trimmed = output.trim()

    if (!trimmed) {
      throw new ProviderError('whisper', 'transcribe', 422, 'Transcription returned no text')
    }

    return trimmed
  } catch (error) {
    if (error instanceof ProviderError) throw error
    throw new ProviderError('whisper', 'transcribe', 500, error)
  }
}
