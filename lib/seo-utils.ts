/**
 * SEO Utilities
 * Funciones para generar meta-tags dinámicos y optimizar SEO
 */

import type { Metadata } from 'next';

export interface PropertySEOData {
  id: string;
  titulo: string;
  descripcion?: string;
  precio?: number;
  tipo?: string;
  superficie?: number;
  habitaciones?: number;
  banos?: number;
  direccion?: string;
  ciudad?: string;
  estado?: string;
  imagenes?: string[];
  buildingNombre?: string;
}

export interface SEOConfig {
  title: string;
  description: string;
  url: string;
  images?: string[];
  type?: 'website' | 'article' | 'product';
  siteName?: string;
  locale?: string;
}

/**
 * Genera meta-tags completos (Open Graph + Twitter Cards)
 */
export function generateMetaTags(config: SEOConfig): Metadata {
  const {
    title,
    description,
    url,
    images = [],
    type = 'website',
    siteName = 'INMOVA',
    locale = 'es_ES',
  } = config;

  const imageUrl = images[0] || '/inmova-og-image.jpg';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName,
      images: images.map((img) => ({
        url: img,
        width: 1200,
        height: 630,
        alt: title,
      })),
      locale,
      type: type as any,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
      creator: '@inmova',
      site: '@inmova',
    },
    alternates: {
      canonical: url,
    },
  };
}

/**
 * Genera meta-tags específicos para propiedades
 */
export function generatePropertyMetaTags(
  property: PropertySEOData,
  baseUrl: string = 'https://inmova.app'
): Metadata {
  const {
    id,
    titulo,
    descripcion,
    precio,
    tipo,
    superficie,
    habitaciones,
    banos,
    direccion,
    ciudad,
    imagenes = [],
    buildingNombre,
  } = property;

  // Construir título optimizado para SEO
  let title = titulo;
  if (tipo) title = `${tipo} - ${title}`;
  if (ciudad) title = `${title} en ${ciudad}`;
  title = `${title} | INMOVA`;

  // Construir descripción rica
  let desc = descripcion || '';
  if (!desc) {
    const features = [];
    if (habitaciones) features.push(`${habitaciones} hab.`);
    if (banos) features.push(`${banos} baños`);
    if (superficie) features.push(`${superficie}m²`);
    if (precio) features.push(`${formatCurrency(precio)}/mes`);

    desc = `${tipo || 'Propiedad'} disponible`;
    if (features.length > 0) {
      desc += ` - ${features.join(', ')}`;
    }
    if (direccion) {
      desc += ` ubicada en ${direccion}`;
    }
    if (buildingNombre) {
      desc += ` - ${buildingNombre}`;
    }
  }

  const url = `${baseUrl}/unidades/${id}`;

  // Usar imágenes de la propiedad o imagen por defecto
  const propertyImages = imagenes.length > 0 ? imagenes : ['/inmova-property-default.jpg'];

  return generateMetaTags({
    title,
    description: desc,
    url,
    images: propertyImages,
    type: 'product',
  });
}

/**
 * Formatea precio a moneda
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Genera palabras clave para SEO
 */
export function generateKeywords(property: PropertySEOData): string[] {
  const keywords: string[] = ['inmova', 'gestión inmobiliaria', 'alquiler'];

  if (property.tipo) keywords.push(property.tipo.toLowerCase());
  if (property.ciudad) keywords.push(property.ciudad.toLowerCase());
  if (property.habitaciones) keywords.push(`${property.habitaciones} habitaciones`);
  if (property.buildingNombre) keywords.push(property.buildingNombre.toLowerCase());

  keywords.push('propiedad en alquiler', 'inmueble', 'vivienda');

  return keywords;
}

/**
 * Genera URL canónica
 */
export function generateCanonicalUrl(path: string, baseUrl: string = 'https://inmova.app'): string {
  // Limpiar path de parámetros de query
  const cleanPath = path.split('?')[0];
  return `${baseUrl}${cleanPath}`;
}
