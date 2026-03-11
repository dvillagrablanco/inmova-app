// @ts-nocheck
/**
 * SERVICIO DE PUBLICACIÓN EN PORTALES DE MEDIA ESTANCIA
 *
 * Integración con portales especializados en alquiler temporal:
 * - Spotahome
 * - HousingAnywhere
 * - Uniplaces
 * - Badi
 * - Idealista (sección temporal)
 * - Fotocasa (sección temporal)
 */

import { prisma } from '../db';
import { format } from 'date-fns';
import { es, enUS, fr } from 'date-fns/locale';

// ==========================================
// TIPOS
// ==========================================

export type PortalName =
  | 'spotahome'
  | 'housingAnywhere'
  | 'uniplaces'
  | 'badi'
  | 'idealista'
  | 'fotocasa'
  | 'alamo'
  | 'beroomers'
  | 'homelike';

export interface PortalConfig {
  name: PortalName;
  displayName: string;
  logo: string;
  apiBaseUrl: string;
  supportsTemporary: boolean;
  minDuration: number; // meses
  maxDuration: number; // meses
  targetAudience: string[];
  commission?: number; // porcentaje
  features: string[];
}

export interface PropertyListing {
  propertyId: string;
  title: Record<string, string>; // Multi-idioma
  description: Record<string, string>;
  price: number;
  currency: string;
  availableFrom: Date;
  availableTo?: Date;
  minStay: number; // meses
  maxStay: number; // meses
  photos: string[];
  amenities: string[];
  rules: {
    petsAllowed: boolean;
    smokingAllowed: boolean;
    couplesAllowed: boolean;
    studentsOnly?: boolean;
  };
  location: {
    address?: string;
    city: string;
    neighborhood?: string;
    postalCode?: string;
    coordinates?: { lat: number; lng: number };
  };
  property: {
    type: 'apartment' | 'room' | 'studio' | 'house';
    bedrooms: number;
    bathrooms: number;
    size: number;
    floor?: number;
    hasElevator?: boolean;
    furnished: boolean;
  };
  services: {
    wifi: boolean;
    utilities: boolean;
    cleaning?: string;
    airConditioning: boolean;
    heating: boolean;
    washingMachine: boolean;
    dryer: boolean;
    dishwasher: boolean;
    tv: boolean;
  };
  landlord: {
    name: string;
    email: string;
    phone?: string;
    responseTime?: string;
  };
}

export interface PublicationResult {
  portal: PortalName;
  success: boolean;
  listingId?: string;
  listingUrl?: string;
  error?: string;
  expiresAt?: Date;
}

export interface PortalStats {
  portal: PortalName;
  impressions: number;
  clicks: number;
  inquiries: number;
  bookings: number;
  conversionRate: number;
}

// ==========================================
// CONFIGURACIÓN DE PORTALES
// ==========================================

export const PORTAL_CONFIGS: PortalConfig[] = [
  {
    name: 'spotahome',
    displayName: 'Spotahome',
    logo: '/images/portals/spotahome.svg',
    apiBaseUrl: 'https://api.spotahome.com/v2',
    supportsTemporary: true,
    minDuration: 1,
    maxDuration: 12,
    targetAudience: ['estudiantes', 'profesionales', 'expatriados'],
    commission: 8,
    features: [
      'Verificación de propiedades con "Homechecker"',
      'Reserva online con pago seguro',
      'Protección al inquilino',
      'Tours virtuales 3D',
    ],
  },
  {
    name: 'housingAnywhere',
    displayName: 'HousingAnywhere',
    logo: '/images/portals/housinganywhere.svg',
    apiBaseUrl: 'https://api.housinganywhere.com/v1',
    supportsTemporary: true,
    minDuration: 1,
    maxDuration: 24,
    targetAudience: ['estudiantes internacionales', 'profesionales', 'investigadores'],
    commission: 12,
    features: [
      'Comunidad global de inquilinos',
      'Seguro de alquiler incluido',
      'Soporte multiidioma',
      'Pago en cuotas',
    ],
  },
  {
    name: 'uniplaces',
    displayName: 'Uniplaces',
    logo: '/images/portals/uniplaces.svg',
    apiBaseUrl: 'https://api.uniplaces.com/v1',
    supportsTemporary: true,
    minDuration: 1,
    maxDuration: 12,
    targetAudience: ['estudiantes universitarios', 'erasmus'],
    commission: 15,
    features: [
      'Especializado en estudiantes',
      'Partenariados con universidades',
      'Verificación de propiedades',
      'Flexibilidad de fechas',
    ],
  },
  {
    name: 'badi',
    displayName: 'Badi',
    logo: '/images/portals/badi.svg',
    apiBaseUrl: 'https://api.badi.com/v1',
    supportsTemporary: true,
    minDuration: 1,
    maxDuration: 12,
    targetAudience: ['jóvenes profesionales', 'coliving'],
    commission: 10,
    features: ['Matching con IA', 'Perfiles verificados', 'Chat integrado', 'Seguro de alquiler'],
  },
  {
    name: 'idealista',
    displayName: 'Idealista',
    logo: '/images/portals/idealista.svg',
    apiBaseUrl: 'https://api.idealista.com/v1',
    supportsTemporary: true,
    minDuration: 1,
    maxDuration: 11,
    targetAudience: ['público general', 'profesionales'],
    features: [
      'Mayor alcance en España',
      'Sección específica temporal',
      'Estadísticas detalladas',
      'App móvil popular',
    ],
  },
  {
    name: 'fotocasa',
    displayName: 'Fotocasa',
    logo: '/images/portals/fotocasa.svg',
    apiBaseUrl: 'https://api.fotocasa.es/v1',
    supportsTemporary: true,
    minDuration: 1,
    maxDuration: 11,
    targetAudience: ['público general'],
    features: [
      'Segundo portal más grande de España',
      'Filtros específicos para temporal',
      'Alertas personalizadas',
      'Mapa interactivo',
    ],
  },
  {
    name: 'alamo',
    displayName: 'Álamo',
    logo: '/images/portals/alamo.svg',
    apiBaseUrl: 'https://api.alamo.es/v1',
    supportsTemporary: true,
    minDuration: 1,
    maxDuration: 11,
    targetAudience: ['profesionales', 'expatriados', 'empresas', 'nómadas digitales'],
    commission: 10,
    features: [
      'Especializado en media estancia premium',
      'Verificación inquilinos profesionales',
      'Contratos adaptados a temporada',
      'Gestión integral de entradas/salidas',
      'Servicio de limpieza coordinado',
      'Atención al inquilino multiidioma',
    ],
  },
  {
    name: 'beroomers',
    displayName: 'Beroomers',
    logo: '/images/portals/beroomers.svg',
    apiBaseUrl: 'https://api.beroomers.com/v1',
    supportsTemporary: true,
    minDuration: 1,
    maxDuration: 12,
    targetAudience: ['estudiantes', 'profesionales', 'erasmus'],
    commission: 8,
    features: [
      'Fuerte en mercado estudiantil',
      'Reserva online segura',
      'Verificación de universidad/empresa',
      'Chat integrado con propietario',
    ],
  },
  {
    name: 'homelike',
    displayName: 'Homelike',
    logo: '/images/portals/homelike.svg',
    apiBaseUrl: 'https://api.thehomelike.com/v1',
    supportsTemporary: true,
    minDuration: 1,
    maxDuration: 24,
    targetAudience: ['corporativos', 'empresas', 'reubicaciones'],
    commission: 12,
    features: [
      'Mercado corporativo premium',
      'Facturación a empresas',
      'Estancias de reubicación',
      'Proceso de reserva empresarial',
      'Servicio concierge',
    ],
  },
];

// ==========================================
// GENERACIÓN DE ANUNCIOS
// ==========================================

/**
 * Genera el contenido del anuncio optimizado para cada portal
 */
export function generateListingContent(
  property: any,
  contract: any,
  language: 'es' | 'en' | 'fr' = 'es'
): PropertyListing {
  const services = contract.serviciosIncluidos || {};

  const titles: Record<string, Record<string, string>> = {
    es: {
      apartment: `Piso amueblado en ${property.building?.city || 'ciudad'}`,
      room: `Habitación en piso compartido en ${property.building?.city || 'ciudad'}`,
      studio: `Estudio en ${property.building?.city || 'ciudad'}`,
      house: `Casa en ${property.building?.city || 'ciudad'}`,
    },
    en: {
      apartment: `Furnished apartment in ${property.building?.city || 'city'}`,
      room: `Room in shared apartment in ${property.building?.city || 'city'}`,
      studio: `Studio in ${property.building?.city || 'city'}`,
      house: `House in ${property.building?.city || 'city'}`,
    },
    fr: {
      apartment: `Appartement meublé à ${property.building?.city || 'ville'}`,
      room: `Chambre en colocation à ${property.building?.city || 'ville'}`,
      studio: `Studio à ${property.building?.city || 'ville'}`,
      house: `Maison à ${property.building?.city || 'ville'}`,
    },
  };

  const descriptions: Record<string, string> = {
    es: generateDescriptionES(property, contract, services),
    en: generateDescriptionEN(property, contract, services),
    fr: generateDescriptionFR(property, contract, services),
  };

  const propertyType = property.tipoUnidad?.toLowerCase() || 'apartment';

  return {
    propertyId: property.id,
    title: {
      es: titles.es[propertyType] || titles.es.apartment,
      en: titles.en[propertyType] || titles.en.apartment,
      fr: titles.fr[propertyType] || titles.fr.apartment,
    },
    description: descriptions,
    price: contract.rentaMensual,
    currency: 'EUR',
    availableFrom: contract.fechaInicio,
    availableTo: contract.fechaFin,
    minStay: 1,
    maxStay: contract.duracionMesesPrevista || 11,
    photos: property.photos?.map((p: any) => p.url) || [],
    amenities: extractAmenities(property, services),
    rules: {
      petsAllowed: property.mascotasPermitidas || false,
      smokingAllowed: false,
      couplesAllowed: true,
      studentsOnly: contract.motivoTemporalidad === 'estudios',
    },
    location: {
      city: property.building?.city || '',
      neighborhood: property.building?.neighborhood || '',
      postalCode: property.building?.postalCode || '',
      coordinates:
        property.building?.latitude && property.building?.longitude
          ? { lat: property.building.latitude, lng: property.building.longitude }
          : undefined,
    },
    property: {
      type: propertyType as any,
      bedrooms: property.habitaciones || 1,
      bathrooms: property.banos || 1,
      size: property.superficie || 0,
      floor: property.planta,
      hasElevator: property.ascensor,
      furnished: property.amueblado || true,
    },
    services: {
      wifi: services.wifi || false,
      utilities: services.agua && services.luz,
      cleaning: services.limpieza ? services.limpiezaFrecuencia : undefined,
      airConditioning: property.aireAcondicionado || false,
      heating: services.calefaccion || property.calefaccion || false,
      washingMachine: property.lavadora || false,
      dryer: property.secadora || false,
      dishwasher: property.lavavajillas || false,
      tv: property.television || false,
    },
    landlord: {
      name: 'Gestión Inmova',
      email: 'inquiries@inmova.app',
      responseTime: '< 24 horas',
    },
  };
}

function generateDescriptionES(property: any, contract: any, services: any): string {
  const lines = [
    `🏠 ${property.descripcion || 'Bonito piso completamente amueblado y equipado.'}`,
    '',
    '📍 UBICACIÓN:',
    `Situado en ${property.building?.city || 'zona céntrica'}${property.building?.neighborhood ? `, barrio ${property.building.neighborhood}` : ''}.`,
    property.building?.cercaDeMetro ? '🚇 Cerca del metro.' : '',
    '',
    '🛏️ CARACTERÍSTICAS:',
    `• ${property.habitaciones || 1} habitaciones`,
    `• ${property.banos || 1} baños`,
    `• ${property.superficie || 0} m² útiles`,
    property.amueblado ? '• Completamente amueblado' : '',
    property.ascensor ? '• Edificio con ascensor' : '',
    property.balcon ? '• Con balcón/terraza' : '',
    '',
    '💡 SERVICIOS INCLUIDOS:',
    services.wifi ? '✓ WiFi de alta velocidad' : '',
    services.agua ? '✓ Agua' : '',
    services.luz ? '✓ Electricidad' : '',
    services.gas ? '✓ Gas' : '',
    services.calefaccion ? '✓ Calefacción' : '',
    services.limpieza ? `✓ Limpieza ${services.limpiezaFrecuencia || 'semanal'}` : '',
    '',
    '📅 DISPONIBILIDAD:',
    `Disponible desde ${format(contract.fechaInicio, "d 'de' MMMM 'de' yyyy", { locale: es })}`,
    `Estancia mínima: 1 mes`,
    `Estancia máxima: ${contract.duracionMesesPrevista || 11} meses`,
    '',
    '💰 CONDICIONES:',
    `Renta mensual: ${contract.rentaMensual}€`,
    `Fianza: ${contract.deposito}€ (${contract.mesesFianza} ${contract.mesesFianza > 1 ? 'meses' : 'mes'})`,
    '',
    '📞 Para más información o visitas, contacta con nosotros.',
  ];

  return lines.filter((l) => l).join('\n');
}

function generateDescriptionEN(property: any, contract: any, services: any): string {
  const lines = [
    `🏠 ${property.descripcionEn || 'Beautiful fully furnished and equipped apartment.'}`,
    '',
    '📍 LOCATION:',
    `Located in ${property.building?.city || 'central area'}${property.building?.neighborhood ? `, ${property.building.neighborhood} neighborhood` : ''}.`,
    property.building?.cercaDeMetro ? '🚇 Near metro station.' : '',
    '',
    '🛏️ FEATURES:',
    `• ${property.habitaciones || 1} bedrooms`,
    `• ${property.banos || 1} bathrooms`,
    `• ${property.superficie || 0} m² floor area`,
    property.amueblado ? '• Fully furnished' : '',
    property.ascensor ? '• Building with elevator' : '',
    property.balcon ? '• With balcony/terrace' : '',
    '',
    '💡 SERVICES INCLUDED:',
    services.wifi ? '✓ High-speed WiFi' : '',
    services.agua ? '✓ Water' : '',
    services.luz ? '✓ Electricity' : '',
    services.gas ? '✓ Gas' : '',
    services.calefaccion ? '✓ Heating' : '',
    services.limpieza ? `✓ ${services.limpiezaFrecuencia || 'Weekly'} cleaning` : '',
    '',
    '📅 AVAILABILITY:',
    `Available from ${format(contract.fechaInicio, 'MMMM d, yyyy', { locale: enUS })}`,
    `Minimum stay: 1 month`,
    `Maximum stay: ${contract.duracionMesesPrevista || 11} months`,
    '',
    '💰 CONDITIONS:',
    `Monthly rent: €${contract.rentaMensual}`,
    `Deposit: €${contract.deposito} (${contract.mesesFianza} month${contract.mesesFianza > 1 ? 's' : ''})`,
    '',
    '📞 For more information or visits, contact us.',
  ];

  return lines.filter((l) => l).join('\n');
}

function generateDescriptionFR(property: any, contract: any, services: any): string {
  const lines = [
    `🏠 ${property.descripcionFr || 'Bel appartement entièrement meublé et équipé.'}`,
    '',
    '📍 EMPLACEMENT:',
    `Situé à ${property.building?.city || 'zone centrale'}${property.building?.neighborhood ? `, quartier ${property.building.neighborhood}` : ''}.`,
    property.building?.cercaDeMetro ? '🚇 Proche du métro.' : '',
    '',
    '🛏️ CARACTÉRISTIQUES:',
    `• ${property.habitaciones || 1} chambres`,
    `• ${property.banos || 1} salles de bain`,
    `• ${property.superficie || 0} m² habitables`,
    property.amueblado ? '• Entièrement meublé' : '',
    property.ascensor ? '• Immeuble avec ascenseur' : '',
    property.balcon ? '• Avec balcon/terrasse' : '',
    '',
    '💡 SERVICES INCLUS:',
    services.wifi ? '✓ WiFi haut débit' : '',
    services.agua ? '✓ Eau' : '',
    services.luz ? '✓ Électricité' : '',
    services.gas ? '✓ Gaz' : '',
    services.calefaccion ? '✓ Chauffage' : '',
    services.limpieza ? `✓ Ménage ${services.limpiezaFrecuencia || 'hebdomadaire'}` : '',
    '',
    '📅 DISPONIBILITÉ:',
    `Disponible à partir du ${format(contract.fechaInicio, 'd MMMM yyyy', { locale: fr })}`,
    `Séjour minimum: 1 mois`,
    `Séjour maximum: ${contract.duracionMesesPrevista || 11} mois`,
    '',
    '💰 CONDITIONS:',
    `Loyer mensuel: ${contract.rentaMensual}€`,
    `Caution: ${contract.deposito}€ (${contract.mesesFianza} mois)`,
    '',
    "📞 Pour plus d'informations ou visites, contactez-nous.",
  ];

  return lines.filter((l) => l).join('\n');
}

function extractAmenities(property: any, services: any): string[] {
  const amenities: string[] = [];

  // Servicios
  if (services.wifi) amenities.push('wifi');
  if (services.agua && services.luz) amenities.push('utilities_included');
  if (services.calefaccion) amenities.push('heating');
  if (services.limpieza) amenities.push('cleaning_service');

  // Propiedad
  if (property.ascensor) amenities.push('elevator');
  if (property.aireAcondicionado) amenities.push('air_conditioning');
  if (property.balcon) amenities.push('balcony');
  if (property.terraza) amenities.push('terrace');
  if (property.parking) amenities.push('parking');
  if (property.trastero) amenities.push('storage');
  if (property.lavadora) amenities.push('washing_machine');
  if (property.secadora) amenities.push('dryer');
  if (property.lavavajillas) amenities.push('dishwasher');
  if (property.television) amenities.push('tv');
  if (property.portero) amenities.push('doorman');
  if (property.piscina) amenities.push('swimming_pool');
  if (property.gimnasio) amenities.push('gym');

  return amenities;
}

// ==========================================
// PUBLICACIÓN EN PORTALES
// ==========================================

/**
 * Publica un anuncio en múltiples portales
 */
export async function publishToPortals(
  propertyId: string,
  contractId: string,
  portals: PortalName[]
): Promise<PublicationResult[]> {
  const property = await prisma.unit.findUnique({
    where: { id: propertyId },
    include: {
      building: true,
      photos: true,
    },
  });

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
  });

  if (!property || !contract) {
    throw new Error('Propiedad o contrato no encontrado');
  }

  const listing = generateListingContent(property, contract);
  const results: PublicationResult[] = [];

  for (const portalName of portals) {
    try {
      const result = await publishToPortal(portalName, listing);
      results.push(result);

      // Guardar publicación en BD
      await prisma.propertyPublication.create({
        data: {
          unitId: propertyId,
          portal: portalName,
          externalId: result.listingId,
          status: result.success ? 'active' : 'error',
          url: result.listingUrl,
          expiresAt: result.expiresAt,
        },
      });
    } catch (error: any) {
      results.push({
        portal: portalName,
        success: false,
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Publica en un portal específico
 */
async function publishToPortal(
  portal: PortalName,
  listing: PropertyListing
): Promise<PublicationResult> {
  const config = PORTAL_CONFIGS.find((c) => c.name === portal);

  if (!config) {
    throw new Error(`Portal ${portal} no configurado`);
  }

  // Simular llamada a API del portal
  // En producción, cada portal tiene su propia API/integración
  console.log(`[Portals] Publishing to ${portal}:`, listing.title);

  // Ejemplo de integración real (pseudocódigo):
  /*
  const apiKey = process.env[`${portal.toUpperCase()}_API_KEY`];
  const response = await fetch(`${config.apiBaseUrl}/listings`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: listing.title[language],
      description: listing.description[language],
      price: { amount: listing.price, currency: listing.currency },
      availability: {
        from: listing.availableFrom.toISOString(),
        to: listing.availableTo?.toISOString(),
        min_months: listing.minStay,
        max_months: listing.maxStay,
      },
      photos: listing.photos,
      location: listing.location,
      amenities: listing.amenities,
      ...
    }),
  });
  */

  // Por ahora, simular éxito
  return {
    portal,
    success: true,
    listingId: `${portal}-${Date.now()}`,
    listingUrl: `https://${portal}.com/listings/${Date.now()}`,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
  };
}

/**
 * Actualiza un anuncio existente
 */
export async function updatePortalListing(
  publicationId: string,
  updates: Partial<PropertyListing>
): Promise<PublicationResult> {
  const publication = await prisma.propertyPublication.findUnique({
    where: { id: publicationId },
  });

  if (!publication) {
    throw new Error('Publicación no encontrada');
  }

  // TODO: Llamar a API del portal para actualizar
  console.log(`[Portals] Updating ${publication.portal} listing ${publication.externalId}`);

  await prisma.propertyPublication.update({
    where: { id: publicationId },
    data: { updatedAt: new Date() },
  });

  return {
    portal: publication.portal as PortalName,
    success: true,
    listingId: publication.externalId || undefined,
    listingUrl: publication.url || undefined,
  };
}

/**
 * Desactiva/elimina un anuncio
 */
export async function unpublishFromPortal(publicationId: string): Promise<boolean> {
  const publication = await prisma.propertyPublication.findUnique({
    where: { id: publicationId },
  });

  if (!publication) {
    throw new Error('Publicación no encontrada');
  }

  // TODO: Llamar a API del portal para eliminar
  console.log(`[Portals] Unpublishing from ${publication.portal}`);

  await prisma.propertyPublication.update({
    where: { id: publicationId },
    data: { status: 'inactive', unpublishedAt: new Date() },
  });

  return true;
}

/**
 * Obtiene estadísticas de rendimiento en portales
 */
export async function getPortalStats(propertyId: string): Promise<PortalStats[]> {
  const publications = await prisma.propertyPublication.findMany({
    where: { unitId: propertyId, status: 'active' },
  });

  // En producción, esto vendría de las APIs de cada portal
  return publications.map((pub) => ({
    portal: pub.portal as PortalName,
    impressions: Math.floor(Math.random() * 1000),
    clicks: Math.floor(Math.random() * 100),
    inquiries: Math.floor(Math.random() * 20),
    bookings: Math.floor(Math.random() * 5),
    conversionRate: Math.random() * 10,
  }));
}

/**
 * Sincroniza disponibilidad con todos los portales
 */
export async function syncAvailability(
  propertyId: string,
  availableFrom: Date,
  availableTo?: Date
): Promise<void> {
  const publications = await prisma.propertyPublication.findMany({
    where: { unitId: propertyId, status: 'active' },
  });

  for (const publication of publications) {
    // TODO: Llamar a API de cada portal para actualizar disponibilidad
    console.log(`[Portals] Syncing availability for ${publication.portal}`);
  }
}

export default {
  PORTAL_CONFIGS,
  generateListingContent,
  publishToPortals,
  updatePortalListing,
  unpublishFromPortal,
  getPortalStats,
  syncAvailability,
};
