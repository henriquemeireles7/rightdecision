# /d-socialpost — Idea to Profile-Aware Social Posts

Generate platform-specific social media posts from a raw idea using a persona profile. Every shower thought becomes differentiated content.

## When to use
When you have an idea for a social post and want to generate platform-specific versions using a profile's voice, hooks, angles, and CTAs. No podcast episode needed.

## Input
- Idea text (required) — the raw thought, insight, or topic
- `--profile <name>` (required) — Target profile slug (e.g., `indy-kaz`, `henry-kaz`)
- `--platform <name>` (optional) — Filter to specific platform(s). If omitted, generates for all active platforms in social.md.

## Steps

1. **Load profile context**
   ```ts
   import { readProfile, listProfiles } from '@/providers/profile'
   ```
   - Call `readProfile(profileName)` to get profile.md + social.md
   - If profile doesn't exist, show available profiles and ask user to choose

2. **Match idea to play**
   - Read the idea text and infer the audience awareness state (1=problem-aware, 2=solution-aware, 3=product-aware, 4=most-aware)
   - Select the matching play from profile.md
   - If no play matches, use Play 1 (broadest audience)

3. **Generate posts per platform**
   For each active platform in social.md (or filtered by --platform):
   - Use the selected play's hooks, angles, and CTA
   - Apply the profile's voice and tone guidelines
   - Respect platform character limits from social.md
   - Generate platform-native copy (TikTok = punchy, Instagram = story, X = provocative)

4. **Output the posts**
   Display each post with:
   - Platform name and character count
   - Play used and audience state
   - The generated post text
   - Hashtags

## Output Format

### SUCCESS (posts generated)
```
Profile: indy-kaz | Play: "The Permission Slip" (state 1: problem-aware)
Idea: "You don't need another book, you need to decide"

--- TikTok (247/300 chars) ---
[post text]
#hashtags

--- Instagram (1,842/2,200 chars) ---
[post text]
#hashtags

Next: Copy these to your scheduling tool, or run /process-episode --profile indy-kaz for podcast-derived content.
```

### ERROR
"Profile 'xyz' not found. Available: indy-kaz, henry-kaz, the-right-decision. Run `/profile-create` to add a new one."

### EMPTY (no active platforms)
"Profile 'indy-kaz' has no active platforms configured in social.md. Add platform accounts first."

## Rules
- Profile is REQUIRED — this skill always generates persona-specific content
- Never exceed platform character limits
- Always use the profile's hooks/angles, never generic ones
- If the profile has no plays yet, suggest running `/d-input` first
