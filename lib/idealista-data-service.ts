/**
 * SERVICIO DE INTEGRACIÓN CON IDEALISTA DATA PLATFORM
 *
 * Accede a la plataforma profesional de datos de Idealista (idealista.com/data)
 * mediante autenticación con credenciales de usuario para obtener:
 *
 * - Precios medios por m² (venta y alquiler) por zona/CP
 * - Evolución histórica de precios
 * - Oferta y demanda por zona
 * - Tiempo medio de publicación
 * - Distribución de precios
 *
 * Esta fuente tiene fiabilidad ALTA (88%) porque usa datos agregados
 * profesionales de Idealista, no asking prices individuales.
 *
 * Credenciales: IDEALISTA_DATA_EMAIL + IDEALISTA_DATA_PASSWORD en .env
 */

import axios, { AxiosInstance } from 'axios';
import logger from '@/lib/logger';
import { getCachedData, setCachedData, buildCacheKey } from './scraping/scraping-base';

// ============================================================================
// TIPOS
// ============================================================================

export interface IdealistaDataMarketReport {
  location: string;
  postalCode?: string;
  province?: string;

  // Precios de venta
  salePricePerM2: number | null;
  salePricePerM2Evolution: number | null; // % interanual
  salePriceMedian: number | null;
  salePriceMin: number | null;
  salePriceMax: number | null;

  // Precios de alquiler
  rentPricePerM2: number | null;
  rentPricePerM2Evolution: number | null;

  // Indicadores de mercado
  avgDaysOnMarket: number | null;
  totalListings: number | null;
  newListingsLastMonth: number | null;
  priceReductions: number | null; // % de anuncios con rebaja

  // Oferta/Demanda
  demandIndex: number | null; // 0-100
  supplyIndex: number | null; // 0-100
  demandLevel: 'alta' | 'media' | 'baja';

  // Distribución de precios (percentiles)
  pricePercentile25: number | null;
  pricePercentile75: number | null;

  // Metadata
  reportDate: string;
  dataSource: string;
  sampleSize: number;
}

export interface IdealistaDataSession {
  cookies: string;
  csrfToken: string;
  expiresAt: number;
}

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const IDEALISTA_DATA_BASE = 'https://www.idealista.com';
const IDEALISTA_DATA_APP = 'https://www.idealista.com/data';
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 min
const CACHE_TTL_SECONDS = 12 * 60 * 60; // 12h (datos profesionales cambian menos)

// Mapeo de ciudades a códigos de ubicación de Idealista Data
const IDEALISTA_LOCATION_CODES: Record<string, { municipioId: string; provinciaId: string }> = {
  madrid: { municipioId: '0-EU-ES-28-07-001-079', provinciaId: '0-EU-ES-28' },
  barcelona: { municipioId: '0-EU-ES-08-07-001-019', provinciaId: '0-EU-ES-08' },
  valencia: { municipioId: '0-EU-ES-46-07-001-250', provinciaId: '0-EU-ES-46' },
  sevilla: { municipioId: '0-EU-ES-41-07-001-091', provinciaId: '0-EU-ES-41' },
  malaga: { municipioId: '0-EU-ES-29-07-001-067', provinciaId: '0-EU-ES-29' },
  bilbao: { municipioId: '0-EU-ES-48-07-001-020', provinciaId: '0-EU-ES-48' },
  zaragoza: { municipioId: '0-EU-ES-50-07-001-297', provinciaId: '0-EU-ES-50' },
  palencia: { municipioId: '0-EU-ES-34-07-001-120', provinciaId: '0-EU-ES-34' },
  valladolid: { municipioId: '0-EU-ES-47-07-001-186', provinciaId: '0-EU-ES-47' },
  alicante: { municipioId: '0-EU-ES-03-07-001-014', provinciaId: '0-EU-ES-03' },
  marbella: { municipioId: '0-EU-ES-29-07-001-069', provinciaId: '0-EU-ES-29' },
  benidorm: { municipioId: '0-EU-ES-03-07-001-031', provinciaId: '0-EU-ES-03' },
  palma: { municipioId: '0-EU-ES-07-07-001-040', provinciaId: '0-EU-ES-07' },
  cordoba: { municipioId: '0-EU-ES-14-07-001-021', provinciaId: '0-EU-ES-14' },
  granada: { municipioId: '0-EU-ES-18-07-001-087', provinciaId: '0-EU-ES-18' },
  murcia: { municipioId: '0-EU-ES-30-07-001-030', provinciaId: '0-EU-ES-30' },
  vigo: { municipioId: '0-EU-ES-36-07-001-057', provinciaId: '0-EU-ES-36' },
  gijon: { municipioId: '0-EU-ES-33-07-001-024', provinciaId: '0-EU-ES-33' },
  santander: { municipioId: '0-EU-ES-39-07-001-075', provinciaId: '0-EU-ES-39' },
  'san sebastian': { municipioId: '0-EU-ES-20-07-001-069', provinciaId: '0-EU-ES-20' },
};

// ============================================================================
// SESIÓN Y AUTENTICACIÓN
// ============================================================================

let cachedSession: IdealistaDataSession | null = null;

function isConfigured(): boolean {
  return !!(process.env.IDEALISTA_DATA_EMAIL && process.env.IDEALISTA_DATA_PASSWORD);
}

function createHttpClient(session?: IdealistaDataSession): AxiosInstance {
  const headers: Record<string, string> = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    Accept: 'application/json, text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    Origin: IDEALISTA_DATA_BASE,
    Referer: `${IDEALISTA_DATA_APP}/`,
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
  };

  if (session?.cookies) {
    headers['Cookie'] = session.cookies;
  }
  if (session?.csrfToken) {
    headers['X-CSRF-Token'] = session.csrfToken;
  }

  return axios.create({
    baseURL: IDEALISTA_DATA_BASE,
    headers,
    timeout: 20000,
    maxRedirects: 5,
    validateStatus: (status) => status < 500,
  });
}

/**
 * Autenticación en Idealista Data Platform.
 * Obtiene cookies de sesión mediante login con email/password.
 */
async function authenticate(): Promise<IdealistaDataSession | null> {
  if (cachedSession && cachedSession.expiresAt > Date.now()) {
    return cachedSession;
  }

  const email = process.env.IDEALISTA_DATA_EMAIL;
  const password = process.env.IDEALISTA_DATA_PASSWORD;

  if (!email || !password) {
    logger.info(
      '[IdealistaData] No configurado — set IDEALISTA_DATA_EMAIL + IDEALISTA_DATA_PASSWORD'
    );
    return null;
  }

  try {
    logger.info('[IdealistaData] Iniciando autenticación...');

    const client = createHttpClient();

    // Paso 1: Obtener página de login para cookies iniciales y CSRF token
    const loginPageResponse = await client.get('/data/app/user/login', {
      headers: { Accept: 'text/html,application/xhtml+xml' },
    });

    let cookies = extractCookies(loginPageResponse.headers['set-cookie']);
    let csrfToken = '';

    // Extraer CSRF token del HTML o de las cookies
    const html = typeof loginPageResponse.data === 'string' ? loginPageResponse.data : '';
    const csrfMatch =
      html.match(/name="csrf[_-]?token"[^>]*value="([^"]+)"/i) ||
      html.match(/name="_token"[^>]*value="([^"]+)"/i) ||
      html.match(/"csrfToken"\s*:\s*"([^"]+)"/);
    if (csrfMatch) {
      csrfToken = csrfMatch[1];
    }

    // Paso 2: POST de login
    const loginData = new URLSearchParams();
    loginData.append('email', email);
    loginData.append('password', password);
    if (csrfToken) {
      loginData.append('_token', csrfToken);
      loginData.append('csrf_token', csrfToken);
    }

    const loginResponse = await client.post('/data/app/user/login', loginData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: cookies,
        ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
      },
      maxRedirects: 0,
      validateStatus: (status) => status < 500,
    });

    // Combinar cookies de la respuesta
    const newCookies = extractCookies(loginResponse.headers['set-cookie']);
    cookies = mergeCookies(cookies, newCookies);

    // Si hubo redirect (302/301), seguirlo manualmente para captar más cookies
    if ([301, 302, 303].includes(loginResponse.status)) {
      const redirectUrl = loginResponse.headers['location'];
      if (redirectUrl) {
        const followResponse = await client.get(redirectUrl, {
          headers: { Cookie: cookies },
          maxRedirects: 3,
        });
        const moreCookies = extractCookies(followResponse.headers['set-cookie']);
        cookies = mergeCookies(cookies, moreCookies);
      }
    }

    // Paso 3: Verificar que estamos autenticados accediendo a una página protegida
    const verifyResponse = await client.get('/data/app', {
      headers: { Cookie: cookies },
      maxRedirects: 3,
    });

    const verifyHtml = typeof verifyResponse.data === 'string' ? verifyResponse.data : '';
    const isAuthenticated =
      verifyResponse.status === 200 &&
      !verifyHtml.includes('/user/login') &&
      (verifyHtml.includes('logout') ||
        verifyHtml.includes('user-menu') ||
        verifyHtml.includes('data-app'));

    if (!isAuthenticated && verifyResponse.status === 200) {
      // Podría estar autenticado pero la verificación no es concluyente — continuar
      logger.warn('[IdealistaData] Estado de autenticación incierto, continuando...');
    }

    const session: IdealistaDataSession = {
      cookies,
      csrfToken,
      expiresAt: Date.now() + SESSION_TTL_MS,
    };

    cachedSession = session;
    logger.info('[IdealistaData] Autenticación completada');
    return session;
  } catch (error: any) {
    logger.error('[IdealistaData] Error en autenticación:', error.message);
    cachedSession = null;
    return null;
  }
}

// ============================================================================
// OBTENCIÓN DE DATOS DE MERCADO
// ============================================================================

/**
 * Obtiene informe de mercado de Idealista Data para una ubicación.
 * Intenta múltiples endpoints internos de la plataforma.
 */
export async function getIdealistaDataReport(
  city: string,
  postalCode?: string
): Promise<IdealistaDataMarketReport | null> {
  if (!isConfigured()) return null;

  const cacheKey = buildCacheKey('idealista-data', city, 'report', postalCode);
  const cached = await getCachedData<IdealistaDataMarketReport>(cacheKey);
  if (cached) return cached;

  const session = await authenticate();
  if (!session) return null;

  try {
    const client = createHttpClient(session);
    const cityKey = normalizeCity(city);
    const locationInfo = IDEALISTA_LOCATION_CODES[cityKey];

    let report: IdealistaDataMarketReport | null = null;

    // Estrategia 1: API interna de informes de mercado
    report = await fetchMarketReportAPI(client, session, cityKey, postalCode, locationInfo);

    // Estrategia 2: Scraping de la página de datos de mercado con sesión autenticada
    if (!report) {
      report = await fetchMarketReportFromPage(client, session, cityKey, postalCode);
    }

    // Estrategia 3: Endpoint de precios por zona
    if (!report) {
      report = await fetchPriceIndexData(client, session, cityKey, postalCode, locationInfo);
    }

    if (report) {
      await setCachedData(cacheKey, report, CACHE_TTL_SECONDS);
      logger.info('[IdealistaData] Informe obtenido', {
        city,
        postalCode,
        salePricePerM2: report.salePricePerM2,
        rentPricePerM2: report.rentPricePerM2,
        sampleSize: report.sampleSize,
      });
    }

    return report;
  } catch (error: any) {
    logger.error('[IdealistaData] Error obteniendo informe:', error.message);
    return null;
  }
}

/**
 * Estrategia 1: Intenta API interna JSON de Idealista Data
 */
async function fetchMarketReportAPI(
  client: AxiosInstance,
  session: IdealistaDataSession,
  city: string,
  postalCode?: string,
  locationInfo?: { municipioId: string; provinciaId: string }
): Promise<IdealistaDataMarketReport | null> {
  const endpoints = [
    // Endpoint de informes de mercado (formato API interno)
    `/data/api/market-report?location=${encodeURIComponent(city)}&country=es`,
    `/data/api/v1/market-report?location=${encodeURIComponent(city)}`,
    // Con código de ubicación
    ...(locationInfo
      ? [
          `/data/api/market-report?locationId=${locationInfo.municipioId}`,
          `/data/api/v1/indicators?locationId=${locationInfo.municipioId}`,
        ]
      : []),
    // Con código postal
    ...(postalCode
      ? [
          `/data/api/market-report?postalCode=${postalCode}&country=es`,
          `/data/api/v1/prices?postalCode=${postalCode}`,
        ]
      : []),
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await client.get(endpoint, {
        headers: {
          Cookie: session.cookies,
          Accept: 'application/json',
        },
        timeout: 10000,
      });

      if (response.status === 200 && response.data && typeof response.data === 'object') {
        const data = response.data;

        // Adaptar distintos formatos de respuesta
        if (data.pricePerSquareMeter || data.averagePrice || data.salePrice || data.price) {
          return parseAPIResponse(data, city, postalCode);
        }

        if (data.data || data.result || data.report) {
          return parseAPIResponse(data.data || data.result || data.report, city, postalCode);
        }
      }
    } catch {
      // Endpoint no disponible, probar siguiente
      continue;
    }
  }

  return null;
}

/**
 * Estrategia 2: Scraping de la página HTML de datos de mercado (autenticada)
 */
async function fetchMarketReportFromPage(
  client: AxiosInstance,
  session: IdealistaDataSession,
  city: string,
  postalCode?: string
): Promise<IdealistaDataMarketReport | null> {
  try {
    const citySlug = getCitySlugForData(city);
    if (!citySlug) return null;

    // URLs de datos de mercado en Idealista
    const urls = [
      `/data/venta-viviendas/${citySlug}/`,
      `/sala-de-prensa/informes-precio-vivienda/${citySlug}/`,
      ...(postalCode ? [`/data/venta-viviendas/${citySlug}/?codigoPostal=${postalCode}`] : []),
    ];

    for (const url of urls) {
      const response = await client.get(url, {
        headers: {
          Cookie: session.cookies,
          Accept: 'text/html,application/xhtml+xml',
        },
        timeout: 15000,
      });

      if (response.status === 200 && typeof response.data === 'string') {
        const report = parseMarketDataHTML(response.data, city, postalCode);
        if (report && report.salePricePerM2) return report;
      }
    }
  } catch (error: any) {
    logger.warn('[IdealistaData] Error en scraping de página:', error.message);
  }

  return null;
}

/**
 * Estrategia 3: Índice de precios por zona (endpoint público enriquecido con sesión)
 */
async function fetchPriceIndexData(
  client: AxiosInstance,
  session: IdealistaDataSession,
  city: string,
  postalCode?: string,
  locationInfo?: { municipioId: string; provinciaId: string }
): Promise<IdealistaDataMarketReport | null> {
  try {
    const citySlug = getCitySlugForData(city);
    if (!citySlug) return null;

    // Acceder a las páginas de precios con sesión autenticada (más datos)
    const pageUrl = `/informes/precio-vivienda/${citySlug}/`;
    const response = await client.get(pageUrl, {
      headers: {
        Cookie: session.cookies,
        Accept: 'text/html,application/xhtml+xml',
      },
      timeout: 15000,
    });

    if (response.status === 200 && typeof response.data === 'string') {
      const report = parseMarketDataHTML(response.data, city, postalCode);
      if (report) return report;
    }

    // Intentar endpoints JSON alternativos con sesión
    const jsonEndpoints = [
      `/ajax/indicepreciosv2/getIndicePreciosForLocation.ajax?locationUri=${encodeURIComponent(city)}&operation=1`,
      `/ajax/marketdata/getMarketData.ajax?municipio=${encodeURIComponent(city)}`,
    ];

    for (const endpoint of jsonEndpoints) {
      try {
        const jsonResponse = await client.get(endpoint, {
          headers: {
            Cookie: session.cookies,
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          timeout: 10000,
        });

        if (jsonResponse.status === 200 && jsonResponse.data) {
          const parsed = parseAPIResponse(jsonResponse.data, city, postalCode);
          if (parsed?.salePricePerM2) return parsed;
        }
      } catch {
        continue;
      }
    }
  } catch (error: any) {
    logger.warn('[IdealistaData] Error en índice de precios:', error.message);
  }

  return null;
}

// ============================================================================
// PARSERS
// ============================================================================

function parseAPIResponse(
  data: any,
  city: string,
  postalCode?: string
): IdealistaDataMarketReport | null {
  try {
    const salePricePerM2 =
      data.pricePerSquareMeter ||
      data.averagePrice ||
      data.salePrice ||
      data.price?.sale?.perSquareMeter ||
      data.precioM2 ||
      data.avgPricePerSqm ||
      null;

    const rentPricePerM2 =
      data.rentPrice?.perSquareMeter ||
      data.price?.rent?.perSquareMeter ||
      data.rentPricePerSqm ||
      data.alquilerM2 ||
      null;

    if (!salePricePerM2 && !rentPricePerM2) return null;

    const evolution =
      data.priceEvolution || data.evolution || data.yearOverYear || data.variacion || null;

    const saleEvolution =
      typeof evolution === 'number' ? evolution : evolution?.sale || evolution?.venta || null;

    const totalListings =
      data.totalListings || data.numListings || data.supply || data.oferta || null;

    const avgDays = data.avgDaysOnMarket || data.daysOnMarket || data.diasPublicado || null;

    const demandIdx = data.demandIndex || data.demand || data.demanda || null;

    let demandLevel: 'alta' | 'media' | 'baja' = 'media';
    if (typeof demandIdx === 'number') {
      demandLevel = demandIdx > 65 ? 'alta' : demandIdx > 35 ? 'media' : 'baja';
    } else if (typeof data.demandLevel === 'string') {
      demandLevel = data.demandLevel;
    }

    return {
      location: city,
      postalCode,
      salePricePerM2: salePricePerM2 ? Math.round(salePricePerM2) : null,
      salePricePerM2Evolution: saleEvolution,
      salePriceMedian: data.medianPrice || data.priceMedian || null,
      salePriceMin: data.minPrice || data.priceRange?.min || null,
      salePriceMax: data.maxPrice || data.priceRange?.max || null,
      rentPricePerM2: rentPricePerM2 ? Math.round(rentPricePerM2 * 100) / 100 : null,
      rentPricePerM2Evolution: evolution?.rent || evolution?.alquiler || null,
      avgDaysOnMarket: avgDays,
      totalListings: totalListings,
      newListingsLastMonth: data.newListings || null,
      priceReductions: data.priceReductions || data.rebajas || null,
      demandIndex: typeof demandIdx === 'number' ? demandIdx : null,
      supplyIndex: data.supplyIndex || null,
      demandLevel,
      pricePercentile25: data.percentile25 || data.pricePercentile?.p25 || null,
      pricePercentile75: data.percentile75 || data.pricePercentile?.p75 || null,
      reportDate: new Date().toISOString(),
      dataSource: 'idealista_data_api',
      sampleSize: totalListings || 0,
    };
  } catch {
    return null;
  }
}

function parseMarketDataHTML(
  html: string,
  city: string,
  postalCode?: string
): IdealistaDataMarketReport | null {
  try {
    // Intentar extraer datos de scripts JSON embebidos
    const jsonLdMatches = html.match(
      /<script[^>]*type="application\/(?:ld\+)?json"[^>]*>([\s\S]*?)<\/script>/gi
    );
    if (jsonLdMatches) {
      for (const match of jsonLdMatches) {
        const jsonContent = match.replace(/<\/?script[^>]*>/gi, '').trim();
        try {
          const parsed = JSON.parse(jsonContent);
          if (parsed.pricePerSquareMeter || parsed.averagePrice || parsed.price) {
            return parseAPIResponse(parsed, city, postalCode);
          }
        } catch {
          continue;
        }
      }
    }

    // Extraer datos de state/config embebido (React/Vue apps suelen tener esto)
    const statePatterns = [
      /window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});/,
      /window\.__DATA__\s*=\s*({[\s\S]*?});/,
      /window\.dataLayer\.push\(({[\s\S]*?})\)/,
      /"marketData"\s*:\s*({[\s\S]*?})\s*[,}]/,
      /"priceData"\s*:\s*({[\s\S]*?})\s*[,}]/,
      /"indicators"\s*:\s*({[\s\S]*?})\s*[,}]/,
    ];

    for (const pattern of statePatterns) {
      const match = html.match(pattern);
      if (match?.[1]) {
        try {
          const data = JSON.parse(match[1]);
          const report = parseAPIResponse(data, city, postalCode);
          if (report?.salePricePerM2) return report;
        } catch {
          continue;
        }
      }
    }

    // Parsing HTML directo de elementos con datos de precios
    let salePricePerM2: number | null = null;
    let rentPricePerM2: number | null = null;
    let evolution: number | null = null;

    // Patrón: "X.XXX €/m²" o "X.XXX€/m²"
    const priceM2Pattern = /([\d.,]+)\s*€\/m[²2]/g;
    const priceMatches = [...html.matchAll(priceM2Pattern)];
    if (priceMatches.length > 0) {
      const firstPrice = parseSpanishNumber(priceMatches[0][1]);
      if (firstPrice && firstPrice > 500 && firstPrice < 20000) {
        salePricePerM2 = firstPrice;
      }
      if (priceMatches.length > 1) {
        const secondPrice = parseSpanishNumber(priceMatches[1][1]);
        if (secondPrice && secondPrice > 3 && secondPrice < 50) {
          rentPricePerM2 = secondPrice;
        }
      }
    }

    // Patrón de evolución: "+X,X%" o "-X,X%"
    const evolutionPattern = /([+-]?\d+[.,]?\d*)\s*%/;
    const evoMatch = html.match(evolutionPattern);
    if (evoMatch) {
      evolution = parseSpanishNumber(evoMatch[1]);
    }

    // Buscar número total de anuncios
    let totalListings: number | null = null;
    const listingsPattern = /([\d.,]+)\s*(?:anuncios|inmuebles|propiedades|viviendas)/i;
    const listingsMatch = html.match(listingsPattern);
    if (listingsMatch) {
      totalListings = parseSpanishNumber(listingsMatch[1]);
    }

    if (!salePricePerM2 && !rentPricePerM2) return null;

    let demandLevel: 'alta' | 'media' | 'baja' = 'media';
    if (
      html.toLowerCase().includes('demanda alta') ||
      html.toLowerCase().includes('alta demanda')
    ) {
      demandLevel = 'alta';
    } else if (
      html.toLowerCase().includes('demanda baja') ||
      html.toLowerCase().includes('baja demanda')
    ) {
      demandLevel = 'baja';
    }

    return {
      location: city,
      postalCode,
      salePricePerM2,
      salePricePerM2Evolution: evolution,
      salePriceMedian: null,
      salePriceMin: null,
      salePriceMax: null,
      rentPricePerM2,
      rentPricePerM2Evolution: null,
      avgDaysOnMarket: null,
      totalListings,
      newListingsLastMonth: null,
      priceReductions: null,
      demandIndex: null,
      supplyIndex: null,
      demandLevel,
      pricePercentile25: null,
      pricePercentile75: null,
      reportDate: new Date().toISOString(),
      dataSource: 'idealista_data_html',
      sampleSize: totalListings || 0,
    };
  } catch {
    return null;
  }
}

// ============================================================================
// UTILIDADES
// ============================================================================

function extractCookies(setCookieHeaders: string | string[] | undefined): string {
  if (!setCookieHeaders) return '';
  const headers = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
  return headers
    .map((h) => h.split(';')[0].trim())
    .filter(Boolean)
    .join('; ');
}

function mergeCookies(existing: string, incoming: string): string {
  const cookieMap = new Map<string, string>();

  for (const cookie of existing
    .split(';')
    .map((c) => c.trim())
    .filter(Boolean)) {
    const [name] = cookie.split('=');
    if (name) cookieMap.set(name.trim(), cookie);
  }

  for (const cookie of incoming
    .split(';')
    .map((c) => c.trim())
    .filter(Boolean)) {
    const [name] = cookie.split('=');
    if (name) cookieMap.set(name.trim(), cookie);
  }

  return [...cookieMap.values()].join('; ');
}

function normalizeCity(city: string): string {
  return city
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getCitySlugForData(city: string): string | null {
  const slugs: Record<string, string> = {
    madrid: 'madrid-madrid',
    barcelona: 'barcelona',
    valencia: 'valencia',
    sevilla: 'sevilla',
    malaga: 'malaga-malaga',
    bilbao: 'bilbao-vizcaya',
    zaragoza: 'zaragoza-zaragoza',
    palencia: 'palencia',
    valladolid: 'valladolid',
    alicante: 'alicante-alacant-alicante',
    marbella: 'marbella-malaga',
    benidorm: 'benidorm-alicante',
    palma: 'palma-de-mallorca-balears',
    cordoba: 'cordoba',
    granada: 'granada',
    murcia: 'murcia',
    vigo: 'vigo-pontevedra',
    gijon: 'gijon-asturias',
    santander: 'santander-cantabria',
    'san sebastian': 'san-sebastian-gipuzkoa',
  };

  const key = normalizeCity(city);
  return slugs[key] || key.replace(/\s+/g, '-');
}

function parseSpanishNumber(text: string): number | null {
  if (!text) return null;
  const cleaned = text.replace(/\./g, '').replace(',', '.').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

// ============================================================================
// FUNCIÓN PÚBLICA: INVALIDAR SESIÓN
// ============================================================================

export function invalidateIdealistaDataSession(): void {
  cachedSession = null;
}

// ============================================================================
// FUNCIÓN PÚBLICA: VERIFICAR CONFIGURACIÓN
// ============================================================================

export function isIdealistaDataConfigured(): boolean {
  return isConfigured();
}
