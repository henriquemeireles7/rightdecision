# /generate-metadata — AI Metadata Generation

Generate platform-specific descriptions, hashtags, and CTAs for cut clips. This skill does the AI thinking; the server endpoint validates and saves.

## When to use
After clips are cut (pipeline status "cut"). Usually called by /process-episode, but can run standalone.

## Input
- Pipeline run ID
- `--profile <name>` (optional) — Target profile slug (e.g., `indy-kaz`, `henry-kaz`). When provided, metadata is persona-aware.

## Steps

0. **Load profile context (if --profile provided)**
   ```ts
   import { readProfile, listProfiles } from '@/providers/profile'
   ```
   - If `--profile` is provided, call `readProfile(profileName)` to get profile.md + social.md content
   - If not provided, skip this step (backward compatible — generate generic metadata)
   - If profile doesn't exist, show available profiles via `listProfiles()` and ask user to choose
   - Profile context is injected into the AI prompt for step 3

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
     "profileSlug": "indy-kaz",
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
   Include `profileSlug` in the payload so it's stored on each post row for analytics attribution.

5. **POST the results**
   ```
   POST /api/metadata-generate
   Content-Type: application/json
   ```

## Writing Rules (Generic — no profile)
- Match the platform's native voice (TikTok ≠ LinkedIn)
- Front-load the hook — first line matters most
- Hashtags: mix broad (discovery) + niche (community)
- Never exceed platform char limits
- Read decisions/voice.md for brand voice guidelines

## Writing Rules (Profile-Aware — when --profile provided)
When profile context is loaded, metadata generation becomes persona-specific:
- **Use the profile's hooks and angles** — Pull from the profile's plays, not generic hooks
- **Match the profile's voice** — Indy sounds conversational; Henry sounds technical; Brand sounds authoritative
- **Use the profile's CTA** — Each profile has a primary CTA in its Quick Reference block
- **Apply platform strategies from social.md** — Use the profile's platform-specific strategies for character limits, hashtag approach, content type
- **Match play to clip** — Infer the audience awareness state from the clip's transcript, select the matching play, use that play's hooks/angles/objections
- **Fallback rule** — If no play matches the clip's audience state, use Play 1 (broadest audience)
- All generic writing rules still apply

## Output Format

### SUCCESS (metadata generated)
Show a brief per platform: profile used, play matched, character count vs limit, first 100 chars of description. Suggest next action: "Run `/process-episode` to post, or review metadata in the pipeline dashboard."

### ERROR (profile or pipeline issue)
Actionable error with fix command. Example: "Profile 'indy-kaz' has no plays defined yet. Run `/d-input` to fill in the copy framework."

### EMPTY (no clips available)
"No cut clips found for pipeline run. Run `/select-clips --profile <name>` first."
