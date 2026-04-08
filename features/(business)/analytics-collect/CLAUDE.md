# analytics-collect

## Purpose
Step 6 of BD pipeline. Collects engagement metrics from Upload-Post analytics API. Creates immutable snapshots in postAnalytics. No AI dependency.

## Verify
```sh
bun test features/\(business\)/analytics-collect/service.test.ts
```
