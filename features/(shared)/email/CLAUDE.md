# email

## Purpose
Transactional email reminders: inactivity, module completion, abandoned onboarding.

## Critical Rules
- ALWAYS use sendEmail() from providers/email — never import Resend directly
- NEVER send more than 1 email per trigger per user per week
- ALWAYS include unsubscribe link in emails

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| reminders.ts | sendInactivityReminders, sendModuleCompletionEmail, sendAbandonedOnboardingReminders |

## Internal Dependencies
- platform/db
- providers/email

<!-- Generated: 2026-04-08T05:22:13.833Z -->
