'use client';

import { Navigation } from './_components/Navigation';
import { HeroSection } from './_components/HeroSection';
import { SocialProofBar } from './_components/SocialProofBar';
import { ProblemSection } from './_components/ProblemSection';
import { SolutionSection } from './_components/SolutionSection';
import { FeaturesByPersona } from './_components/FeaturesByPersona';
import { ROICalculator } from './_components/ROICalculator';
import { ComparisonTable } from './_components/ComparisonTable';
import { TestimonialsSection } from './_components/TestimonialsSection';
import { PricingSection } from './_components/PricingSection';
import { FAQSection } from './_components/FAQSection';
import { Footer } from './_components/Footer';
import { useLandingTracking } from '@/hooks/useLandingTracking';

// Deshabilitareneración estática para evitar errores de prerender
export const dynamic = 'force-dynamic';

export default function LandingPage() {
  // Initialize tracking
  useLandingTracking();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navigation />
      <main>
        <HeroSection />
        <SocialProofBar />
        <ProblemSection />
        <SolutionSection />
        <FeaturesByPersona />
        <ROICalculator />
        <ComparisonTable />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
}
