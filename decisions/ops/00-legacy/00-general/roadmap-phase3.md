# Roadmap — Phase 3: Developer Platform + Research (Month 24 → Month 36)

> Thesis: The Decision Protocol becomes an open standard. The Decision API becomes the intelligence layer for any decision-adjacent app. Research establishes authority.
> Flywheel stage: User decides → Data captured → Network patterns → Third-party apps amplify → More users
> Revenue target: $5M ARR (10K LD + 200 BD + 20 Enterprise + API revenue)
> Data target: 1M+ decision records

---

## P3.1: Decision Protocol V1 (Open Standard)
**Track:** Developer Layer

**What:** Define and publish the Decision Protocol, an open standard for representing human decisions. Like HTTP for data transfer, the Decision Protocol defines: how to decompose a decision, how to commit, how to track outcomes, how to learn from results. Versioned from day 1 with backward compatibility guarantees. Specification document, reference implementation, developer docs.

**Why in the 5-year vision:** Open protocols win markets. Proprietary protocols win battles. The Protocol makes the Decision OS the default infrastructure for human decision-making. Third-party adoption feeds the flywheel through the API. The own model in Phase 4 becomes the canonical implementation of the Protocol.

---

## P3.2: Decision API + 3 Reference Implementations
**Track:** Developer Layer

**What:** Decision API: "Add decision intelligence to your app in 3 lines of code." Developer documentation, SDKs (JS, Python, Swift, Kotlin), sandbox environment, rate limiting, SLA guarantees. Three showcase integrations built by us: a Relationship Decision Guide, a Career Pivot Assessment, and a Financial Decision Calculator. These prove the protocol works and give developers something to copy.

**Why in the 5-year vision:** The API is how the Decision Protocol spreads. Every third-party app that integrates generates decision records through the API, feeding the flywheel without needing individual users on your platform. The 3 reference implementations are the wedge (AWS Lambda launched with Amazon's own services first). This is the difference between a $50M company and a $5B company.

---

## P3.3: Decision Marketplace
**Track:** Developer Layer

**What:** Third-party developers build specialized decision tools on the platform. A therapist builds a "Relationship Decision Guide." A financial advisor builds a "Retirement Decision Calculator." Platform cut on marketplace sales. Developer onboarding, review process, quality standards.

**Why in the 5-year vision:** The App Store for decisions. Every marketplace app generates decision records. Developers adopt the Protocol because the Marketplace provides distribution AND intelligence. Your data flywheel accelerates because third-party apps feed it.

---

## P3.4: Decision Research Institute
**Track:** Intelligence Layer

**What:** Publish first research paper on decision-making patterns (anonymized data). Create the Decision Benchmark (public, like MMLU but for decisions). Launch annual "State of Human Decision-Making" report. Begin university partnerships for anonymized research access. Host first "Decision Summit" conference (virtual or in-person).

**Why in the 5-year vision:** Credibility that money can't buy. When Nature publishes a paper using your data, that's better marketing than any ad campaign. The Decision Benchmark becomes the standard for evaluating decision support AI. The annual report positions you as THE authority on human decision-making. This is the moat for Phase 4 enterprise deals and government contracts.

---

## P3.5: Enterprise Tier
**Track:** Shared

**What:** Organizational decision support (team decisions). Decision governance (who can make which decisions, approval flows). Decision audit trail (compliance). Integration with enterprise tools (Slack, Teams, Jira, Notion). SSO/SAML. Custom model fine-tuning per organization. Decision analytics dashboard (org-level patterns). ROI measurement.

**Why in the 5-year vision:** Enterprise is the revenue engine for Phase 3. At $X0,000+/year per organization, 20 enterprise clients = significant ARR. Enterprise data is also the richest for business decision intelligence. The enterprise tier validates that the methodology works at organizational scale, not just individual.

---

## P3.6: Dataset Curation + Model Feasibility Gate
**Track:** Intelligence Layer

**What:** Audit the accumulated decision dataset. Build the decision taxonomy (categories, complexity levels). Label outcomes and follow-through. Analyze cross-domain transfer patterns. Generate synthetic data for underrepresented categories. FEASIBILITY GATE: if organic records < 1M, evaluate whether fine-tuning on available data + synthetic augmentation is sufficient before committing to full model training in Phase 4.

**Why in the 5-year vision:** This is the bridge between "platform that uses Claude" and "company that owns its own model." The dataset quality determines whether Phase 4 succeeds. The feasibility gate prevents premature investment in model training.
