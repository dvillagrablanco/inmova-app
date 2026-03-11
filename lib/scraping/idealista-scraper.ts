// @ts-nocheck
/**
 * SCRAPER DE IDEALISTA
 *
 * Extrae listings de idealista.com mediante scraping de las páginas
 * de búsqueda. Soporta venta y alquiler, filtrado por ciudad/CP.
 *
 * Idealista tiene protección anti-bot agresiva. Este scraper:
 * - Rota User-Agents
 * - Respeta rate limits (mín. 3s entre requests)
 * - Cachea resultados 24h en Redis
 * - Tiene fallback a datos estáticos si el scraping falla
 */

import * as cheerio from 'cheerio';
import logger from '@/lib/logger';
import {
  fetchWithRetry,
  parseSpanishPrice,
  parseSquareMeters,
  getCachedData,
  setCachedData,
  buildCacheKey,
  calculateSummary,
  type ScrapedListing,
  type ScrapedMarketSummary,
} from './scraping-base';

const BASE_URL = 'https://www.idealista.com';

// Mapeo de ciudades a slugs de Idealista
const CITY_SLUGS: Record<string, string> = {
  madrid: 'madrid-madrid',
  barcelona: 'barcelona-barcelona',
  valencia: 'valencia-valencia',
  sevilla: 'sevilla-sevilla',
  malaga: 'malaga-malaga',
  bilbao: 'bilbao-vizcaya',
  zaragoza: 'zaragoza-zaragoza',
  palencia: 'palencia-palencia',
  valladolid: 'valladolid-valladolid',
  alicante: 'alicante-alicante',
  benidorm: 'benidorm-alicante',
  marbella: 'marbella-malaga',
  palma: 'palma-de-mallorca-baleares',
};

function getCitySlug(city: string): string | null {
  const key = city
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return CITY_SLUGS[key] || null;
}

const PROPERTY_TYPE_SEGMENTS: Record<string, { sale: string; rent: string }> = {
  vivienda: { sale: 'venta-viviendas', rent: 'alquiler-viviendas' },
  local: { sale: 'venta-locales', rent: 'alquiler-locales' },
  local_comercial: { sale: 'venta-locales', rent: 'alquiler-locales' },
  oficina: { sale: 'venta-oficinas', rent: 'alquiler-oficinas' },
  nave_industrial: { sale: 'venta-naves', rent: 'alquiler-naves' },
  nave: { sale: 'venta-naves', rent: 'alquiler-naves' },
  garaje: { sale: 'venta-garajes', rent: 'alquiler-garajes' },
  trastero: { sale: 'venta-trasteros', rent: 'alquiler-trasteros' },
  terreno: { sale: 'venta-terrenos', rent: 'venta-terrenos' },
  edificio: { sale: 'venta-edificios', rent: 'venta-edificios' },
  coworking: { sale: 'venta-oficinas', rent: 'alquiler-oficinas' },
};

function buildSearchUrl(
  city: string,
  operation: 'sale' | 'rent',
  postalCode?: string,
  propertyType?: string
): string | null {
  const slug = getCitySlug(city);
  if (!slug) return null;

  const segments =
    PROPERTY_TYPE_SEGMENTS[propertyType || 'vivienda'] || PROPERTY_TYPE_SEGMENTS.vivienda;
  const op = operation === 'sale' ? segments.sale : segments.rent;

  if (postalCode) {
    return `${BASE_URL}/${op}/${slug}/?codigoPostal=${postalCode}`;
  }
  return `${BASE_URL}/${op}/${slug}/`;
}

function parseListingCard($: cheerio.CheerioAPI, el: cheerio.Element): ScrapedListing | null {
  try {
    const $el = $(el);

    const titleEl = $el.find('.item-link');
    const title = titleEl.text().trim();
    const href = titleEl.attr('href');
    const url = href ? `${BASE_URL}${href}` : '';

    const priceText = $el.find('.item-price, .price-row span').first().text().trim();
    const price = parseSpanishPrice(priceText);

    const detailItems = $el.find('.item-detail span');
    let squareMeters: number | null = null;
    let rooms: number | null = null;
    let floor: string | null = null;

    detailItems.each((_, detEl) => {
      const text = $(detEl).text().trim();
      if (text.includes('m²') || text.includes('m2')) {
        squareMeters = parseSquareMeters(text);
      } else if (text.includes('hab') || text.includes('dorm')) {
        const match = text.match(/(\d+)/);
        if (match) rooms = parseInt(match[1]);
      } else if (text.includes('planta') || text.includes('Bajo') || text.includes('Ático')) {
        floor = text;
      }
    });

    const pricePerM2 =
      price && squareMeters && squareMeters > 0 ? Math.round(price / squareMeters) : null;

    const address =
      $el.find('.item-detail-char .item-description, .item-location').text().trim() || title;
    const neighborhood = $el.find('.item-detail-char .item-description').text().trim() || null;
    const imageUrl =
      $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src') || null;

    if (!price && !squareMeters) return null;

    return {
      title,
      price,
      pricePerM2,
      squareMeters,
      rooms,
      bathrooms: null,
      floor,
      address,
      neighborhood,
      url,
      imageUrl,
      description: null,
      source: 'idealista',
    };
  } catch {
    return null;
  }
}

export async function scrapeIdealista(
  city: string,
  operation: 'sale' | 'rent' = 'sale',
  postalCode?: string,
  propertyType?: string
): Promise<ScrapedMarketSummary | null> {
  const pType = propertyType || 'vivienda';
  const cacheKey = buildCacheKey('idealista', city, `${operation}-${pType}`, postalCode);

  const cached = await getCachedData<ScrapedMarketSummary>(cacheKey);
  if (cached) return cached;

  const url = buildSearchUrl(city, operation, postalCode, pType);
  if (!url) {
    logger.warn(`[Idealista] Ciudad no soportada: ${city}`);
    return null;
  }

  try {
    logger.info(`[Idealista] Scraping ${operation} en ${city}...`);

    const html = await fetchWithRetry(url, {
      referer: `${BASE_URL}/`,
      extraHeaders: {
        'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
      },
    });

    const $ = cheerio.load(html);

    const listings: ScrapedListing[] = [];

    // Selectores principales de cards de Idealista
    $('article.item, .item-multimedia-container').each((_, el) => {
      const listing = parseListingCard($, el);
      if (listing) listings.push(listing);
    });

    // Selector alternativo si la estructura cambió
    if (listings.length === 0) {
      $('.listing-item, .item_contains').each((_, el) => {
        const listing = parseListingCard($, el);
        if (listing) listings.push(listing);
      });
    }

    // Intentar extraer datos del JSON-LD si hay
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const jsonText = $(el).html();
        if (!jsonText) return;
        const json = JSON.parse(jsonText);
        if (json['@type'] === 'ItemList' && json.itemListElement) {
          for (const item of json.itemListElement) {
            if (item.item?.offers?.price) {
              const existingUrls = new Set(listings.map((l) => l.url));
              const itemUrl = item.item.url || '';
              if (!existingUrls.has(itemUrl)) {
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
                  url: itemUrl,
                  imageUrl: item.item.image || null,
                  description: item.item.description || null,
                  source: 'idealista',
                });
              }
            }
          }
        }
      } catch {
        // JSON-LD parsing fallido, ignorar
      }
    });

    if (listings.length === 0) {
      logger.warn(`[Idealista] 0 listings encontrados para ${city}. Posible bloqueo anti-bot.`);
      return null;
    }

    logger.info(`[Idealista] ${listings.length} listings extraídos de ${city}`);

    const summary = calculateSummary(listings, 'idealista', city, operation, postalCode);
    await setCachedData(cacheKey, summary, 24 * 60 * 60);

    return summary;
  } catch (error: any) {
    logger.error(`[Idealista] Error scraping ${city}:`, error.message);
    return null;
  }
}
