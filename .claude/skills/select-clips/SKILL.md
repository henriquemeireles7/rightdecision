# /select-clips — AI Clip Selection

Pick the best clips from a podcast transcript. This skill does the AI thinking; the server endpoint validates and saves.

## When to use
After a pipeline run reaches "transcribed" status. Usually called by /process-episode, but can be run standalone.

## Input
- Pipeline run ID (the user provides this, or you get it from /process-episode context)

## Steps

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

## Selection Criteria
- **Hook in first 3 seconds** — Would someone stop scrolling?
- **Standalone value** — Does it make sense without context?
- **Emotional beat** — Does it provoke curiosity, surprise, or recognition?
- **Clean boundaries** — Does it start/end at natural pauses?
- **Platform fit** — Short punchy = TikTok, story arc = YouTube, provocative = X

## Quality Rules
- Minimum 5 clips, target 15
- Each clip 30-60 seconds (no shorter, no longer)
- No overlapping timestamps
- Score honestly — not everything is a 9
- If the content is truly bad, return fewer clips with honest scores
