# /process-episode — Master Pipeline Skill

Run the full podcast-to-social pipeline from video URL to distributed posts.

## When to use
When you have a new podcast episode to process. This is the main entry point.

## Input
The user provides a video URL (already uploaded to R2).

## Steps

### Step 1: Transcribe (server-side)
```
POST /api/pipeline-runs
{ "videoUrl": "<r2-url>" }
```
Save the returned `id`. Then trigger processing:
```
POST /api/pipeline-runs/:id/process
```
Wait for status "transcribed".

### Step 2: Select Clips (AI — you do the thinking)
```
GET /api/pipeline-runs/:id
```
Read the `transcript` field. Now analyze it: pick the 15 best 30-60 second segments.
Follow the /select-clips skill instructions for selection criteria.

Then POST the results:
```
POST /api/clip-select
{ "pipelineRunId": "<id>", "clips": [...] }
```

### Step 3: Approve + Cut Clips (server-side)
In Phase 1 (auto mode), all clips are auto-approved. Trigger cutting:
```
POST /api/clip-cut
{ "pipelineRunId": "<id>" }
```

### Step 4: Generate Metadata (AI — you do the thinking)
```
GET /api/pipeline-runs/:id/clips
```
Read the cut clips. For each clip × platform combination, generate platform-native metadata.
Follow the /generate-metadata skill instructions.

Then POST:
```
POST /api/metadata-generate
{ "pipelineRunId": "<id>", "metadata": [...] }
```

### Step 5: Distribute (server-side)
```
POST /api/post-distribute
{ "pipelineRunId": "<id>" }
```

### Done!
Report the results:
- How many clips were selected
- How many were cut successfully
- How many posts were distributed
- Any failures

## Error Handling
If any step fails, stop and report. The user can retry individual steps.
Check `GET /api/pipeline-runs/:id` for the current status and error message.

## Phase 1 vs Phase 3
- **Phase 1** (now): Run straight through, no pauses. Auto-approve everything.
- **Phase 3** (future): Pause at clip review and metadata review for user approval.
