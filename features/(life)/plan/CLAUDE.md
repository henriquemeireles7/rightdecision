# plan

## Purpose
Pillar 2 of the handbook — turning what a member wants into a real plan. A `plan` is a horizon
(default 90 days — the "3-month plan") that breaks down into a few `plan_decisions`: concrete,
DATED moves, each pending or done. This is where dates live (unlike aspirations, which are dateless).

## Critical Rules
- ALWAYS scope by `userId`. Plans and decisions both carry `userId`; update/delete match on
  (id, userId) so a wrong owner gets PLAN_NOT_FOUND / PLAN_DECISION_NOT_FOUND.
- ALWAYS verify the parent plan is owned by the member before adding a decision to it
  (addDecision resolves the plan by (planId, userId) → PLAN_NOT_FOUND otherwise).
- `completedAt` is DERIVED from status: setting status='done' stamps it (timestamptz), 'pending'
  clears it. Never let callers set completedAt directly.
- NEVER put plan/decision text in event properties — `plan_created` carries `planId` ONLY.
- `plan_created` is NOT a Decision Graph event (decisionTaxonomy is unchanged) even though plan
  decisions are conceptually "decisions" — wiring them into "Decisions Made" is a later choice.

## Imports (use from other modules)
```ts
import { planRoutes, createPlanRoutes } from '@/features/(life)/plan/routes'
import { listPlans, getPlan, createPlan, addDecision } from '@/features/(life)/plan/service'
```

## Recipe: Add a dated decision to an owned plan
```ts
const plan = await db.select().from(plans).where(and(eq(plans.id, planId), eq(plans.userId, userId)))
if (!plan[0]) return { error: 'PLAN_NOT_FOUND' as const }
await db.insert(planDecisions).values({ planId, userId, title, targetDate })
```

## Verify
```sh
source /tmp/test-env.sh && bun test "features/(life)/plan"
```

---
<!-- AUTO-GENERATED BELOW — do not edit manually -->

## Files
| File | Exports |
|------|---------|
| routes.ts | createPlanRoutes, planRoutes |
| service.ts | createPlanSchema, updatePlanSchema, createDecisionSchema, updateDecisionSchema, CreatePlanInput, UpdatePlanInput, CreateDecisionInput, UpdateDecisionInput, listPlans, getPlan, createPlan, updatePlan, deletePlan, addDecision, updateDecision, deleteDecision |

## Internal Dependencies
- platform/auth
- platform/db
- platform/errors
- platform/events
- platform/server
- platform/types

<!-- Generated: 2026-06-15T04:05:06.165Z -->
