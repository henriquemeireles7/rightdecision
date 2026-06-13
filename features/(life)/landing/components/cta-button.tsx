interface CTAButtonProps {
  text?: string
  className?: string
  href?: string
}

export function CTAButton({
  text = 'Start for $197/year',
  className = '',
  href = '/api/checkout/redirect',
}: CTAButtonProps) {
  return (
    <a
      href={href}
      class={`inline-block bg-gold hover:bg-gold-hover text-ink font-body font-semibold text-lg px-8 py-4 rounded-[8px] min-h-[48px] transition-colors ${className}`}
    >
      {text}
    </a>
  )
}

export function ScrollCTA({ text, targetId }: { text: string; targetId: string }) {
  return (
    <a href={`#${targetId}`} class="text-gold hover:text-gold-hover font-semibold">
      {text} &rarr;
    </a>
  )
}
