const BEFORE = [
  { label: 'Life score', value: '18/50' },
  { label: 'Career', value: '3/10' },
  { label: 'Sleep', value: 'Insomnia 5 nights/week' },
  { label: 'Savings', value: '$800' },
]

const AFTER = [
  { label: 'Life score', value: '35/50' },
  { label: 'Income', value: '$4,200 → $6,800/month' },
  { label: 'Sleep', value: '5/10 → 8/10' },
  { label: 'Savings', value: '$800 → $3,200' },
]

export function TransformationSection() {
  return (
    <section class="bg-cream py-16">
      <div class="max-w-[800px] mx-auto px-4">
        <h2 class="font-display text-2xl md:text-3xl text-ink text-center">Your Tuesday, after</h2>
        <p class="max-w-[640px] mx-auto mt-6 text-body leading-[1.7] text-center">
          Imagine it's a Tuesday. Three months from now. The thing you've been avoiding? Done.
          Behind you. Not because you finally "healed enough." Because you decided, and then you did
          it.
        </p>
        <p class="max-w-[640px] mx-auto mt-4 text-body leading-[1.7] text-center">
          You wake up without the Sunday dread. You go to work on something you chose. At 3pm you
          have energy. You don't check your bank account before buying groceries.
        </p>

        <p class="max-w-[640px] mx-auto mt-8 text-body text-center">
          Maria scored 18 out of 50 on her life assessment. She made one decision. Changed one
          thing. In 6 weeks:
        </p>

        <div class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Before */}
          <div class="bg-sand rounded-[12px] p-6">
            <h3 class="font-semibold text-muted text-sm uppercase tracking-wide mb-4">Before</h3>
            <ul class="space-y-3">
              {BEFORE.map((item) => (
                <li key={item.label} class="flex justify-between text-muted">
                  <span>{item.label}</span>
                  <span class="font-semibold">{item.value}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* After */}
          <div class="bg-surface-white rounded-[12px] p-6 border border-linen">
            <h3 class="font-semibold text-gold text-sm uppercase tracking-wide mb-4">After</h3>
            <ul class="space-y-3">
              {AFTER.map((item) => (
                <li key={item.label} class="flex justify-between text-ink">
                  <span>{item.label}</span>
                  <span class="font-semibold text-gold">{item.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p class="mt-8 text-center text-ink font-display text-xl">
          One decision. One cycle. Seventeen points.
        </p>
      </div>
    </section>
  )
}
