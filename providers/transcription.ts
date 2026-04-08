import { env } from '@/platform/env'
import { ProviderError } from '@/providers/errors'

const TIMEOUT_MS = 10 * 60 * 1000 // 10 minutes

export async function transcribe(videoPath: string): Promise<string> {
  try {
    const proc = Bun.spawn(
      [
        'whisper-cpp',
        '--model',
        env.WHISPER_MODEL_PATH,
        '--output-format',
        'txt',
        '--timestamps',
        videoPath,
      ],
      { stdout: 'pipe', stderr: 'pipe' },
    )

    // Read stdout/stderr concurrently with exit to avoid pipe buffer deadlock
    const [exitCode, stdout, stderr] = await Promise.race([
      Promise.all([
        proc.exited,
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
      ]),
      new Promise<never>((_, reject) =>
        setTimeout(() => {
          proc.kill()
          reject(new ProviderError('whisper', 'transcribe', 504, 'Transcription timed out'))
        }, TIMEOUT_MS),
      ),
    ])

    if (exitCode !== 0) {
      throw new ProviderError('whisper', 'transcribe', 500, stderr || `Exit code: ${exitCode}`)
    }

    const trimmed = stdout.trim()

    if (!trimmed) {
      throw new ProviderError('whisper', 'transcribe', 422, 'Transcription returned no text')
    }

    return trimmed
  } catch (error) {
    if (error instanceof ProviderError) throw error
    throw new ProviderError('whisper', 'transcribe', 500, error)
  }
}
