type MicroDecisionProps = {
  classId: string
  courseSlug: string
  prompt: string
  existingDecision?: {
    response: string
    createdAt: string
    editable: boolean
  } | null
}

export function MicroDecision({
  classId,
  courseSlug,
  prompt,
  existingDecision,
}: MicroDecisionProps) {
  if (existingDecision) {
    return (
      <div class="fade-in-entry my-12" id={`decision-${classId}`}>
        {/* Locked pull quote */}
        <div class="decision-quote">{existingDecision.response}</div>
        <div class="flex items-center gap-3 mt-2 text-sm text-muted">
          <span>
            Decided · {new Date(existingDecision.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
          {existingDecision.editable && (
            <button
              type="button"
              class="text-gold hover:text-gold-hover transition-colors underline underline-offset-2"
              data-action="edit-decision"
              data-class-id={classId}
            >
              Edit
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div class="fade-in-entry my-12" id={`decision-${classId}`}>
      {/* Decision prompt */}
      <p class="font-display italic text-lg text-ink mb-4">{prompt}</p>

      <form
        hx-post="/api/decisions/save"
        hx-target={`#decision-${classId}`}
        hx-swap="outerHTML"
        class="space-y-4"
      >
        <input type="hidden" name="classId" value={classId} />
        <input type="hidden" name="courseSlug" value={courseSlug} />
        <input type="hidden" name="decisionType" value="text" />
        <input type="hidden" name="prompt" value={prompt} />

        <input
          type="text"
          name="response"
          required
          placeholder="Type your decision..."
          class="w-full px-4 py-3 bg-sand border-2 border-transparent rounded-md text-ink placeholder:text-muted focus:border-gold focus:outline-none transition-colors"
          autocomplete="off"
        />

        <button
          type="submit"
          class="bg-gold text-white px-6 py-3 rounded-md hover:bg-gold-hover transition-colors"
        >
          I've decided
        </button>
      </form>
    </div>
  )
}
