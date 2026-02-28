/**
 * SCRAPER DE PISOS.COM
 *
 * Portal generalista con buena cobertura nacional.
 * Estructura HTML relativamente estable.
 */

import * as cheerio from 'cheerio';
import logger from '@/lib/logger';
import {
  fetchWithRetry,
  parseSpanishPrice,
  getCachedData,
  setCachedData,
  buildCacheKey,
  calculateSummary,
  type ScrapedListing,
  type ScrapedMarketSummary,
} from './scraping-base';

const BASE_URL = 'https://www.pisos.com';

const CITY_SLUGS: Record<string, string> = {
  madrid: 'madrid/madrid-capital',
  barcelona: 'barcelona/barcelona-capital',
  valencia: 'valencia/valencia-capital',
  sevilla: 'sevilla/sevilla-capital',
  malaga: 'malaga/malaga-capital',
  bilbao: 'vizcaya/bilbao',
  zaragoza: 'zaragoza/zaragoza-capital',
  palencia: 'palencia/palencia-capital',
  valladolid: 'valladolid/valladolid-capital',
  alicante: 'alicante/alicante-capital',
  benidorm: 'alicante/benidorm',
  marbella: 'malaga/marbella',
};

function getCitySlug(city: string): string | null {
  const key = city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return CITY_SLUGS[key] || null;
}

function buildSearchUrl(city: string, operation: 'sale' | 'rent'): string | null {
  const slug = getCitySlug(city);
  if (!slug) return null;
  const op = operation === 'sale' ? 'venta' : 'alquiler';
  return `${BASE_URL}/${op}/pisos-${slug}/`;
}

export async function scrapePisosCom(
  city: string,
  operation: 'sale' | 'rent' = 'sale',
  postalCode?: string,
): Promise<ScrapedMarketSummary | null> {
  const cacheKey = buildCacheKey('pisos_com', city, operation, postalCode);

  const cached = await getCachedData<ScrapedMarketSummary>(cacheKey);
  if (cached) return cached;

  const url = buildSearchUrl(city, operation);
  if (!url) {
    logger.warn(`[Pisos.com] Ciudad no soportada: ${city}`);
    return null;
  }

  try {
    logger.info(`[Pisos.com] Scraping ${operation} en ${city}...`);

    const html = await fetchWithRetry(url, {
      referer: `${BASE_URL}/`,
    });

    const $ = cheerio.load(html);
    const listings: ScrapedListing[] = [];

    // Pisos.com usa .ad-preview como contenedor de cada anuncio
    $('.ad-preview, .listing-item, [class*="ad-card"]').each((_, el) => {
      try {
        const $el = $(el);

        const titleEl = $el.find('a.ad-preview__title, a[class*="title"]').first();
        const title = titleEl.text().trim();
        const href = titleEl.attr('href');
        const itemUrl = href
          ? href.startsWith('http') ? href : `${BASE_URL}${href}`
          : '';

        const priceText = $el.find('.ad-preview__price, [class*="price"]').first().text().trim();
        const price = parseSpanishPrice(priceText);

        let squareMeters: number | null = null;
        let rooms: number | null = null;
        let bathrooms: number | null = null;

        $el.find('.ad-preview__char span, [class*="feature"], [class*="char"]').each((_, feat) => {
          const text = $(feat).text().trim();
          if (text.includes('m²') || text.includes('m2')) {
            const m = text.match(/([\d.,]+)/);
            if (m) squareMeters = parseFloat(m[1].replace('.', '').replace(',', '.'));
          } else if (text.includes('hab') || text.includes('dorm')) {
            const m = text.match(/(\d+)/);
            if (m) rooms = parseInt(m[1]);
          } else if (text.includes('baño')) {
            const m = text.match(/(\d+)/);
            if (m) bathrooms = parseInt(m[1]);
          }
        });

        if (!price && !squareMeters) return;

        listings.push({
          title,
          price,
          pricePerM2: price && squareMeters && squareMeters > 0 ? Math.round(price / squareMeters) : null,
          squareMeters,
          rooms,
          bathrooms,
          floor: null,
          address: title,
          neighborhood: null,
          url: itemUrl,
          imageUrl: $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src') || null,
          description: null,
          source: 'pisos_com',
        });
      } catch {
        // Ignorar card
      }
    });

    // JSON-LD fallback
    if (listings.length === 0) {
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const json = JSON.parse($(el).html() || '');
          const items = json.itemListElement || (json['@graph'] || []).filter((n: any) => n['@type'] === 'RealEstateListing');
          for (const item of items) {
            const offer = item.item || item;
            if (offer.offers?.price || offer.price) {
              listings.push({
                title: offer.name || '',
                price: parseFloat(offer.offers?.price || offer.price) || null,
                pricePerM2: null,
                squareMeters: offer.floorSize?.value ? parseFloat(offer.floorSize.value) : null,
                rooms: offer.numberOfRooms || null,
                bathrooms: null,
                floor: null,
                address: offer.name || offer.address?.streetAddress || '',
                neighborhood: null,
                url: offer.url || '',
                imageUrl: null,
                description: null,
                source: 'pisos_com',
              });
            }
          }
        } catch {
          // Ignorar
        }
      });
    }

    if (listings.length === 0) {
      logger.warn(`[Pisos.com] 0 listings para ${city}`);
      return null;
    }

    logger.info(`[Pisos.com] ${listings.length} listings extraídos de ${city}`);

    const summary = calculateSummary(listings, 'pisos_com', city, operation, postalCode);
    await setCachedData(cacheKey, summary, 24 * 60 * 60);

    return summary;
  } catch (error: any) {
    logger.error(`[Pisos.com] Error scraping ${city}:`, error.message);
    return null;
  }
}
