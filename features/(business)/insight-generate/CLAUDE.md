# insight-generate

## Purpose
Step 7 of BD pipeline. SKILL-DRIVEN RECEIVER: validates and saves insights sent by the /whats-working skill. Persists recommendations with supporting data. Server never calls AI.

## Verify
```sh
bun test features/\(business\)/insight-generate/service.test.ts
```
