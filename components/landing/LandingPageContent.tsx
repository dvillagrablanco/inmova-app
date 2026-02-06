'use client';

import dynamic from 'next/dynamic';
import { StructuredData } from '@/components/StructuredData';

// Lazy load de componentes pesados
const LandingChatbot = dynamic(
  () => import('@/components/LandingChatbot').then((mod) => ({ default: mod.LandingChatbot })),
  {
    ssr: false,
    loading: () => null,
  }
);

// Componentes modulares de la landing page - OPTIMIZADO
import { Navigation } from '@/components/landing/sections/Navigation';
import { HeroSectionSegmentado } from '@/components/landing/sections/HeroSectionSegmentado';
import { PromoBanner } from '@/components/landing/sections/PromoBanner';
import { FeaturesSection } from '@/components/landing/sections/FeaturesSection';
import { AccessPortalsSection } from '@/components/landing/sections/AccessPortalsSection';
import { PricingSection } from '@/components/landing/sections/PricingSection';
import { TestimonialsSection } from '@/components/landing/sections/TestimonialsSection';
import { IntegrationsSection } from '@/components/landing/sections/IntegrationsSection';
import { FAQSection } from '@/components/landing/sections/FAQSection';
import { Footer } from '@/components/landing/sections/Footer';

export function LandingPageContent() {
  return (
    <>
      <StructuredData />
      <h1 className="sr-only">INMOVA - Plataforma PropTech Multi-Vertical para Gestión Inmobiliaria</h1>
      <main className="min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Navigation */}
        <Navigation />

        {/* Hero Section Segmentado por Buyer Persona */}
        <HeroSectionSegmentado />

        {/* Banner Promocional Rotativo */}
        <PromoBanner />

        {/* Features & Verticals - 7 Verticales + Módulos */}
        <FeaturesSection />

        {/* Access Portals Section */}
        <AccessPortalsSection />

        {/* Pricing Section */}
        <PricingSection />

        {/* Testimonios */}
        <TestimonialsSection />

        {/* Integrations Section */}
        <IntegrationsSection />

        {/* FAQ Section */}
        <FAQSection />

        {/* Footer */}
        <Footer />

        {/* Chatbot y WhatsApp flotantes */}
        <LandingChatbot />
      </main>
    </>
  );
}
