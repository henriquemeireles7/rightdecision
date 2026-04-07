# account

## Purpose
GDPR/privacy endpoints: data export and account deletion.

## Critical Rules
- ALWAYS require auth on all endpoints
- ALWAYS cascade delete ALL user data on account deletion
- NEVER include sensitive fields (password hashes, tokens) in data export
