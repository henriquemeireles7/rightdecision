import type { CourseClass } from '@/providers/content'
import { renderCourseMarkdown } from '@/providers/markdown'

type ClassViewProps = {
  cls: CourseClass
  isComplete: boolean
  isLocked: boolean
  prevClass: { id: string; title: string } | null
  nextClass: { id: string; title: string } | null
  breadcrumb: { moduleNum: number; moduleName: string; classIndex: number; totalClasses: number }
}

export function ClassView({
  cls,
  isComplete,
  isLocked,
  prevClass,
  nextClass,
  breadcrumb,
}: ClassViewProps) {
  if (isLocked) {
    return (
      <div class="max-w-[65ch] mx-auto px-6 py-12">
        <div class="bg-sand rounded-md p-8 text-center">
          <h2 class="text-2xl font-display mb-4 text-ink">Upgrade to unlock</h2>
          <p class="text-body mb-6">This module requires an active subscription.</p>
          <a
            href="/api/checkout"
            class="inline-block bg-gold text-white px-6 py-3 rounded-md hover:bg-gold-hover transition-colors"
          >
            Get access — $197/year
          </a>
        </div>
      </div>
    )
  }

  const isPractical = cls.type === 'practical'
  const renderedContent = renderCourseMarkdown(cls.content)

  return (
    <div class={`fade-in-entry ${isPractical ? 'bg-practice' : 'bg-cream'}`}>
      {/* Reading progress bar */}
      <div class="reading-progress" id="reading-progress" />

      {/* Breadcrumb */}
      <div class="max-w-[65ch] mx-auto px-6 pt-8 pb-2">
        <nav class="text-sm text-muted">
          <a href="/courses/life-decisions" class="hover:text-gold transition-colors">
            Module {breadcrumb.moduleNum}
          </a>
          <span class="mx-2">›</span>
          <span>
            Class {breadcrumb.classIndex} of {breadcrumb.totalClasses}
          </span>
        </nav>
      </div>

      {/* Main content area */}
      <article class="max-w-[65ch] mx-auto px-6 pb-12">
        {isPractical && (
          <div class="text-sm text-gold font-medium mb-2 uppercase tracking-wide">Exercise</div>
        )}

        <h1 class="text-3xl font-display mb-2 text-ink">{cls.title}</h1>
        <div class="text-sm text-muted mb-8">
          {cls.durationMinutes} min read · {isPractical ? 'Practice' : 'Theory'}
        </div>

        {/* Rendered editorial content */}
        <div
          class="prose-editorial"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted local .mdx content
          dangerouslySetInnerHTML={{ __html: renderedContent }}
        />

        {/* Mark complete */}
        <div class="border-t border-linen pt-8 mt-12 flex items-center justify-between">
          {!isComplete ? (
            <button
              type="button"
              class="bg-gold text-white px-6 py-3 rounded-md hover:bg-gold-hover transition-colors"
              hx-post="/api/progress/v2/complete"
              hx-vals={JSON.stringify({ classId: cls.id, courseId: cls.courseId })}
            >
              {isPractical ? "I've completed this exercise" : 'Mark complete'}
            </button>
          ) : (
            <span class="text-success font-medium">Completed</span>
          )}
        </div>

        {/* Previous / Next navigation */}
        <nav class="border-t border-linen pt-8 mt-8 grid grid-cols-2 gap-4">
          {prevClass ? (
            <a href={`/class/${prevClass.id}`} class="group">
              <div class="text-xs text-muted mb-1">← Previous</div>
              <div class="font-display text-ink group-hover:text-gold transition-colors">
                {prevClass.title}
              </div>
            </a>
          ) : (
            <div />
          )}
          {nextClass ? (
            <a href={`/class/${nextClass.id}`} class="group text-right">
              <div class="text-xs text-muted mb-1">Next →</div>
              <div class="font-display text-ink group-hover:text-gold transition-colors">
                {nextClass.title}
              </div>
            </a>
          ) : (
            <div />
          )}
        </nav>
      </article>

      {/* Inline scripts: reading progress + menu toggle */}
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: inline scripts for progress bar and menu
        dangerouslySetInnerHTML={{
          __html: [
            // Reading progress bar
            `(function(){var b=document.getElementById('reading-progress');if(!b)return;var t=function(){var h=document.documentElement.scrollHeight-window.innerHeight;b.style.width=h>0?Math.min(100,window.scrollY/h*100)+'%':'0%'};window.addEventListener('scroll',t,{passive:true});t()})()`,
            // Menu toggle (data-action handlers)
            `document.addEventListener('click',function(e){var t=e.target.closest('[data-action]');if(!t)return;var a=t.getAttribute('data-action'),m=document.getElementById('menu-overlay');if(m){if(a==='open-menu')m.classList.remove('hidden');if(a==='close-menu')m.classList.add('hidden')}})`,
          ].join(';'),
        }}
      />
    </div>
  )
}
