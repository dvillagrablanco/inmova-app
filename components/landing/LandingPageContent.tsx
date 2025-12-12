'use client';

import dynamic from 'next/dynamic';
import { StructuredData } from '@/components/StructuredData';
import { usePartnerBranding } from '@/hooks/use-partner-branding';

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
import { CompetitorComparisonSection } from '@/components/landing/sections/CompetitorComparisonSection';
import { PricingSection } from '@/components/landing/sections/PricingSection';
import { IntegrationsSection } from '@/components/landing/sections/IntegrationsSection';
import { FAQsSection } from '@/components/landing/sections/FAQsSection';
import { Footer } from '@/components/landing/sections/Footer';

export function LandingPageContent() {
  const { branding, hasPartner, isLoading } = usePartnerBranding();

  return (
    <>
      <StructuredData />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Navigation */}
        <Navigation partnerBranding={branding} />

        {/* Hero Section */}
        <HeroSection partnerBranding={branding} />

        {/* Mensaje personalizado del partner */}
        {hasPartner && branding?.mensajeBienvenida && (
          <section className="py-8 px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{
                borderLeftColor: branding.coloresPrimarios?.primary || '#4F46E5'
              }}>
                <p className="text-gray-700 text-lg leading-relaxed">
                  {branding.mensajeBienvenida}
                </p>
                {branding.nombre && (
                  <p className="mt-3 text-sm text-gray-500">
                    — {branding.nombre}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Promo Section */}
        <PromoSection />

        {/* Stats Section */}
        <StatsSection />

        {/* Features & Verticals */}
        <FeaturesSection />

        {/* Competitor Comparison Section */}
        <CompetitorComparisonSection />

        {/* Pricing Section */}
        <PricingSection />

        {/* Integrations Section */}
        <IntegrationsSection />

        {/* FAQs Section */}
        <FAQsSection />

        {/* Footer */}
        <Footer partnerBranding={branding} />

        {/* Chatbot y WhatsApp flotantes */}
        <LandingChatbot />
      </div>
    </>
  );
}
