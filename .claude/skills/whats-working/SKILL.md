# /whats-working — AI Insight Generation

Analyze engagement analytics and generate one actionable recommendation. This skill does the AI thinking; the server endpoint validates and saves.

## When to use
On demand, after at least 7 days of analytics data exists.

## Input
- `--profile <name>` (optional) — Scope insights to a specific profile's posts. When provided, only analyzes posts WHERE profileSlug matches.

## Steps

0. **Load profile context (if --profile provided)**
   ```ts
   import { readProfile, listProfiles } from '@/providers/profile'
   ```
   - If `--profile` provided, scope all queries to posts with matching profileSlug
   - If not provided, analyze all posts (backward compatible)

1. **Read analytics data**
   ```
   GET /api/analytics-collect
   ```
   Or query the pipeline runs and their post analytics.
   If `--profile` is set, filter to posts WHERE profileSlug = profileName.

2. **Analyze patterns**
   Look for:
   - Which platforms get the most engagement?
   - What content topics/formats perform best?
   - What posting times correlate with higher views?
   - Which clip scores correlated with actual performance?
   - Are there diminishing returns on any platform?
   - (Profile mode) Which plays are performing best?
   - (Profile mode) Which hooks/angles drive the most engagement?

3. **Generate ONE actionable recommendation**
   Not a report — a single, specific action the user should take.
   Bad: "Instagram is performing well"
   Good: "Double your TikTok posting frequency — your TikTok clips get 3.2x more engagement per impression than Instagram, but you're posting 50% less there"

4. **Format and POST**
   ```json
   {
     "dateRange": {
       "from": "2026-03-01T00:00:00Z",
       "to": "2026-03-15T00:00:00Z"
     },
     "recommendation": "Double your TikTok posting frequency...",
     "supportingData": {
       "topPlatform": "tiktok",
       "engagementRate": { "tiktok": 0.082, "instagram": 0.025 },
       "topClips": ["clip-id-1", "clip-id-2"]
     }
   }
   ```
   ```
   POST /api/insights
   ```

## Quality Rules
- Minimum 7 days of data required
- Recommendation must contain a specific action verb
- Supporting data must back up the recommendation
- Be honest — if there's not enough data for a pattern, say so
