/**
 * RESOLVERS record — maps {{PLACEHOLDER}} names to generator functions.
 * Each resolver takes a TemplateContext and returns the replacement string.
 */

import { generateBrowseSetup, generateCommandReference, generateSnapshotFlags } from './browse'
import { generateInvokeSkill } from './composition'
import { generateConfidenceCalibration } from './confidence'
import {
  generateDesignHardRules,
  generateDesignMethodology,
  generateDesignMockup,
  generateDesignOutsideVoices,
  generateDesignReviewLite,
  generateDesignSetup,
  generateDesignShotgunLoop,
  generateDesignSketch,
} from './design'
import { generateLearningsLog, generateLearningsSearch } from './learnings'
// Domain modules
import { generatePreamble, generateTestFailureTriage } from './preamble'
import {
  generateAdversarialStep,
  generateBenefitsFrom,
  generateCodexPlanReview,
  generateCodexSecondOpinion,
  generatePlanCompletionAuditReview,
  generatePlanCompletionAuditShip,
  generatePlanFileReviewReport,
  generatePlanVerificationExec,
  generateReviewDashboard,
  generateScopeDrift,
  generateSpecReviewLoop,
} from './review'
import { generateReviewArmy } from './review-army'
import {
  generateTestBootstrap,
  generateTestCoverageAuditPlan,
  generateTestCoverageAuditReview,
  generateTestCoverageAuditShip,
} from './testing'
import type { ResolverFn, TemplateContext } from './types'
import {
  generateBaseBranchDetect,
  generateChangelogWorkflow,
  generateCoAuthorTrailer,
  generateDeployBootstrap,
  generateQAMethodology,
  generateSlugEval,
  generateSlugSetup,
} from './utility'

export const RESOLVERS: Record<string, ResolverFn> = {
  SLUG_EVAL: generateSlugEval,
  SLUG_SETUP: generateSlugSetup,
  COMMAND_REFERENCE: generateCommandReference,
  SNAPSHOT_FLAGS: generateSnapshotFlags,
  PREAMBLE: generatePreamble,
  BROWSE_SETUP: generateBrowseSetup,
  BASE_BRANCH_DETECT: generateBaseBranchDetect,
  QA_METHODOLOGY: generateQAMethodology,
  DESIGN_METHODOLOGY: generateDesignMethodology,
  DESIGN_HARD_RULES: generateDesignHardRules,
  DESIGN_OUTSIDE_VOICES: generateDesignOutsideVoices,
  DESIGN_REVIEW_LITE: generateDesignReviewLite,
  REVIEW_DASHBOARD: generateReviewDashboard,
  PLAN_FILE_REVIEW_REPORT: generatePlanFileReviewReport,
  TEST_BOOTSTRAP: generateTestBootstrap,
  TEST_COVERAGE_AUDIT_PLAN: generateTestCoverageAuditPlan,
  TEST_COVERAGE_AUDIT_SHIP: generateTestCoverageAuditShip,
  TEST_COVERAGE_AUDIT_REVIEW: generateTestCoverageAuditReview,
  TEST_FAILURE_TRIAGE: generateTestFailureTriage,
  SPEC_REVIEW_LOOP: generateSpecReviewLoop,
  DESIGN_SKETCH: generateDesignSketch,
  DESIGN_SETUP: generateDesignSetup,
  DESIGN_MOCKUP: generateDesignMockup,
  DESIGN_SHOTGUN_LOOP: generateDesignShotgunLoop,
  BENEFITS_FROM: generateBenefitsFrom,
  CODEX_SECOND_OPINION: generateCodexSecondOpinion,
  ADVERSARIAL_STEP: generateAdversarialStep,
  SCOPE_DRIFT: generateScopeDrift,
  DEPLOY_BOOTSTRAP: generateDeployBootstrap,
  CODEX_PLAN_REVIEW: generateCodexPlanReview,
  PLAN_COMPLETION_AUDIT_SHIP: generatePlanCompletionAuditShip,
  PLAN_COMPLETION_AUDIT_REVIEW: generatePlanCompletionAuditReview,
  PLAN_VERIFICATION_EXEC: generatePlanVerificationExec,
  CO_AUTHOR_TRAILER: generateCoAuthorTrailer,
  LEARNINGS_SEARCH: generateLearningsSearch,
  LEARNINGS_LOG: generateLearningsLog,
  CONFIDENCE_CALIBRATION: generateConfidenceCalibration,
  INVOKE_SKILL: generateInvokeSkill,
  CHANGELOG_WORKFLOW: generateChangelogWorkflow,
  REVIEW_ARMY: generateReviewArmy,
}
