type Decision = {
  classId: string
  prompt: string
  response: string
  createdAt: string
}

type JourneyProps = {
  decisions: Decision[]
  throughlineNamed?: string
  totalClasses: number
  courseComplete: boolean
  currentClassId?: string | null
}

export function JourneyPage({
  decisions,
  throughlineNamed,
  totalClasses,
  courseComplete,
  currentClassId,
}: JourneyProps) {
  const isEmpty = decisions.length === 0

  return (
    <div class="bg-cream min-h-screen">
      <div class="max-w-[65ch] mx-auto px-6 py-12">
        <h1 class="text-3xl font-display text-ink mb-2">Your Journey</h1>
        <p class="text-body mb-10">
          {decisions.length} decision{decisions.length !== 1 ? 's' : ''} made
          {totalClasses > 0 && ` across ${totalClasses} classes`}
        </p>

        {/* Throughline banner */}
        {throughlineNamed && (
          <div class="border-l-3 border-gold pl-6 py-4 mb-10">
            <div class="text-xs text-gold uppercase tracking-wide mb-1">Your throughline</div>
            <p class="font-display italic text-ink text-lg">{throughlineNamed}</p>
          </div>
        )}

        {/* Empty state */}
        {isEmpty && (
          <div class="text-center py-16">
            <p class="font-display italic text-ink text-lg mb-4 max-w-md mx-auto">
              Your journey begins with your first decision. Start reading, and when the moment
              arrives, you'll know.
            </p>
            <a
              href={currentClassId ? `/class/${currentClassId}` : '/courses/life-decisions'}
              class="inline-block bg-gold text-white px-6 py-3 rounded-md hover:bg-gold-hover transition-colors"
            >
              Continue reading
            </a>
          </div>
        )}

        {/* Timeline */}
        {!isEmpty && (
          <div class="relative" role="list">
            {/* Timeline line */}
            <div class="absolute left-[5px] top-0 bottom-0 w-0.5 bg-linen" />

            {decisions.map((decision) => (
              <div key={decision.classId} class="relative pl-10 pb-10" role="listitem">
                {/* Node circle */}
                <div class="absolute left-0 top-1 w-3 h-3 rounded-full bg-gold" />

                {/* Decision content */}
                <div class="font-display italic text-ink text-lg leading-relaxed mb-2">
                  {decision.response}
                </div>
                <div class="text-sm text-muted">
                  <span class="mr-3">
                    {new Date(decision.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span class="text-xs text-muted">{decision.prompt}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Course complete: share button */}
        {courseComplete && decisions.length > 0 && (
          <div class="text-center mt-8 pt-8 border-t border-linen">
            <p class="text-body mb-4">You've completed the course. Share your journey.</p>
            <a
              href="/share/journey"
              class="inline-block bg-gold text-white px-6 py-3 rounded-md hover:bg-gold-hover transition-colors"
            >
              Share your journey
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
