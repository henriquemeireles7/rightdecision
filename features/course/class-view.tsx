import type { CourseClass } from '@/providers/content'

type ClassViewProps = {
  cls: CourseClass
  isComplete: boolean
  isLocked: boolean
  nextClassId: string | null
}

export function ClassView({ cls, isComplete, isLocked, nextClassId }: ClassViewProps) {
  if (isLocked) {
    return (
      <div class="max-w-3xl mx-auto px-6 py-12">
        <div class="bg-amber-50 border border-amber-200 rounded-lg p-8 text-center">
          <h2 class="text-2xl font-serif mb-4">Upgrade to unlock</h2>
          <p class="text-neutral-600 mb-6">This module requires an active subscription.</p>
          <a href="/api/checkout" class="bg-amber-700 text-white px-6 py-3 rounded-lg hover:bg-amber-800 transition-colors">
            Get access — $197/year
          </a>
        </div>
      </div>
    )
  }

  const isPractical = cls.type === 'practical'

  return (
    <div class={`max-w-3xl mx-auto px-6 py-12 ${isPractical ? 'bg-amber-50' : ''}`}>
      {isPractical && (
        <div class="text-sm text-amber-700 font-medium mb-2 uppercase tracking-wide">
          Exercise
        </div>
      )}

      <h1 class="text-3xl font-serif mb-2">{cls.title}</h1>
      <div class="text-sm text-neutral-500 mb-8">
        {cls.durationMinutes} min · Module {cls.module} · {cls.type === 'practical' ? 'Practice' : 'Theory'}
      </div>

      {/* Content is from trusted local MDX files, rendered as text.
          TODO: Add markdown renderer (e.g. marked + DOMPurify) for rich formatting */}
      <div class="prose prose-neutral max-w-none mb-12 whitespace-pre-wrap">{cls.content}</div>

      <div class="border-t pt-8 flex items-center justify-between">
        {!isComplete ? (
          <button
            class="bg-amber-700 text-white px-6 py-3 rounded-lg hover:bg-amber-800 transition-colors"
            hx-post="/api/progress/v2/complete"
            hx-vals={JSON.stringify({ classId: cls.id, courseId: cls.courseId })}
          >
            {isPractical ? "I've completed this exercise" : 'Mark complete'}
          </button>
        ) : (
          <span class="text-green-700 font-medium">Completed</span>
        )}

        {nextClassId && (
          <a href={`/class/${nextClassId}`} class="text-amber-700 hover:text-amber-800 font-medium">
            Next class &rarr;
          </a>
        )}
      </div>
    </div>
  )
}
