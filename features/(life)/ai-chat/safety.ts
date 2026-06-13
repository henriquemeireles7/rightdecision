/**
 * Safety system (P6 roadmap deliverable 6 — SCOPE, not polish).
 *
 * The ICP will include people in crisis. This module is the tested mechanism that keeps
 * crisis/self-harm input from ever receiving advice or decision-decomposition. On a crisis
 * signal the chat turn returns CRISIS_RESPONSE (resource referral + boundary) and the LLM is
 * NEVER called. The "not therapy" disclosure is persistent (under the chat input + onboarding).
 *
 * ALL copy here complies with decisions/voice.md: warm, plain, no hedge, no banned words, no
 * alarm. The crisis treatment is CALM by design (the UI renders it sand/gold, never alarm-red).
 */

/**
 * Crisis-resource list — FOUNDER INPUT REQUIRED (roadmap open question + humantasks.md P0).
 * Do NOT invent specific region-specific hotline numbers here. This is a clearly-marked
 * placeholder using only the generic US 988 line + emergency-services language; the founder
 * supplies the real region-aware list before AI features launch.
 *
 * TODO(founder): replace with the real, region-aware crisis-resource list. Tracked in
 * decisions/humantasks.md ("AI crisis-resource list" P0).
 */
export const CRISIS_RESOURCES = {
  isPlaceholder: true as const,
  todo: 'PLACEHOLDER — founder must supply the real region-specific crisis-resource list (humantasks.md P0).',
  /** US generic placeholder. Real region-aware lines are founder input. */
  primaryLine: 'In the US, call or text 988 (the Suicide & Crisis Lifeline) — 24 hours a day.',
  emergencyLine: 'If you might act on this right now, call your local emergency services.',
} as const

/**
 * The crisis response: a referral + a warm boundary. NEVER advice, NEVER decomposition,
 * NEVER "let's break this down". Voice.md-compliant — speaks like a person, not a clinician
 * or an alarm. Short. Plain. No hedging. No banned words.
 */
export const CRISIS_RESPONSE = [
  'I want to stop here for a second, because what you just said matters more than anything else.',
  '',
  "I'm built to help you decide things — and this is not the right place for what you're carrying right now. You deserve a real person, not a product.",
  '',
  CRISIS_RESOURCES.primaryLine,
  CRISIS_RESOURCES.emergencyLine,
  '',
  "You're not a burden for saying this. Please reach out to one of them now. I'll be here when you're ready to come back.",
].join('\n')

/**
 * The persistent "not therapy" disclosure — a quiet line UNDER the chat input (never a
 * dismissable modal) and in onboarding. Voice.md register: plain, kind, no hedge.
 */
export const NOT_THERAPY_LINE =
  'This is not therapy. It helps you decide — it does not replace a doctor, a therapist, or a crisis line.'

/**
 * The safety preamble prepended to every chat system prompt. Sets the refusal boundaries and
 * the crisis posture for the model (the keyword classifier is the hard gate; this is defense
 * in depth so even a near-miss the classifier didn't catch is handled as referral, not advice).
 */
export const SAFETY_SYSTEM_PROMPT = [
  'You help one woman decide things. You are not a therapist, a doctor, or a crisis line, and you never pretend to be one.',
  '',
  'If she mentions wanting to die, hurting herself, or being in crisis: do not give advice, do not decompose the decision, do not try to fix it. Point her to real help and set a warm boundary. A crisis is not a decision to break down — it is a moment to hand off to a person.',
  '',
  'You refuse, plainly and kindly, to give medical, legal, or clinical-mental-health advice. You decline anything that would harm her or someone else. When you refuse, you say what you can help with instead.',
  '',
  'You are honest and specific. You do not flatter. You do not hedge every sentence. You never use words like manifest, align, vibration, tribe, empower, or "healing journey". You talk like a person who has lived it, not a coach on Instagram.',
].join('\n')

/**
 * Self-harm / suicide intent matcher. Word-boundary phrase patterns, case-insensitive.
 * Deliberately phrase-based (not bare keywords) so idioms like "this deadline is killing me"
 * or "I keep killing my chances" do NOT trip it. The hard gate before any LLM call.
 */
const CRISIS_PATTERNS: RegExp[] = [
  /\bkill (myself|me)\b/,
  /\b(suicide|suicidal)\b/,
  /\bend (my life|it all|things)\b/,
  /\b(don'?t|do not|never) want to (be alive|live|wake up|exist)\b/,
  /\bwant to (die|disappear)\b/,
  /\bhurt(ing)? myself\b/,
  /\b(self[- ]harm|self[- ]harming)\b/,
  /\b(cut(ting)?) myself\b/,
  /\b(better off|everyone.{0,20}better) (if i|without me|i (were|was) (dead|gone))\b/,
  /\bbetter off if i (were|was) (dead|gone)\b/,
  /\bplan to (end|kill)\b/,
  /\bno (point|reason) (in|to) (living|being here|going on)\b/,
]

/** True when the message carries a self-harm / crisis signal — the hard gate before the LLM. */
export function classifyCrisis(message: string): boolean {
  const text = message.toLowerCase()
  return CRISIS_PATTERNS.some((pattern) => pattern.test(text))
}
