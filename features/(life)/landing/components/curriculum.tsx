import { CTAButton } from './cta-button'

const ACTS = [
  {
    num: 'I',
    title: 'See Clearly',
    months: 'Month 1',
    modules: [
      {
        num: 1,
        title: 'The Wake-Up Call',
        desc: 'Understand why "doing the work" keeps you stuck. Name your discomfort.',
      },
      {
        num: 2,
        title: 'Where You Actually Are',
        desc: 'Write your honest state map. Facts, not stories. Numbers, not narratives.',
      },
      {
        num: 3,
        title: 'Where You Want to Be',
        desc: 'Define your target state as a specific Tuesday you\'d want to live.',
      },
    ],
  },
  {
    num: 'II',
    title: 'Decide',
    months: 'Month 2',
    modules: [
      {
        num: 4,
        title: 'The One Thing in the Way',
        desc: 'Identify your dominant constraint. The ONE obstacle that matters most.',
      },
      {
        num: 5,
        title: 'The Decision',
        desc: 'Commit. Write it down. Say it out loud. Tell someone. Set a date.',
      },
      {
        num: 6,
        title: 'The Plan',
        desc: 'Build a one-page plan. Objectives, tasks, habits. Starting tomorrow.',
      },
    ],
  },
  {
    num: 'III',
    title: 'Move',
    months: 'Month 3',
    modules: [
      {
        num: 7,
        title: 'Doing the Thing',
        desc: 'One task per day. Not motivation. Just the thing.',
      },
      {
        num: 8,
        title: 'What Reality Tells You',
        desc: 'Weekly 15-minute reviews. Adjust or persist based on real data.',
      },
      {
        num: 9,
        title: 'Resolution + Next Loop',
        desc: 'Close the cycle. Start the next one. Each loop is faster.',
      },
    ],
  },
] as const

export function CurriculumSection() {
  return (
    <section class="bg-cream py-16">
      <div class="max-w-[800px] mx-auto px-4">
        <h2 class="font-display text-2xl md:text-3xl text-ink text-center">
          9 modules. 3 acts. 3 months.
        </h2>
        <p class="max-w-[640px] mx-auto mt-4 text-body text-center leading-[1.7]">
          This is not a course you binge on a Sunday and forget by Wednesday.
          It's a 3-month system. Two hours a week.
        </p>

        <div class="mt-10 space-y-6">
          {ACTS.map((act, i) => (
            <details
              key={act.num}
              class="bg-linen rounded-[12px] border-l-4 border-gold"
              open={i === 0 ? true : undefined}
            >
              <summary class="p-6 cursor-pointer">
                <span class="inline-flex items-center gap-3">
                  <span class="text-gold font-semibold text-sm">
                    Act {act.num}
                  </span>
                  <span class="font-display text-xl text-ink">{act.title}</span>
                  <span class="text-muted text-sm">({act.months})</span>
                </span>
              </summary>
              <div class="px-6 pb-6">
                <ol class="space-y-3">
                  {act.modules.map((mod) => (
                    <li key={mod.num} class="flex gap-3">
                      <span class="text-gold font-semibold text-sm mt-0.5">
                        {mod.num}.
                      </span>
                      <div>
                        <span class="text-ink font-semibold">{mod.title}</span>
                        <span class="text-body"> — {mod.desc}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </details>
          ))}
        </div>

        <p class="mt-8 text-center text-body text-sm max-w-[640px] mx-auto">
          By the end: 10 documents in your personal decision folder — including
          your win story. AI skills you can run again for your next decision.
        </p>

        <div class="mt-8 text-center">
          <CTAButton text="Start the course" className="w-full md:w-auto" />
        </div>
      </div>
    </section>
  )
}
