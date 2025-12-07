import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'INMOVA vs Homming: Comparativa Completa 2025 | Ahorra 58% con Más Funcionalidad',
  description: 'Análisis detallado INMOVA vs Homming. Descubre cómo INMOVA ofrece 88 módulos (vs 15), 7 verticales (vs 1) y ahorra 58% en costos. Calculadora ROI incluida.',
  keywords: 'INMOVA vs Homming, alternativa homming, mejor que homming, homming precio, software gestión alquileres, proptech españa',
  openGraph: {
    title: 'INMOVA vs Homming: 88 Módulos, 7 Verticales, 58% Más Económico',
    description: 'Comparativa completa con calculadora de ahorro. Descubre por qué gestores inteligentes eligen INMOVA sobre Homming.',
    type: 'website',
  },
};

export default function ComparativaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
