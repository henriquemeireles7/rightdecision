/// <reference lib="dom" />
/**
 * AdminApp — composition root: provides Data/Uploader/PutFile contexts (real by default,
 * injected in tests), the fixed left sidebar (Stripe-dashboard calm: cream canvas, sand
 * accents, gold only for the active state), and the route switch.
 */
import { CohortsScreen } from './cohorts'
import { CourseDetailScreen, CoursesScreen, ModuleDetailScreen } from './courses'
import type { AdminData } from './data'
import { createAdminData, DataContext } from './data'
import { DistributionRunScreen, DistributionScreen } from './distribution'
import { LessonEditorScreen } from './lesson-editor'
import { LivesScreen } from './lives'
import { MaterialsScreen } from './materials'
import { ProgramDetailScreen, ProgramsScreen } from './programs'
import type { Route } from './router'
import { useRoute } from './router'
import { TemplateEditorScreen, TemplatesScreen } from './templates'
import { RouteLink } from './ui'
import type { PutFile, Uploader } from './uploader'
import { createTusUploader, PutFileContext, putFileWithProgress, UploaderContext } from './uploader'

const NAV: Array<{ label: string; route: Route; matches: Route['name'][] }> = [
  {
    label: 'Courses',
    route: { name: 'courses' },
    matches: ['courses', 'course', 'module', 'lesson'],
  },
  { label: 'Programs', route: { name: 'programs' }, matches: ['programs', 'program'] },
  { label: 'Cohorts', route: { name: 'cohorts' }, matches: ['cohorts'] },
  { label: 'Lives', route: { name: 'lives' }, matches: ['lives'] },
  { label: 'Materials', route: { name: 'materials' }, matches: ['materials'] },
  { label: 'Templates', route: { name: 'templates' }, matches: ['templates', 'template'] },
  {
    label: 'Distribution',
    route: { name: 'distribution' },
    matches: ['distribution', 'distribution-run'],
  },
]

function Screen({ route }: { route: Route }) {
  switch (route.name) {
    case 'courses':
      return <CoursesScreen />
    case 'course':
      return <CourseDetailScreen courseId={route.courseId} />
    case 'module':
      return <ModuleDetailScreen courseId={route.courseId} moduleId={route.moduleId} />
    case 'lesson':
      return (
        <LessonEditorScreen
          courseId={route.courseId}
          moduleId={route.moduleId}
          lessonId={route.lessonId}
        />
      )
    case 'programs':
      return <ProgramsScreen />
    case 'program':
      return <ProgramDetailScreen programId={route.programId} />
    case 'cohorts':
      return <CohortsScreen />
    case 'lives':
      return <LivesScreen />
    case 'materials':
      return <MaterialsScreen />
    case 'templates':
      return <TemplatesScreen />
    case 'template':
      return <TemplateEditorScreen templateId={route.templateId} />
    case 'distribution':
      return <DistributionScreen />
    case 'distribution-run':
      return <DistributionRunScreen runId={route.runId} />
  }
}

export function AdminApp(props: { data?: AdminData; uploader?: Uploader; putFile?: PutFile }) {
  const route = useRoute()
  return (
    <DataContext.Provider value={props.data ?? createAdminData()}>
      <UploaderContext.Provider value={props.uploader ?? createTusUploader()}>
        <PutFileContext.Provider value={props.putFile ?? putFileWithProgress}>
          <div class="flex min-h-screen bg-cream">
            <aside class="w-56 shrink-0 border-r border-linen bg-sand/40 px-4 py-6">
              <p class="px-3 font-display text-lg text-ink">Right Decision</p>
              <p class="px-3 text-xs text-muted">Admin</p>
              <nav aria-label="Admin sections" class="mt-6 space-y-1">
                {NAV.map((item) => {
                  const active = item.matches.includes(route.name)
                  return (
                    <RouteLink
                      key={item.label}
                      route={item.route}
                      class={`block rounded-sm px-3 py-2 text-sm font-medium ${
                        active ? 'bg-gold/20 text-ink' : 'text-body hover:bg-sand hover:text-ink'
                      }`}
                      aria-current={active ? 'page' : undefined}
                    >
                      {item.label}
                    </RouteLink>
                  )
                })}
              </nav>
            </aside>
            <main class="min-w-0 flex-1 px-10 py-8">
              <div class="mx-auto max-w-4xl">
                <Screen route={route} />
              </div>
            </main>
          </div>
        </PutFileContext.Provider>
      </UploaderContext.Provider>
    </DataContext.Provider>
  )
}
