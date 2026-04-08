type RichProfileProps = {
  throughlineNamed?: string
  userName?: string
}

const LIFE_AREAS = ['Career', 'Finances', 'Health', 'Relationships', 'Purpose'] as const
const AGE_RANGES = ['18-24', '25-30', '31-40', '41-50', '51-60', '60+'] as const
const TIME_STUCK = [
  'Less than a month',
  '1-3 months',
  '3-6 months',
  '6-12 months',
  '1-2 years',
  '2+ years',
] as const

export function RichProfileScreen({ throughlineNamed, userName }: RichProfileProps) {
  return (
    <div class="min-h-screen bg-stone-50 flex items-center justify-center px-6 py-12">
      <div class="max-w-lg w-full">
        <h1 class="text-3xl font-serif mb-2 text-neutral-900">
          Welcome{userName ? `, ${userName}` : ''}.
        </h1>
        <p class="text-neutral-600 mb-8">
          A few questions to personalize your experience. Takes 2 minutes.
        </p>

        {throughlineNamed && (
          <div class="bg-white border border-amber-200 rounded-lg p-4 mb-8">
            <div class="text-xs text-amber-700 uppercase tracking-wide mb-1">Your decision</div>
            <p class="font-serif">{throughlineNamed}</p>
          </div>
        )}

        <form class="space-y-6" method="POST" action="/api/onboarding/profile">
          <div>
            <label htmlFor="ageRange" class="block text-sm font-medium text-neutral-700 mb-2">
              Age range
            </label>
            <select
              id="ageRange"
              name="ageRange"
              class="w-full border rounded-lg px-4 py-3 bg-white"
            >
              <option value="">Select...</option>
              {AGE_RANGES.map((range) => (
                <option value={range}>{range}</option>
              ))}
            </select>
          </div>

          <div>
            <span id="lifeAreasLabel" class="block text-sm font-medium text-neutral-700 mb-2">
              Which life areas feel most stuck? (select all that apply)
            </span>
            <div class="space-y-2">
              {LIFE_AREAS.map((area) => (
                <label class="flex items-center gap-3 px-4 py-3 bg-white border rounded-lg cursor-pointer hover:border-amber-300">
                  <input
                    type="checkbox"
                    name="lifeAreas"
                    value={area.toLowerCase()}
                    class="accent-amber-700"
                  />
                  <span>{area}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <span id="triedBeforeLabel" class="block text-sm font-medium text-neutral-700 mb-2">
              Have you tried self-help or coaching before?
            </span>
            <div class="space-y-2">
              {['Books', 'Coaching', 'Therapy', 'Courses', 'Nothing — this is my first'].map(
                (opt) => (
                  <label class="flex items-center gap-3 px-4 py-3 bg-white border rounded-lg cursor-pointer hover:border-amber-300">
                    <input
                      type="checkbox"
                      name="triedBefore"
                      value={opt.toLowerCase()}
                      class="accent-amber-700"
                    />
                    <span>{opt}</span>
                  </label>
                ),
              )}
            </div>
          </div>

          <div>
            <label htmlFor="timeStuck" class="block text-sm font-medium text-neutral-700 mb-2">
              How long have you felt stuck in this area?
            </label>
            <select
              id="timeStuck"
              name="timeStuck"
              class="w-full border rounded-lg px-4 py-3 bg-white"
            >
              <option value="">Select...</option>
              {TIME_STUCK.map((t) => (
                <option value={t}>{t}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            class="w-full bg-amber-700 text-white px-6 py-4 rounded-lg text-lg font-medium hover:bg-amber-800 transition-colors"
          >
            Start my course
          </button>

          <a
            href="/course"
            class="block text-center text-sm text-neutral-500 hover:text-neutral-700"
          >
            Skip — I'll do this later
          </a>
        </form>
      </div>
    </div>
  )
}
