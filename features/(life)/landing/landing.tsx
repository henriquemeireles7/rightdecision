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

export function LandingPage({ variant = 'a' }: LandingPageProps) {
  return (
    <div class="flex flex-col">
      <HeroSection variant={variant} />
      <ProblemSection />
      <OfferSection />
      <MechanismSection />
      <TransformationSection />
      <CurriculumSection />
      <FounderSection />
      <SocialProofSection />
      <DisqualSection />
      <FAQSection />
      <FinalCTASection />
    </div>
  )
}
