/**
 * SCRAPER DE FOTOCASA
 *
 * Extrae listings de fotocasa.es. Fotocasa renderiza contenido
 * en parte con JS, pero los datos principales del listado están
 * disponibles en el HTML inicial y en JSON embebido (__NEXT_DATA__).
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

const BASE_URL = 'https://www.fotocasa.es';

const CITY_SLUGS: Record<string, string> = {
  madrid: 'madrid-capital/todas-las-zonas/l',
  barcelona: 'barcelona-capital/todas-las-zonas/l',
  valencia: 'valencia-capital/todas-las-zonas/l',
  sevilla: 'sevilla-capital/todas-las-zonas/l',
  malaga: 'malaga-capital/todas-las-zonas/l',
  bilbao: 'bilbao/todas-las-zonas/l',
  zaragoza: 'zaragoza-capital/todas-las-zonas/l',
  palencia: 'palencia-capital/todas-las-zonas/l',
  valladolid: 'valladolid-capital/todas-las-zonas/l',
  alicante: 'alicante-alacant-capital/todas-las-zonas/l',
  benidorm: 'benidorm/todas-las-zonas/l',
  marbella: 'marbella/todas-las-zonas/l',
};

function getCitySlug(city: string): string | null {
  const key = city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return CITY_SLUGS[key] || null;
}

function buildSearchUrl(city: string, operation: 'sale' | 'rent'): string | null {
  const slug = getCitySlug(city);
  if (!slug) return null;
  const op = operation === 'sale' ? 'comprar' : 'alquiler';
  return `${BASE_URL}/${op}/viviendas/${slug}`;
}

function extractFromNextData(html: string): ScrapedListing[] {
  const listings: ScrapedListing[] = [];

  try {
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!match) return listings;

    const nextData = JSON.parse(match[1]);
    const realEstates =
      nextData?.props?.pageProps?.initialProps?.searchResult?.realEstates ||
      nextData?.props?.pageProps?.searchResult?.realEstates ||
      [];

    for (const re of realEstates) {
      const price = re.price?.amount || re.priceInfo?.amount || null;
      const surface = re.surface || re.features?.find((f: any) => f.key === 'surface')?.value || null;
      const rooms = re.rooms || re.features?.find((f: any) => f.key === 'rooms')?.value || null;
      const bathrooms = re.bathrooms || null;

      listings.push({
        title: re.title || re.suggestedTexts?.title || '',
        price,
        pricePerM2: price && surface ? Math.round(price / surface) : null,
        squareMeters: surface,
        rooms,
        bathrooms,
        floor: re.floor || null,
        address: re.address || re.suggestedTexts?.subtitle || '',
        neighborhood: re.neighborhood || null,
        url: re.detail?.url ? `${BASE_URL}${re.detail.url}` : '',
        imageUrl: re.multimedia?.images?.[0]?.url || null,
        description: re.description || null,
        source: 'fotocasa',
      });
    }
  } catch (error) {
    logger.debug('[Fotocasa] No se pudo extraer __NEXT_DATA__');
  }

  return listings;
}

function parseListingCards($: cheerio.CheerioAPI): ScrapedListing[] {
  const listings: ScrapedListing[] = [];

  $('[class*="re-Card"], [data-testid="listing-card"]').each((_, el) => {
    try {
      const $el = $(el);

      const title = $el.find('[class*="re-CardTitle"], [class*="title"]').first().text().trim();
      const href = $el.find('a[href*="/vivienda/"]').first().attr('href') || $el.find('a').first().attr('href');
      const url = href ? (href.startsWith('http') ? href : `${BASE_URL}${href}`) : '';

      const priceText = $el.find('[class*="re-CardPrice"], [class*="price"]').first().text().trim();
      const price = parseSpanishPrice(priceText);

      const features = $el.find('[class*="re-CardFeatures"] li, [class*="feature"]');
      let squareMeters: number | null = null;
      let rooms: number | null = null;
      let bathrooms: number | null = null;

      features.each((_, feat) => {
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
        url,
        imageUrl: $el.find('img').first().attr('src') || null,
        description: null,
        source: 'fotocasa',
      });
    } catch {
      // Ignorar cards que no se pueden parsear
    }
  });

  return listings;
}

export async function scrapeFotocasa(
  city: string,
  operation: 'sale' | 'rent' = 'sale',
  postalCode?: string,
): Promise<ScrapedMarketSummary | null> {
  const cacheKey = buildCacheKey('fotocasa', city, operation, postalCode);

  const cached = await getCachedData<ScrapedMarketSummary>(cacheKey);
  if (cached) return cached;

  const url = buildSearchUrl(city, operation);
  if (!url) {
    logger.warn(`[Fotocasa] Ciudad no soportada: ${city}`);
    return null;
  }

  try {
    logger.info(`[Fotocasa] Scraping ${operation} en ${city}...`);

    const html = await fetchWithRetry(url, {
      referer: `${BASE_URL}/`,
    });

    // Primero intentar __NEXT_DATA__ (más fiable)
    let listings = extractFromNextData(html);

    // Si no hay datos en __NEXT_DATA__, parsear HTML
    if (listings.length === 0) {
      const $ = cheerio.load(html);
      listings = parseListingCards($);
    }

    if (listings.length === 0) {
      logger.warn(`[Fotocasa] 0 listings para ${city}`);
      return null;
    }

    logger.info(`[Fotocasa] ${listings.length} listings extraídos de ${city}`);

    const summary = calculateSummary(listings, 'fotocasa', city, operation, postalCode);
    await setCachedData(cacheKey, summary, 24 * 60 * 60);

    return summary;
  } catch (error: any) {
    logger.error(`[Fotocasa] Error scraping ${city}:`, error.message);
    return null;
  }
}
