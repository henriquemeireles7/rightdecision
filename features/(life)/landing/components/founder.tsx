export function FounderSection() {
  return (
    <section class="bg-sand py-16">
      <div class="max-w-[640px] mx-auto px-4">
        <h2 class="font-display text-2xl md:text-3xl text-ink text-center mb-8">
          We were stuck too
        </h2>

        {/* Placeholder portraits */}
        <div class="flex justify-center gap-4 mb-8">
          <div class="w-20 h-20 rounded-full bg-linen flex items-center justify-center text-muted text-xs">
            Henry
          </div>
          <div class="w-20 h-20 rounded-full bg-linen flex items-center justify-center text-muted text-xs">
            Indy
          </div>
        </div>

        {/* Mobile: collapsed */}
        <div class="md:hidden">
          <details>
            <summary class="text-body cursor-pointer">
              I'm Henry. I had multiple companies. Exits. Then I was almost unemployed for a year...
            </summary>
            <div class="mt-4 space-y-4 text-body leading-[1.7]">{founderProse()}</div>
          </details>
        </div>

        {/* Desktop: full */}
        <div class="hidden md:block space-y-4 text-body leading-[1.7]">{founderProse()}</div>
      </div>
    </section>
  )
}

function founderProse() {
  return (
    <>
      <p>I'm Henry. I had multiple companies. Exits. Then I was almost unemployed for a year.</p>
      <p>
        I did everything. Therapy. Meditation. Books. Morning routines. Planning sessions. I had all
        the tools.
      </p>
      <p class="text-ink font-semibold">Nothing was moving.</p>
      <p>
        Then I stopped. I stopped all of it. I went to the computer and started doing things that
        made me excited. That's it. No framework. No plan. Just doing.
      </p>
      <p>
        After a few weeks, clarity arrived. Not before the action. After. It was through doing that
        everything became clear.
      </p>
      <p>
        My wife Indy went through the same thing from the other side. Different path, same
        conclusion: the only thing that works is making the right decision and doing the thing.
      </p>
      <p>
        We built The Right Decision because we got tired of recommending other people's programs to
        our friends — and watching those friends stay stuck. We were making other creators money
        while our friends stayed in the same place.
      </p>
      <p class="text-ink font-semibold">So we built the thing we wished we'd had.</p>
    </>
  )
}
