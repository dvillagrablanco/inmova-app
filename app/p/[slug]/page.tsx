/**
 * Landing Pública Personalizada de Partner
 *
 * URL: /p/[slug]
 *
 * Esta página muestra la landing personalizada del partner con:
 * - Su branding (colores, logo, tipografía)
 * - Su contenido personalizado (hero, beneficios, testimonios)
 * - Sus servicios complementarios
 * - Sus promociones activas
 * - Formulario de registro que trackea al partner
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getFullPartnerData, trackPartnerLandingView } from '@/lib/partner-branding-service';
import PartnerLandingClient from './partner-landing-client';

interface Props {
  params: { slug: string };
}

// Generar metadata dinámica para SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getFullPartnerData(params.slug);

  if (!data) {
    return {
      title: 'Página no encontrada | Inmova',
    };
  }

  return {
    title: data.landing.seo.title || `${data.theme.nombre} | Inmova`,
    description: data.landing.seo.description || data.landing.hero.subtitle,
    keywords: data.landing.seo.keywords,
    openGraph: {
      title: data.landing.seo.title || `${data.theme.nombre} | Inmova`,
      description: data.landing.seo.description || data.landing.hero.subtitle,
      images: data.landing.seo.ogImage ? [data.landing.seo.ogImage] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: data.landing.seo.title || `${data.theme.nombre} | Inmova`,
      description: data.landing.seo.description || data.landing.hero.subtitle,
    },
  };
}

export default async function PartnerLandingPage({ params }: Props) {
  const data = await getFullPartnerData(params.slug);

  if (!data) {
    notFound();
  }

  // Registrar visita (fire and forget)
  trackPartnerLandingView(params.slug);

  return <PartnerLandingClient data={data} slug={params.slug} />;
}
