import type { Course } from '@/providers/content'

type CourseCardProps = {
  course: Course
  progress?: { percent: number; completed: number; total: number }
}

function CourseCard({ course, progress }: CourseCardProps) {
  return (
    <a
      href={`/courses/${course.slug}`}
      class="block bg-surface-white rounded-md p-6 hover:shadow-sm transition-shadow border border-linen"
    >
      <h2 class="font-display text-xl text-ink mb-1">{course.title}</h2>
      <p class="text-body text-sm mb-4">{course.subtitle}</p>
      <div class="flex items-center justify-between text-sm text-muted">
        <span>{course.modules.length} modules</span>
        {progress && <span class="text-gold">{progress.percent}% read</span>}
      </div>
    </a>
  )
}

type CourseListingProps = {
  courses: Course[]
  courseProgress: Map<string, { percent: number; completed: number; total: number }>
}

export function CourseListing({ courses, courseProgress }: CourseListingProps) {
  return (
    <div class="bg-cream min-h-screen">
      <div class="max-w-[65ch] mx-auto px-6 py-12">
        <h1 class="text-3xl font-display text-ink mb-2">Courses</h1>
        <p class="text-body mb-10">Your reading list.</p>

        <div class="space-y-4">
          {courses.map((course) => (
            <CourseCard
              key={course.slug}
              course={course}
              progress={courseProgress.get(course.slug)}
            />
          ))}
        </div>

        {courses.length === 0 && (
          <div class="text-center py-12">
            <p class="text-body italic">Courses coming soon</p>
          </div>
        )}
      </div>
    </div>
  )
}
