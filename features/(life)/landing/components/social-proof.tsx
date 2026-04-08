interface SocialProofProps {
  isPostLaunch?: boolean
}

export function SocialProofSection({ isPostLaunch = false }: SocialProofProps) {
  if (isPostLaunch) {
    return (
      <section class="bg-cream py-16">
        <div class="max-w-[640px] mx-auto px-4 text-center text-body">
          {/* Future: Wins Board feed goes here */}
          <p>Real customer victories will appear here.</p>
        </div>
      </section>
    )
  }

  return (
    <section class="bg-cream py-16">
      <div class="max-w-[640px] mx-auto px-4 text-body leading-[1.7]">
        <p class="text-ink font-semibold text-lg">
          We're not going to show you fake testimonials from people we paid.
        </p>

        <p class="mt-6">Here's what we CAN show you:</p>

        <ul class="mt-4 space-y-3">
          <li class="flex gap-2">
            <span class="text-gold">•</span>
            <span>
              Henry and Indy used this exact methodology to go from stuck to building a company
              together
            </span>
          </li>
          <li class="flex gap-2">
            <span class="text-gold">•</span>
            <span>
              The framework is based on established research: Theory of Constraints (Goldratt),
              Behavior Model (BJ Fogg), and years of informally coaching friends who were stuck
            </span>
          </li>
          <li class="flex gap-2">
            <span class="text-gold">•</span>
            <span>
              Every friend we coached informally used variations of this approach. We stopped
              recommending other programs and built our own.
            </span>
          </li>
        </ul>

        <p class="mt-6">
          We're new. This is honest. The methodology isn't new — we've been living it. The product
          is.
        </p>

        <p class="mt-4 text-muted italic">
          After you complete the course, we'd love to hear your results. Real ones. With real
          numbers.
        </p>
      </div>
    </section>
  )
}
