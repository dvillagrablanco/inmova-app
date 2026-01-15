'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { StructuredData } from '@/components/StructuredData';

// Skeleton placeholder para secciones lazy
function SectionSkeleton({ height = 'h-96' }: { height?: string }) {
  return (
    <div className={`${height} w-full bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse`} />
  );
}

// Critical components - Cargados inmediatamente (Above the fold)
import { Navigation } from '@/components/landing/sections/Navigation';
import { HeroSectionSegmentado } from '@/components/landing/sections/HeroSectionSegmentado';

// Lazy load de componentes below the fold - Reducir DOM inicial
const PromoBanner = dynamic(
  () => import('@/components/landing/sections/PromoBanner').then((mod) => ({ default: mod.PromoBanner })),
  { loading: () => <SectionSkeleton height="h-24" /> }
);

const FeaturesSection = dynamic(
  () => import('@/components/landing/sections/FeaturesSection').then((mod) => ({ default: mod.FeaturesSection })),
  { loading: () => <SectionSkeleton height="h-[600px]" /> }
);

const AccessPortalsSection = dynamic(
  () => import('@/components/landing/sections/AccessPortalsSection').then((mod) => ({ default: mod.AccessPortalsSection })),
  { loading: () => <SectionSkeleton height="h-[400px]" /> }
);

const PricingSection = dynamic(
  () => import('@/components/landing/sections/PricingSection').then((mod) => ({ default: mod.PricingSection })),
  { loading: () => <SectionSkeleton height="h-[500px]" /> }
);

const TestimonialsSection = dynamic(
  () => import('@/components/landing/sections/TestimonialsSection').then((mod) => ({ default: mod.TestimonialsSection })),
  { loading: () => <SectionSkeleton height="h-[300px]" /> }
);

const IntegrationsSection = dynamic(
  () => import('@/components/landing/sections/IntegrationsSection').then((mod) => ({ default: mod.IntegrationsSection })),
  { loading: () => <SectionSkeleton height="h-[200px]" /> }
);

const FAQSection = dynamic(
  () => import('@/components/landing/sections/FAQSection').then((mod) => ({ default: mod.FAQSection })),
  { loading: () => <SectionSkeleton height="h-[400px]" /> }
);

const Footer = dynamic(
  () => import('@/components/landing/sections/Footer').then((mod) => ({ default: mod.Footer })),
  { loading: () => <SectionSkeleton height="h-64" /> }
);

// Chatbot - SSR false, se carga después de la interacción inicial
const LandingChatbot = dynamic(
  () => import('@/components/LandingChatbot').then((mod) => ({ default: mod.LandingChatbot })),
  {
    ssr: false,
    loading: () => null,
  }
);

export function LandingPageContent() {
  return (
    <>
      <StructuredData />
      <h1 className="sr-only">INMOVA - Plataforma PropTech Multi-Vertical para Gestión Inmobiliaria</h1>
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Critical - Above the fold */}
        <Navigation />
        <HeroSectionSegmentado />

        {/* Below the fold - Lazy loaded para reducir DOM inicial */}
        <Suspense fallback={<SectionSkeleton height="h-24" />}>
          <PromoBanner />
        </Suspense>

        <Suspense fallback={<SectionSkeleton height="h-[600px]" />}>
          <FeaturesSection />
        </Suspense>

        <Suspense fallback={<SectionSkeleton height="h-[400px]" />}>
          <AccessPortalsSection />
        </Suspense>

        <Suspense fallback={<SectionSkeleton height="h-[500px]" />}>
          <PricingSection />
        </Suspense>

        <Suspense fallback={<SectionSkeleton height="h-[300px]" />}>
          <TestimonialsSection />
        </Suspense>

        <Suspense fallback={<SectionSkeleton height="h-[200px]" />}>
          <IntegrationsSection />
        </Suspense>

        <Suspense fallback={<SectionSkeleton height="h-[400px]" />}>
          <FAQSection />
        </Suspense>

        <Suspense fallback={<SectionSkeleton height="h-64" />}>
          <Footer />
        </Suspense>

        {/* Chatbot - Non-critical, loads after user interaction */}
        <LandingChatbot />
      </main>
    </>
  );
}
