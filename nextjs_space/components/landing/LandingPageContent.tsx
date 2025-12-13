'use client';

import dynamic from 'next/dynamic';
import { StructuredData } from '@/components/StructuredData';

// Lazy load de componentes pesados
const LandingChatbot = dynamic(() => import('@/components/LandingChatbot').then(mod => ({ default: mod.LandingChatbot })), {
  ssr: false,
  loading: () => null
});

// Componentes modulares de la landing page
import { Navigation } from '@/components/landing/sections/Navigation';
import { HeroSection } from '@/components/landing/sections/HeroSection';
import { PromoSection } from '@/components/landing/sections/PromoSection';
import { StatsSection } from '@/components/landing/sections/StatsSection';
import { FeaturesSection } from '@/components/landing/sections/FeaturesSection';
import { AccessPortalsSection } from '@/components/landing/sections/AccessPortalsSection';
import { CompetitorComparisonSection } from '@/components/landing/sections/CompetitorComparisonSection';
import { PricingSection } from '@/components/landing/sections/PricingSection';
import { IntegrationsSection } from '@/components/landing/sections/IntegrationsSection';
import { Footer } from '@/components/landing/sections/Footer';

export function LandingPageContent() {

  return (
    <>
      <StructuredData />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Navigation */}
        <Navigation />

        {/* Hero Section */}
        <HeroSection />

        {/* Promo Section */}
        <PromoSection />

        {/* Stats Section */}
        <StatsSection />

        {/* Features & Verticals */}
        <FeaturesSection />

        {/* Access Portals Section */}
        <AccessPortalsSection />

        {/* Competitor Comparison Section */}
        <CompetitorComparisonSection />

        {/* Pricing Section */}
        <PricingSection />

        {/* Integrations Section */}
        <IntegrationsSection />

        {/* Footer */}
        <Footer />

        {/* Chatbot y WhatsApp flotantes */}
        <LandingChatbot />
      </div>
    </>
  );
}
