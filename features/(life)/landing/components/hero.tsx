import { CTAButton } from './cta-button'

const HEADLINES = {
  a: 'The one thing that transforms your life in less than 7 days.',
  b: "You already know what to do. You just haven't decided.",
  c: 'Stop preparing. Start deciding.',
  d: "You don't need another course. You need one decision.",
} as const

type Variant = keyof typeof HEADLINES

interface HeroProps {
  variant?: Variant
}

export function HeroSection({ variant = 'a' }: HeroProps) {
  return (
    <section class="bg-cream pt-[96px] pb-[64px]">
      <div class="max-w-[800px] mx-auto px-4 text-center">
        <h1 class="font-display text-4xl md:text-[56px] leading-tight text-ink">
          {HEADLINES[variant]}
        </h1>
        <p class="max-w-[640px] mx-auto mt-6 text-lg text-body leading-relaxed">
          A methodology + AI that turns stuck goals into clear decisions and
          daily actions. Not therapy. Not motivation. Just clarity.
        </p>
        <div class="mt-8">
          <CTAButton className="w-full md:w-auto" />
        </div>
        <p class="mt-4 text-sm text-muted">
          7-day money-back guarantee. Cancel anytime.
        </p>
      </div>
    </section>
  )
}
