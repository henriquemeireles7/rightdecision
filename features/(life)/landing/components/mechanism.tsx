import { CTAButton } from './cta-button'

const PHASES = [
  {
    num: 1,
    label: 'See Clearly',
    description:
      'Map where you actually are (facts, not stories) and where you want to be (conditions, not metrics). Find the ONE thing in the way.',
    illustration: 'Person surveying landscape',
  },
  {
    num: 2,
    label: 'Decide',
    description:
      'Name it. Commit to it. Tell someone. Set a date. Not a wish. Not a plan. A decision with a deadline and a witness.',
    illustration: 'Person writing on a card',
  },
  {
    num: 3,
    label: 'Move',
    description:
      'Break the decision into daily actions. Do one thing per day. Each step has an AI skill that guides you.',
    illustration: 'Person mid-stride',
  },
] as const

export function MechanismSection() {
  return (
    <section id="mechanism" class="bg-cream py-16">
      <div class="max-w-[800px] mx-auto px-4">
        {/* Insight prose */}
        <div class="max-w-[640px] mx-auto space-y-6 text-body leading-[1.7]">
          <h2 class="font-display text-2xl md:text-3xl text-ink">
            Why nothing has worked until now
          </h2>
          <p>
            Every self-help framework you've tried does the same thing: it helps you understand the
            PAST.
          </p>
          <p>None of them ask the one question that actually changes your life:</p>
          <p class="text-ink font-semibold text-lg">
            "What are you going to DO about it? Specifically? By when?"
          </p>

          {/* Three failure points - full on desktop, bullets on mobile */}
          <div class="hidden md:block space-y-3">
            <p>The loop has three failure points:</p>
            <ol class="list-decimal list-inside space-y-2">
              <li>
                <span class="text-ink font-semibold">
                  You work on everything instead of the ONE thing that matters.
                </span>{' '}
                General improvement feels productive but changes nothing.
              </li>
              <li>
                <span class="text-ink font-semibold">You plan without committing.</span> Beautiful
                intentions without a date and a witness.
              </li>
              <li>
                <span class="text-ink font-semibold">
                  You commit without a system to follow through.
                </span>{' '}
                Motivation fades. Willpower fails. Tuesday happens.
              </li>
            </ol>
          </div>
          <div class="md:hidden space-y-2">
            <ul class="list-disc list-inside space-y-1 text-sm">
              <li>Working on everything instead of the ONE thing</li>
              <li>Planning without committing</li>
              <li>Committing without a system to follow through</li>
            </ul>
          </div>

          <p class="text-ink font-semibold">
            You are stuck because you're not making decisions, not because you lack understanding.
          </p>
        </div>

        {/* Phase cards */}
        <div class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {PHASES.map((phase) => (
            <div key={phase.num} class="bg-sand rounded-[12px] p-6 text-center">
              <div class="bg-linen rounded-lg h-48 flex items-center justify-center text-muted text-sm mb-4">
                Illustration: {phase.illustration}
              </div>
              <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gold text-white font-semibold text-sm">
                {phase.num}
              </span>
              <h3 class="font-display text-xl text-ink mt-2">{phase.label}</h3>
              <p class="text-body text-sm mt-2">{phase.description}</p>
            </div>
          ))}
        </div>

        <div class="mt-10 text-center">
          <CTAButton className="w-full md:w-auto" />
        </div>
      </div>
    </section>
  )
}
