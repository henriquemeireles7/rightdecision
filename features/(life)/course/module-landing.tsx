import type { CourseModule } from '@/providers/content'

type ModuleLandingProps = {
  module: CourseModule
  courseSlug: string
  completedClassIds: Set<string>
  currentClassId?: string | null
}

export function ModuleLandingPage({
  module: mod,
  courseSlug,
  completedClassIds,
  currentClassId,
}: ModuleLandingProps) {
  const completedCount = mod.classes.filter((c) => completedClassIds.has(c.id)).length

  return (
    <div class="bg-cream min-h-screen">
      <div class="max-w-[65ch] mx-auto px-6 py-12">
        {/* Back to course */}
        <nav class="text-sm text-muted mb-8">
          <a href={`/courses/${courseSlug}`} class="hover:text-gold transition-colors">
            ← Back to course
          </a>
        </nav>

        {/* Module header */}
        <div class="mb-10">
          <div class="text-sm text-muted mb-2">Module {mod.id}</div>
          <h1 class="text-3xl font-display text-ink mb-2">{mod.name}</h1>
          <p class="text-body">
            {completedCount} of {mod.classes.length} classes read
          </p>
        </div>

        {/* Class list */}
        <div class="space-y-2">
          {mod.classes.map((cls) => {
            const isCompleted = completedClassIds.has(cls.id)
            const isCurrent = cls.id === currentClassId

            return (
              <a
                key={cls.id}
                href={`/courses/${courseSlug}/class/${cls.id}`}
                class={`block p-4 rounded-md border transition-colors ${
                  isCurrent
                    ? 'border-gold bg-surface-white'
                    : 'border-linen hover:border-gold'
                }`}
              >
                <div class="flex items-center justify-between">
                  <div>
                    <div class={`font-display ${isCurrent ? 'text-gold' : 'text-ink'}`}>
                      {cls.title}
                    </div>
                    <div class="text-sm text-muted mt-1">
                      {cls.durationMinutes} min · {cls.type === 'practical' ? 'Exercise' : 'Theory'}
                    </div>
                  </div>
                  {isCompleted && <span class="text-success text-sm">✓</span>}
                </div>
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}
