import type { CourseModule } from '@/providers/content'
import type { AccessTier } from './access'

type DashboardProps = {
  accessTier: AccessTier
  throughlineNamed?: string
  modules: Array<CourseModule & { progress: { completed: number; total: number; percent: number } }>
  overallPercent: number
  currentClassId?: string | null
  currentClassName?: string
}

function DecisionAnchor({ throughlineNamed }: { throughlineNamed?: string }) {
  if (!throughlineNamed) return null
  return (
    <div class="border-l-3 border-gold pl-6 py-4 mb-10">
      <div class="text-xs text-gold uppercase tracking-wide mb-1">Your decision</div>
      <p class="font-display italic text-ink text-lg">{throughlineNamed}</p>
    </div>
  )
}

export function CourseDashboard(props: DashboardProps) {
  const {
    accessTier,
    throughlineNamed,
    modules,
    overallPercent,
    currentClassId,
    currentClassName,
  } = props
  const isComplete = overallPercent === 100

  // Find first locked module index for graceful message
  const firstLockedIdx = modules.findIndex((mod) => mod.id > 1 && accessTier !== 'paid')

  return (
    <div class="bg-cream min-h-screen">
      <div class="max-w-[65ch] mx-auto px-6 py-12">
        {/* Header with subtle progress */}
        <div class="flex items-baseline justify-between mb-2">
          <h1 class="text-3xl font-display text-ink">Your Course</h1>
          {!isComplete && <span class="text-sm text-muted">{overallPercent}% read</span>}
          {isComplete && <span class="text-sm text-success font-medium">Complete</span>}
        </div>

        {/* Thin progress line */}
        <div class="h-0.5 bg-linen rounded-full mb-10">
          <div
            class="h-full bg-gold rounded-full transition-all"
            style={{ width: `${overallPercent}%` }}
          />
        </div>

        <DecisionAnchor throughlineNamed={throughlineNamed} />

        {/* Continue reading CTA */}
        {!isComplete && currentClassId && (
          <a
            href={`/class/${currentClassId}`}
            class="block bg-gold text-white px-6 py-4 rounded-md hover:bg-gold-hover transition-colors text-center text-lg mb-10"
          >
            {overallPercent === 0
              ? 'Begin reading'
              : `Continue reading: ${currentClassName ?? 'Next class'}`}
          </a>
        )}

        {isComplete && (
          <a
            href="/wins/share"
            class="block bg-success text-white px-6 py-4 rounded-md mb-10 hover:opacity-90 transition-opacity text-center text-lg"
          >
            Write a win
          </a>
        )}

        {/* Chapter list (book table of contents) */}
        <div class="space-y-1">
          {modules.map((mod, idx) => {
            const isLocked = mod.id > 1 && accessTier !== 'paid'

            // Show graceful locked message once, not per-module
            if (isLocked && idx === firstLockedIdx) {
              const lastModNum = modules[modules.length - 1]?.id ?? mod.id
              return (
                <div key="locked" class="py-6 text-center">
                  <p class="text-body italic">
                    Chapters {mod.id}–{lastModNum}: available with full access
                  </p>
                  <a
                    href="/api/checkout"
                    class="inline-block mt-3 text-gold hover:text-gold-hover transition-colors text-sm underline underline-offset-2"
                  >
                    Get full access — $197/year
                  </a>
                </div>
              )
            }
            if (isLocked) return null

            const hasCurrentClass = mod.classes.some((c) => c.id === currentClassId)

            return (
              <div key={mod.id} class="py-4 border-b border-linen last:border-0">
                <div class="flex items-baseline justify-between mb-2">
                  <h3 class={`font-display text-lg ${hasCurrentClass ? 'text-gold' : 'text-ink'}`}>
                    <span class="text-muted mr-3">{mod.id}.</span>
                    {mod.name}
                  </h3>
                  <span class="text-sm text-muted whitespace-nowrap ml-4">
                    {mod.progress.completed} of {mod.progress.total} read
                  </span>
                </div>

                {/* Individual class titles */}
                <div class="pl-8 space-y-1">
                  {mod.classes.map((cls) => {
                    const isCurrent = cls.id === currentClassId
                    return (
                      <a
                        key={cls.id}
                        href={`/class/${cls.id}`}
                        class={`block text-sm py-1 transition-colors ${
                          isCurrent ? 'text-gold font-medium' : 'text-body hover:text-ink'
                        }`}
                      >
                        {cls.title}
                        {cls.type === 'practical' && (
                          <span class="text-xs text-muted ml-2">· Exercise</span>
                        )}
                      </a>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
