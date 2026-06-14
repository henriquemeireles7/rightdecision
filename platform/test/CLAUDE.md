# test

## Purpose
Test infrastructure shared by all integration and feature tests. Provides database lifecycle management, test data factories, and common assertion helpers. Every integration test imports from here — never roll your own test setup.

## Critical Rules
- mock.module leaks process-wide — ALWAYS mock via the passthrough proxies in mocks.ts (`dbProxy`/`envProxy`/`requireAuthProxy` + `setDbOverride`/`setEnvOverride`/`setAuthOverride`) with afterAll cleanup (`clearDbOverride`/`clearEnvOverride`/`clearAuthOverride`); NEVER hand-roll mock.module replacements for db/env/schema/auth-middleware (a leaked `requireAuth` stub silently disables the "401 without a session" tests in every later-loaded file)
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

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| dom-preload.ts | — |
| factories.ts | createTestUser, createTestSession, createTestSubscription, createTestWin, createTestOnboardingProfile, createTestPipelineRun, createTestProgram, createTestCohort, createTestCourse, createTestProgramCourse, createTestModule, createTestLesson, createTestEnrollment, createTestMaterial, createTestProgramMaterial, createTestLive, buildTestTemplateSchema, createTestDocumentTemplate, createTestPlatformAccount |
| helpers.ts | stubAuth, apiCall, authenticatedRequest, assertError, assertSuccess |
| index.ts | — |
| mocks.ts | mockSchema, dbProxy, setDbOverride, clearDbOverride, envProxy, setEnvOverride, clearEnvOverride |
| setup.ts | testDb, setupTestDb, teardownTestDb |

## Internal Dependencies
- platform/db
- platform/env
- platform/errors
- platform/types

<!-- Generated: 2026-06-13T02:53:44.062Z -->
