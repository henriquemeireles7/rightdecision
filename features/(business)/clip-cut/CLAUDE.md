# clip-cut

## Purpose
Step 3 of BD pipeline. Downloads source video, uses ffmpeg to cut clips at specified timestamps, uploads cut clips to R2. Pure server-side — no AI dependency.

## Critical Rules
- NEVER call AI APIs — this is server-side ffmpeg processing
- ALWAYS clean up temp files on both success AND failure
- ALWAYS handle partial failures (mark individual clips as failed, continue others)
- ALWAYS use assertTransition() for status changes
- NEVER return raw c.json() — use success() or partial()

## Verify
```sh
bun test features/\(business\)/clip-cut/service.test.ts
```
