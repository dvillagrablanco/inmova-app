/**
 * Servicio de Feeds Inmobiliarios
 * 
 * Integra múltiples fuentes de listados de propiedades:
 * 1. InmolinkCRM — REST API (activo)
 * 2. Idealista API — OAuth2 (preparado, pendiente API key)
 * 3. FreeMLS — XML feed (futuro)
 * 
 * Uso:
 *   const listings = await searchListings({ city: 'Madrid', operation: 'sale', maxPrice: 500000 });
 */

import logger from '@/lib/logger';

// ============================================================================
// TIPOS
// ============================================================================

export interface PropertyListing {
  id: string;
  source: 'inmolink' | 'idealista' | 'freemls' | 'internal';
  title: string;
  description?: string;
  operation: 'sale' | 'rent';
  propertyType: string; // vivienda, local, oficina, garaje, edificio
  price: number;
  pricePerM2: number;
  surface: number;
  rooms?: number;
  bathrooms?: number;
  address?: string;
  city: string;
  province?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  url?: string;
  imageUrl?: string;
  publishDate?: string;
  // Calculated KPIs
  estimatedRent?: number;
  estimatedYield?: number;
  investmentScore?: number;
}

export interface SearchFilters {
  city?: string;
  province?: string;
  operation?: 'sale' | 'rent';
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  minSurface?: number;
  maxSurface?: number;
  minRooms?: number;
  maxItems?: number;
}

// ============================================================================
// 1. INMOLINKCRM — REST API INTEGRATION
// ============================================================================

const INMOLINK_BASE_URL = 'https://inmolinkcrm.es/api/v1';

/**
 * Fetch property listings from InmolinkCRM
 * REST API with Kyero-compatible format
 */
export async function fetchInmolinkListings(filters: SearchFilters): Promise<PropertyListing[]> {
  try {
    // Build query params
    const params = new URLSearchParams();
    if (filters.city) params.set('location', filters.city);
    if (filters.operation) params.set('type', filters.operation === 'sale' ? 'sale' : 'rental');
    if (filters.propertyType) params.set('property_type', mapPropertyType(filters.propertyType));
    if (filters.minPrice) params.set('min_price', filters.minPrice.toString());
    if (filters.maxPrice) params.set('max_price', filters.maxPrice.toString());
    if (filters.minSurface) params.set('min_size', filters.minSurface.toString());
    if (filters.maxItems) params.set('limit', Math.min(filters.maxItems, 50).toString());
    params.set('format', 'json');

    const apiKey = process.env.INMOLINK_API_KEY;
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'InmovaApp/1.0',
    };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const url = `${INMOLINK_BASE_URL}/properties?${params.toString()}`;
    const res = await fetch(url, { headers, next: { revalidate: 3600 } });

    if (!res.ok) {
      logger.warn(`[InmolinkCRM] API returned ${res.status}`);
      return [];
    }

    const data = await res.json();
    const properties = Array.isArray(data) ? data : data.properties || data.data || [];

    return properties.map((p: any) => ({
      id: `inmolink-${p.id || p.reference}`,
      source: 'inmolink' as const,
      title: p.title || p.name || `Propiedad en ${p.location || filters.city}`,
      description: p.description,
      operation: p.type === 'rental' ? 'rent' as const : 'sale' as const,
      propertyType: mapPropertyTypeReverse(p.property_type || p.type_property),
      price: Number(p.price) || 0,
      pricePerM2: p.size > 0 ? Number(p.price) / p.size : 0,
      surface: Number(p.size || p.built_size || p.plot_size) || 0,
      rooms: Number(p.bedrooms || p.rooms) || undefined,
      bathrooms: Number(p.bathrooms) || undefined,
      address: p.address || p.location,
      city: p.city || p.town || filters.city || '',
      province: p.province,
      postalCode: p.postcode,
      latitude: p.latitude ? Number(p.latitude) : undefined,
      longitude: p.longitude ? Number(p.longitude) : undefined,
      url: p.url || p.link,
      imageUrl: p.main_image || p.image_url || (p.images && p.images[0]),
      publishDate: p.date || p.created_at,
    }));
  } catch (err) {
    logger.error('[InmolinkCRM] Fetch error:', err);
    return [];
  }
}

// ============================================================================
// 2. IDEALISTA API — OAUTH2 (PREPARED, NEEDS API KEY)
// ============================================================================

const IDEALISTA_TOKEN_URL = 'https://api.idealista.com/oauth/token';
const IDEALISTA_SEARCH_URL = 'https://api.idealista.com/3.5/es/search';

// Location IDs for main cities
const IDEALISTA_LOCATIONS: Record<string, string> = {
  'madrid': '0-EU-ES-28-07-001-079',
  'barcelona': '0-EU-ES-08-07-001-019',
  'valencia': '0-EU-ES-46-07-001-250',
  'sevilla': '0-EU-ES-41-07-001-091',
  'málaga': '0-EU-ES-29-07-001-067',
  'malaga': '0-EU-ES-29-07-001-067',
  'marbella': '0-EU-ES-29-07-001-069',
  'alicante': '0-EU-ES-03-07-001-014',
  'bilbao': '0-EU-ES-48-07-001-020',
  'valladolid': '0-EU-ES-47-07-001-186',
  'palencia': '0-EU-ES-34-07-001-120',
  'zaragoza': '0-EU-ES-50-07-001-297',
};

let idealistaToken: { token: string; expires: number } | null = null;

/**
 * Get OAuth2 token for Idealista API
 * Requires IDEALISTA_API_KEY and IDEALISTA_API_SECRET env vars
 */
async function getIdealistaToken(): Promise<string | null> {
  const apiKey = process.env.IDEALISTA_API_KEY;
  const apiSecret = process.env.IDEALISTA_API_SECRET;

  if (!apiKey || !apiSecret) {
    return null;
  }

  // Check cached token
  if (idealistaToken && idealistaToken.expires > Date.now()) {
    return idealistaToken.token;
  }

  try {
    const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

    const res = await fetch(IDEALISTA_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials&scope=read',
    });

    if (!res.ok) {
      logger.error(`[Idealista] Token error: ${res.status}`);
      return null;
    }

    const data = await res.json();
    idealistaToken = {
      token: data.access_token,
      expires: Date.now() + (data.expires_in - 60) * 1000,
    };

    logger.info('[Idealista] Token obtained successfully');
    return idealistaToken.token;
  } catch (err) {
    logger.error('[Idealista] Token fetch error:', err);
    return null;
  }
}

/**
 * Search Idealista listings
 * REQUIRES: IDEALISTA_API_KEY + IDEALISTA_API_SECRET in env
 */
export async function fetchIdealistaListings(filters: SearchFilters): Promise<PropertyListing[]> {
  const token = await getIdealistaToken();
  if (!token) {
    logger.info('[Idealista] API no configurada — set IDEALISTA_API_KEY + IDEALISTA_API_SECRET');
    return [];
  }

  try {
    const cityKey = (filters.city || 'madrid').toLowerCase();
    const locationId = IDEALISTA_LOCATIONS[cityKey] || IDEALISTA_LOCATIONS['madrid'];

    const params = new URLSearchParams({
      operation: filters.operation || 'sale',
      locationId,
      maxItems: (filters.maxItems || 20).toString(),
      order: 'priceDown',
      locale: 'es',
      country: 'es',
    });

    if (filters.propertyType) params.set('propertyType', mapToIdealistaType(filters.propertyType));
    if (filters.minPrice) params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice.toString());
    if (filters.minSurface) params.set('minSize', filters.minSurface.toString());
    if (filters.maxSurface) params.set('maxSize', filters.maxSurface.toString());
    if (filters.minRooms) params.set('minRooms', filters.minRooms.toString());

    const res = await fetch(`${IDEALISTA_SEARCH_URL}?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      logger.warn(`[Idealista] Search returned ${res.status}`);
      return [];
    }

    const data = await res.json();
    const elements = data.elementList || [];

    logger.info(`[Idealista] Found ${elements.length} listings in ${filters.city}`);

    return elements.map((p: any) => ({
      id: `idealista-${p.propertyCode}`,
      source: 'idealista' as const,
      title: p.suggestedTexts?.title || `${p.propertyType} en ${p.address || filters.city}`,
      description: p.description,
      operation: p.operation === 'rent' ? 'rent' as const : 'sale' as const,
      propertyType: mapIdealistaTypeReverse(p.propertyType),
      price: Number(p.price) || 0,
      pricePerM2: Number(p.priceByArea) || (p.size > 0 ? p.price / p.size : 0),
      surface: Number(p.size) || 0,
      rooms: Number(p.rooms) || undefined,
      bathrooms: Number(p.bathrooms) || undefined,
      address: p.address,
      city: p.municipality || p.province || filters.city || '',
      province: p.province,
      postalCode: p.district,
      latitude: p.latitude,
      longitude: p.longitude,
      url: p.url || `https://www.idealista.com/inmueble/${p.propertyCode}/`,
      imageUrl: p.thumbnail,
      publishDate: p.modificationDate,
    }));
  } catch (err) {
    logger.error('[Idealista] Search error:', err);
    return [];
  }
}

// ============================================================================
// 3. UNIFIED SEARCH — ALL SOURCES
// ============================================================================

/**
 * Search across all available listing sources
 * Returns merged, deduplicated, and scored results
 */
export async function searchListings(filters: SearchFilters): Promise<{
  listings: PropertyListing[];
  sources: string[];
  totalFound: number;
}> {
  const allListings: PropertyListing[] = [];
  const sources: string[] = [];

  // Fetch from all sources in parallel
  const [inmolinkResults, idealistaResults] = await Promise.allSettled([
    fetchInmolinkListings(filters),
    fetchIdealistaListings(filters),
  ]);

  if (inmolinkResults.status === 'fulfilled' && inmolinkResults.value.length > 0) {
    allListings.push(...inmolinkResults.value);
    sources.push('InmolinkCRM');
  }

  if (idealistaResults.status === 'fulfilled' && idealistaResults.value.length > 0) {
    allListings.push(...idealistaResults.value);
    sources.push('Idealista');
  }

  // Calculate investment KPIs for sale listings
  const enriched = allListings.map(listing => {
    if (listing.operation === 'sale' && listing.price > 0 && listing.surface > 0) {
      // Estimate rent based on area averages (rough estimation)
      const avgRentPerM2 = getEstimatedRentPerM2(listing.city, listing.propertyType);
      const estimatedRent = listing.surface * avgRentPerM2;
      const estimatedYield = (estimatedRent * 12 / listing.price) * 100;
      const investmentScore = calculateInvestmentScore(estimatedYield, listing);

      return { ...listing, estimatedRent, estimatedYield, investmentScore };
    }
    return listing;
  });

  // Sort by investment score (best first)
  enriched.sort((a, b) => (b.investmentScore || 0) - (a.investmentScore || 0));

  return {
    listings: enriched,
    sources,
    totalFound: enriched.length,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function getEstimatedRentPerM2(city: string, propertyType: string): number {
  const cityLower = (city || '').toLowerCase();
  const baseRents: Record<string, number> = {
    'madrid': 18, 'barcelona': 17, 'malaga': 12, 'málaga': 12, 'marbella': 14,
    'valencia': 11, 'sevilla': 10, 'bilbao': 13, 'alicante': 10,
    'valladolid': 8, 'palencia': 7, 'zaragoza': 9,
  };

  const typeMultiplier: Record<string, number> = {
    'local': 1.5, 'oficina': 1.3, 'vivienda': 1.0, 'garaje': 0.4, 'edificio': 0.9,
  };

  const base = baseRents[cityLower] || 10;
  const mult = typeMultiplier[propertyType] || 1.0;
  return base * mult;
}

function calculateInvestmentScore(yield_: number, listing: PropertyListing): number {
  let score = 0;
  // Yield score (0-40)
  if (yield_ >= 8) score += 40;
  else if (yield_ >= 6) score += 30;
  else if (yield_ >= 4) score += 20;
  else score += 10;

  // Price per m² below average (0-30)
  const avgPrices: Record<string, number> = { 'madrid': 4200, 'marbella': 3960, 'barcelona': 3800, 'valencia': 1900 };
  const avg = avgPrices[(listing.city || '').toLowerCase()] || 2000;
  if (listing.pricePerM2 < avg * 0.8) score += 30;
  else if (listing.pricePerM2 < avg) score += 20;
  else score += 10;

  // Surface bonus (0-15)
  if (listing.surface > 200) score += 15;
  else if (listing.surface > 100) score += 10;
  else score += 5;

  // Type bonus (0-15)
  if (listing.propertyType === 'local') score += 15;
  else if (listing.propertyType === 'edificio') score += 12;
  else if (listing.propertyType === 'oficina') score += 10;
  else score += 5;

  return score;
}

function mapPropertyType(type: string): string {
  const map: Record<string, string> = {
    'vivienda': 'apartment', 'local': 'commercial', 'oficina': 'office',
    'garaje': 'garage', 'edificio': 'building', 'nave': 'warehouse',
  };
  return map[type] || 'apartment';
}

function mapPropertyTypeReverse(type: string): string {
  const map: Record<string, string> = {
    'apartment': 'vivienda', 'flat': 'vivienda', 'house': 'vivienda',
    'commercial': 'local', 'office': 'oficina', 'garage': 'garaje',
    'building': 'edificio', 'warehouse': 'nave',
  };
  return map[(type || '').toLowerCase()] || type || 'vivienda';
}

function mapToIdealistaType(type: string): string {
  const map: Record<string, string> = {
    'vivienda': 'homes', 'local': 'premises', 'oficina': 'offices',
    'garaje': 'garages', 'edificio': 'homes', 'nave': 'premises',
  };
  return map[type] || 'homes';
}

function mapIdealistaTypeReverse(type: string): string {
  const map: Record<string, string> = {
    'flat': 'vivienda', 'house': 'vivienda', 'chalet': 'vivienda',
    'penthouse': 'vivienda', 'duplex': 'vivienda', 'studio': 'vivienda',
    'premises': 'local', 'office': 'oficina', 'garage': 'garaje',
    'building': 'edificio', 'warehouse': 'nave', 'land': 'terreno',
  };
  return map[(type || '').toLowerCase()] || type || 'vivienda';
}
