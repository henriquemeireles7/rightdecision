import { ScrollCTA } from './cta-button'

export function ProblemSection() {
  return (
    <section class="bg-cream py-16">
      <div class="max-w-[640px] mx-auto px-4 text-body leading-[1.7]">
        {/* Mobile: shortened version */}
        <div class="md:hidden">
          <p class="text-ink font-semibold text-lg">You've done the work.</p>
          <p class="mt-4">
            Therapy. Courses. Books. Meditation. Journaling. Workshops. You've tried everything. And
            you're still stuck.
          </p>
          <details class="mt-4">
            <summary class="text-gold cursor-pointer font-semibold">Read more</summary>
            <div class="mt-4 space-y-4">{fullProse()}</div>
          </details>
        </div>

        {/* Desktop: full version */}
        <div class="hidden md:block space-y-6">
          <p class="text-ink font-semibold text-xl">You've done the work.</p>
          {fullProse()}
        </div>

        {/* Price anchor */}
        <div class="mt-8 space-y-4">
          <p class="text-ink font-semibold">
            Add it up. How much have you spent trying to get unstuck?
          </p>
          <p>
            Therapy: $150-300/session. Coaching: $200-500/hour. Courses: $47-997 each. Retreats:
            $1,500+.
          </p>
          <p>
            Over the last three years, the average number is $3,000-5,000. For understanding. For
            insights. For language about your pain.
          </p>
          <p class="text-ink font-semibold text-lg">How many decisions did it produce?</p>
        </div>

        <div class="mt-8 border-t border-linen pt-8">
          <ScrollCTA text="See how The Right Decision is different" targetId="mechanism" />
        </div>
      </div>
    </section>
  )
}

function fullProse() {
  return (
    <>
      <p>
        Therapy. Courses. Books. Meditation. Journaling. Workshops. You've tried everything. You can
        explain your patterns, name your traumas, draw your attachment map.
      </p>
      <p>And you're still stuck.</p>
      <p>
        Not at the beginning. You've moved cities, changed jobs, built something real. You're ahead
        of most people you know.
      </p>
      <p>
        But something stopped working. You have movement but no progress. Plans but no action. You
        know what you want but can't figure out the steps.
      </p>
      <p>So you do what you've always done: you try to understand why.</p>
      <p>One more book. One more course. One more therapist. One more practice.</p>
      <p>
        And here's the thing — you're not doing nothing. You're doing everything. Therapy, courses,
        journaling, meditation. You're doing the work. You feel productive. You feel like you're
        getting somewhere.
      </p>
      <p>Until a life event shows you that you're in the exact same place.</p>
      <p>
        So you find the next thing. Start with enthusiasm. Do the practice. Feel improvement. Then
        reality hits again. You're in a loop. You've been in it for years. Each cycle feels
        different because the solution is different. But the pattern is identical: consume, process,
        feel better, get hit by life, repeat.
      </p>
      <p class="text-ink font-semibold">Nothing changes.</p>
    </>
  )
}
