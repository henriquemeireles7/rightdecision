# /collect-analytics — Trigger Analytics Collection

Simple automation skill that triggers the analytics collection endpoint. No AI thinking needed.

## When to use
Daily, or whenever you want fresh engagement data.

## Steps

1. **Trigger collection**
   ```
   POST /api/analytics-collect
   Content-Type: application/json

   {}
   ```
   This collects metrics for all posted content from the last 7 days.

2. **Report results**
   The response shows `{ collected: N, errors: N }`.
   Report to the user: "Collected analytics for N posts. M errors."
