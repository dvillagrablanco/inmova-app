/**
 * SERVICIO DE BÚSQUEDA DE OPORTUNIDADES DE INVERSIÓN
 *
 * Conecta con fuentes reales para buscar activos por debajo del precio de mercado:
 *
 * 1. Idealista — scraping de listings por tipo de activo (vivienda, local,
 *    oficina, nave, garaje) con filtros de precio, superficie, ciudad
 * 2. BOE Subastas — scraping avanzado con filtros por provincia, tipo, precio
 * 3. Idealista Data — datos de mercado para calcular si un listing está infravalorado
 *
 * Cada resultado incluye:
 * - Comparación con precio medio de zona (de Idealista Data)
 * - Yield estimado (usando datos de alquiler de la zona)
 * - Score de oportunidad (0-100)
 */

import * as cheerio from 'cheerio';
import logger from '@/lib/logger';
import {
  fetchWithRetry,
  getCachedData,
  setCachedData,
  type ScrapedListing,
} from './scraping/scraping-base';

// ============================================================================
// TIPOS
// ============================================================================

export interface OpportunitySearchFilters {
  cities?: string[];
  propertyTypes?: string[];
  operation?: 'sale' | 'rent';
  maxPrice?: number;
  minPrice?: number;
  minSurface?: number;
  maxSurface?: number;
  minDiscount?: number; // % mínimo bajo precio mercado
  minYield?: number;
  includeBOE?: boolean;
  includeIdealista?: boolean;
}

export interface InvestmentOpportunityResult {
  id: string;
  source: 'idealista' | 'boe' | 'fotocasa' | 'alertasubastas';
  title: string;
  propertyType: string;
  location: string;
  city: string;
  price: number;
  pricePerM2: number;
  surface: number | null;
  rooms: number | null;
  url: string;
  imageUrl: string | null;

  // Análisis de oportunidad
  marketPricePerM2: number | null;
  discountVsMarket: number | null; // % bajo mercado
  estimatedRent: number | null;
  estimatedYield: number | null;
  zoneYield: number | null;
  opportunityScore: number; // 0-100

  description: string | null;
  tags: string[];
}

// ============================================================================
// MAPEO DE TIPOS DE ACTIVO → URLs IDEALISTA
// ============================================================================

const IDEALISTA_BASE = 'https://www.idealista.com';

const PROPERTY_TYPE_URLS: Record<string, { sale: string; rent: string }> = {
  vivienda:        { sale: 'venta-viviendas',    rent: 'alquiler-viviendas' },
  local_comercial: { sale: 'venta-locales',      rent: 'alquiler-locales' },
  oficina:         { sale: 'venta-oficinas',      rent: 'alquiler-oficinas' },
  nave_industrial: { sale: 'venta-naves',         rent: 'alquiler-naves' },
  garaje:          { sale: 'venta-garajes',       rent: 'alquiler-garajes' },
  terreno:         { sale: 'venta-terrenos',      rent: 'venta-terrenos' },
  edificio:        { sale: 'venta-edificios',     rent: 'venta-edificios' },
  trastero:        { sale: 'venta-trasteros',     rent: 'alquiler-trasteros' },
};

const CITY_SLUGS: Record<string, string> = {
  madrid: 'madrid-madrid', barcelona: 'barcelona-barcelona',
  valencia: 'valencia-valencia', sevilla: 'sevilla-sevilla',
  malaga: 'malaga-malaga', bilbao: 'bilbao-vizcaya',
  zaragoza: 'zaragoza-zaragoza', palencia: 'palencia-palencia',
  valladolid: 'valladolid-valladolid', alicante: 'alicante-alicante',
  marbella: 'marbella-malaga', benidorm: 'benidorm-alicante',
  palma: 'palma-de-mallorca-baleares', cordoba: 'cordoba-cordoba',
  granada: 'granada-granada', murcia: 'murcia-murcia',
  vigo: 'vigo-pontevedra', gijon: 'gijon-asturias',
  santander: 'santander-cantabria',
};

function buildIdealistaUrl(
  city: string,
  propertyType: string,
  operation: 'sale' | 'rent',
  filters?: { maxPrice?: number; minSurface?: number },
): string | null {
  const cityKey = city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const slug = CITY_SLUGS[cityKey];
  if (!slug) return null;

  const typeUrls = PROPERTY_TYPE_URLS[propertyType] || PROPERTY_TYPE_URLS.vivienda;
  const segment = operation === 'sale' ? typeUrls.sale : typeUrls.rent;

  let url = `${IDEALISTA_BASE}/${segment}/${slug}/`;

  const params: string[] = [];
  if (filters?.maxPrice) params.push(`precio-hasta_${filters.maxPrice}`);
  if (filters?.minSurface) params.push(`metros-cuadrados-mas-de_${filters.minSurface}`);

  if (params.length > 0) {
    url += `con-${params.join(',')}/`;
  }

  return url;
}

// ============================================================================
// SCRAPING IDEALISTA — TODOS LOS TIPOS DE ACTIVO
// ============================================================================

async function scrapeIdealistaListings(
  city: string,
  propertyType: string,
  operation: 'sale' | 'rent',
  filters?: { maxPrice?: number; minSurface?: number },
): Promise<ScrapedListing[]> {
  const url = buildIdealistaUrl(city, propertyType, operation, filters);
  if (!url) return [];

  try {
    const html = await fetchWithRetry(url, {
      referer: IDEALISTA_BASE,
      extraHeaders: {
        'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
      },
    });

    const $ = cheerio.load(html);
    const listings: ScrapedListing[] = [];

    $('article.item, .item-multimedia-container, .listing-item').each((_, el) => {
      const $el = $(el);

      const titleEl = $el.find('.item-link');
      const title = titleEl.text().trim();
      const href = titleEl.attr('href');
      const listingUrl = href ? `${IDEALISTA_BASE}${href}` : '';

      const priceText = $el.find('.item-price, .price-row span').first().text().trim();
      const price = parsePrice(priceText);

      const detailItems = $el.find('.item-detail span');
      let squareMeters: number | null = null;
      let rooms: number | null = null;
      let floor: string | null = null;

      detailItems.each((_, det) => {
        const t = $(det).text().trim();
        if (t.includes('m²') || t.includes('m2')) {
          squareMeters = parseFloat(t.replace(/[^\d.,]/g, '').replace('.', '').replace(',', '.')) || null;
        } else if (t.includes('hab') || t.includes('dorm')) {
          rooms = parseInt(t.match(/(\d+)/)?.[1] || '') || null;
        } else if (t.includes('planta') || t.includes('Bajo') || t.includes('Ático')) {
          floor = t;
        }
      });

      const pricePerM2 = price && squareMeters && squareMeters > 0
        ? Math.round(price / squareMeters) : null;

      const address = $el.find('.item-detail-char .item-description, .item-location').text().trim() || title;
      const imageUrl = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src') || null;

      if (!price && !squareMeters) return;

      listings.push({
        title,
        price,
        pricePerM2,
        squareMeters,
        rooms,
        bathrooms: null,
        floor,
        address,
        neighborhood: null,
        url: listingUrl,
        imageUrl,
        description: null,
        source: 'idealista',
      });
    });

    // JSON-LD fallback
    if (listings.length === 0) {
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const json = JSON.parse($(el).html() || '');
          if (json['@type'] === 'ItemList' && json.itemListElement) {
            for (const item of json.itemListElement) {
              if (item.item?.offers?.price) {
                listings.push({
                  title: item.item.name || '',
                  price: item.item.offers.price,
                  pricePerM2: null,
                  squareMeters: null,
                  rooms: null,
                  bathrooms: null,
                  floor: null,
                  address: item.item.name || '',
                  neighborhood: null,
                  url: item.item.url || '',
                  imageUrl: item.item.image || null,
                  description: item.item.description || null,
                  source: 'idealista',
                });
              }
            }
          }
        } catch { /* skip */ }
      });
    }

    return listings;
  } catch (error: any) {
    logger.warn(`[IdealistaSearch] Error scraping ${propertyType} en ${city}: ${error.message}`);
    return [];
  }
}

// ============================================================================
// BOE SUBASTAS — BÚSQUEDA AVANZADA CON FILTROS
// ============================================================================

const BOE_BASE = 'https://subastas.boe.es';

const BOE_PROVINCE_CODES: Record<string, string> = {
  madrid: '28', barcelona: '08', valencia: '46', sevilla: '41',
  malaga: '29', bilbao: '48', zaragoza: '50', valladolid: '47',
  alicante: '03', palencia: '34', murcia: '30', cordoba: '14',
  granada: '18', palma: '07', cadiz: '11',
};

const BOE_ASSET_TYPES: Record<string, string> = {
  vivienda: 'V', local_comercial: 'L', oficina: 'O',
  nave_industrial: 'N', garaje: 'G', terreno: 'T',
  edificio: 'E', trastero: 'A',
};

async function searchBOEAuctions(
  filters: OpportunitySearchFilters,
): Promise<InvestmentOpportunityResult[]> {
  const cacheKey = `opp-search:boe:${JSON.stringify(filters).substring(0, 100)}`;
  const cached = await getCachedData<InvestmentOpportunityResult[]>(cacheKey);
  if (cached) return cached;

  const results: InvestmentOpportunityResult[] = [];

  try {
    const params = new URLSearchParams();
    params.set('accion', 'Buscar');
    params.set('dato[3]', 'I'); // Solo inmuebles

    // Filtro por provincia
    if (filters.cities?.length === 1) {
      const cityKey = filters.cities[0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const code = BOE_PROVINCE_CODES[cityKey];
      if (code) params.set('dato[4]', code);
    }

    // Filtro por tipo de activo
    if (filters.propertyTypes?.length === 1) {
      const boeType = BOE_ASSET_TYPES[filters.propertyTypes[0]];
      if (boeType) params.set('dato[15]', boeType);
    }

    params.set('dato[16]', '1'); // Solo activas

    const url = `${BOE_BASE}/subastas_ava.php?${params.toString()}`;

    const html = await fetchWithRetry(url, {
      referer: BOE_BASE,
      extraHeaders: { 'Accept-Language': 'es-ES,es;q=0.9' },
    });

    const $ = cheerio.load(html);

    $('.resultado-busqueda, .rowClass, table.datosSubasta tr, .listadoResult .box-info').each((idx, el) => {
      if (idx >= 25) return;
      const $el = $(el);
      const text = $el.text();

      const titulo = $el.find('.titulo-subasta, h3 a, .info-col strong').first().text().trim()
        || $el.find('a').first().text().trim();
      const link = $el.find('a').first().attr('href');

      const valorMatch = text.match(/(?:Valor|Tasaci[oó]n)[:\s]*([\d.,]+)/i);
      const importeMatch = text.match(/(?:Importe|Puja\s+m[ií]nima)[:\s]*([\d.,]+)/i);
      const superficieMatch = text.match(/([\d.,]+)\s*m[²2]/);

      const valorTasacion = valorMatch ? parsePrice(valorMatch[1]) : null;
      const puja = importeMatch ? parsePrice(importeMatch[1]) : null;
      const superficie = superficieMatch ? parseFloat(superficieMatch[1].replace('.', '').replace(',', '.')) : null;

      if (!titulo && !valorTasacion) return;

      const price = puja || (valorTasacion ? Math.round(valorTasacion * 0.7) : 0);
      if (filters.maxPrice && price > filters.maxPrice) return;
      if (filters.minPrice && price < filters.minPrice) return;
      if (filters.minSurface && superficie && superficie < filters.minSurface) return;

      const market = valorTasacion || (price > 0 ? Math.round(price / 0.7) : 0);
      const discount = market > 0 ? Math.round(((market - price) / market) * 100) : 30;

      if (filters.minDiscount && discount < filters.minDiscount) return;

      const t = (titulo + ' ' + text).toLowerCase();
      const propertyType = t.includes('local') || t.includes('comercial') ? 'local_comercial'
        : t.includes('oficina') ? 'oficina'
        : t.includes('nave') || t.includes('industrial') ? 'nave_industrial'
        : t.includes('garaje') || t.includes('plaza') ? 'garaje'
        : t.includes('solar') || t.includes('terreno') ? 'terreno'
        : 'vivienda';

      const pricePerM2 = superficie && superficie > 0 ? Math.round(price / superficie) : 0;
      const estimatedYield = price > 0 && market > 0 ? Math.round((market * 0.05 / price) * 100) / 10 : null;

      results.push({
        id: `boe-search-${idx}`,
        source: 'boe',
        title: titulo || 'Subasta inmueble',
        propertyType,
        location: titulo,
        city: filters.cities?.[0] || 'España',
        price,
        pricePerM2,
        surface: superficie,
        rooms: null,
        url: link ? (link.startsWith('http') ? link : `${BOE_BASE}/${link}`) : `${BOE_BASE}/subastas_ava.php`,
        imageUrl: null,
        marketPricePerM2: market > 0 && superficie ? Math.round(market / superficie) : null,
        discountVsMarket: discount,
        estimatedRent: null,
        estimatedYield,
        zoneYield: null,
        opportunityScore: Math.min(100, Math.round(discount * 1.2 + (estimatedYield || 0) * 3)),
        description: `Subasta judicial. ${valorTasacion ? `Tasación: €${valorTasacion.toLocaleString('es-ES')}` : ''}. Puja: €${price.toLocaleString('es-ES')}. Descuento: ${discount}%.`,
        tags: ['subasta', 'boe', propertyType],
      });
    });

    if (results.length > 0) {
      await setCachedData(cacheKey, results, 4 * 60 * 60);
      logger.info(`[BOESearch] ${results.length} subastas encontradas`);
    }
  } catch (error: any) {
    logger.warn(`[BOESearch] Error: ${error.message}`);
  }

  return results;
}

// ============================================================================
// BÚSQUEDA UNIFICADA CON ANÁLISIS DE OPORTUNIDAD
// ============================================================================

export async function searchInvestmentOpportunities(
  filters: OpportunitySearchFilters,
): Promise<{
  results: InvestmentOpportunityResult[];
  totalFound: number;
  sources: string[];
  searchedAt: string;
}> {
  const cities = filters.cities || ['Madrid'];
  const types = filters.propertyTypes || ['vivienda'];
  const operation = filters.operation || 'sale';
  const includeIdealista = filters.includeIdealista !== false;
  const includeBOE = filters.includeBOE !== false;

  // Obtener datos de mercado de Idealista Data para comparar
  let marketDataByCity: Record<string, { avgPricePerM2: number; yield: number }> = {};
  try {
    const { getIdealistaDataReport, getRentalYield } = await import('@/lib/idealista-data-service');
    const marketPromises = cities.map(async (city) => {
      const [report, yieldData] = await Promise.all([
        getIdealistaDataReport(city).catch(() => null),
        Promise.resolve(getRentalYield(city)),
      ]);
      return {
        city,
        avgPricePerM2: report?.salePricePerM2 || 0,
        yield: yieldData?.grossYield || 0,
      };
    });
    const marketResults = await Promise.all(marketPromises);
    for (const m of marketResults) {
      if (m.avgPricePerM2 > 0) marketDataByCity[m.city] = { avgPricePerM2: m.avgPricePerM2, yield: m.yield };
    }
  } catch {
    logger.warn('[OppSearch] No se pudieron obtener datos de mercado');
  }

  const allResults: InvestmentOpportunityResult[] = [];
  const sources: string[] = [];

  // Scraping Idealista en paralelo por ciudad y tipo
  if (includeIdealista) {
    const idealistaPromises: Promise<ScrapedListing[]>[] = [];
    const promiseMeta: { city: string; type: string }[] = [];

    for (const city of cities) {
      for (const pType of types) {
        idealistaPromises.push(
          scrapeIdealistaListings(city, pType, operation, {
            maxPrice: filters.maxPrice,
            minSurface: filters.minSurface,
          }),
        );
        promiseMeta.push({ city, type: pType });
      }
    }

    const idealistaResults = await Promise.allSettled(idealistaPromises);
    let hasIdealistaData = false;

    for (let i = 0; i < idealistaResults.length; i++) {
      const result = idealistaResults[i];
      if (result.status !== 'fulfilled' || result.value.length === 0) continue;

      const { city, type } = promiseMeta[i];
      const market = marketDataByCity[city];

      for (const listing of result.value) {
        if (!listing.price || listing.price <= 0) continue;
        if (filters.maxPrice && listing.price > filters.maxPrice) continue;
        if (filters.minPrice && listing.price < filters.minPrice) continue;

        const pricePerM2 = listing.pricePerM2 || (listing.squareMeters ? Math.round(listing.price / listing.squareMeters) : 0);

        let discountVsMarket: number | null = null;
        let estimatedRent: number | null = null;
        let estimatedYield: number | null = null;

        if (market && pricePerM2 > 0 && market.avgPricePerM2 > 0) {
          discountVsMarket = Math.round(((market.avgPricePerM2 - pricePerM2) / market.avgPricePerM2) * 100);
          if (market.yield > 0 && listing.price > 0) {
            estimatedRent = Math.round((listing.price * (market.yield / 100)) / 12);
            estimatedYield = market.yield;
            // Si está por debajo del mercado, el yield efectivo es mayor
            if (discountVsMarket > 0) {
              estimatedYield = Math.round((market.yield / (1 - discountVsMarket / 100)) * 10) / 10;
            }
          }
        }

        if (filters.minDiscount && (discountVsMarket === null || discountVsMarket < filters.minDiscount)) continue;
        if (filters.minYield && (estimatedYield === null || estimatedYield < filters.minYield)) continue;

        const score = calculateOpportunityScore(discountVsMarket, estimatedYield, listing, type);

        allResults.push({
          id: `idealista-${city.toLowerCase()}-${allResults.length}`,
          source: 'idealista',
          title: listing.title || listing.address,
          propertyType: type,
          location: listing.address,
          city,
          price: listing.price,
          pricePerM2,
          surface: listing.squareMeters,
          rooms: listing.rooms,
          url: listing.url,
          imageUrl: listing.imageUrl,
          marketPricePerM2: market?.avgPricePerM2 || null,
          discountVsMarket,
          estimatedRent,
          estimatedYield,
          zoneYield: market?.yield || null,
          opportunityScore: score,
          description: listing.description,
          tags: [type, city.toLowerCase(), ...(discountVsMarket && discountVsMarket > 10 ? ['infravalorado'] : [])],
        });
        hasIdealistaData = true;
      }
    }

    if (hasIdealistaData) sources.push('Idealista');
  }

  // Subastas BOE
  if (includeBOE) {
    const boeResults = await searchBOEAuctions(filters);
    allResults.push(...boeResults);
    if (boeResults.length > 0) sources.push('Subastas BOE');
  }

  // AlertaSubastas (BOE + AEAT + SS + Notarial + Ayuntamientos)
  if (includeBOE) {
    try {
      const { scrapeAlertaSubastas, isAlertaSubastasConfigured } = await import('@/lib/alertasubastas-service');
      if (isAlertaSubastasConfigured()) {
        const alertaItems = await scrapeAlertaSubastas(types, cities);
        for (const item of alertaItems) {
          if (filters.maxPrice && item.price > filters.maxPrice) continue;
          if (filters.minPrice && item.price < filters.minPrice) continue;
          if (filters.minDiscount && item.discount < filters.minDiscount) continue;

          const pricePerM2 = item.surface && item.surface > 0 ? Math.round(item.price / item.surface) : 0;
          const market = marketDataByCity[item.location] || marketDataByCity[cities[0]];
          let discountVsMarket: number | null = null;
          if (market && pricePerM2 > 0 && market.avgPricePerM2 > 0) {
            discountVsMarket = Math.round(((market.avgPricePerM2 - pricePerM2) / market.avgPricePerM2) * 100);
          }

          allResults.push({
            id: item.id,
            source: 'alertasubastas' as any,
            title: item.title,
            propertyType: item.propertyType,
            location: item.location,
            city: item.province || cities[0],
            price: item.price,
            pricePerM2,
            surface: item.surface,
            rooms: null,
            url: item.url,
            imageUrl: item.imageUrl,
            marketPricePerM2: market?.avgPricePerM2 || null,
            discountVsMarket: discountVsMarket ?? item.discount,
            estimatedRent: null,
            estimatedYield: item.marketValue > 0 ? Math.round((item.marketValue * 0.05 / item.price) * 10) / 10 : null,
            zoneYield: market?.yield || null,
            opportunityScore: Math.min(100, Math.round(item.discount * 1.2 + (market?.yield || 0) * 3 + 10)),
            description: item.description,
            tags: [...item.tags, 'alertasubastas'],
          });
        }
        if (alertaItems.length > 0) sources.push('AlertaSubastas');
      }
    } catch (e: any) {
      logger.warn('[OppSearch] AlertaSubastas error:', e.message);
    }
  }

  // Ordenar por score de oportunidad
  allResults.sort((a, b) => b.opportunityScore - a.opportunityScore);

  return {
    results: allResults.slice(0, 50), // Limitar a 50 resultados
    totalFound: allResults.length,
    sources,
    searchedAt: new Date().toISOString(),
  };
}

// ============================================================================
// SCORING
// ============================================================================

function calculateOpportunityScore(
  discountVsMarket: number | null,
  estimatedYield: number | null,
  listing: ScrapedListing,
  propertyType: string,
): number {
  let score = 0;

  // Descuento vs mercado (0-35 puntos)
  if (discountVsMarket !== null && discountVsMarket > 0) {
    score += Math.min(35, discountVsMarket * 1.5);
  }

  // Yield estimado (0-25 puntos)
  if (estimatedYield !== null) {
    score += Math.min(25, estimatedYield * 2.5);
  }

  // Precio atractivo por tipo (0-15 puntos)
  if (listing.price && listing.price > 0) {
    const thresholds: Record<string, number> = {
      vivienda: 200000, local_comercial: 150000, oficina: 250000,
      nave_industrial: 300000, garaje: 30000, trastero: 15000,
    };
    const threshold = thresholds[propertyType] || 200000;
    if (listing.price < threshold * 0.5) score += 15;
    else if (listing.price < threshold * 0.75) score += 10;
    else if (listing.price < threshold) score += 5;
  }

  // Superficie (0-10 puntos) — más superficie = mejor inversión
  if (listing.squareMeters) {
    score += Math.min(10, listing.squareMeters / 20);
  }

  // Tiene datos completos (0-15 puntos)
  if (listing.price) score += 3;
  if (listing.squareMeters) score += 3;
  if (listing.pricePerM2) score += 3;
  if (listing.rooms) score += 3;
  if (listing.url) score += 3;

  return Math.min(100, Math.round(score));
}

// ============================================================================
// UTILIDADES
// ============================================================================

function parsePrice(text: string): number | null {
  if (!text) return null;
  const cleaned = text.replace(/[€\s]/g, '').replace('/mes', '').replace('/m²', '').replace('/m2', '').trim();
  const withoutThousands = cleaned.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(withoutThousands);
  return isNaN(num) ? null : num;
}
