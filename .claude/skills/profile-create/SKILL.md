# /profile-create — Bootstrap New Profiles from Framework

Create a new persona profile from the template using the founder's structured copy framework. This is the BD client onboarding entry point.

## When to use
When setting up a new persona (person or brand) that needs its own content strategy. For BD clients: "tell me about your business" becomes a fully populated profile.

## Input
- Profile name as kebab-case slug (required) — e.g., `jane-doe`, `my-brand`

## Steps

1. **Check if profile exists**
   ```ts
   import { listProfiles } from '@/providers/profile'
   ```
   If `content/profiles/{name}/` already exists, show error: "Profile already exists. Use `/d-input` to update it."

2. **Create directory structure**
   ```
   content/profiles/{name}/
   ├── CLAUDE.md
   ├── profile.md      (from _template/profile.template.md)
   ├── social.md        (from _template/social.template.md)
   ├── learning/.gitkeep
   └── changelog/.gitkeep
   ```

3. **Interactive framework extraction**
   Walk the user through the structured copy framework questions:

   **Identity & ICP:**
   - Who is this persona? Name, role, positioning.
   - Who is the ideal audience? Demographics, psychographics.
   - What state are they in? What state do they want?
   - What's their biggest objection?

   **Core Messaging:**
   - What's the one big idea this persona stands for?
   - What's the real problem (not the surface symptom)?
   - Why does this problem get worse if ignored?
   - What does life look like after the decision?
   - What makes this approach different from everything else?

   **Plays (repeat 2-6 times):**
   - Play name and target audience state (1-4)
   - 5 hooks (scroll-stopping opening lines)
   - 4 angles (perspectives to approach the topic)
   - 3 objections with rebuttals
   - Primary CTA
   - 6 content pillars

   **Voice & Tone:**
   - How does this persona speak?
   - What should they NEVER sound like?

4. **Write profile.md**
   Fill in the template with the user's answers. Include Quick Reference block.

5. **Write social.md**
   Ask about active platforms, handles, posting frequency.

6. **Validate**
   ```ts
   import { readProfile, getHealthScore } from '@/providers/profile'
   ```
   Run validation. Report health score.

## Output Format

### SUCCESS
```
Profile created: content/profiles/jane-doe/
Health score: 7/10
  Completeness: 5/5 | Depth: 2/3 (need 3+ hooks/play) | Maturity: 0/3 (no learnings yet)

Next steps:
1. Run /profile-preview jane-doe to see sample posts
2. Run /process-episode --profile jane-doe to generate content from a podcast
3. After 10+ posts, run /profile-learn jane-doe to start the flywheel
```

### ERROR
"Profile 'jane-doe' already exists. Health: 4/10. Run `/d-input` to improve it."

## Rules
- Profile name must be kebab-case (lowercase, hyphens)
- Always provide 3-4 answer options per question (per feedback_dinput_questions memory)
- The copy framework questions are from 400+ consulting engagements — don't skip or simplify them
- Validate the profile after creation
