import { Metadata } from 'next';
import { LandingPageContent } from '@/components/landing/LandingPageContent';
import { landingMetadata } from '@/lib/data/landing-data';

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
  title: landingMetadata.title,
  description: landingMetadata.description,
  keywords: landingMetadata.keywords,
  authors: [{ name: 'Inmova Team' }],
  openGraph: {
    title: landingMetadata.openGraph.title,
    description: landingMetadata.openGraph.description,
    url: landingMetadata.openGraph.url,
    siteName: landingMetadata.openGraph.siteName,
    images: landingMetadata.openGraph.images,
    locale: landingMetadata.openGraph.locale,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: landingMetadata.twitter.title,
    description: landingMetadata.twitter.description,
    images: landingMetadata.twitter.images,
    creator: landingMetadata.twitter.creator,
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
