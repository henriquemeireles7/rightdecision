# /select-clips — AI Clip Selection

Pick the best clips from a podcast transcript. This skill does the AI thinking; the server endpoint validates and saves.

## When to use
After a pipeline run reaches "transcribed" status. Usually called by /process-episode, but can be run standalone.

## Input
- Pipeline run ID (the user provides this, or you get it from /process-episode context)
- `--profile <name>` (optional) — Target profile slug (e.g., `indy-kaz`, `henry-kaz`). When provided, clip scoring is persona-aware.

## Steps

0. **Load profile context (if --profile provided)**
   ```ts
   import { readProfile, listProfiles } from '@/providers/profile'
   ```
   - If `--profile` is provided, call `readProfile(profileName)` to get profile.md + social.md content
   - If `--profile` is not provided, skip this step (backward compatible — score generically)
   - If the profile doesn't exist, show available profiles via `listProfiles()` and ask the user to choose
   - Inject the full profile.md content as context for scoring in step 2

1. **Read the transcript**
   ```
   GET /api/pipeline-runs/:id
   ```
   Extract the `transcript` field. This is timestamped text like `[00:01:23] sentence here`.

2. **Analyze the transcript**
   Read the full transcript. Identify the 15 best segments for short-form social media clips.
   For each segment:
   - Pick a 30-60 second window with a compelling hook, insight, or emotional moment
   - Score it 1-10 based on: hook strength, standalone value, emotional resonance, controversy/surprise
   - Suggest a title (< 60 chars, scroll-stopping)
   - Extract the transcript snippet for the segment
   - Note which platforms it fits best: tiktok, instagram, youtube, x, facebook

3. **Format the output as JSON**
   ```json
   {
     "pipelineRunId": "<uuid>",
     "clips": [
       {
         "sourceTimestampStart": 83,
         "sourceTimestampEnd": 118,
         "score": 9,
         "suggestedTitle": "The one question that changes everything",
         "transcriptSnippet": "[00:01:23] Here's what nobody tells you...",
         "platformFit": ["tiktok", "instagram", "youtube"]
       }
     ]
   }
   ```

4. **POST the results**
   ```
   POST /api/clip-select
   Content-Type: application/json

   { "pipelineRunId": "...", "clips": [...] }
   ```

## Selection Criteria (Generic — no profile)
- **Hook in first 3 seconds** — Would someone stop scrolling?
- **Standalone value** — Does it make sense without context?
- **Emotional beat** — Does it provoke curiosity, surprise, or recognition?
- **Clean boundaries** — Does it start/end at natural pauses?
- **Platform fit** — Short punchy = TikTok, story arc = YouTube, provocative = X

## Selection Criteria (Profile-Aware — when --profile provided)
When a profile is loaded, scoring criteria shift to prioritize content that matches the profile's audience:
- **ICP alignment** — Does this clip speak to the profile's target audience? (e.g., Indy's women 30-50 vs Henry's entrepreneurs)
- **Play match** — Which play does this clip best fit? Infer audience awareness state from the content, match to the profile's plays
- **Hook resonance** — Does the hook match the profile's voice and hooks? (e.g., Indy = emotional truth, Henry = tactical insight)
- **CTA potential** — Can this clip naturally lead to the profile's primary CTA?
- All generic criteria still apply (standalone value, clean boundaries, platform fit)

## Output Format

### SUCCESS (clips found)
Show a formatted table of selected clips with scores, titles, and platform fit. If profile was used, note which play each clip maps to. Suggest next action: "Run `/generate-metadata --profile <name>` to create posts for these clips."

### ERROR (pipeline or profile issue)
Show actionable error message with fix command. Example: "Profile 'nonexistent' not found. Available profiles: indy-kaz, henry-kaz, the-right-decision"

### EMPTY (no good clips found)
"No clips scored above threshold. The transcript may need a different content angle. Try: re-record focusing on [profile's big idea], or run without --profile for generic scoring."

## Quality Rules
- Minimum 5 clips, target 15
- Each clip 30-60 seconds (no shorter, no longer)
- No overlapping timestamps
- Score honestly — not everything is a 9
- If the content is truly bad, return fewer clips with honest scores
