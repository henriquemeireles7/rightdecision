# account-sync

## Purpose
Syncs Upload-Post profiles to local platformAccounts table. Removes need for manual DB inserts when setting up social media accounts for the pipeline.

## Critical Rules
- ALWAYS upsert on uploadPostProfileId to prevent duplicates
- NEVER delete existing accounts that aren't in Upload-Post (they may be manually configured)

## Verify
```sh
bun test features/\(business\)/account-sync/service.test.ts
```
