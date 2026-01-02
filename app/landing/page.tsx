import { Metadata } from 'next';
import { SimpleLandingContentV2 } from '@/components/landing/SimpleLandingContentV2';

/**
 * Landing Page Principal - Inmova PropTech Platform
 * Versión simplificada sin componentes complejos
 */

export const metadata: Metadata = {
  title: 'INMOVA - Plataforma PropTech Multi-Vertical | 6 Verticales + 10 Módulos',
  description: 'La única plataforma PropTech que combina 6 verticales de negocio inmobiliario con 10 módulos transversales de IA, IoT y Blockchain.',
  keywords: 'proptech, gestión inmobiliaria, alquiler, coliving, house flipping, construcción',
  authors: [{ name: 'Inmova Team' }],
  openGraph: {
    title: 'INMOVA - Plataforma PropTech Multi-Vertical',
    description: 'La única plataforma PropTech que combina 6 verticales de negocio inmobiliario con 10 módulos transversales.',
    url: 'https://inmovaapp.com',
    siteName: 'Inmova',
    images: [
      {
        url: 'https://inmovaapp.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Inmova - Plataforma PropTech',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'INMOVA - Plataforma PropTech Multi-Vertical',
    description: 'La única plataforma PropTech que combina 6 verticales de negocio inmobiliario con 10 módulos transversales.',
    images: ['https://inmovaapp.com/og-image.jpg'],
    creator: '@inmovaapp',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://inmovaapp.com',
  },
};

export default function LandingPage() {
  return <SimpleLandingContentV2 />;
}
