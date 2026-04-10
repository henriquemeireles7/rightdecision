# Roadmap — Phase 4: Own AI Model + BaaS Exploration (Month 36 → Month 48)

> Thesis: We have enough proprietary decision data to train a model that outperforms general LLMs at decision support. The model IS the product.
> Flywheel stage: User decides → Data captured → Model improves (automated) → Better decisions → More users
> Revenue target: $20M ARR
> Data target: 10M+ decision records

---

## P4.1: Decision Foundation Model
**Track:** Intelligence Layer

**What:** Architecture selection (fine-tune open model vs. train from scratch). Training infrastructure (GPU cluster, rent first). Evaluation framework (how to measure "good at decision support"). Benchmark suite (our model vs. Claude/GPT on decision tasks). Safety framework (model NEVER makes the decision for the user). Confidence calibration. Multi-turn decision dialogue.

**Why in the 5-year vision:** The own model is the culmination of Phases 1-3. Trained on the world's largest dataset of structured human decisions with real outcomes. This model understands the STRUCTURE of deciding better than any foundation model because it learned from real humans following the methodology. Full stack ownership starts here.

---

## P4.2: Model-Powered Features
**Track:** Intelligence Layer → User Layer

**What:** Replace Claude skills with own model for core methodology. Decision quality prediction (probability of outcome before acting). Counterfactual reasoning ("if you decided X instead, what would likely happen"). Decision network analysis. Decision fatigue detection. Cultural context adaptation. Model-powered Wins Board predictions.

**Why in the 5-year vision:** These features are impossible with a generic LLM. They require the domain-specific model trained on your data. This is the moment the product becomes genuinely unique, something no competitor can replicate because nobody else has the data OR the model.

---

## P4.3: BaaS Exploration
**Track:** Financial Layer (REQUIRES FUNDRAISE)

**What:** Explore Banking-as-a-Service for platform clients. Sponsor bank relationships, KYC/AML program, card program manager. Feasibility study for debit/credit cards for BD white-label clients. NOT a solo-dev project. Requires dedicated team and regulatory expertise.

**Why in the 5-year vision:** The Shopify Balance play. BD clients who run their business through your platform also manage their money through your platform. Card interchange revenue at scale. But only viable after meaningful GMV flows through Stripe Connect (Phase 2).

---

## P4.4: Decision API V2 (Model-Powered)
**Track:** Developer Layer

**What:** Upgrade the Decision API from Claude-backed to own-model-backed. New capabilities only possible with the own model: predictive decision support, counterfactual queries, decision graph analysis API. Premium tier pricing for model-powered features.

**Why in the 5-year vision:** Third-party developers get capabilities no other API can offer. The premium tier drives revenue. The API usage generates even more training data for the model (virtuous cycle).
