import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'eWoorker - B2B Marketplace para Subcontratación en Construcción',
  description: 'Conecta constructores con subcontratistas certificados. Cumple Ley 32/2006 automáticamente. Pagos seguros con escrow. 2,500+ empresas activas.',
  keywords: 'subcontratación construcción, marketplace construcción, ley 32/2006, escrow construcción, subcontratistas certificados',
  openGraph: {
    title: 'eWoorker - Subcontratación Legal Sin Complicaciones',
    description: 'El marketplace B2B que conecta constructores con subcontratistas certificados. 100% legal. Pagos seguros.',
    siteName: 'eWoorker by Inmova',
    type: 'website',
  },
};

export default function EwoorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
