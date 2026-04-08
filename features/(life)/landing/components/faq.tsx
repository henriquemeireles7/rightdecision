const FAQS = [
  {
    q: 'How long does the course take?',
    a: '~23 hours over 3 months, at 2 hours per week. Each module has 3 theory classes and 1 practical exercise.',
  },
  {
    q: "What if I don't finish?",
    a: "You'll make your first decision in Week 1, Module 1. Finishing isn't the goal. Deciding is. But the full 3-month structure is designed to take you through one complete cycle.",
  },
  {
    q: 'Do I need AI tools?',
    a: "Yes — the practical exercises use Claude Cowork (free to start) with our custom skills installed. We walk you through setup in the intro class. No tech knowledge needed. The AI guides you through questions and saves structured output — it sharpens your answers, it doesn't replace your thinking.",
  },
  {
    q: 'What are "AI skills"?',
    a: "Each exercise IS an AI skill — think of it as a guided conversation that produces a real document. You run the skill, it asks you questions, you answer in your own words, it asks follow-ups to go deeper, and it saves a structured document to your personal folder. You do the thinking. The AI does the structuring. By the end, you have 10 documents that tell the complete story of your decision.",
  },
  {
    q: 'What happens after the year?',
    a: "You renew at the same price. Or you don't — and you keep the methodology, the system, and all 9 documents you created. The Right Decision succeeds when you stop needing it.",
  },
  {
    q: 'Can I get a refund?',
    a: 'Yes. 7-day money-back guarantee. Email us within 7 days for a full refund. No questions asked.',
  },
  {
    q: 'Is this therapy?',
    a: "No. Therapy processes the past. The Right Decision decides the future. They're complementary, not competitive. If you're in crisis, please seek professional support first.",
  },
] as const

export function FAQSection() {
  return (
    <section class="bg-cream py-16">
      <div class="max-w-[800px] mx-auto px-4">
        <h2 class="font-display text-2xl md:text-3xl text-ink text-center mb-10">
          Frequently asked questions
        </h2>

        <div class="divide-y divide-linen">
          {FAQS.map((faq, i) => (
            <details
              key={faq.q}
              class="py-4"
              open={i === 0 ? true : undefined}
            >
              <summary class="cursor-pointer font-semibold text-ink select-none">
                {faq.q}
              </summary>
              <p class="mt-3 text-body leading-[1.7]">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
