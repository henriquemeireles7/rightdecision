import { HeroSection } from './components/hero'
import { ProblemSection } from './components/problem'
import { MechanismSection } from './components/mechanism'
import { TransformationSection } from './components/transformation'
import { CurriculumSection } from './components/curriculum'
import { FounderSection } from './components/founder'
import { SocialProofSection } from './components/social-proof'
import { OfferSection } from './components/offer'
import { DisqualSection } from './components/disqualification'
import { FAQSection } from './components/faq'
import { FinalCTASection } from './components/final-cta'

interface LandingPageProps {
  variant?: 'a' | 'b' | 'c' | 'd'
}

/**
 * Desktop order (HTML order): Hero, Problem, Mechanism, Transformation, Curriculum, Founder, SocialProof, Offer, Disqual, FAQ, FinalCTA
 * Mobile order (CSS order):   Hero(1), Problem(2), Offer(3), Mechanism(4), Curriculum(5), Founder(6), FAQ(7), FinalCTA(8), Transformation(9), SocialProof(10), Disqual(11)
 */
export function LandingPage({ variant = 'a' }: LandingPageProps) {
  return (
    <div class="flex flex-col">
      <div class="order-1 md:order-none"><HeroSection variant={variant} /></div>
      <div class="order-2 md:order-none"><ProblemSection /></div>
      <div class="order-4 md:order-none"><MechanismSection /></div>
      <div class="order-9 md:order-none"><TransformationSection /></div>
      <div class="order-5 md:order-none"><CurriculumSection /></div>
      <div class="order-6 md:order-none"><FounderSection /></div>
      <div class="order-10 md:order-none"><SocialProofSection /></div>
      <div class="order-3 md:order-none"><OfferSection /></div>
      <div class="order-11 md:order-none"><DisqualSection /></div>
      <div class="order-7 md:order-none"><FAQSection /></div>
      <div class="order-8 md:order-none"><FinalCTASection /></div>
    </div>
  )
}
