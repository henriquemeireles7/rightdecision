/**
 * Simple in-memory rate limiter.
 * Good enough for single-server deployment (Railway).
 * Replace with Redis if multi-server.
 */

type Entry = { count: number; resetAt: number }

const store = new Map<string, Entry>()

// Cleanup expired entries every 5 minutes
setInterval(
  () => {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key)
    }
  },
  5 * 60 * 1000,
).unref()

/**
 * Check if a request is within the rate limit.
 * Returns { allowed: true } or { allowed: false, retryAfterMs }.
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): { allowed: true } | { allowed: false; retryAfterMs: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true }
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, retryAfterMs: entry.resetAt - now }
  }

  entry.count++
  return { allowed: true }
}
