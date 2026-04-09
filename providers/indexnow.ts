import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { env } from '@/platform/env'
import { ProviderError } from '@/providers/errors'

const SUBMITTED_LOG_PATH = join(process.cwd(), '.indexnow-submitted.json')
const INDEXNOW_API = 'https://api.indexnow.org/indexnow'
const MAX_URLS_PER_REQUEST = 10_000

export async function submitUrls(urls: string[]): Promise<{ submitted: number; skipped: boolean }> {
  const key = env.INDEXNOW_KEY
  if (!key) {
    return { submitted: 0, skipped: true }
  }

  if (urls.length === 0) {
    return { submitted: 0, skipped: false }
  }

  const host = new URL(env.PUBLIC_APP_URL).host
  let totalSubmitted = 0

  for (let i = 0; i < urls.length; i += MAX_URLS_PER_REQUEST) {
    const batch = urls.slice(i, i + MAX_URLS_PER_REQUEST)
    const body = {
      host,
      key,
      keyLocation: `${env.PUBLIC_APP_URL}/${key}.txt`,
      urlList: batch,
    }

    const res = await fetch(INDEXNOW_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    })

    if (res.status === 200 || res.status === 202) {
      totalSubmitted += batch.length
      continue
    }

    if (res.status === 429) {
      throw new ProviderError('indexnow', 'submitUrls', 429, await res.text())
    }

    throw new ProviderError('indexnow', 'submitUrls', res.status, await res.text())
  }

  return { submitted: totalSubmitted, skipped: false }
}

export function loadSubmittedLog(): Record<string, string> {
  if (!existsSync(SUBMITTED_LOG_PATH)) {
    return {}
  }
  try {
    return JSON.parse(readFileSync(SUBMITTED_LOG_PATH, 'utf-8'))
  } catch {
    return {}
  }
}

export function saveSubmittedLog(log: Record<string, string>): void {
  writeFileSync(SUBMITTED_LOG_PATH, JSON.stringify(log, null, 2))
}

export function getUnsubmittedUrls(allUrls: string[], log: Record<string, string>): string[] {
  return allUrls.filter((url) => !log[url])
}
