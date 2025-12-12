import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'INMOVA vs Competidor 1: Comparativa Completa 2025 | Ahorra 58% con Más Funcionalidad',
  description:
    'Análisis detallado INMOVA vs Competidor 1. Descubre cómo INMOVA ofrece 56 módulos (vs 15), 7 verticales (vs 1) y ahorra 58% en costos. Calculadora ROI incluida.',
  keywords:
    'INMOVA vs Competidor 1, alternativa competidor-1, mejor que competidor-1, competidor-1 precio, software gestión alquileres, proptech españa',
  openGraph: {
    title: 'INMOVA vs Competidor 1: 88 Módulos, 7 Verticales, 58% Más Económico',
    description:
      'Comparativa completa con calculadora de ahorro. Descubre por qué gestores inteligentes eligen INMOVA sobre Competidor 1.',
    type: 'website',
  },
};

export default function ComparativaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
