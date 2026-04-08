import { sql } from 'drizzle-orm'
import { db } from '@/platform/db/client'
import { listProfiles } from '@/providers/social-posting'
import { download, remove, upload } from '@/providers/storage'

interface ProviderStatus {
  ok: boolean
  latencyMs: number
  error?: string
}

interface HealthResult {
  status: 'healthy' | 'degraded'
  providers: {
    db: ProviderStatus
    r2: ProviderStatus
    uploadPost: ProviderStatus
    whisper: ProviderStatus
    ffmpeg: ProviderStatus
  }
}

async function checkProvider(name: string, fn: () => Promise<void>): Promise<ProviderStatus> {
  const start = Date.now()
  try {
    await fn()
    return { ok: true, latencyMs: Date.now() - start }
  } catch (error) {
    // Sanitize error message: only expose provider name and error type, not stack/credentials
    const msg = error instanceof Error ? error.message.slice(0, 100) : 'Unknown error'
    return { ok: false, latencyMs: Date.now() - start, error: `${name}: ${msg}` }
  }
}

async function checkBinary(name: string): Promise<ProviderStatus> {
  const start = Date.now()
  try {
    const proc = Bun.spawn(['which', name], { stdout: 'pipe', stderr: 'pipe' })
    const exitCode = await proc.exited
    return exitCode === 0
      ? { ok: true, latencyMs: Date.now() - start }
      : { ok: false, latencyMs: Date.now() - start, error: `${name} not found in PATH` }
  } catch (error) {
    const msg = error instanceof Error ? error.message.slice(0, 100) : 'Unknown error'
    return { ok: false, latencyMs: Date.now() - start, error: `${name}: ${msg}` }
  }
}

const R2_TEST_KEY = 'test/health-check'

export async function checkHealth(skipBinaryChecks = false): Promise<HealthResult> {
  const [dbStatus, r2Status, uploadPostStatus, whisperStatus, ffmpegStatus] = await Promise.all([
    checkProvider('db', async () => {
      await db.execute(sql`SELECT 1`)
    }),
    checkProvider('r2', async () => {
      try {
        await upload(R2_TEST_KEY, Buffer.from('health'), 'text/plain')
        await download(R2_TEST_KEY)
      } finally {
        await remove(R2_TEST_KEY).catch(() => {})
      }
    }),
    checkProvider('uploadPost', async () => {
      await listProfiles()
    }),
    skipBinaryChecks ? Promise.resolve({ ok: true, latencyMs: 0 }) : checkBinary('whisper-cpp'),
    skipBinaryChecks ? Promise.resolve({ ok: true, latencyMs: 0 }) : checkBinary('ffmpeg'),
  ])

  const allOk =
    dbStatus.ok && r2Status.ok && uploadPostStatus.ok && whisperStatus.ok && ffmpegStatus.ok

  return {
    status: allOk ? 'healthy' : 'degraded',
    providers: {
      db: dbStatus,
      r2: r2Status,
      uploadPost: uploadPostStatus,
      whisper: whisperStatus,
      ffmpeg: ffmpegStatus,
    },
  }
}
