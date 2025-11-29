'use client';

import LandingPage from './landing/page';

export default function HomePage() {
  // Mostrar siempre la landing page en la ruta raíz
  // Los usuarios autenticados pueden navegar explícitamente a /dashboard
  return <LandingPage />;
}
