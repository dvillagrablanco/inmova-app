/**
 * INFRAESTRUCTURA BASE DE WEB SCRAPING
 *
 * Componentes compartidos por todos los scrapers de portales inmobiliarios:
 * - Pool de User-Agents rotativos
 * - Rate limiting por dominio
 * - Cache en Redis con TTL configurable
 * - Retry con backoff exponencial
 * - Logging estructurado
 */

import logger from '@/lib/logger';

// ============================================================================
// USER AGENTS ROTATIVOS
// ============================================================================

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0',
];

export function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// ============================================================================
// RATE LIMITING POR DOMINIO
// ============================================================================

const domainLastRequest = new Map<string, number>();
const DOMAIN_MIN_DELAY_MS: Record<string, number> = {
  'idealista.com': 1500,
  'fotocasa.es': 1500,
  'habitaclia.com': 1500,
  'pisos.com': 1500,
  default: 800,
};

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}

async function waitForRateLimit(url: string): Promise<void> {
  const domain = getDomain(url);
  const minDelay = DOMAIN_MIN_DELAY_MS[domain] || DOMAIN_MIN_DELAY_MS.default;
  const lastReq = domainLastRequest.get(domain) || 0;
  const elapsed = Date.now() - lastReq;

  if (elapsed < minDelay) {
    const waitTime = minDelay - elapsed + Math.random() * 1000;
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  domainLastRequest.set(domain, Date.now());
}

// ============================================================================
// CACHE REDIS PARA SCRAPING
// ============================================================================

let redisClient: any = null;

async function getRedis() {
  if (redisClient) return redisClient;
  try {
    if (process.env.UPSTASH_REDIS_REST_URL) {
      const { Redis } = await import('@upstash/redis');
      redisClient = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });
      return redisClient;
    }
  } catch {
    // Redis no disponible, cache deshabilitado
  }
  return null;
}

const SCRAPING_CACHE_PREFIX = 'scraping:';
const DEFAULT_CACHE_TTL = 24 * 60 * 60; // 24 horas

export async function getCachedData<T>(key: string): Promise<T | null> {
  const redis = await getRedis();
  if (!redis) return null;

  try {
    const data = await redis.get(`${SCRAPING_CACHE_PREFIX}${key}`);
    if (data) {
      logger.debug(`[Scraping Cache] HIT: ${key}`);
      return typeof data === 'string' ? JSON.parse(data) : data;
    }
  } catch (error) {
    logger.warn('[Scraping Cache] Error reading:', error);
  }
  return null;
}

export async function setCachedData<T>(
  key: string,
  data: T,
  ttlSeconds: number = DEFAULT_CACHE_TTL,
): Promise<void> {
  const redis = await getRedis();
  if (!redis) return;

  try {
    await redis.setex(
      `${SCRAPING_CACHE_PREFIX}${key}`,
      ttlSeconds,
      JSON.stringify(data),
    );
    logger.debug(`[Scraping Cache] SET: ${key} (TTL: ${ttlSeconds}s)`);
  } catch (error) {
    logger.warn('[Scraping Cache] Error writing:', error);
  }
}

// ============================================================================
// FETCH CON RETRY, RATE LIMIT Y HEADERS
// ============================================================================

interface FetchOptions {
  maxRetries?: number;
  timeoutMs?: number;
  extraHeaders?: Record<string, string>;
  referer?: string;
}

export async function fetchWithRetry(
  url: string,
  options: FetchOptions = {},
): Promise<string> {
  const { maxRetries = 1, timeoutMs = 8000, extraHeaders = {}, referer } = options;

  await waitForRateLimit(url);

  const headers: Record<string, string> = {
    'User-Agent': getRandomUserAgent(),
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Upgrade-Insecure-Requests': '1',
    ...(referer && { Referer: referer }),
    ...extraHeaders,
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        headers,
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timeout);

      if (response.status === 403 || response.status === 429) {
        logger.warn(`[Scraping] ${response.status} en ${getDomain(url)}, reintento ${attempt + 1}`);
        if (attempt < maxRetries) {
          // Delay suave: 1.5s + 1.5s = max 3s entre 2 reintentos. Con DataDome
          // los portales devuelven 403 sistemáticamente: no merece la pena
          // esperar más; el pipeline tiene fallbacks (datos estáticos, Notariado).
          await new Promise((r) => setTimeout(r, (attempt + 1) * 1500 + Math.random() * 500));
          continue;
        }
        throw new Error(`Bloqueado (${response.status}) por ${getDomain(url)}`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} en ${url}`);
      }

      return await response.text();
    } catch (error: any) {
      lastError = error;
      if (error.name === 'AbortError') {
        logger.warn(`[Scraping] Timeout en ${getDomain(url)}, intento ${attempt + 1}`);
      }
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, (attempt + 1) * 1000));
      }
    }
  }

  throw lastError || new Error(`Failed to fetch ${url}`);
}

// ============================================================================
// UTILIDADES DE PARSING
// ============================================================================

export function parseSpanishPrice(text: string): number | null {
  if (!text) return null;
  // "350.000 €" → 350000, "1.200 €/mes" → 1200, "3.500€/m²" → 3500
  const cleaned = text
    .replace(/[€\s]/g, '')
    .replace('/mes', '')
    .replace('/m²', '')
    .replace('/m2', '')
    .trim();

  // Formato español: 350.000 (puntos como separador de miles)
  const withoutThousandsSep = cleaned.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(withoutThousandsSep);
  return isNaN(num) ? null : num;
}

export function parseSquareMeters(text: string): number | null {
  if (!text) return null;
  const match = text.match(/([\d.,]+)\s*m[²2]/);
  if (!match) return null;
  return parseFloat(match[1].replace('.', '').replace(',', '.')) || null;
}

export function parseRooms(text: string): number | null {
  if (!text) return null;
  const match = text.match(/(\d+)\s*(?:hab|dorm|room)/i);
  return match ? parseInt(match[1]) : null;
}

export function parseBathrooms(text: string): number | null {
  if (!text) return null;
  const match = text.match(/(\d+)\s*(?:baño|bath)/i);
  return match ? parseInt(match[1]) : null;
}

export function buildCacheKey(
  portal: string,
  city: string,
  operation: string,
  postalCode?: string,
): string {
  const parts = [portal, city.toLowerCase().replace(/\s+/g, '-'), operation];
  if (postalCode) parts.push(postalCode);
  return parts.join(':');
}

// ============================================================================
// TIPOS COMPARTIDOS
// ============================================================================

export interface ScrapedListing {
  title: string;
  price: number | null;
  pricePerM2: number | null;
  squareMeters: number | null;
  rooms: number | null;
  bathrooms: number | null;
  floor: string | null;
  address: string;
  neighborhood: string | null;
  url: string;
  imageUrl: string | null;
  description: string | null;
  source: string;
}

export interface ScrapedMarketSummary {
  source: string;
  city: string;
  postalCode?: string;
  operation: 'sale' | 'rent';
  totalListings: number;
  avgPricePerM2: number | null;
  medianPricePerM2: number | null;
  minPricePerM2: number | null;
  maxPricePerM2: number | null;
  avgPrice: number | null;
  listings: ScrapedListing[];
  scrapedAt: string;
}

export function calculateSummary(
  listings: ScrapedListing[],
  source: string,
  city: string,
  operation: 'sale' | 'rent',
  postalCode?: string,
): ScrapedMarketSummary {
  const withPricePerM2 = listings.filter(
    (l) => l.pricePerM2 && l.pricePerM2 > 0,
  );
  const prices = withPricePerM2.map((l) => l.pricePerM2!).sort((a, b) => a - b);
  const allPrices = listings.filter((l) => l.price && l.price > 0).map((l) => l.price!);

  return {
    source,
    city,
    postalCode,
    operation,
    totalListings: listings.length,
    avgPricePerM2:
      prices.length > 0
        ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
        : null,
    medianPricePerM2:
      prices.length > 0
        ? Math.round(prices[Math.floor(prices.length / 2)])
        : null,
    minPricePerM2: prices.length > 0 ? Math.round(prices[0]) : null,
    maxPricePerM2:
      prices.length > 0 ? Math.round(prices[prices.length - 1]) : null,
    avgPrice:
      allPrices.length > 0
        ? Math.round(allPrices.reduce((a, b) => a + b, 0) / allPrices.length)
        : null,
    listings,
    scrapedAt: new Date().toISOString(),
  };
}
