# /d-profile-learn — Analytics to Learning to Profile Update

The learning flywheel. Pulls analytics for a profile's posts, analyzes what worked, writes a learning file, optionally updates the profile, and writes a changelog. Makes profiles smarter over time.

## When to use
After a profile has accumulated enough posted content with analytics data. Run periodically (weekly or bi-weekly) to feed learnings back into profiles.

## Input
- `--profile <name>` (required) — Profile slug to analyze
- `--dry-run` (optional) — Generate learning file but don't update profile.md/social.md

## Steps

1. **Min data gate**
   Query posts WHERE profileSlug = name. Count posts that have analytics data.
   - If < 10 posts have analytics: write a "not enough data" learning file at `content/profiles/{name}/learning/YYYY_MM_DD-insufficient-data.md` with current count and threshold. **STOP HERE.** Do not analyze insufficient data.
   - If >= 10 posts: proceed to step 2

2. **Pull analytics**
   ```
   GET /api/pipeline-runs (filter by profileSlug via posts)
   ```
   Aggregate metrics per post: views, likes, comments, shares, saves, impressions, reach.

3. **Analyze performance**
   For each post, identify:
   - Which play was used (from post metadata or inference)
   - Which hooks/angles were used
   - Platform performance differences
   - Top 5 and bottom 5 posts by engagement rate

4. **Generate insights**
   - Which plays are performing best?
   - Which hooks get the most engagement?
   - Which platforms are strongest for this profile?
   - What content types (length, tone, topic) resonate?
   - Are there patterns in posting times?

5. **Write learning file**
   Create `content/profiles/{name}/learning/YYYY_MM_DD-{slug}.md`:
   ```markdown
   # Learning: {Date} — {One-line summary}

   ## Data Range
   Posts analyzed: {count} | Date range: {start} — {end}

   ## Top Performers
   {table of top 5 posts with metrics}

   ## Bottom Performers
   {table of bottom 5 posts with metrics}

   ## Insights
   - {insight 1 with data}
   - {insight 2 with data}

   ## Recommended Profile Changes
   - {specific change to profile.md with reasoning}
   - {specific change to social.md with reasoning}

   ## Conclusion
   {1-2 sentence summary of what this learning round revealed}
   ```

6. **Update profile (unless --dry-run)**
   Apply the recommended changes to profile.md and/or social.md.
   Only make changes that are backed by data from step 4.

7. **Write changelog**
   Create `content/profiles/{name}/changelog/YYYY_MM_DD-{slug}.md`:
   ```markdown
   # Changelog: {Date}

   ## What Changed
   - {specific change 1}
   - {specific change 2}

   ## Why
   Based on learning round analyzing {count} posts from {date range}.
   {key insight that drove the change}

   ## Metrics Snapshot
   | Metric | Before | Current |
   |--------|--------|---------|
   | Avg views | {n} | {n} |
   | Engagement rate | {n}% | {n}% |
   ```

8. **Cross-profile insights (if 2+ profiles have learnings)**
   Write to `content/profiles/_insights/YYYY_MM_DD-cross-profile.md` with comparative analysis across profiles.

## Output Format

### SUCCESS
```
Learning round complete for indy-kaz.
Posts analyzed: 47 | Date range: 2026-03-01 — 2026-04-08
Learning file: content/profiles/indy-kaz/learning/2026_04_08-weekly-review.md
Changelog: content/profiles/indy-kaz/changelog/2026_04_08-hook-optimization.md
Changes: Updated 2 hooks in Play 1, added Instagram posting time insight.
Next: Run /d-profile-preview to see how the updated profile generates content.
```

### ERROR
"Profile 'xyz' not found. Available profiles: indy-kaz, henry-kaz, the-right-decision"

### EMPTY (insufficient data)
"indy-kaz has 3/10 required posts with analytics. Post more content and collect analytics first. Run `/d-collect-analytics --profile indy-kaz` to pull latest metrics."

## Rules
- NEVER guess from insufficient data — the min data gate exists for a reason
- NEVER mix learning and content workflows — this skill updates profiles, not posts
- ALWAYS write a learning file, even for insufficient data
- ALWAYS write a changelog when profile changes are made
- Learning files end with ## Conclusion
- Changelogs use ## What Changed / ## Why / ## Metrics Snapshot format
