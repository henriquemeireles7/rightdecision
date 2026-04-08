import { CTAButton } from './cta-button'

const INCLUDED = [
  '9-module course (~23 hours, 3 months at 2h/week)',
  '9 AI-powered Claude skills — one per exercise',
  '9 practical exercises producing YOUR documents (State Map, Decision Statement, One-Page Plan, and more)',
  'Weekly review framework for ongoing decision-making',
  'All future course + skill updates',
  'Your decision archive on your computer — you own your data',
  'AI setup class (no tech knowledge needed)',
]

const NOT_INCLUDED = [
  "No live coaching or calls — because we don't want you dependent on us",
  'No traditional community or forums — but a Wins Board where you can share victories (coming soon)',
  "No \"motivation\" — because motivation is not the problem. Decisions are.",
]

export function OfferSection() {
  return (
    <section class="bg-cream py-16">
      <div class="max-w-[800px] mx-auto px-4">
        <div class="bg-surface-white rounded-[12px] p-8 md:p-12 border border-linen">
          <h2 class="font-display text-2xl md:text-[32px] text-ink text-center">
            The Right Decision — $197/year
          </h2>

          {/* Included */}
          <ul class="mt-8 space-y-3">
            {INCLUDED.map((item) => (
              <li key={item} class="flex gap-3 text-body">
                <span class="text-success font-bold flex-shrink-0">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          {/* Not included */}
          <ul class="mt-6 space-y-3">
            {NOT_INCLUDED.map((item) => (
              <li key={item} class="flex gap-3 text-muted">
                <span class="font-bold flex-shrink-0">✗</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          {/* Price comparison */}
          <div class="mt-8 pt-6 border-t border-linen text-body space-y-2">
            <p>One therapy session: $150-300.</p>
            <p>
              <span class="text-ink font-semibold">
                The Right Decision: $197 for a full year.
              </span>{' '}
              That's $16/month. Less than one therapy session.
            </p>
            <p>
              And while therapy helps you understand the past, The Right Decision
              helps you decide the future.
            </p>
          </div>

          {/* Guarantee box */}
          <div class="mt-8 rounded-[12px] border-2 border-warning p-6 bg-cream">
            <p class="text-ink font-semibold">7-day money-back guarantee.</p>
            <p class="mt-2 text-body text-sm">
              Try the course for a week. Do Module 1. If it's not for you, email
              us and get a full refund. No questions. No guilt.
            </p>
            <p class="mt-2 text-muted text-sm italic">
              We'd rather lose a sale than keep a student who isn't in the right
              place for this.
            </p>
          </div>

          <div class="mt-8 text-center">
            <CTAButton
              text="Start for $197/year — 7-day guarantee"
              className="w-full md:w-auto"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
