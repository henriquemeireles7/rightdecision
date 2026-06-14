/**
 * Canonical program slugs — the SINGLE shared home (P4 decision).
 *
 * Previously PAID_PROGRAM_SLUG lived in platform/scripts/migrate-subscribers-to-enrollments.ts
 * and FREE_PROGRAM_SLUG in platform/scripts/seed-v2.ts. Features may not import from
 * platform/scripts (scripts are standalone CLIs) and scripts may not import from features,
 * so the constants moved here: platform/ is the one layer both can import. The scripts
 * re-export them for back-compat.
 *
 * These are lookup keys, not display names — programs are looked up by slug at runtime
 * (webhook → paid enrollment, join flow → free cohort). NEVER rename a slug without a
 * data migration for the programs table.
 */

/** The paid program ($197/year, evergreen — enrollments carry cohortId NULL). */
export const PAID_PROGRAM_SLUG = 'life-decisions-paid'

/** The free program (monthly cohorts — enrollments are cohort-bound). */
export const FREE_PROGRAM_SLUG = 'life-decisions-free'
