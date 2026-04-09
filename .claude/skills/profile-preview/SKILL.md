# /profile-preview — Sample Posts Without Real Episode

Generate sample social media posts to preview what a profile produces. Zero-cost iteration before committing real content.

## When to use
After creating or updating a profile, before running a real episode. For BD clients: create profile, preview, tweak, THEN run first episode.

## Input
- `--profile <name>` (required) — Profile slug to preview

## Steps

1. **Load profile**
   ```ts
   import { readProfile, listProfiles } from '@/providers/profile'
   ```
   Call `readProfile(profileName)`. If profile not found, show available profiles.

2. **Check profile readiness**
   The profile needs at least:
   - Filled Identity section
   - At least 1 play with hooks
   If plays are empty, suggest: "Run `/profile-create` or `/d-input` to add plays first."

3. **Generate sample posts**
   For each play in the profile (up to 3 plays):
   - Pick a representative topic from the play's content pillars
   - Generate 1 post per active platform using the play's hooks, angles, and CTA
   - Apply the profile's voice and tone

4. **Display results**
   Show posts grouped by play, with platform and character counts.

## Output Format

### SUCCESS
```
Profile Preview: indy-kaz | Health: 4/10 | Plays: 2

--- Play 1: "The Permission Slip" (state 1: problem-aware) ---

  TikTok (287/300 chars):
  You've been in therapy for 3 years and you still haven't
  done the thing. That's not a you problem. That's a decision
  problem. #decisions #unstuck

  Instagram (1,203/2,200 chars):
  [longer version...]

--- Play 2: "The Anti-Framework" (state 2: solution-aware) ---

  TikTok (256/300 chars):
  [post text...]

Satisfied? Run /process-episode --profile indy-kaz to generate real content.
Not right? Edit content/profiles/indy-kaz/profile.md and run /profile-preview again.
```

### ERROR
"Profile 'xyz' not found. Available: indy-kaz, henry-kaz, the-right-decision"

### EMPTY (profile not ready)
"Profile 'indy-kaz' has no plays defined. Run `/profile-create indy-kaz` or `/d-input` to add the copy framework."

## Rules
- NEVER post or save these samples — preview only
- Generate realistic content that actually sounds like the profile's voice
- Show character counts against platform limits
- If the preview looks bad, suggest specific profile edits
