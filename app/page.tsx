'use client';

import { LandingPageContent } from '@/components/landing/LandingPageContent';

// Force dynamic rendering to avoid static export issues

export default function HomePage() {
  // Mostrar siempre la landing page en la ruta raíz
  // Los usuarios autenticados pueden navegar explícitamente a /dashboard
  return <LandingPageContent />;
}
