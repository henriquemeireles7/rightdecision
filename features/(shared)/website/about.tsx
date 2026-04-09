import { Layout } from './layout'

export function AboutPage() {
  return (
    <Layout>
      <article class="py-2xl">
        <div class="max-w-[800px] mx-auto px-md">
          <h1 class="font-display text-hero text-ink mb-xl">About The Right Decision</h1>

          {/* The thesis */}
          <p class="text-lg text-secondary leading-relaxed mb-2xl">
            We believe the decision is the primitive. Every meaningful change in a human life begins
            with a decision — not with information, motivation, or a plan. At any moment, one
            decision matters more than all others. We built The Right Decision to help you find it.
          </p>

          {/* Henry's story */}
          <section class="mb-2xl">
            <h2 class="font-display text-2xl text-ink mb-lg">Henry's Story</h2>

            <p class="text-secondary leading-relaxed mb-md">
              I had multiple companies. Exits. Then I was almost unemployed for a year in the US.
            </p>

            <p class="text-secondary leading-relaxed mb-md">
              I was doing everything. Therapy. Meditation. Reading books. Morning routines. Planning
              sessions. I had all the tools. Nothing was moving.
            </p>

            <p class="text-secondary leading-relaxed mb-md">
              Then I stopped. I stopped all of it. The self-help, the hustle culture, the spiritual
              practices. I just went to the computer and started doing things that made me excited.
              That's it.
            </p>

            <p class="text-secondary leading-relaxed mb-md">
              I woke up, did the thing, and went to sleep. No framework. No plan. No vision board.
              Just the thing.
            </p>

            <p class="text-secondary leading-relaxed mb-md">
              After a few weeks, clarity arrived. Not before the action. After. It was through doing
              that everything became clear. The theories I had been juggling for months collapsed
              into one insight: the decision was the thing. Not the information. Not the motivation.
              The decision to do it, and then doing it.
            </p>

            <p class="text-secondary leading-relaxed mb-md">
              I felt like maybe decision is the universal primitive of human beings. We are here to
              make decisions. Depression and not making decisions are related. Anxiety and making
              bad decisions are related. Everything in life could be linked to decisions.
            </p>

            <p class="text-secondary leading-relaxed">
              But it took me years to make one right decision. I did it by luck, by trying too many
              times until luck found me. The idea behind The Right Decision is that you should not
              need years or luck. You should have a system.
            </p>
          </section>

          {/* Indy's story */}
          <section class="mb-2xl">
            <h2 class="font-display text-2xl text-ink mb-lg">Indy's Story</h2>

            <p class="text-secondary leading-relaxed mb-md">
              Indy is the voice and heart of The Right Decision. She went through the same thing
              from the other side — different path, same conclusion: the only thing that works is
              making the right decision and doing the thing.
            </p>

            <p class="text-secondary leading-relaxed">
              She is the quality gate for everything we publish. If it sounds like a coach on
              Instagram, it gets rewritten. If it sounds like a woman who just finished the laundry
              and is telling you the truth — it ships.
            </p>
          </section>

          {/* What we're building */}
          <section class="mb-2xl">
            <h2 class="font-display text-2xl text-ink mb-lg">What We're Building</h2>

            <p class="text-secondary leading-relaxed mb-md">
              We got tired of recommending other people's programs to our friends — and watching
              those friends stay stuck. We were making other creators money while our friends stayed
              in the same place.
            </p>

            <p class="text-secondary leading-relaxed mb-md">
              So we built the thing we wished we'd had. Two products, one idea:
            </p>

            <div class="space-y-md mb-md">
              <div class="p-lg border border-linen rounded-md">
                <h3 class="font-semibold text-ink mb-xs">Life Decisions — $197/year</h3>
                <p class="text-secondary text-sm">
                  A course + AI skills for personal life decisions. You learn the methodology, run
                  the skills, and make the decisions that change your life.
                </p>
              </div>
              <div class="p-lg border border-linen rounded-md opacity-60">
                <h3 class="font-semibold text-ink mb-xs">Business Decisions — Coming Soon</h3>
                <p class="text-secondary text-sm">
                  For non-tech entrepreneurs who want to build AI-native businesses using our exact
                  tools and methodology.
                </p>
              </div>
            </div>
          </section>

          {/* The methodology */}
          <section>
            <h2 class="font-display text-2xl text-ink mb-lg">The Methodology</h2>

            <p class="text-secondary leading-relaxed">
              The Right Decision is built on one idea: you are stuck because you're not making
              decisions, not because you lack understanding. The methodology is a cycle: map where
              you are, define where you want to be, find the one thing in the way, decide, decompose
              the decision into daily actions, do the thing, re-evaluate. Each cycle is faster than
              the last.
            </p>
          </section>
        </div>
      </article>
    </Layout>
  )
}
