type Win = {
  id: string
  lifeArea: string
  description: string
  createdAt: string
  isSeed: boolean
}

type WinsBoardProps = {
  wins: Win[]
  isLoggedIn: boolean
  selectedArea?: string
}

const AREA_LABELS: Record<string, string> = {
  health: 'Health',
  relationships: 'Relationships',
  career: 'Career',
  money: 'Money',
}

const AREA_COLORS: Record<string, string> = {
  health: 'bg-green-50 text-green-700 border-green-200',
  relationships: 'bg-pink-50 text-pink-700 border-pink-200',
  career: 'bg-blue-50 text-blue-700 border-blue-200',
  money: 'bg-amber-50 text-amber-700 border-amber-200',
}

export function WinsBoard({ wins, isLoggedIn, selectedArea }: WinsBoardProps) {
  return (
    <div class="max-w-3xl mx-auto px-6 py-12">
      <h1 class="text-3xl font-serif mb-2">Wins Board</h1>
      <p class="text-neutral-600 mb-8">Real decisions, real progress. All anonymous.</p>

      {/* Area filters */}
      <div class="flex gap-2 mb-8">
        <a
          href="/wins"
          class={`px-4 py-2 rounded-full text-sm border ${!selectedArea ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'}`}
        >
          All
        </a>
        {Object.entries(AREA_LABELS).map(([key, label]) => (
          <a
            key={key}
            href={`/wins?area=${key}`}
            class={`px-4 py-2 rounded-full text-sm border ${selectedArea === key ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'}`}
          >
            {label}
          </a>
        ))}
      </div>

      {/* Win cards */}
      <div class="space-y-4">
        {wins.length === 0 && (
          <div class="text-center py-12 text-neutral-500">No wins yet. Be the first to share.</div>
        )}
        {wins.map((win) => (
          <div key={win.id} class="bg-white border border-neutral-200 rounded-lg p-6">
            <div class="flex items-center gap-2 mb-3">
              <span
                class={`text-xs px-2 py-1 rounded-full border ${AREA_COLORS[win.lifeArea] ?? 'bg-neutral-50 text-neutral-600'}`}
              >
                {AREA_LABELS[win.lifeArea] ?? win.lifeArea}
              </span>
              {win.isSeed && <span class="text-xs text-amber-600">Founding win</span>}
            </div>
            <p class="text-neutral-900">{win.description}</p>
            <p class="text-xs text-neutral-400 mt-3">{win.createdAt}</p>
          </div>
        ))}
      </div>

      {/* Share CTA */}
      {isLoggedIn && (
        <div class="mt-8 text-center">
          <a
            href="/wins/share"
            class="bg-amber-700 text-white px-6 py-3 rounded-lg hover:bg-amber-800 transition-colors"
          >
            Share a win
          </a>
        </div>
      )}
    </div>
  )
}
