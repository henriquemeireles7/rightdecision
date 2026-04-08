type StepProps = {
  currentStep: number
  totalSteps: number
  sessionId: string
}

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div class="flex gap-2 justify-center mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          class={`w-2 h-2 rounded-full ${i + 1 <= current ? 'bg-amber-700' : 'bg-neutral-300'}`}
        />
      ))}
    </div>
  )
}

export function Step1Welcome() {
  return (
    <div class="min-h-screen bg-stone-50 flex items-center justify-center px-6">
      <div class="max-w-lg text-center">
        <h1 class="text-4xl font-serif mb-4">One decision changes everything.</h1>
        <p class="text-lg text-neutral-600 mb-8">Not ten. Not five. One. Let's find yours.</p>
        <p class="text-sm text-neutral-500 mb-8">Takes about 3 minutes. No account needed.</p>
        <button
          class="bg-amber-700 text-white px-8 py-4 rounded-lg text-lg hover:bg-amber-800 transition-colors"
          hx-post="/api/onboarding/start"
        >
          Let's begin
        </button>
      </div>
    </div>
  )
}

export function Step2Intro({ currentStep, totalSteps, sessionId }: StepProps) {
  return (
    <div class="min-h-screen bg-stone-50 flex items-center justify-center px-6">
      <div class="max-w-lg">
        <ProgressDots current={currentStep} total={totalSteps} />
        <h2 class="text-2xl font-serif mb-4 text-center">Before we start</h2>
        <p class="text-neutral-600 mb-8 text-center">
          Most people who feel stuck aren't missing motivation. They're missing clarity on which
          thing to focus on. That's what we're going to find.
        </p>
        <button
          class="w-full bg-amber-700 text-white px-6 py-4 rounded-lg text-lg hover:bg-amber-800 transition-colors"
          hx-put={`/api/onboarding/step/${currentStep}`}
          hx-headers={JSON.stringify({ 'x-onboarding-session': sessionId })}
        >
          Continue
        </button>
      </div>
    </div>
  )
}

export function Step3Question({ currentStep, totalSteps, sessionId }: StepProps) {
  return (
    <div class="min-h-screen bg-stone-50 flex items-center justify-center px-6">
      <div class="max-w-lg w-full">
        <ProgressDots current={currentStep} total={totalSteps} />
        <h2 class="text-2xl font-serif mb-2 text-center">What have you been avoiding?</h2>
        <p class="text-sm text-neutral-500 mb-6 text-center">
          The conversation, the decision, the change. Say it here.
        </p>
        <textarea
          name="throughlineQ1"
          class="w-full border rounded-lg px-4 py-3 min-h-32 mb-6 resize-none"
          placeholder="Type honestly. No one sees this but you."
        />
        <button
          class="w-full bg-amber-700 text-white px-6 py-4 rounded-lg text-lg hover:bg-amber-800 transition-colors"
          hx-put={`/api/onboarding/step/${currentStep}`}
          hx-headers={JSON.stringify({ 'x-onboarding-session': sessionId })}
        >
          Continue
        </button>
        <a
          href={`/onboarding/step/${currentStep - 1}`}
          class="block text-center text-sm text-neutral-500 mt-4"
        >
          &larr; Back
        </a>
      </div>
    </div>
  )
}

export function Step4Question({ currentStep, totalSteps, sessionId }: StepProps) {
  return (
    <div class="min-h-screen bg-stone-50 flex items-center justify-center px-6">
      <div class="max-w-lg w-full">
        <ProgressDots current={currentStep} total={totalSteps} />
        <h2 class="text-2xl font-serif mb-2 text-center">
          If one thing changed in the next 90 days, what would it be?
        </h2>
        <p class="text-sm text-neutral-500 mb-6 text-center">Not everything. One thing.</p>
        <textarea
          name="throughlineQ2"
          class="w-full border rounded-lg px-4 py-3 min-h-32 mb-6 resize-none"
          placeholder="Be specific. 'Feel better' doesn't count."
        />
        <button
          class="w-full bg-amber-700 text-white px-6 py-4 rounded-lg text-lg hover:bg-amber-800 transition-colors"
          hx-put={`/api/onboarding/step/${currentStep}`}
          hx-headers={JSON.stringify({ 'x-onboarding-session': sessionId })}
        >
          Continue
        </button>
        <a
          href={`/onboarding/step/${currentStep - 1}`}
          class="block text-center text-sm text-neutral-500 mt-4"
        >
          &larr; Back
        </a>
      </div>
    </div>
  )
}

export function Step5Decision({ currentStep, totalSteps, sessionId }: StepProps) {
  return (
    <div class="min-h-screen bg-stone-50 flex items-center justify-center px-6">
      <div class="max-w-lg w-full">
        <ProgressDots current={currentStep} total={totalSteps} />
        <h2 class="text-2xl font-serif mb-2 text-center">Name your decision.</h2>
        <p class="text-sm text-neutral-500 mb-6 text-center">
          Based on what you just said — what's the decision you need to make?
        </p>
        <input
          type="text"
          name="throughlineNamed"
          class="w-full border rounded-lg px-4 py-4 text-lg mb-6"
          placeholder="I am deciding to..."
        />
        <button
          class="w-full bg-amber-700 text-white px-6 py-4 rounded-lg text-lg hover:bg-amber-800 transition-colors"
          hx-put={`/api/onboarding/step/${currentStep}`}
          hx-headers={JSON.stringify({ 'x-onboarding-session': sessionId })}
        >
          Continue
        </button>
        <a
          href={`/onboarding/step/${currentStep - 1}`}
          class="block text-center text-sm text-neutral-500 mt-4"
        >
          &larr; Back
        </a>
      </div>
    </div>
  )
}

export function Step6Email({ currentStep, totalSteps, sessionId }: StepProps) {
  return (
    <div class="min-h-screen bg-stone-50 flex items-center justify-center px-6">
      <div class="max-w-lg w-full">
        <ProgressDots current={currentStep} total={totalSteps} />
        <h2 class="text-2xl font-serif mb-2 text-center">Almost there.</h2>
        <p class="text-sm text-neutral-500 mb-6 text-center">
          Enter your email to save your decision and get access to the course.
        </p>
        <input
          type="email"
          name="email"
          class="w-full border rounded-lg px-4 py-4 text-lg mb-6"
          placeholder="your@email.com"
          required
        />
        <button
          class="w-full bg-amber-700 text-white px-6 py-4 rounded-lg text-lg hover:bg-amber-800 transition-colors"
          hx-put={`/api/onboarding/step/${currentStep}`}
          hx-headers={JSON.stringify({ 'x-onboarding-session': sessionId })}
        >
          Save my decision
        </button>
        {/* No back button on email step — per PRD */}
      </div>
    </div>
  )
}
