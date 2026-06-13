export function FreeIntroPaywall() {
  return (
    <div class="min-h-screen bg-cream">
      {/* Top bar */}
      <header class="border-b border-linen">
        <div class="max-w-[800px] mx-auto px-md py-sm">
          <a href="/" class="text-muted text-sm no-underline hover:text-ink transition-colors">
            The Right Decision
          </a>
        </div>
      </header>

      {/* Achievement: User's decision card placeholder */}
      <section class="py-3xl">
        <div class="max-w-[800px] mx-auto px-md">
          {/* This card would be populated with the user's actual decision via client JS */}
          <div class="max-w-[600px] mx-auto p-xl bg-white border-2 border-gold rounded-lg text-center">
            <p class="text-gold text-xs font-semibold tracking-wider uppercase mb-md">
              Your Decision Document
            </p>
            <p class="font-display text-xl text-ink mb-md leading-relaxed" id="user-decision">
              You've identified your constraint and made your first real decision.
            </p>
            <div class="flex justify-center gap-md mt-lg">
              <button
                type="button"
                id="export-btn"
                class="text-gold text-sm font-medium bg-transparent border-none cursor-pointer hover:underline"
              >
                Download as image ↓
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* What comes next */}
      <section class="py-2xl">
        <div class="max-w-[640px] mx-auto px-md">
          <h2 class="font-display text-2xl text-ink mb-md">
            Your decision is the beginning, not the end.
          </h2>
          <p class="text-secondary leading-relaxed mb-md">
            You've done what most people never do: you named your constraint, made a real decision,
            and committed to a first action. That's not nothing. That's everything.
          </p>
          <p class="text-secondary leading-relaxed mb-lg">
            The full Life Decisions program takes your decision and decomposes it across 9 modules.
            You'll build daily actions, learn to adjust when reality pushes back, and resolve the
            thing that's been holding you back. Three acts. Three months. One transformed area of
            your life.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section class="py-2xl bg-sand">
        <div class="max-w-[800px] mx-auto px-md">
          <h2 class="font-display text-2xl text-ink mb-sm text-center">Continue your journey</h2>
          <p class="text-secondary text-center mb-xl max-w-[500px] mx-auto">
            Pick the plan that works for you. Both include the full 9-module program with AI-powered
            decision support.
          </p>
          <div class="grid md:grid-cols-2 gap-lg max-w-[600px] mx-auto">
            {/* Monthly */}
            <div class="p-xl bg-white border border-linen rounded-md">
              <h3 class="font-display text-lg text-ink mb-xs">Monthly</h3>
              <p class="text-ink text-2xl font-semibold mb-xs">
                $19.70<span class="text-muted text-sm font-normal">/month</span>
              </p>
              <p class="text-secondary text-sm mb-lg leading-relaxed">
                Less than a therapy session. Cancel anytime.
              </p>
              <a
                href="/api/checkout/redirect?plan=monthly"
                class="block text-center px-lg py-sm bg-cream text-ink font-medium rounded-sm hover:bg-linen transition-colors no-underline"
              >
                Start Monthly
              </a>
            </div>

            {/* Yearly — highlighted */}
            <div class="p-xl bg-white border-2 border-gold rounded-md relative">
              <span class="absolute -top-[12px] left-xl bg-gold text-ink text-xs font-semibold px-sm py-[2px] rounded-full">
                Save $40
              </span>
              <h3 class="font-display text-lg text-ink mb-xs">Yearly</h3>
              <p class="text-ink text-2xl font-semibold mb-xs">
                $197<span class="text-muted text-sm font-normal">/year</span>
              </p>
              <p class="text-secondary text-sm mb-lg leading-relaxed">
                The cost of one self-help course that actually works.
              </p>
              <a
                href="/api/checkout/redirect?plan=yearly"
                class="block text-center px-lg py-sm bg-gold text-ink font-medium rounded-sm hover:bg-gold-hover transition-colors no-underline"
              >
                Start Yearly
              </a>
            </div>
          </div>
          <p class="text-muted text-xs text-center mt-md">
            7-day money-back guarantee on both plans.
          </p>
        </div>
      </section>

      {/* Not ready CTA */}
      <section class="py-2xl">
        <div class="max-w-[640px] mx-auto px-md text-center">
          <p class="text-secondary mb-md">
            Not ready? That's fine. Your decision isn't going anywhere. We'll email you tomorrow to
            check in.
          </p>
          <a href="/blog" class="text-gold text-sm no-underline hover:underline font-medium">
            Read more from our blog →
          </a>
        </div>
      </section>
    </div>
  )
}
