'use client';

import dynamic from 'next/dynamic';
import { Navigation } from './(landing)/_components/Navigation';
import { HeroSection } from './(landing)/_components/HeroSection';
import { SocialProofBar } from './(landing)/_components/SocialProofBar';
import { useLandingTracking } from '@/hooks/useLandingTracking';

// Lazy load sections below the fold for better performance
const ProblemSection = dynamic(
  () =>
    import('./(landing)/_components/ProblemSection').then((mod) => ({
      default: mod.ProblemSection,
    })),
  {
    loading: () => <div className="py-24 bg-white" />,
  }
);

const SolutionSection = dynamic(
  () =>
    import('./(landing)/_components/SolutionSection').then((mod) => ({
      default: mod.SolutionSection,
    })),
  {
    loading: () => <div className="py-24 bg-gradient-to-br from-blue-50 to-indigo-50" />,
  }
);

const FeaturesByPersona = dynamic(
  () =>
    import('./(landing)/_components/FeaturesByPersona').then((mod) => ({
      default: mod.FeaturesByPersona,
    })),
  {
    loading: () => <div className="py-24 bg-white" />,
  }
);

const ROICalculator = dynamic(
  () =>
    import('./(landing)/_components/ROICalculator').then((mod) => ({ default: mod.ROICalculator })),
  {
    loading: () => <div className="py-24 bg-gradient-to-br from-blue-50 to-indigo-50" />,
  }
);

const ComparisonTable = dynamic(
  () =>
    import('./(landing)/_components/ComparisonTable').then((mod) => ({
      default: mod.ComparisonTable,
    })),
  {
    loading: () => <div className="py-24 bg-white" />,
  }
);

const TestimonialsSection = dynamic(
  () =>
    import('./(landing)/_components/TestimonialsSection').then((mod) => ({
      default: mod.TestimonialsSection,
    })),
  {
    loading: () => <div className="py-24 bg-gradient-to-br from-slate-50 to-blue-50" />,
  }
);

const PricingSection = dynamic(
  () =>
    import('./(landing)/_components/PricingSection').then((mod) => ({
      default: mod.PricingSection,
    })),
  {
    loading: () => <div className="py-24 bg-white" />,
  }
);

const FAQSection = dynamic(
  () => import('./(landing)/_components/FAQSection').then((mod) => ({ default: mod.FAQSection })),
  {
    loading: () => <div className="py-24 bg-gradient-to-br from-slate-50 to-blue-50" />,
  }
);

const Footer = dynamic(
  () => import('./(landing)/_components/Footer').then((mod) => ({ default: mod.Footer })),
  {
    loading: () => <footer className="bg-gray-900 text-gray-300 py-16" />,
  }
);

export default function HomePage() {
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
