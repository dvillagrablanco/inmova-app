import { Metadata } from 'next';
import { LandingPageContent } from '@/components/landing/LandingPageContent';
import { seoMetadata } from '@/lib/data/landing-data';

/**
 * Landing Page Principal - Inmova PropTech Platform
 *
 * Optimizada para:
 * - SEO (Server-side rendering, structured data)
 * - Performance (Dynamic imports, lazy loading)
 * - Conversión (CTAs optimizados, social proof)
 * - Mobile-first design
 */

export const metadata: Metadata = {
  title: seoMetadata.title,
  description: seoMetadata.description,
  keywords: Array.isArray(seoMetadata.keywords)
    ? seoMetadata.keywords.join(', ')
    : seoMetadata.keywords,
  authors: [{ name: 'Inmova Team' }],
  openGraph: {
    title: seoMetadata.openGraph?.title || seoMetadata.title,
    description: seoMetadata.openGraph?.description || seoMetadata.description,
    url: seoMetadata.openGraph?.url || 'https://inmovaapp.com',
    siteName: 'Inmova',
    images: [
      {
        url: seoMetadata.openGraph?.image || 'https://inmovaapp.com/og-image.jpg',
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
    title: seoMetadata.title,
    description: seoMetadata.description,
    images: [seoMetadata.openGraph?.image || 'https://inmovaapp.com/og-image.jpg'],
    creator: seoMetadata.twitter?.creator || '@inmovaapp',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://inmovaapp.com',
  },
};

export default function LandingPage() {
  return <LandingPageContent />;
}
