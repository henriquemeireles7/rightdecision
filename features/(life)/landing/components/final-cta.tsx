import { CTAButton } from './cta-button'

export function FinalCTASection() {
  return (
    <section class="bg-cream py-16">
      <div class="max-w-[640px] mx-auto px-4 text-center">
        <p class="font-display text-2xl md:text-3xl text-ink leading-tight">
          You've spent years understanding why you're stuck.
        </p>
        <p class="font-display text-2xl md:text-3xl text-ink leading-tight mt-2">
          You already know enough.
        </p>
        <p class="font-display text-2xl md:text-3xl text-gold leading-tight mt-2">
          The only thing missing is the decision.
        </p>

        <div class="mt-8">
          <CTAButton className="w-full md:w-auto" />
        </div>
        <p class="mt-4 text-sm text-muted">
          7-day money-back guarantee. Cancel anytime. Your first decision happens in Week 1.
        </p>
      </div>
    </section>
  )
}
