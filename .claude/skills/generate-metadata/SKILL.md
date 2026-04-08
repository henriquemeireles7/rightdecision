# /generate-metadata — AI Metadata Generation

Generate platform-specific descriptions, hashtags, and CTAs for cut clips. This skill does the AI thinking; the server endpoint validates and saves.

## When to use
After clips are cut (pipeline status "cut"). Usually called by /process-episode, but can run standalone.

## Steps

1. **Read the clips**
   ```
   GET /api/pipeline-runs/:id/clips
   ```

2. **Read platform accounts**
   ```
   GET /api/platform-accounts
   ```
   Note the `charLimit` and `hashtagLimit` per platform.

3. **For each clip × platform combination, generate metadata**
   - **Description**: Platform-native copy. TikTok is punchy (300 chars), Instagram is story-driven (2200 chars), X is provocative (280 chars).
   - **Hashtags**: 3-5 relevant hashtags per platform. Research-informed, not generic.
   - **CTA**: Short call to action ("Follow for more", "Link in bio", etc.)

4. **Format as JSON**
   ```json
   {
     "pipelineRunId": "<uuid>",
     "metadata": [
       {
         "clipId": "<uuid>",
         "platformAccountId": "<uuid>",
         "description": "Platform-native description...",
         "hashtags": ["#ai", "#decisionmaking", "#selfgrowth"],
         "cta": "Follow for more insights"
       }
     ]
   }
   ```

5. **POST the results**
   ```
   POST /api/metadata-generate
   Content-Type: application/json
   ```

## Writing Rules
- Match the platform's native voice (TikTok ≠ LinkedIn)
- Front-load the hook — first line matters most
- Hashtags: mix broad (discovery) + niche (community)
- Never exceed platform char limits
- Read decisions/voice.md for brand voice guidelines
