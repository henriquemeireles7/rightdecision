import type { DecisionBlockDef } from '@/providers/content'

type Props = {
  lessonNum: number
  title: string
  firstSegmentHtml: string
  blocks: DecisionBlockDef[]
  classId: string
  courseSlug: string
  isLastLesson: boolean
}

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <nav aria-label="Lesson progress" class="flex items-center gap-sm">
      {Array.from({ length: total }, (_, i) => {
        const num = i + 1
        const isCurrent = num === current
        const isComplete = num < current
        const dotClass = `inline-block w-[10px] h-[10px] rounded-full transition-colors ${
          isCurrent ? 'bg-gold' : isComplete ? 'bg-gold/50' : 'bg-linen'
        }`

        if (num <= current) {
          return (
            <a key={num} href={`/free/${num}`} class={`${dotClass} cursor-pointer`}>
              <span class="sr-only">
                Lesson {num}
                {isCurrent ? ' (current)' : ' (complete)'}
              </span>
            </a>
          )
        }
        return <span key={num} class={dotClass} />
      })}
    </nav>
  )
}

function EmailGate() {
  return (
    <div id="email-gate" class="my-xl">
      <div class="border border-linen rounded-md p-lg bg-white">
        <p class="font-display text-xl text-ink mb-sm">Save your progress and continue</p>
        <p class="text-secondary text-sm mb-lg leading-relaxed">
          Enter your email to keep your decisions and unlock the next lesson.
        </p>
        <form id="email-gate-form" class="space-y-md">
          <input
            type="email"
            id="email-input"
            placeholder="your@email.com"
            required
            class="w-full p-md bg-white border border-linen rounded-sm text-ink text-sm placeholder:text-muted focus:outline-none focus:border-gold transition-colors"
          />
          <label class="flex items-start gap-sm cursor-pointer">
            <input
              type="checkbox"
              id="consent-checkbox"
              required
              class="mt-[3px] w-[18px] h-[18px] accent-gold"
            />
            <span class="text-secondary text-xs leading-relaxed">
              Send me follow-up insights about my decisions. You can unsubscribe anytime.
            </span>
          </label>
          <button
            type="submit"
            class="w-full px-lg py-md bg-gold text-ink font-semibold rounded-sm hover:bg-gold-hover transition-colors"
          >
            Continue →
          </button>
        </form>
        <p id="email-error" class="text-error text-xs mt-sm hidden" />
        <p id="email-existing" class="text-secondary text-sm mt-md hidden">
          You already have an account.{' '}
          <a href="/login" class="text-gold no-underline hover:underline">
            Sign in to continue →
          </a>
        </p>
      </div>
    </div>
  )
}

export function FreeIntroLesson({
  lessonNum,
  firstSegmentHtml,
  blocks,
  classId,
  courseSlug,
  isLastLesson,
}: Props) {
  const needsEmailGate = lessonNum === 2

  return (
    <div class="min-h-screen bg-cream">
      {/* Top bar */}
      <header class="sticky top-0 z-10 bg-cream/90 backdrop-blur border-b border-linen">
        <div class="max-w-[800px] mx-auto px-md py-sm flex items-center justify-between">
          <a href="/free" class="text-muted text-sm no-underline hover:text-ink transition-colors">
            ← Back
          </a>
          <div class="flex items-center gap-md">
            <span class="text-muted text-xs">Lesson {lessonNum} of 3</span>
            <ProgressDots current={lessonNum} total={3} />
          </div>
        </div>
      </header>

      {/* Email gate overlay for L2 (shown first, hides lesson content) */}
      {needsEmailGate && (
        <div id="email-gate-overlay">
          <div class="max-w-[640px] mx-auto px-md py-2xl">
            <EmailGate />
          </div>
        </div>
      )}

      {/* Lesson content (hidden behind email gate on L2 until email is submitted) */}
      <article
        class="max-w-[640px] mx-auto px-md py-2xl"
        id="lesson-content"
        style={needsEmailGate ? 'display:none' : undefined}
      >
        {/* First segment (always visible) */}
        <div
          class="prose-warm"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted markdown
          dangerouslySetInnerHTML={{ __html: firstSegmentHtml }}
        />

        {/* Decision blocks */}
        {blocks.map((block, i) => (
          <div key={block.blockId} class="my-xl" id={`block-${block.blockId}`}>
            <div class="border border-linen rounded-md p-lg bg-white">
              <p class="font-display text-xl text-ink mb-lg">{block.question}</p>

              {/* Skeleton suggestions (replaced by client JS) */}
              <div class="space-y-sm" id={`suggestions-${block.blockId}`}>
                <div class="w-full p-md bg-cream border border-linen rounded-sm animate-pulse h-[52px]" />
                <div class="w-full p-md bg-cream border border-linen rounded-sm animate-pulse h-[52px]" />
                <div class="w-full p-md bg-cream border border-linen rounded-sm animate-pulse h-[52px]" />
              </div>

              <div class="mt-md">
                <input
                  type="text"
                  placeholder="Or write your own..."
                  class="w-full p-md bg-white border border-linen rounded-sm text-ink text-sm placeholder:text-muted focus:outline-none focus:border-gold transition-colors"
                  id={`custom-${block.blockId}`}
                  data-block-id={block.blockId}
                  data-class-id={classId}
                  data-course-slug={courseSlug}
                  data-question={block.question}
                />
              </div>
            </div>

            {/* Locked content placeholder */}
            {i < blocks.length - 1 && (
              <div
                class="mt-md h-[120px] bg-gradient-to-b from-cream/50 to-cream rounded-sm flex items-center justify-center"
                id={`locked-${block.blockId}`}
              >
                <p class="text-muted text-xs italic">Answer to continue reading...</p>
              </div>
            )}
          </div>
        ))}

        {/* Navigation */}
        <div class="mt-3xl pt-xl border-t border-linen flex justify-between items-center">
          {lessonNum > 1 && (
            <a
              href={`/free/${lessonNum - 1}`}
              class="text-muted text-sm no-underline hover:text-ink transition-colors"
            >
              ← Previous
            </a>
          )}
          <div class="ml-auto">
            {isLastLesson ? (
              <a
                href="/free/paywall"
                class="inline-block px-xl py-md bg-gold text-ink font-semibold rounded-sm hover:bg-gold-hover transition-colors no-underline"
              >
                Continue to Full Program →
              </a>
            ) : (
              <a
                href={`/free/${lessonNum + 1}`}
                class="inline-block px-lg py-sm bg-gold text-ink font-medium rounded-sm hover:bg-gold-hover transition-colors no-underline"
              >
                Continue to Lesson {lessonNum + 1} →
              </a>
            )}
          </div>
        </div>
      </article>

      {/* Client-side JS */}
      <script
        type="module"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: inline script for decision block + session interactivity
        dangerouslySetInnerHTML={{
          __html: `
const LESSON = ${lessonNum};

// ─── A/B variant tracking ───
const urlVariant = new URLSearchParams(window.location.search).get('v');
const cookieVariant = document.cookie.match(/free_intro_variant=([^;]+)/)?.[1];
const variant = urlVariant || cookieVariant || 'default';
if (window.posthog) {
  window.posthog.register({ free_intro_variant: variant });
}

// ─── Session management ───
async function ensureSession() {
  try {
    const res = await fetch('/api/free-intro/session', { method: 'POST' });
    return (await res.json()).data;
  } catch { return null; }
}

// ─── Email gate (Lesson 2) ───
const emailForm = document.getElementById('email-gate-form');
if (emailForm) {
  emailForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email-input').value.trim();
    const consent = document.getElementById('consent-checkbox').checked;
    const errorEl = document.getElementById('email-error');
    const existingEl = document.getElementById('email-existing');

    if (!email || !consent) {
      errorEl.textContent = 'Please enter your email and check the consent box.';
      errorEl.classList.remove('hidden');
      return;
    }

    try {
      const res = await fetch('/api/free-intro/email-gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, consent }),
      });
      const data = await res.json();

      if (data.ok && data.data.existingAccount) {
        existingEl.classList.remove('hidden');
        errorEl.classList.add('hidden');
        return;
      }

      if (data.ok) {
        // Success: hide gate, show content
        document.getElementById('email-gate-overlay').style.display = 'none';
        document.getElementById('lesson-content').style.display = 'block';
        loadSuggestions();
      } else {
        errorEl.textContent = 'Something went wrong. Please try again.';
        errorEl.classList.remove('hidden');
      }
    } catch {
      errorEl.textContent = 'Network error. Please try again.';
      errorEl.classList.remove('hidden');
    }
  });
}

// ─── Init: create session on L1 ───
if (LESSON === 1) {
  ensureSession();
}

// ─── Decision block suggestions ───
function loadSuggestions() {
  document.querySelectorAll('[id^="suggestions-"]').forEach(async (el) => {
    const blockId = el.id.replace('suggestions-', '');
    const input = document.querySelector('#custom-' + blockId);
    if (!input) return;

    // L1 is anonymous — no AI suggestions, just show "type your answer"
    if (LESSON === 1) {
      el.innerHTML = '<p class="text-muted text-xs">Type your answer below and press Enter</p>';
      return;
    }

    const question = input.dataset.question;
    const classId = input.dataset.classId;

    try {
      const res = await fetch('/api/decisions/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, classId, blockId }),
      });
      const data = await res.json();
      if (data.ok && data.data.suggestions) {
        el.innerHTML = data.data.suggestions.map((s, i) =>
          '<button type="button" class="w-full p-md bg-cream border border-linen rounded-sm text-left text-secondary text-sm leading-relaxed hover:border-gold transition-colors cursor-pointer" data-index="' + i + '">' + escapeHtml(s) + '</button>'
        ).join('');

        el.querySelectorAll('button').forEach(btn => {
          btn.addEventListener('click', () => saveAnswer(blockId, btn.textContent, false, parseInt(btn.dataset.index)));
        });
      }
    } catch {
      el.innerHTML = '<p class="text-muted text-xs">Type your answer below</p>';
    }
  });
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

// ─── Open text submit ───
document.querySelectorAll('[id^="custom-"]').forEach(input => {
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      saveAnswer(input.dataset.blockId, input.value.trim(), true);
    }
  });
});

// ─── Save answer + unlock ───
async function saveAnswer(blockId, response, isCustom, suggestionIndex) {
  const input = document.querySelector('#custom-' + blockId);
  if (!input) return;

  // L1: save to anonymous session only (no auth, no decision API)
  if (LESSON === 1) {
    try {
      await fetch('/api/free-intro/lesson-one', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: response }),
      });
      // Visual feedback: gold border
      const block = document.querySelector('#block-' + blockId + ' > div');
      if (block) { block.classList.remove('border-linen'); block.classList.add('border-gold'); }
      // Remove locked placeholder
      const locked = document.querySelector('#locked-' + blockId);
      if (locked) locked.remove();
    } catch (err) { console.error('L1 save failed:', err); }
    return;
  }

  // L2/L3: save via decision API (requires auth from email gate)
  const body = {
    classId: input.dataset.classId,
    blockId,
    courseSlug: input.dataset.courseSlug,
    question: input.dataset.question,
    response,
    isCustom,
    suggestionIndex: suggestionIndex ?? undefined,
  };

  try {
    await fetch('/api/decisions/block/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    // Unlock next segment
    const locked = document.querySelector('#locked-' + blockId);
    if (locked) {
      const segRes = await fetch('/api/decisions/segment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: input.dataset.classId, blockId }),
      });
      const segData = await segRes.json();
      if (segData.ok && segData.data.content) {
        locked.outerHTML = '<div class="prose-warm mt-lg">' + segData.data.content + '</div>';
      } else {
        locked.remove();
      }
    }

    // Gold border feedback
    const block = document.querySelector('#block-' + blockId + ' > div');
    if (block) {
      block.classList.remove('border-linen');
      block.classList.add('border-gold');
    }
  } catch (err) {
    console.error('Save failed:', err);
  }
}

// Load suggestions immediately if no email gate (L1, L3) or after gate is passed
if (LESSON !== 2) {
  loadSuggestions();
}
          `,
        }}
      />
    </div>
  )
}
