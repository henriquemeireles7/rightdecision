/// <reference lib="dom" />
/**
 * The admin SPA's data layer — every API call in one place, typed end-to-end from
 * AppRoutes via the shared api-client (the ONE fetch wrapper; never hand-rolled fetch).
 * Screens consume it through DataContext so tests inject scripted fakes per method.
 */
import { createContext } from 'preact'
import { useContext } from 'preact/hooks'
import { api, unwrap } from '@/features/(shared)/api-client'

export function createAdminData(client: typeof api = api) {
  const admin = client.api.admin
  const cb = admin['course-builder']
  return {
    // ─── Courses → modules → lessons ───
    listCourses: () => unwrap(cb.courses.$get()),
    createCourse: (json: { slug: string; title: string; description?: string }) =>
      unwrap(cb.courses.$post({ json })),
    getCourse: (courseId: string) => unwrap(cb.courses[':courseId'].$get({ param: { courseId } })),
    updateCourse: (
      courseId: string,
      json: { slug?: string; title?: string; description?: string | null },
    ) => unwrap(cb.courses[':courseId'].$patch({ param: { courseId }, json })),
    archiveCourse: (courseId: string) =>
      unwrap(cb.courses[':courseId'].archive.$post({ param: { courseId } })),
    createModule: (courseId: string, json: { title: string; description?: string }) =>
      unwrap(cb.courses[':courseId'].modules.$post({ param: { courseId }, json })),
    reorderModules: (courseId: string, moduleIds: string[]) =>
      unwrap(
        cb.courses[':courseId'].modules.reorder.$post({ param: { courseId }, json: { moduleIds } }),
      ),
    updateModule: (
      moduleId: string,
      json: { title?: string; description?: string | null; status?: 'draft' | 'published' },
    ) => unwrap(cb.modules[':moduleId'].$patch({ param: { moduleId }, json })),
    createLesson: (
      moduleId: string,
      json: { title: string; description?: string; decisionPrompt?: string },
    ) => unwrap(cb.modules[':moduleId'].lessons.$post({ param: { moduleId }, json })),
    reorderLessons: (moduleId: string, lessonIds: string[]) =>
      unwrap(
        cb.modules[':moduleId'].lessons.reorder.$post({ param: { moduleId }, json: { lessonIds } }),
      ),
    updateLesson: (
      lessonId: string,
      json: { title?: string; description?: string | null; decisionPrompt?: string | null },
    ) => unwrap(cb.lessons[':lessonId'].$patch({ param: { lessonId }, json })),

    // ─── Video upload + captions + publish gate ───
    requestLessonUploadUrl: (lessonId: string, uploadLengthBytes: number) =>
      unwrap(
        cb.lessons[':lessonId']['upload-url'].$post({
          param: { lessonId },
          json: { uploadLengthBytes },
        }),
      ),
    generateCaptions: (lessonId: string) =>
      unwrap(cb.lessons[':lessonId'].captions.generate.$post({ param: { lessonId } })),
    setCaptionsReady: (lessonId: string, ready: boolean) =>
      unwrap(cb.lessons[':lessonId'].captions.ready.$put({ param: { lessonId }, json: { ready } })),
    publishLesson: (lessonId: string) =>
      unwrap(cb.lessons[':lessonId'].publish.$post({ param: { lessonId } })),

    // ─── AI covers (ADR 18) ───
    generateCovers: (json: { kind: 'course' | 'module' | 'lesson'; id: string; subject: string }) =>
      unwrap(cb.covers.generate.$post({ json })),
    pickCover: (json: { kind: 'course' | 'module' | 'lesson'; id: string; key: string }) =>
      unwrap(cb.covers.pick.$post({ json })),

    // ─── Programs + program_courses ───
    listPrograms: () => unwrap(admin.programs.$get()),
    createProgram: (json: {
      slug: string
      name: string
      description?: string
      tier: 'free' | 'paid'
    }) => unwrap(admin.programs.$post({ json })),
    getProgram: (id: string) => unwrap(admin.programs[':id'].$get({ param: { id } })),
    updateProgram: (
      id: string,
      json: {
        slug?: string
        name?: string
        description?: string | null
        tier?: 'free' | 'paid'
        status?: 'draft' | 'active' | 'archived'
      },
    ) => unwrap(admin.programs[':id'].$patch({ param: { id }, json })),
    addCourseToProgram: (programId: string, courseId: string) =>
      unwrap(
        admin.programs[':programId'].courses.$post({ param: { programId }, json: { courseId } }),
      ),
    removeCourseFromProgram: (programId: string, courseId: string) =>
      unwrap(
        admin.programs[':programId'].courses[':courseId'].$delete({
          param: { programId, courseId },
        }),
      ),
    reorderProgramCourses: (programId: string, courseIds: string[]) =>
      unwrap(
        admin.programs[':programId'].courses.reorder.$post({
          param: { programId },
          json: { courseIds },
        }),
      ),

    // ─── Cohorts ───
    listCohorts: (programId: string, when: 'upcoming' | 'past' | 'all' = 'all') =>
      unwrap(admin.cohorts.$get({ query: { programId, when } })),
    suggestCohorts: () => unwrap(admin.cohorts.suggestions.$get({ query: {} })),
    createCohort: (json: { programId: string; title: string; startsAt: string; endsAt?: string }) =>
      unwrap(admin.cohorts.$post({ json })),
    updateCohort: (
      id: string,
      json: { title?: string; startsAt?: string; endsAt?: string | null },
    ) => unwrap(admin.cohorts[':id'].$patch({ param: { id }, json })),

    // ─── Lives ───
    listLives: (programId: string, when: 'upcoming' | 'past' | 'all' = 'all') =>
      unwrap(admin.lives.$get({ query: { programId, when } })),
    scheduleLive: (json: {
      programId: string
      title: string
      description?: string
      scheduledAt: string
      youtubeUrl?: string
    }) => unwrap(admin.lives.$post({ json })),
    cancelLive: (id: string) => unwrap(admin.lives[':id'].cancel.$post({ param: { id } })),
    requestReplayUploadUrl: (id: string, uploadLengthBytes: number) =>
      unwrap(
        admin.lives[':id']['replay-upload-url'].$post({
          param: { id },
          json: { uploadLengthBytes },
        }),
      ),

    // ─── Document templates (P5: Life Playbook / Starter Notebook authorship) ───
    listTemplates: (programId?: string) =>
      unwrap(admin.templates.$get({ query: programId ? { programId } : {} })),
    getTemplate: (id: string) => unwrap(admin.templates[':id'].$get({ param: { id } })),
    createTemplate: (json: {
      programId: string
      slug: string
      title: string
      sortOrder?: number
      schema: unknown
    }) => unwrap(admin.templates.$post({ json })),
    updateTemplate: (
      id: string,
      json: {
        programId?: string
        slug?: string
        title?: string
        sortOrder?: number
        schema?: unknown
      },
    ) => unwrap(admin.templates[':id'].$patch({ param: { id }, json })),
    publishTemplate: (id: string) =>
      unwrap(admin.templates[':id'].publish.$post({ param: { id } })),

    // ─── Materials + program_materials ───
    listMaterials: () => unwrap(admin.materials.$get()),
    requestMaterialUploadUrl: (json: { fileName: string; mimeType: string }) =>
      unwrap(admin.materials['upload-url'].$post({ json })),
    createMaterial: (json: {
      title: string
      description?: string
      fileKey: string
      fileSizeBytes?: number
      mimeType?: string
      lessonId?: string
    }) => unwrap(admin.materials.$post({ json })),
    deleteMaterial: (id: string) => unwrap(admin.materials[':id'].$delete({ param: { id } })),
    listProgramMaterials: (programId: string) =>
      unwrap(admin.materials.programs[':programId'].$get({ param: { programId } })),
    addMaterialToProgram: (programId: string, materialId: string) =>
      unwrap(
        admin.materials.programs[':programId'].$post({
          param: { programId },
          json: { materialId },
        }),
      ),
    removeMaterialFromProgram: (programId: string, materialId: string) =>
      unwrap(
        admin.materials.programs[':programId'][':materialId'].$delete({
          param: { programId, materialId },
        }),
      ),
  }
}

export type AdminData = ReturnType<typeof createAdminData>

// Inferred row aliases (types flow from AppRoutes — never defined manually).
export type AdminCourse = Awaited<ReturnType<AdminData['listCourses']>>['courses'][number]
export type AdminCourseDetail = Awaited<ReturnType<AdminData['getCourse']>>
export type AdminModule = AdminCourseDetail['modules'][number]
export type AdminLesson = AdminModule['lessons'][number]
export type AdminProgram = Awaited<ReturnType<AdminData['listPrograms']>>['programs'][number]
export type AdminProgramDetail = Awaited<ReturnType<AdminData['getProgram']>>
export type AdminCohort = Awaited<ReturnType<AdminData['listCohorts']>>['cohorts'][number]
export type AdminCohortSuggestion = Awaited<
  ReturnType<AdminData['suggestCohorts']>
>['suggestions'][number]
export type AdminLive = Awaited<ReturnType<AdminData['listLives']>>['lives'][number]
export type AdminMaterial = Awaited<ReturnType<AdminData['listMaterials']>>['materials'][number]
export type AdminTemplate = Awaited<ReturnType<AdminData['listTemplates']>>['templates'][number]
export type AdminTemplateSchema = AdminTemplate['schema']
export type AdminTemplateChapter = AdminTemplateSchema['chapters'][number]
export type AdminTemplatePage = AdminTemplateChapter['pages'][number]
export type AdminTemplateField = AdminTemplatePage['fields'][number]

export const DataContext = createContext<AdminData>(createAdminData())

export function useData(): AdminData {
  return useContext(DataContext)
}
