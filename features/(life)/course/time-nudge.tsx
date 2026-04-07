type TimeNudgeProps = {
  nudgeText: string
  nextModuleName: string
  nextModuleId: number
}

/**
 * Soft time nudge shown at the end of a module.
 * No hard gate — user can proceed immediately.
 * Example: "Take a few days to sit with this before moving on."
 */
export function TimeNudge({ nudgeText, nextModuleName, nextModuleId }: TimeNudgeProps) {
  return (
    <div class="bg-amber-50 border border-amber-200 rounded-lg p-6 my-8 text-center">
      <p class="text-amber-800 font-serif text-lg mb-4">{nudgeText}</p>
      <p class="text-sm text-amber-600 mb-6">
        When you're ready, Module {nextModuleId}: {nextModuleName} is waiting.
      </p>
      <a
        href={`/course/module/${nextModuleId}`}
        class="text-amber-700 hover:text-amber-800 font-medium text-sm"
      >
        I'm ready — continue to Module {nextModuleId} &rarr;
      </a>
    </div>
  )
}

/**
 * Default nudge texts per module transition.
 * Can be overridden by frontmatter time_nudge field.
 */
export const DEFAULT_NUDGES: Record<number, string> = {
  1: "You've just seen the truth about where you are. Take a day to let it settle.",
  2: "Your state map is honest. Give yourself a day before defining where you want to be.",
  3: "The gap is clear now. Sleep on it before naming your constraint.",
  4: "You've named the thing in the way. Take 2-3 days before making your decision.",
  5: "The decision is made. Let it breathe for a day before building your plan.",
  6: "Your plan is set. Start tomorrow. Not today — tomorrow.",
  7: "You're doing the work. Keep going for at least a week before reviewing.",
  8: "Your first review is done. Give it another week of data.",
}
