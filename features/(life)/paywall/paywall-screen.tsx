type PaywallProps = {
  throughlineNamed?: string
  checkoutUrl: string
}

export function PaywallScreen({ throughlineNamed, checkoutUrl }: PaywallProps) {
  return (
    <div class="min-h-screen bg-stone-50 flex items-center justify-center px-6">
      <div class="max-w-lg text-center">
        <h1 class="text-3xl font-serif mb-4 text-neutral-900">
          You've named your decision.
        </h1>
        <p class="text-lg text-neutral-600 mb-8">Now let's make it happen.</p>

        {throughlineNamed && (
          <div class="bg-white border border-amber-200 rounded-lg p-6 mb-8 text-left">
            <div class="text-xs text-amber-700 uppercase tracking-wide mb-2">Your decision</div>
            <p class="text-lg font-serif text-neutral-900">{throughlineNamed}</p>
          </div>
        )}

        <a
          href={checkoutUrl}
          class="inline-block bg-amber-700 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-amber-800 transition-colors mb-4 w-full"
        >
          Get the full course — $197/year
        </a>

        <p class="text-sm text-neutral-500 mb-6">7-day money-back guarantee. No questions asked.</p>

        <a href="/course/free" class="text-amber-700 hover:text-amber-800 text-sm font-medium">
          No thanks, I'll start with Module 1 for free &rarr;
        </a>
      </div>
    </div>
  )
}
