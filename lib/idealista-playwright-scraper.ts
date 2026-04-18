/**
 * SCRAPER IDEALISTA CON PLAYWRIGHT (browser real headless)
 *
 * Por qué Playwright en lugar de axios + cheerio:
 * - Idealista usa DataDome anti-bot que devuelve 773 bytes de captcha a
 *   cualquier request HTTP simple desde IPs de datacenter (Hetzner, AWS, etc.)
 * - Con Playwright + chromium real, el JS del captcha se ejecuta y la
 *   sesión queda válida (en la mayoría de casos).
 * - Soporta login a Idealista Data Platform con credenciales reales.
 *
 * USO:
 *   const data = await getIdealistaPlaywrightReport({
 *     city: 'Palencia',
 *     postalCode: '34001',
 *   });
 *
 * Soporta:
 * - Búsqueda por ciudad/CP
 * - Búsqueda por dirección concreta
 * - Búsqueda por referencia catastral (vía Catastro → coordenadas → Idealista)
 * - Login Idealista Data autenticado para informes profesionales
 *
 * NO bloquea el proceso si Playwright no está disponible o falla:
 * devuelve null y deja que el pipeline use otras fuentes.
 */

import logger from '@/lib/logger';

// Cache: 6 horas para ahorrar tokens (Idealista actualiza precios cada quincena/mes)
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const cache = new Map<string, { value: any; expiresAt: number }>();

function getCached<T>(key: string): T | null {
  const c = cache.get(key);
  if (!c) return null;
  if (c.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return c.value as T;
}

function setCached<T>(key: string, value: T) {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ============================================================================
// MAPEO DE CIUDADES → SLUGS DE IDEALISTA
// ============================================================================

interface IdealistaSearchUrl {
  saleListUrl: string; // /venta-viviendas/{slug}/
  rentListUrl: string; // /alquiler-viviendas/{slug}/
  pressKitSale: string; // /sala-de-prensa/informes-precio-vivienda/venta/...
  pressKitRent: string;
  dataPlatformSale: string;
}

function buildSearchUrls(city: string, postalCode?: string): IdealistaSearchUrl | null {
  const c = city
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  // Mapeo simplificado (extender según necesidades del cliente)
  const slugs: Record<
    string,
    {
      municipio: string;
      provincia: string;
      comunidad: string;
    }
  > = {
    madrid: { municipio: 'madrid-madrid', provincia: 'madrid-provincia', comunidad: 'madrid-comunidad' },
    barcelona: {
      municipio: 'barcelona-barcelona',
      provincia: 'barcelona',
      comunidad: 'catalunya',
    },
    valencia: {
      municipio: 'valencia-valencia',
      provincia: 'valencia',
      comunidad: 'comunitat-valenciana',
    },
    sevilla: { municipio: 'sevilla-sevilla', provincia: 'sevilla-provincia', comunidad: 'andalucia' },
    malaga: { municipio: 'malaga-malaga', provincia: 'malaga', comunidad: 'andalucia' },
    bilbao: { municipio: 'bilbao-vizcaya', provincia: 'vizcaya', comunidad: 'pais-vasco' },
    palencia: {
      municipio: 'palencia-palencia',
      provincia: 'palencia-provincia',
      comunidad: 'castilla-y-leon',
    },
    valladolid: {
      municipio: 'valladolid-valladolid',
      provincia: 'valladolid-provincia',
      comunidad: 'castilla-y-leon',
    },
    zaragoza: {
      municipio: 'zaragoza-zaragoza',
      provincia: 'zaragoza-provincia',
      comunidad: 'aragon',
    },
    marbella: { municipio: 'marbella-malaga', provincia: 'malaga', comunidad: 'andalucia' },
    benidorm: {
      municipio: 'benidorm-alicante',
      provincia: 'alicante',
      comunidad: 'comunitat-valenciana',
    },
    alicante: {
      municipio: 'alicante-alacant-alicante',
      provincia: 'alicante',
      comunidad: 'comunitat-valenciana',
    },
    salamanca: {
      municipio: 'salamanca-salamanca',
      provincia: 'salamanca-provincia',
      comunidad: 'castilla-y-leon',
    },
    burgos: {
      municipio: 'burgos-burgos',
      provincia: 'burgos-provincia',
      comunidad: 'castilla-y-leon',
    },
    leon: { municipio: 'leon-leon', provincia: 'leon-provincia', comunidad: 'castilla-y-leon' },
  };

  const meta = slugs[c];
  if (!meta) return null;

  return {
    saleListUrl: `https://www.idealista.com/venta-viviendas/${meta.municipio}/${
      postalCode ? `?codigoPostal=${postalCode}` : ''
    }`,
    rentListUrl: `https://www.idealista.com/alquiler-viviendas/${meta.municipio}/${
      postalCode ? `?codigoPostal=${postalCode}` : ''
    }`,
    pressKitSale: `https://www.idealista.com/sala-de-prensa/informes-precio-vivienda/venta/${meta.comunidad}/${meta.provincia}/${c}/`,
    pressKitRent: `https://www.idealista.com/sala-de-prensa/informes-precio-vivienda/alquiler/${meta.comunidad}/${meta.provincia}/${c}/`,
    dataPlatformSale: `https://www.idealista.com/data/venta-viviendas/${meta.municipio.replace(
      /-([a-z]+)$/,
      ''
    )}/`,
  };
}

// ============================================================================
// REPORTE FINAL
// ============================================================================

export interface IdealistaPlaywrightReport {
  city: string;
  postalCode?: string;
  // Datos del index público
  pressKit: {
    salePricePerM2: number | null;
    rentPricePerM2: number | null;
    saleAnnualVariation: number | null;
    rentAnnualVariation: number | null;
    fetchedAt: string;
  } | null;
  // Listings agregados (lista pública)
  listings: {
    operation: 'sale' | 'rent';
    averagePricePerM2: number | null;
    medianPricePerM2: number | null;
    sampleSize: number;
    pricesPerM2: number[];
    listingsPreview: Array<{
      title: string;
      price: number;
      squareMeters: number;
      pricePerM2: number;
      rooms?: number;
      url: string;
    }>;
  }[];
  // Idealista Data Platform (autenticado)
  dataPlatform: {
    available: boolean;
    salePricePerM2?: number;
    rentPricePerM2?: number;
    avgDaysOnMarket?: number;
    grossYield?: number;
    totalListings?: number;
    note?: string;
  } | null;
  source: 'playwright_real_browser';
  reliability: number; // 70-95
}

// ============================================================================
// SCRAPER PRINCIPAL
// ============================================================================

let chromiumLazy: any = null;
async function loadChromium() {
  if (chromiumLazy) return chromiumLazy;
  try {
    const { chromium } = await import('playwright');
    chromiumLazy = chromium;
    return chromium;
  } catch (e: any) {
    logger.warn('[IdealistaPlaywright] Playwright no disponible:', e.message);
    return null;
  }
}

export interface IdealistaScrapeOptions {
  city: string;
  postalCode?: string;
  address?: string; // dirección completa para acotar zona
  /** Si true, intenta login con IDEALISTA_DATA_EMAIL/PASSWORD para data platform */
  useAuthenticatedData?: boolean;
  maxListings?: number;
  /** Tiempo máximo total de scraping (ms) */
  timeoutMs?: number;
}

export async function getIdealistaPlaywrightReport(
  options: IdealistaScrapeOptions
): Promise<IdealistaPlaywrightReport | null> {
  const { city, postalCode, useAuthenticatedData = true, maxListings = 30, timeoutMs = 60_000 } =
    options;

  const cacheKey = `playwright::${city}::${postalCode || ''}::${address(options)}`;
  const cached = getCached<IdealistaPlaywrightReport>(cacheKey);
  if (cached) {
    logger.info(`[IdealistaPlaywright] Cache HIT para ${city} ${postalCode || ''}`);
    return cached;
  }

  const urls = buildSearchUrls(city, postalCode);
  if (!urls) {
    logger.warn(`[IdealistaPlaywright] Ciudad no mapeada: ${city}`);
    return null;
  }

  const chromium = await loadChromium();
  if (!chromium) return null;

  const startedAt = Date.now();
  const log = (msg: string) =>
    logger.info(`[IdealistaPlaywright] ${msg} (t=${((Date.now() - startedAt) / 1000).toFixed(1)}s)`);

  let browser: any = null;
  try {
    log(`Lanzando chromium para ${city}...`);
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
      ],
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      locale: 'es-ES',
      timezoneId: 'Europe/Madrid',
      deviceScaleFactor: 2,
      hasTouch: false,
      isMobile: false,
      javaScriptEnabled: true,
      extraHTTPHeaders: {
        'Accept-Language': 'es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7',
        'Sec-Ch-Ua':
          '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"macOS"',
      },
    });

    // Anti-detección agresiva (evade DataDome básico)
    await context.addInitScript(() => {
      // Ocultar webdriver
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      // @ts-ignore
      window.chrome = {
        runtime: {},
        loadTimes: () => ({}),
        csi: () => ({}),
        app: { isInstalled: false },
      };
      // Plugins falsos realistas
      Object.defineProperty(navigator, 'plugins', {
        get: () => [
          { name: 'PDF Viewer', filename: 'internal-pdf-viewer' },
          { name: 'Chrome PDF Viewer', filename: 'internal-pdf-viewer' },
          { name: 'Chromium PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
          { name: 'Microsoft Edge PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
          { name: 'WebKit built-in PDF', filename: 'internal-pdf-viewer' },
        ],
      });
      Object.defineProperty(navigator, 'languages', { get: () => ['es-ES', 'es', 'en'] });
      // Hardware concurrency realista (Mac)
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
      // DeviceMemory
      Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
      // WebGL vendor
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      // @ts-ignore
      WebGLRenderingContext.prototype.getParameter = function (parameter: number) {
        if (parameter === 37445) return 'Intel Inc.';
        if (parameter === 37446) return 'Intel(R) Iris(TM) Plus Graphics';
        return getParameter.apply(this, [parameter]);
      };
      // Permissions
      const originalQuery = window.navigator.permissions.query;
      // @ts-ignore
      window.navigator.permissions.query = (params: any) =>
        params.name === 'notifications'
          ? Promise.resolve({ state: 'default' } as any)
          : originalQuery(params);
    });

    const page = await context.newPage();
    page.setDefaultTimeout(Math.min(timeoutMs / 3, 25_000));

    const result: IdealistaPlaywrightReport = {
      city,
      postalCode,
      pressKit: null,
      listings: [],
      dataPlatform: null,
      source: 'playwright_real_browser',
      reliability: 70,
    };

    // === 1) Press kit (índice de precios públicos) ===
    log('Fetching press kit (índice precios)...');
    try {
      const pressKitData = await fetchPressKit(page, urls.pressKitSale, urls.pressKitRent);
      if (pressKitData) {
        result.pressKit = pressKitData;
        result.reliability = 85;
        log(
          `Press kit OK: venta ${pressKitData.salePricePerM2}€/m², alquiler ${pressKitData.rentPricePerM2}€/m²`
        );
      }
    } catch (e: any) {
      log(`Press kit falló: ${e.message}`);
    }

    // === 2) Listings agregados (sale + rent) ===
    log('Fetching listings de venta...');
    try {
      const saleListings = await fetchListings(page, urls.saleListUrl, 'sale', maxListings);
      if (saleListings && saleListings.sampleSize > 0) {
        result.listings.push(saleListings);
        result.reliability = Math.max(result.reliability, 88);
        log(`Sale listings OK: ${saleListings.sampleSize} muestras`);
      }
    } catch (e: any) {
      log(`Sale listings falló: ${e.message}`);
    }

    if (Date.now() - startedAt < timeoutMs * 0.7) {
      log('Fetching listings de alquiler...');
      try {
        const rentListings = await fetchListings(page, urls.rentListUrl, 'rent', maxListings);
        if (rentListings && rentListings.sampleSize > 0) {
          result.listings.push(rentListings);
          log(`Rent listings OK: ${rentListings.sampleSize} muestras`);
        }
      } catch (e: any) {
        log(`Rent listings falló: ${e.message}`);
      }
    }

    // === 3) Idealista Data Platform autenticado (opcional, lento) ===
    if (
      useAuthenticatedData &&
      process.env.IDEALISTA_DATA_EMAIL &&
      process.env.IDEALISTA_DATA_PASSWORD &&
      Date.now() - startedAt < timeoutMs * 0.5
    ) {
      log('Intentando login en Idealista Data...');
      try {
        const dataReport = await fetchDataPlatformAuth(page, urls.dataPlatformSale);
        if (dataReport) {
          result.dataPlatform = dataReport;
          result.reliability = Math.max(result.reliability, 92);
          log('Data platform OK');
        }
      } catch (e: any) {
        log(`Data platform auth falló: ${e.message}`);
      }
    }

    // Solo cachear si tenemos algo
    const hasData =
      result.pressKit ||
      result.listings.some((l) => l.sampleSize > 0) ||
      result.dataPlatform?.available;
    if (hasData) {
      setCached(cacheKey, result);
      log(`Reporte completo, fiabilidad ${result.reliability}%`);
      return result;
    }

    log('Sin datos extraídos, devolviendo null');
    return null;
  } catch (error: any) {
    logger.error('[IdealistaPlaywright] Error global:', {
      message: error?.message || String(error),
      stack: error?.stack?.substring(0, 800),
    });
    return null;
  } finally {
    try {
      if (browser) await browser.close();
    } catch {
      // ignore
    }
  }
}

function address(options: IdealistaScrapeOptions): string {
  return options.address || '';
}

// ============================================================================
// FUNCIONES INTERNAS DE EXTRACCIÓN
// ============================================================================

/**
 * Visita una URL y espera a que pase el captcha de DataDome.
 * Devuelve true si pudo acceder al contenido real, false si quedó bloqueado.
 */
async function visitAndWaitForCaptcha(
  page: any,
  url: string,
  maxWaitMs = 20_000
): Promise<{ html: string; passedCaptcha: boolean }> {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25_000 });

  // Pequeñas interacciones humanas
  await page.mouse.move(Math.random() * 800 + 100, Math.random() * 600 + 100);
  await page.waitForTimeout(800 + Math.random() * 1200);

  let html = await page.content();
  let isCaptcha = /captcha-delivery|datadome|please enable js/i.test(html);

  if (!isCaptcha) {
    return { html, passedCaptcha: true };
  }

  // Esperar a que DataDome termine su análisis (a veces nos deja pasar tras 5-15s)
  const startedAt = Date.now();
  let attempt = 0;
  while (isCaptcha && Date.now() - startedAt < maxWaitMs) {
    attempt++;
    await page.mouse.move(Math.random() * 1200, Math.random() * 700);
    await page.evaluate(() => window.scrollTo(0, Math.random() * 200));
    await page.waitForTimeout(1500 + Math.random() * 1500);
    html = await page.content();
    isCaptcha = /captcha-delivery|datadome|please enable js/i.test(html);
    if (!isCaptcha) {
      logger.info(`[IdealistaPlaywright] DataDome superado tras ${attempt} intentos`);
      return { html, passedCaptcha: true };
    }
  }

  return { html, passedCaptcha: false };
}

async function fetchPressKit(
  page: any,
  saleUrl: string,
  rentUrl: string
): Promise<IdealistaPlaywrightReport['pressKit']> {
  const result: IdealistaPlaywrightReport['pressKit'] = {
    salePricePerM2: null,
    rentPricePerM2: null,
    saleAnnualVariation: null,
    rentAnnualVariation: null,
    fetchedAt: new Date().toISOString(),
  };

  // SALE
  try {
    const { passedCaptcha } = await visitAndWaitForCaptcha(page, saleUrl);
    if (passedCaptcha) {
      const saleData = await page.evaluate(() => {
        const text = document.body.innerText;
        const priceMatch = text.match(/([\d.,]+)\s*€\s*\/\s*m[²2]/);
        const annualMatch = text.match(
          /([+-]?\d+[.,]?\d*)\s*%\s*(?:variaci[óo]n\s+anual|anual|interanual|último año)/i
        );
        return {
          priceMatch: priceMatch ? priceMatch[1] : null,
          annualMatch: annualMatch ? annualMatch[1] : null,
        };
      });
      if (saleData.priceMatch) result.salePricePerM2 = parseSpanishNumber(saleData.priceMatch);
      if (saleData.annualMatch)
        result.saleAnnualVariation = parseSpanishNumber(saleData.annualMatch);
    }
  } catch (e: any) {
    // ignore
  }

  // RENT
  try {
    const { passedCaptcha } = await visitAndWaitForCaptcha(page, rentUrl);
    if (passedCaptcha) {
      const rentData = await page.evaluate(() => {
        const text = document.body.innerText;
        const priceMatch = text.match(/([\d.,]+)\s*€\s*\/\s*m[²2]/);
        const annualMatch = text.match(
          /([+-]?\d+[.,]?\d*)\s*%\s*(?:variaci[óo]n\s+anual|anual|interanual|último año)/i
        );
        return {
          priceMatch: priceMatch ? priceMatch[1] : null,
          annualMatch: annualMatch ? annualMatch[1] : null,
        };
      });
      if (rentData.priceMatch) result.rentPricePerM2 = parseSpanishNumber(rentData.priceMatch);
      if (rentData.annualMatch)
        result.rentAnnualVariation = parseSpanishNumber(rentData.annualMatch);
    }
  } catch (e: any) {
    // ignore
  }

  if (!result.salePricePerM2 && !result.rentPricePerM2) return null;
  return result;
}

async function fetchListings(
  page: any,
  listUrl: string,
  operation: 'sale' | 'rent',
  maxListings: number
): Promise<IdealistaPlaywrightReport['listings'][0] | null> {
  const { passedCaptcha } = await visitAndWaitForCaptcha(page, listUrl, 25_000);
  if (!passedCaptcha) return null;

  // Extraer listings desde DOM
  const listings = await page.evaluate(
    ({ max }: { max: number }) => {
      const items = Array.from(document.querySelectorAll('article, .item-info-container, [data-element-id]')).slice(
        0,
        max * 2
      );
      const results: any[] = [];

      for (const item of items) {
        const title = (item.querySelector('a.item-link, h3 a, .item-title') as HTMLElement)?.innerText?.trim() || '';
        const url = (item.querySelector('a.item-link, h3 a') as HTMLAnchorElement)?.href || '';

        const priceText =
          (item.querySelector('.price-row, .item-price, [data-element-id*="price"]') as HTMLElement)?.innerText?.trim() ||
          '';
        const detailsText =
          (item.querySelector('.item-detail-char, .details, .item-details') as HTMLElement)?.innerText?.trim() || '';

        // Parsear precio (eur)
        const priceMatch = priceText.match(/([\d.]+)/);
        const price = priceMatch ? parseInt(priceMatch[1].replace(/\./g, ''), 10) : 0;

        // Parsear m²
        const m2Match = (priceText + ' ' + detailsText).match(/(\d+)\s*m[²2]/);
        const squareMeters = m2Match ? parseInt(m2Match[1], 10) : 0;

        // Habitaciones
        const roomsMatch = detailsText.match(/(\d+)\s*hab/i);
        const rooms = roomsMatch ? parseInt(roomsMatch[1], 10) : undefined;

        if (price > 0 && squareMeters > 0 && title) {
          results.push({
            title,
            url,
            price,
            squareMeters,
            pricePerM2: Math.round(price / squareMeters),
            rooms,
          });
        }

        if (results.length >= max) break;
      }

      return results;
    },
    { max: maxListings }
  );

  if (!listings || listings.length === 0) return null;

  const pricesPerM2 = listings.map((l: any) => l.pricePerM2).sort((a: number, b: number) => a - b);
  const median = pricesPerM2[Math.floor(pricesPerM2.length / 2)];
  const avg = Math.round(pricesPerM2.reduce((s: number, v: number) => s + v, 0) / pricesPerM2.length);

  return {
    operation,
    averagePricePerM2: avg,
    medianPricePerM2: median,
    sampleSize: listings.length,
    pricesPerM2,
    listingsPreview: listings.slice(0, 10),
  };
}

async function fetchDataPlatformAuth(
  page: any,
  dataUrl: string
): Promise<IdealistaPlaywrightReport['dataPlatform']> {
  const email = process.env.IDEALISTA_DATA_EMAIL!;
  const password = process.env.IDEALISTA_DATA_PASSWORD!;

  // Login
  try {
    await page.goto('https://www.idealista.com/data/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
  } catch {
    // ignore
  }

  try {
    await page.goto('https://www.idealista.com/data/app/user/login', {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });
    await page.waitForTimeout(1500);

    // Detectar captcha
    const isCaptcha = await page
      .evaluate(() => /captcha|datadome/i.test(document.body.innerText))
      .catch(() => false);
    if (isCaptcha) {
      return { available: false, note: 'Login bloqueado por captcha en /data/app/user/login' };
    }

    // Buscar inputs
    await page.fill('input[name="email"], input[type="email"]', email).catch(() => {});
    await page.fill('input[name="password"], input[type="password"]', password).catch(() => {});

    await Promise.all([
      page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {}),
      page.click('button[type="submit"]').catch(() => {}),
    ]);
    await page.waitForTimeout(2000);
  } catch {
    return { available: false, note: 'Login flow falló' };
  }

  // Visitar dashboard
  try {
    await page.goto(dataUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);

    const isCaptcha = await page
      .evaluate(() => /captcha|datadome/i.test(document.body.innerText))
      .catch(() => false);
    if (isCaptcha) {
      return { available: false, note: 'Dashboard bloqueado por captcha' };
    }

    const data = await page.evaluate(() => {
      const text = document.body.innerText;
      const saleMatch = text.match(/precio\s+venta\s*[:.]?\s*([\d.,]+)\s*€\/m[²2]/i);
      const rentMatch = text.match(/precio\s+alquiler\s*[:.]?\s*([\d.,]+)\s*€\/m[²2]/i);
      const yieldMatch = text.match(/rentabilidad\s*[:.]?\s*([\d.,]+)\s*%/i);
      const daysMatch = text.match(/(\d+)\s*d[íi]as\s+en\s+mercado/i);
      const totalMatch = text.match(/(\d+)\s*(?:anuncios|inmuebles|propiedades)/i);
      return {
        sale: saleMatch ? saleMatch[1] : null,
        rent: rentMatch ? rentMatch[1] : null,
        yield: yieldMatch ? yieldMatch[1] : null,
        days: daysMatch ? parseInt(daysMatch[1], 10) : null,
        total: totalMatch ? parseInt(totalMatch[1], 10) : null,
      };
    });

    return {
      available: true,
      salePricePerM2: data.sale ? parseSpanishNumber(data.sale) || undefined : undefined,
      rentPricePerM2: data.rent ? parseSpanishNumber(data.rent) || undefined : undefined,
      grossYield: data.yield ? parseSpanishNumber(data.yield) || undefined : undefined,
      avgDaysOnMarket: data.days || undefined,
      totalListings: data.total || undefined,
    };
  } catch {
    return null;
  }
}

function parseSpanishNumber(text: string): number | null {
  if (!text) return null;
  const cleaned = text.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

export function isPlaywrightConfigured(): boolean {
  // Comprobación lazy: si node_modules tiene playwright
  try {
    require.resolve('playwright');
    return true;
  } catch {
    return false;
  }
}
