/** Returns the REAL schema module — see platform/test/mocks.ts.
 * Bun's mock.module leaks process-wide, so schema mocks must hand back the
 * real tables or later-loaded integration tests crash on real inserts. */
export { mockSchema } from '@/platform/test/mocks'

/** Promise that also supports .returning() for CAS update mocks */
export function casResult(id = 'run-1') {
  return Object.assign(Promise.resolve(), {
    returning: () => Promise.resolve([{ id }]),
  })
}

/** Transaction mock — wraps a mock tx object through the callback */
export function mockTransaction(tx: Record<string, unknown>) {
  return (fn: (t: typeof tx) => Promise<unknown>) => fn(tx)
}
