/**
 * Shared mock factories for ALL test files.
 * Prevents schema mock duplication across feature tests.
 *
 * Bun's mock.module() leaks process-wide: every test file that loads AFTER a
 * mocker sees the replacement. The passthrough proxies below make that leak
 * harmless — when a unit test's override is cleared (afterAll), the proxy
 * delegates to the REAL module, so later-loaded integration tests keep
 * working against the real db/env.
 *
 * Usage in unit tests (NEVER hand-roll mock.module replacements for db/env):
 *
 *   mock.module('@/platform/env', () => ({ env: envProxy }))
 *   setEnvOverride({ WIN_RATE_LIMIT_PER_DAY: 3 })
 *   mock.module('@/platform/db/client', () => ({ db: dbProxy }))
 *   setDbOverride({ query: { ... }, insert: ... })
 *   afterAll(() => {
 *     clearDbOverride()
 *     clearEnvOverride()
 *   })
 */

// These imports run BEFORE any mock.module call in a test file (ESM imports
// are hoisted, and every mocker file imports this module first), so they
// capture the genuine modules.
import { db } from '@/platform/db/client'
import * as schema from '@/platform/db/schema'
import { env } from '@/platform/env'

const realDb = db
const realEnv = env

/** Returns the REAL schema module.
 *
 * The old hand-maintained stub here was missing newer tables and columns, so
 * any later-loaded integration test doing real Drizzle inserts crashed with
 * `cols[colKey] undefined`. schema.ts is pure table definitions (no DB
 * connection), so handing unit tests the real module is safe — they mock
 * @/platform/db/client for actual query behavior — and it can never go stale
 * again. */
export function mockSchema() {
  return schema
}

// ─── db passthrough proxy ───────────────────────────────────────────────

let dbOverride: object | undefined

/** Drop-in replacement for the real `db` export. Delegates every property
 * access to the override when set (unit tests), else to the REAL db
 * (integration tests loaded after a unit-test mocker). */
export const dbProxy = new Proxy({} as typeof realDb, {
  get(_target, prop) {
    const source = (dbOverride ?? realDb) as Record<PropertyKey, unknown>
    const value = source[prop as keyof typeof source]
    return typeof value === 'function'
      ? (value as (...args: unknown[]) => unknown).bind(source)
      : value
  },
  has(_target, prop) {
    return prop in ((dbOverride ?? realDb) as object)
  },
})

export function setDbOverride(mockDb: object): void {
  dbOverride = mockDb
}

export function clearDbOverride(): void {
  dbOverride = undefined
}

// ─── env passthrough proxy ──────────────────────────────────────────────

let envOverride: Record<string, unknown> | undefined

/** Drop-in replacement for the real `env` export. Override keys win (even
 * when explicitly set to undefined — that's how tests simulate a missing
 * var); everything else falls through to the REAL env, so unit tests can pin
 * single vars without losing the rest. */
export const envProxy = new Proxy({} as typeof realEnv, {
  get(_target, prop) {
    if (envOverride && typeof prop === 'string' && prop in envOverride) {
      return envOverride[prop]
    }
    return (realEnv as Record<PropertyKey, unknown>)[prop]
  },
  has(_target, prop) {
    if (envOverride && typeof prop === 'string' && prop in envOverride) return true
    return prop in (realEnv as object)
  },
})

/** Keeps a live reference — tests may mutate the passed object between cases. */
export function setEnvOverride(partial: Record<string, unknown>): void {
  envOverride = partial
}

export function clearEnvOverride(): void {
  envOverride = undefined
}
