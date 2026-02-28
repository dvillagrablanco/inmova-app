/**
 * SCRAPER DE HABITACLIA
 *
 * Fuerte en Cataluña y Levante. Estructura HTML más simple que Idealista.
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

const BASE_URL = 'https://www.habitaclia.com';

const CITY_SLUGS: Record<string, string> = {
  madrid: 'madrid',
  barcelona: 'barcelona',
  valencia: 'valencia',
  sevilla: 'sevilla',
  malaga: 'malaga',
  bilbao: 'bilbao',
  zaragoza: 'zaragoza',
  palencia: 'palencia',
  valladolid: 'valladolid',
  alicante: 'alicante',
  benidorm: 'benidorm',
  marbella: 'marbella',
  girona: 'girona',
  tarragona: 'tarragona',
  lleida: 'lleida',
  terrassa: 'terrassa',
  sabadell: 'sabadell',
  hospitalet: 'hospitalet_de_llobregat',
};

function getCitySlug(city: string): string | null {
  const key = city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return CITY_SLUGS[key] || null;
}

function buildSearchUrl(city: string, operation: 'sale' | 'rent'): string | null {
  const slug = getCitySlug(city);
  if (!slug) return null;
  const op = operation === 'sale' ? 'comprar' : 'alquiler';
  return `${BASE_URL}/${op}-vivienda-en-${slug}.htm`;
}

export async function scrapeHabitaclia(
  city: string,
  operation: 'sale' | 'rent' = 'sale',
  postalCode?: string,
): Promise<ScrapedMarketSummary | null> {
  const cacheKey = buildCacheKey('habitaclia', city, operation, postalCode);

  const cached = await getCachedData<ScrapedMarketSummary>(cacheKey);
  if (cached) return cached;

  const url = buildSearchUrl(city, operation);
  if (!url) {
    logger.warn(`[Habitaclia] Ciudad no soportada: ${city}`);
    return null;
  }

  try {
    logger.info(`[Habitaclia] Scraping ${operation} en ${city}...`);

    const html = await fetchWithRetry(url, {
      referer: `${BASE_URL}/`,
    });

    const $ = cheerio.load(html);
    const listings: ScrapedListing[] = [];

    // Habitaclia usa cards con clase .list-item o .pjax-item
    $('.list-item, .js-list-item, article[class*="list"]').each((_, el) => {
      try {
        const $el = $(el);

        const titleEl = $el.find('a.title, a[class*="title"], h3 a').first();
        const title = titleEl.text().trim();
        const href = titleEl.attr('href');
        const itemUrl = href
          ? href.startsWith('http') ? href : `${BASE_URL}${href}`
          : '';

        const priceText = $el.find('.price, [class*="price"]').first().text().trim();
        const price = parseSpanishPrice(priceText);

        let squareMeters: number | null = null;
        let rooms: number | null = null;
        let bathrooms: number | null = null;

        $el.find('.feature, [class*="feature"] span, .list-item-feature').each((_, feat) => {
          const text = $(feat).text().trim();
          if (text.includes('m²') || text.includes('m2')) {
            const m = text.match(/([\d.,]+)/);
            if (m) squareMeters = parseFloat(m[1].replace('.', '').replace(',', '.'));
          } else if (text.includes('hab')) {
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
          source: 'habitaclia',
        });
      } catch {
        // Ignorar card
      }
    });

    // Intentar JSON-LD
    if (listings.length === 0) {
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const json = JSON.parse($(el).html() || '');
          if (json['@type'] === 'ItemList' && json.itemListElement) {
            for (const item of json.itemListElement) {
              if (item.item?.offers?.price) {
                listings.push({
                  title: item.item.name || '',
                  price: parseFloat(item.item.offers.price) || null,
                  pricePerM2: null,
                  squareMeters: null,
                  rooms: null,
                  bathrooms: null,
                  floor: null,
                  address: item.item.name || '',
                  neighborhood: null,
                  url: item.item.url || '',
                  imageUrl: null,
                  description: null,
                  source: 'habitaclia',
                });
              }
            }
          }
        } catch {
          // Ignorar
        }
      });
    }

    if (listings.length === 0) {
      logger.warn(`[Habitaclia] 0 listings para ${city}`);
      return null;
    }

    logger.info(`[Habitaclia] ${listings.length} listings extraídos de ${city}`);

    const summary = calculateSummary(listings, 'habitaclia', city, operation, postalCode);
    await setCachedData(cacheKey, summary, 24 * 60 * 60);

    return summary;
  } catch (error: any) {
    logger.error(`[Habitaclia] Error scraping ${city}:`, error.message);
    return null;
  }
}
