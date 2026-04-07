# admin

## Purpose
Admin-only analytics and management routes. Requires admin role.

## Critical Rules
- ALWAYS use requirePermission('view_analytics') on all routes
- NEVER expose individual user PII in aggregate analytics
