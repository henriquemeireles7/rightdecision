# post-distribute

## Purpose
Step 5 of BD pipeline. Posts clips to social platforms via Upload-Post API. NOT idempotent — dedup via UNIQUE constraint. Handles partial failures.

## Critical Rules
- NEVER re-post to same clipId+accountId — dedup via DB constraint
- ALWAYS handle partial failures (some accounts fail, others succeed)
- ALWAYS store uploadPostId and uploadPostResponse for debugging

## Verify
```sh
bun test features/\(business\)/post-distribute/service.test.ts
```
