/**
 * Structured Data (JSON-LD) Generators
 * Genera datos estructurados para mejorar SEO
 */

import type { PropertySEOData } from './seo-utils';

export interface Organization {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  name: string;
  url: string;
  logo: string;
  description?: string;
  contactPoint?: ContactPoint;
  sameAs?: string[];
}

export interface ContactPoint {
  '@type': 'ContactPoint';
  telephone: string;
  contactType: string;
  availableLanguage: string[];
}

export interface PropertyListing {
  '@context': 'https://schema.org';
  '@type': 'Product' | 'RealEstateListin g';
  name: string;
  description: string;
  url: string;
  image?: string[];
  offers?: Offer;
  address?: Address;
  numberOfRooms?: number;
  numberOfBathroomsTotal?: number;
  floorSize?: QuantitativeValue;
}

export interface Offer {
  '@type': 'Offer';
  price: string;
  priceCurrency: string;
  availability: string;
  priceValidUntil?: string;
}

export interface Address {
  '@type': 'PostalAddress';
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
  addressCountry: string;
}

export interface QuantitativeValue {
  '@type': 'QuantitativeValue';
  value: number;
  unitCode: string;
}

export interface BreadcrumbList {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: ListItem[];
}

export interface ListItem {
  '@type': 'ListItem';
  position: number;
  name: string;
  item: string;
}

/**
 * Genera Structured Data para la organización INMOVA
 */
export function generateOrganizationSchema(
  baseUrl: string = 'https://inmova.app'
): Organization {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'INMOVA',
    url: baseUrl,
    logo: `${baseUrl}/inmova-logo.png`,
    description:
      'Plataforma SaaS todo-en-uno para gestión inmobiliaria profesional. 88 módulos especializados para alquiler tradicional, coliving, STR, house flipping y más.',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+34-900-000-000',
      contactType: 'customer service',
      availableLanguage: ['Spanish', 'English'],
    },
    sameAs: [
      'https://www.linkedin.com/company/inmova',
      'https://twitter.com/inmova',
      'https://www.facebook.com/inmova',
    ],
  };
}

/**
 * Genera Structured Data para una propiedad
 */
export function generatePropertySchema(
  property: PropertySEOData,
  baseUrl: string = 'https://inmova.app'
): PropertyListing {
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
    estado,
    imagenes = [],
  } = property;

  const schema: PropertyListing = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: titulo,
    description: descripcion || `${tipo || 'Propiedad'} disponible para alquiler`,
    url: `${baseUrl}/unidades/${id}`,
  };

  // Imágenes
  if (imagenes.length > 0) {
    schema.image = imagenes;
  }

  // Oferta (precio)
  if (precio) {
    schema.offers = {
      '@type': 'Offer',
      price: precio.toString(),
      priceCurrency: 'EUR',
      availability: estado === 'disponible' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 días
    };
  }

  // Dirección
  if (direccion || ciudad) {
    schema.address = {
      '@type': 'PostalAddress',
      streetAddress: direccion,
      addressLocality: ciudad,
      addressCountry: 'ES',
    };
  }

  // Características
  if (habitaciones) {
    schema.numberOfRooms = habitaciones;
  }

  if (banos) {
    schema.numberOfBathroomsTotal = banos;
  }

  if (superficie) {
    schema.floorSize = {
      '@type': 'QuantitativeValue',
      value: superficie,
      unitCode: 'MTK', // Metro cuadrado
    };
  }

  return schema;
}

/**
 * Genera Breadcrumb Schema
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>,
  baseUrl: string = 'https://inmova.app'
): BreadcrumbList {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.url}`,
    })),
  };
}

/**
 * Componente para insertar JSON-LD en el head
 */
export function generateStructuredDataScript(data: Record<string, unknown>): string {
  return JSON.stringify(data);
}
