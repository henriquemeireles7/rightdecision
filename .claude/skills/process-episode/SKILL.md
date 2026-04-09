# /process-episode -- Master Pipeline Skill

Run the full podcast-to-social pipeline from video URL to distributed posts.
Accepts a new video URL or a run ID to resume from a failed step.

## When to use
- New episode: `/process-episode episodes/my-episode.mp4`
- Resume failed: `/process-episode --resume <run-id>`
- Dry run: `/process-episode episodes/test.mp4 --dry-run`

## Input
The user provides either:
- A video URL (R2 key, e.g. `episodes/video.mp4`) for a new run
- A run ID with `--resume` to continue from a failed step
- `--dry-run` flag to skip actual social posting
- `--profile <name>` — Target profile slug (REQUIRED when profiles exist)

### Profile Selection (MANDATORY)
Before starting the pipeline, check if `content/profiles/` has any profiles:
```ts
import { listProfiles } from '@/providers/profile'
const profiles = listProfiles()
```
- If profiles exist and `--profile` is NOT specified: prompt the user to select from the list. Do NOT allow skipping.
- If profiles exist and `--profile` IS specified: validate it exists, then pass to `/select-clips --profile` and `/generate-metadata --profile`
- If NO profiles exist (first-run): proceed without profile (backward compatible). Suggest running `/profile-create` after.

## Pre-flight Checks (MANDATORY)

Before starting ANY pipeline run, verify all dependencies:

```bash
# 1. Health check
curl -s -H "Authorization: Bearer $TOKEN" $BASE_URL/api/pipeline/health | jq
```

If ANY provider shows `ok: false`, report which provider is down and STOP.
Do not proceed with a degraded pipeline.

```bash
# 2. Platform accounts check
curl -s -H "Authorization: Bearer $TOKEN" $BASE_URL/api/platform-accounts | jq '.data.accounts | length'
```

If the accounts array is empty (length 0), tell the user:
"No social media accounts configured. Run `POST /api/platform-accounts/sync` first to import your Upload-Post profiles."

## Pipeline Flow

### Step 1: Start Transcription

```
POST /api/pipeline-runs
{ "videoUrl": "<r2-key>", "config": { "dryRun": true/false, "autoApproveClips": true, "autoApproveMetadata": true } }
```

Save the returned `run.id`. Then trigger async processing:

```
POST /api/pipeline-runs/:id/process
```

This returns 202 immediately. The transcription runs in background.

**Poll for completion:**
```
GET /api/pipeline-runs/:id
```
Poll every 5 seconds. Wait for status to change from `transcribing` to either:
- `transcribed` -- success, proceed to Step 2
- `failed` -- report error, offer retry

**Timeout:** If still `transcribing` after 15 minutes, report:
"Transcription is taking longer than expected. The process may still be running.
Options: (A) Keep waiting (B) Check status later (C) Mark as failed"

### Step 2: Select Clips (AI or Manual)

```
GET /api/pipeline-runs/:id
```

Read the `transcript` field. Analyze it and pick the best 30-60 second segments.

**Phase 1 (now):** Prompt the user for clip selections. Show the transcript and ask
which segments to clip. The user provides timestamps, scores, and titles.

**Phase 2 (future):** Use /select-clips skill to have AI analyze the transcript
and suggest clips automatically.

Then POST the selections:
```
POST /api/clip-select
{ "pipelineRunId": "<id>", "clips": [
  { "sourceTimestampStart": 10, "sourceTimestampEnd": 40, "score": 8, "suggestedTitle": "Title" }
] }
```

### Step 3: Cut Clips

```
POST /api/clip-cut
{ "pipelineRunId": "<id>" }
```

Wait for response. Report per-clip success/failure.
If all clips fail, offer retry.

### Step 4: Generate Metadata (AI or Manual)

```
GET /api/pipeline-runs/:id/clips
```

Read the cut clips. For each clip, generate platform-specific metadata.

**Phase 1 (now):** Prompt the user for descriptions, hashtags, and CTAs per clip per platform.

**Phase 2 (future):** Use /generate-metadata skill to have AI write platform-native copy.

Then POST:
```
POST /api/metadata-generate
{ "pipelineRunId": "<id>", "metadata": [
  { "clipId": "<id>", "platformAccountId": "<id>", "description": "...", "hashtags": ["..."], "cta": "..." }
] }
```

### Step 5: Distribute Posts

```
POST /api/post-distribute
{ "pipelineRunId": "<id>" }
```

If dry-run mode: report "DRY RUN: Posts logged but not sent to social platforms."
Otherwise: report posted count and any failures.

### Step 6: Collect Analytics (Optional)

Skip if dry-run or if posts are less than 24 hours old.

```
POST /api/analytics-collect
{ "postIds": ["<id1>", "<id2>"] }
```

### Step 7: Summary

```
GET /api/pipeline-runs/:id
```

Display final report:
```
Pipeline Complete!
  Status: completed
  Total duration: Xm Ys

  Step Timing:
    Transcribe:       3m 10s
    Clip Selection:    manual
    Clip Cut:          45s (5 clips)
    Metadata:          manual
    Post Distribution: 12s (10 posts)
    Analytics:         skipped (too recent)

  Results:
    Clips: 5 selected, 5 cut, 0 failed
    Posts: 10 distributed, 0 failed
    Mode: dry-run / live
```

## Resume Logic

When called with `--resume <run-id>`:

1. GET /api/pipeline-runs/:id to check current status
2. Based on status, skip completed steps:
   - `failed` at any step: retry from that step
   - `transcribed`: skip Step 1, go to Step 2
   - `selected` or `cut`: skip Steps 1-2/3, continue
   - `metadata_ready`: skip Steps 1-4, go to Step 5
   - `posted`: skip Steps 1-5, go to Step 6
   - `completed`: "This run is already complete."
3. Report which steps were skipped and which will run

## Error Handling

If any step returns an error:
1. Display: "Step [N] ([name]) failed: [error code]"
2. If error has details, show them
3. Offer options:
   - (A) Retry this step
   - (B) Skip to next step (may cause downstream failures)
   - (C) Abort pipeline

The state machine supports retry from failed state. Retrying calls the same API endpoint again.
