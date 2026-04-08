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
    <div class="bg-amber-50 border-b border-amber-200 px-6 py-4">
      <div class="max-w-3xl mx-auto flex items-center justify-between">
        <div>
          <div class="text-xs text-amber-700 uppercase tracking-wide mb-1">Your decision</div>
          <p class="font-serif text-neutral-900">{throughlineNamed}</p>
        </div>
      </div>
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

  return (
    <div>
      <DecisionAnchor throughlineNamed={throughlineNamed} />

      <div class="max-w-3xl mx-auto px-6 py-12">
        <h1 class="text-3xl font-serif mb-2">Your Course</h1>

        {/* Overall progress */}
        <div class="mb-8">
          <div class="flex items-center justify-between text-sm text-neutral-600 mb-2">
            <span>{overallPercent}% complete</span>
            {isComplete && <span class="text-green-700 font-medium">Course complete</span>}
          </div>
          <div class="h-2 bg-neutral-200 rounded-full overflow-hidden">
            <div
              class="h-full bg-amber-700 rounded-full transition-all"
              style={{ width: `${overallPercent}%` }}
            />
          </div>
        </div>

        {/* Continue CTA */}
        {!isComplete && currentClassId && (
          <div class="space-y-3 mb-8">
            <a
              href={`/class/${currentClassId}`}
              class="block bg-amber-700 text-white px-6 py-4 rounded-lg hover:bg-amber-800 transition-colors text-center text-lg"
            >
              {overallPercent === 0
                ? 'Begin Module 1'
                : `Continue: ${currentClassName ?? 'Next class'}`}
            </a>
            {overallPercent === 0 && accessTier === 'paid' && (
              <a
                href="/class/module-01/class-04"
                class="block border border-amber-700 text-amber-700 px-6 py-3 rounded-lg hover:bg-amber-50 transition-colors text-center"
              >
                Quick Start: go straight to your first exercise
              </a>
            )}
          </div>
        )}

        {isComplete && (
          <a
            href="/wins/share"
            class="block bg-green-700 text-white px-6 py-4 rounded-lg mb-8 hover:bg-green-800 transition-colors text-center text-lg"
          >
            Write a win
          </a>
        )}

        {/* Module list */}
        <div class="space-y-4">
          {modules.map((mod) => {
            const isLocked = mod.id > 1 && accessTier !== 'paid'
            return (
              <div
                key={mod.id}
                class={`border rounded-lg p-6 ${isLocked ? 'opacity-50' : 'bg-white'}`}
              >
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-serif text-lg">
                    Module {mod.id}: {mod.name}
                  </h3>
                  {isLocked ? (
                    <span class="text-xs text-neutral-500">Locked</span>
                  ) : (
                    <span class="text-sm text-neutral-600">
                      {mod.progress.completed}/{mod.progress.total}
                    </span>
                  )}
                </div>
                {!isLocked && (
                  <div class="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-amber-700 rounded-full"
                      style={{ width: `${mod.progress.percent}%` }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
