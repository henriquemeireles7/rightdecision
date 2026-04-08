const NOT_FOR = [
  'You want someone to tell you what to do. This course gives you a system to figure it out yourself.',
  "You're looking for motivation or inspiration. We don't do pep talks.",
  "You're in a clinical crisis (depression, addiction, abuse). Please get professional help first. This course is here when you're stable.",
  'You want to understand yourself better without changing anything. We have nothing to sell you.',
]

const IS_FOR = [
  'You\'ve "done the work" but you\'re still stuck',
  "You know what you want but can't figure out the steps",
  "You're tired of understanding and ready to start deciding",
  "You're willing to be honest with yourself — really honest — for 15 minutes a week",
]

export function DisqualSection() {
  return (
    <section class="bg-sand py-16">
      <div class="max-w-[800px] mx-auto px-4">
        <h2 class="font-display text-2xl md:text-3xl text-ink text-center mb-10">
          This is NOT for everyone
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* IS for you — first on mobile (order-1), second on desktop (md:order-2) */}
          <div class="order-2 md:order-1">
            <h3 class="text-muted font-semibold text-sm uppercase tracking-wide mb-4">
              Don't buy this if:
            </h3>
            <ul class="space-y-3">
              {NOT_FOR.map((item) => (
                <li key={item} class="flex gap-3 text-body text-sm">
                  <span class="text-muted font-bold flex-shrink-0">✗</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div class="order-1 md:order-2">
            <h3 class="text-gold font-semibold text-sm uppercase tracking-wide mb-4">
              This IS for you if:
            </h3>
            <ul class="space-y-3">
              {IS_FOR.map((item) => (
                <li key={item} class="flex gap-3 text-body text-sm">
                  <span class="text-success font-bold flex-shrink-0">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
