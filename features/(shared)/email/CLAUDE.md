# email

## Purpose
Transactional email reminders: inactivity, module completion, abandoned onboarding.

## Critical Rules
- ALWAYS use sendEmail() from providers/email — never import Resend directly
- NEVER send more than 1 email per trigger per user per week
- ALWAYS include unsubscribe link in emails
