# test

## Purpose
Test infrastructure shared by all integration and feature tests. Provides database lifecycle management, test data factories, and common assertion helpers. Every integration test imports from here — never roll your own test setup.

## Critical Rules
- NEVER mock the database — use the real test DB via `setup.ts`
- ALWAYS clean up test data after tests (transaction rollback in afterEach)
- ALWAYS use factories from `factories.ts` to create test data — never hand-craft INSERT queries
- NEVER depend on seed data existing — each test creates what it needs
- NEVER import from this folder in production code — test-only

## Imports (use from other modules)
```ts
import { testDb, setupTestDb, teardownTestDb } from '@/platform/test/setup'
import { createTestUser, createTestSubscription } from '@/platform/test/factories'
import { assertApiError, assertApiSuccess, testApiCall } from '@/platform/test/helpers'
```

## Recipe: New Integration Test
```ts
import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { setupTestDb, teardownTestDb } from '@/platform/test/setup'
import { createTestUser } from '@/platform/test/factories'

describe('integration: my-feature', () => {
  beforeAll(setupTestDb)
  afterAll(teardownTestDb)

  test('does the thing', async () => {
    const user = await createTestUser()
    // ... test logic
    expect(result).toBe(expected)
  })
})
```

## Verify
```sh
bun test platform/test/
```
