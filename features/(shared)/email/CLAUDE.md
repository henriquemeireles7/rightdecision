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
| auth-emails.ts | verificationEmail, welcomeEmail, passwordResetEmail, passwordChangedEmail, inactivityReminderEmail, moduleCompletionEmail, abandonedOnboardingEmail |
| cohort-emails.ts | cohortWelcomeEmail, cohortStartsSoonEmail, cohortUpgradeNudgeEmail |
| layout.ts | emailLayout, escapeHtml, ctaButton, stripHtml |
| payment-emails.ts | paymentConfirmationEmail, renewalReceiptEmail, paymentFailedEmail, renewalReminderEmail, subscriptionCancelledEmail, accessRevokedEmail |
| reminders.ts | sendInactivityReminders, sendModuleCompletionEmail, sendAbandonedOnboardingReminders |

## Internal Dependencies
- platform/db
- providers/email

<!-- Generated: 2026-06-12T23:31:24.936Z -->
