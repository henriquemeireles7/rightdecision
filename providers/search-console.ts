import { SignJWT, importPKCS8 } from 'jose'
import { env } from '@/platform/env'
import { ProviderError } from '@/providers/errors'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly'
const INSPECT_URL = 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect'
const ANALYTICS_URL = 'https://searchconsole.googleapis.com/webmasters/v3/sites'

// Token cache
let cachedToken: string | null = null
let tokenExpiry = 0

export function isConfigured(): boolean {
  return !!env.GOOGLE_SERVICE_ACCOUNT_JSON
}

export async function getAccessToken(): Promise<string | null> {
  if (!env.GOOGLE_SERVICE_ACCOUNT_JSON) return null

  // Return cached token if still valid (55min TTL)
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken

  const creds = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON)
  const privateKey = await importPKCS8(creds.private_key, 'RS256')

  const jwt = await new SignJWT({ scope: SCOPE })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(creds.client_email)
    .setAudience(TOKEN_URL)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(privateKey)

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  if (!res.ok) {
    throw new ProviderError('search-console', 'getAccessToken', res.status, await res.text())
  }

  const data = (await res.json()) as { access_token: string; expires_in: number }
  cachedToken = data.access_token
  tokenExpiry = Date.now() + 55 * 60 * 1000 // 55 min
  return cachedToken
}

export type InspectionResult = {
  verdict: string
  coverageState: string
  indexingState: string
  lastCrawlTime?: string
}

export async function inspectUrl(siteUrl: string, inspectionUrl: string): Promise<InspectionResult> {
  const token = await getAccessToken()
  if (!token) throw new ProviderError('search-console', 'inspectUrl', 401, 'Not configured')

  const res = await fetch(INSPECT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inspectionUrl, siteUrl }),
  })

  if (!res.ok) {
    throw new ProviderError('search-console', 'inspectUrl', res.status, await res.text())
  }

  const data = (await res.json()) as {
    inspectionResult: {
      indexStatusResult: {
        verdict: string
        coverageState: string
        indexingState: string
        lastCrawlTime?: string
      }
    }
  }

  const idx = data.inspectionResult.indexStatusResult
  return {
    verdict: idx.verdict,
    coverageState: idx.coverageState,
    indexingState: idx.indexingState,
    lastCrawlTime: idx.lastCrawlTime,
  }
}

export type AnalyticsRow = {
  keys: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export async function getSearchAnalytics(
  siteUrl: string,
  opts: { startDate: string; endDate: string; dimensions?: string[] },
): Promise<AnalyticsRow[]> {
  const token = await getAccessToken()
  if (!token) throw new ProviderError('search-console', 'getSearchAnalytics', 401, 'Not configured')

  const encodedSite = encodeURIComponent(siteUrl)
  const res = await fetch(`${ANALYTICS_URL}/${encodedSite}/searchAnalytics/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      startDate: opts.startDate,
      endDate: opts.endDate,
      dimensions: opts.dimensions ?? ['query'],
      rowLimit: 100,
    }),
  })

  if (!res.ok) {
    throw new ProviderError('search-console', 'getSearchAnalytics', res.status, await res.text())
  }

  const data = (await res.json()) as { rows?: AnalyticsRow[] }
  return data.rows ?? []
}
