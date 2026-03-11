/**
 * SERVICIO DE SCRAPING DE ALERTASUBASTAS.COM
 *
 * Extrae subastas activas de alertasubastas.com con login autenticado.
 * Fuentes que agrega: BOE judiciales, Hacienda (AEAT), Seguridad Social,
 * Notariales, Ayuntamientos, Diputaciones.
 *
 * Tipos de activo: vivienda, garaje, trastero, solar, local-comercial,
 * nave-industrial, finca-rustica, otros-inmuebles.
 *
 * Credenciales: ALERTASUBASTAS_EMAIL + ALERTASUBASTAS_PASSWORD en .env
 */

import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import logger from '@/lib/logger';
import { getCachedData, setCachedData, getRandomUserAgent } from './scraping/scraping-base';

// ============================================================================
// TIPOS
// ============================================================================

export interface AlertaSubastaItem {
  id: string;
  title: string;
  propertyType: string;
  location: string;
  province: string;
  auctionSource: string; // BOE, AEAT, Seguridad Social, Notarial, etc.
  valorTasacion: number | null;
  pujaMinima: number | null;
  price: number;
  marketValue: number;
  discount: number;
  surface: number | null;
  refCatastral: string | null;
  status: string;
  deadline: string | null;
  url: string;
  imageUrl: string | null;
  description: string;
  tags: string[];
}

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const BASE_URL = 'https://alertasubastas.com';
const CACHE_TTL = 4 * 60 * 60; // 4h

const PROPERTY_TYPE_SLUGS: Record<string, string> = {
  vivienda: 'vivienda',
  garaje: 'garaje',
  trastero: 'trastero',
  solar: 'solar',
  local_comercial: 'local-comercial',
  nave_industrial: 'nave-industrial',
  finca_rustica: 'finca-rustica',
  otros: 'otros-inmuebles',
};

const PROVINCE_SLUGS: Record<string, string> = {
  madrid: 'madrid-provincia',
  barcelona: 'barcelona-provincia',
  valencia: 'valencia-provincia',
  sevilla: 'sevilla-provincia',
  malaga: 'malaga-provincia',
  alicante: 'alicante-provincia',
  vizcaya: 'bizkaia-provincia',
  zaragoza: 'zaragoza-provincia',
  valladolid: 'valladolid-provincia',
  palencia: 'palencia-provincia',
  murcia: 'murcia-provincia',
  cordoba: 'cordoba-provincia',
  granada: 'granada-provincia',
  cadiz: 'cadiz-provincia',
};

// ============================================================================
// SESIÓN Y AUTENTICACIÓN
// ============================================================================

let sessionCookies = '';
let sessionExpiry = 0;

function isConfigured(): boolean {
  return !!(process.env.ALERTASUBASTAS_EMAIL && process.env.ALERTASUBASTAS_PASSWORD);
}

function createClient(): AxiosInstance {
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      'User-Agent': getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-origin',
      'DNT': '1',
      ...(sessionCookies && { 'Cookie': sessionCookies }),
    },
    timeout: 20000,
    maxRedirects: 5,
    validateStatus: s => s < 500,
  });
}

function extractCookies(headers: any): string {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return '';
  const arr = Array.isArray(setCookie) ? setCookie : [setCookie];
  return arr.map((h: string) => h.split(';')[0].trim()).filter(Boolean).join('; ');
}

function mergeCookies(a: string, b: string): string {
  const map = new Map<string, string>();
  for (const c of a.split(';').map(s => s.trim()).filter(Boolean)) {
    const [name] = c.split('=');
    if (name) map.set(name.trim(), c);
  }
  for (const c of b.split(';').map(s => s.trim()).filter(Boolean)) {
    const [name] = c.split('=');
    if (name) map.set(name.trim(), c);
  }
  return [...map.values()].join('; ');
}

async function humanDelay(min = 1000, max = 3000): Promise<void> {
  await new Promise(r => setTimeout(r, min + Math.random() * (max - min)));
}

async function authenticate(): Promise<boolean> {
  if (sessionCookies && sessionExpiry > Date.now()) return true;

  const email = process.env.ALERTASUBASTAS_EMAIL;
  const password = process.env.ALERTASUBASTAS_PASSWORD;
  if (!email || !password) return false;

  try {
    logger.info('[AlertaSubastas] Autenticando...');
    const client = createClient();

    // Paso 1: GET login page para cookies y CSRF
    const loginPage = await client.get('/login');
    sessionCookies = mergeCookies(sessionCookies, extractCookies(loginPage.headers));

    let csrfToken = '';
    const html = typeof loginPage.data === 'string' ? loginPage.data : '';
    const csrfPatterns = [
      /name="_token"\s*value="([^"]+)"/,
      /name="csrf[_-]?token"\s*value="([^"]+)"/,
      /"_token"\s*:\s*"([^"]+)"/,
      /meta\s+name="csrf-token"\s+content="([^"]+)"/,
    ];
    for (const p of csrfPatterns) {
      const m = html.match(p);
      if (m) { csrfToken = m[1]; break; }
    }

    await humanDelay(800, 1500);

    // Paso 2: POST login
    const loginData = new URLSearchParams();
    loginData.append('email', email);
    loginData.append('password', password);
    if (csrfToken) loginData.append('_token', csrfToken);

    const loginRes = await client.post('/login', loginData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': sessionCookies,
        'Referer': `${BASE_URL}/login`,
        ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
      },
      maxRedirects: 0,
      validateStatus: s => s < 500,
    });

    sessionCookies = mergeCookies(sessionCookies, extractCookies(loginRes.headers));

    // Seguir redirects
    if ([301, 302, 303].includes(loginRes.status)) {
      const loc = loginRes.headers['location'];
      if (loc) {
        const followRes = await client.get(loc.startsWith('http') ? loc.replace(BASE_URL, '') : loc, {
          headers: { 'Cookie': sessionCookies },
        });
        sessionCookies = mergeCookies(sessionCookies, extractCookies(followRes.headers));
      }
    }

    sessionExpiry = Date.now() + 25 * 60 * 1000;
    logger.info('[AlertaSubastas] Autenticación completada');
    return true;
  } catch (error: any) {
    logger.error('[AlertaSubastas] Error login:', error.message);
    return false;
  }
}

// ============================================================================
// SCRAPING DE SUBASTAS
// ============================================================================

function parseAuctionCard($: cheerio.CheerioAPI, el: cheerio.Element, idx: number): AlertaSubastaItem | null {
  try {
    const $el = $(el);
    const text = $el.text();

    const titleEl = $el.find('h2 a, h3 a, .card-title a, .titulo a, a.subasta-link').first();
    const title = titleEl.text().trim() || $el.find('h2, h3, .card-title, .titulo').first().text().trim();
    const href = titleEl.attr('href') || $el.find('a').first().attr('href');
    const url = href ? (href.startsWith('http') ? href : `${BASE_URL}${href}`) : '';

    // Extraer valores
    const valorMatch = text.match(/(?:Valor|Tasaci[oó]n|Valor\s+subasta)[:\s€]*([\d.,]+)/i);
    const pujaMatch = text.match(/(?:Puja\s+m[ií]nima|Importe\s+dep[oó]sito|Cantidad\s+reclamada)[:\s€]*([\d.,]+)/i);
    const superficieMatch = text.match(/([\d.,]+)\s*m[²2]/);
    const catastralMatch = text.match(/(\d{7}[A-Z]{2}\d{4}[A-Z]\d{4}[A-Z]{2})/);

    const valorTasacion = valorMatch ? parseNum(valorMatch[1]) : null;
    const pujaMinima = pujaMatch ? parseNum(pujaMatch[1]) : null;
    const surface = superficieMatch ? parseNum(superficieMatch[1]) : null;

    const price = pujaMinima || (valorTasacion ? Math.round(valorTasacion * 0.7) : 0);
    const market = valorTasacion || (price > 0 ? Math.round(price / 0.7) : 0);
    if (price <= 0 && market <= 0) return null;

    const discount = market > 0 ? Math.round(((market - price) / market) * 100) : 0;

    // Detectar provincia
    const provMatch = text.match(/(?:Provincia|Ubicaci[oó]n)[:\s]*([A-ZÁÉÍÓÚÑa-záéíóúñ\s]+?)(?:\s*[-|·]|\s*$)/m);
    const province = provMatch ? provMatch[1].trim() : '';

    // Detectar tipo
    const t = (title + ' ' + text).toLowerCase();
    const propertyType = t.includes('local') || t.includes('comercial') ? 'local_comercial'
      : t.includes('oficina') ? 'oficina'
      : t.includes('nave') || t.includes('industrial') ? 'nave_industrial'
      : t.includes('garaje') || t.includes('plaza') || t.includes('aparcamiento') ? 'garaje'
      : t.includes('solar') || t.includes('terreno') || t.includes('parcela') ? 'terreno'
      : t.includes('trastero') ? 'trastero'
      : t.includes('finca') || t.includes('r[uú]stic') ? 'finca_rustica'
      : 'vivienda';

    // Detectar fuente
    const auctionSource = t.includes('aeat') || t.includes('hacienda') || t.includes('tributaria') ? 'AEAT'
      : t.includes('seguridad social') ? 'Seguridad Social'
      : t.includes('notari') ? 'Notarial'
      : t.includes('ayuntamiento') || t.includes('municipal') ? 'Ayuntamiento'
      : 'BOE Judicial';

    // Estado
    const statusEl = $el.find('.badge, .estado, .status, [class*="activ"], [class*="finaliz"]');
    const status = statusEl.text().trim().toLowerCase().includes('activ') ? 'activa' : 'activa';

    // Fecha límite
    const deadlineMatch = text.match(/(?:Fecha\s+(?:fin|cierre|conclusi[oó]n))[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i);
    const deadline = deadlineMatch ? deadlineMatch[1] : null;

    // Imagen
    const imageUrl = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src') || null;

    return {
      id: `alertasub-${idx}`,
      title: title || `Subasta ${propertyType} ${province}`,
      propertyType,
      location: province || 'España',
      province,
      auctionSource,
      valorTasacion,
      pujaMinima,
      price,
      marketValue: market,
      discount,
      surface,
      refCatastral: catastralMatch ? catastralMatch[1] : null,
      status,
      deadline,
      url,
      imageUrl: imageUrl?.startsWith('http') ? imageUrl : imageUrl ? `${BASE_URL}${imageUrl}` : null,
      description: `${auctionSource}. ${valorTasacion ? `Tasación: €${valorTasacion.toLocaleString('es-ES')}` : ''}${pujaMinima ? `. Puja mínima: €${pujaMinima.toLocaleString('es-ES')}` : ''}. Descuento: ${discount}%.`,
      tags: ['subasta', auctionSource.toLowerCase().replace(/\s/g, '-'), propertyType, ...(province ? [province.toLowerCase()] : [])],
    };
  } catch {
    return null;
  }
}

export async function scrapeAlertaSubastas(
  propertyTypes?: string[],
  provinces?: string[],
): Promise<AlertaSubastaItem[]> {
  const typesKey = (propertyTypes || ['vivienda']).sort().join(',');
  const provsKey = (provinces || []).sort().join(',');
  const cacheKey = `alertasub:${typesKey}:${provsKey}`;

  const cached = await getCachedData<AlertaSubastaItem[]>(cacheKey);
  if (cached) return cached;

  const allResults: AlertaSubastaItem[] = [];
  const types = propertyTypes || ['vivienda'];
  let authenticated = false;

  if (isConfigured()) {
    authenticated = await authenticate();
  }

  for (const pType of types) {
    const slug = PROPERTY_TYPE_SLUGS[pType] || PROPERTY_TYPE_SLUGS.vivienda;

    // Construir URL — con o sin provincia
    const urls: string[] = [];
    if (provinces && provinces.length > 0) {
      for (const prov of provinces) {
        const provSlug = PROVINCE_SLUGS[prov.toLowerCase()] || `${prov.toLowerCase()}-provincia`;
        urls.push(`/subastas-publicas-${slug}/${provSlug}`);
      }
    } else {
      urls.push(`/subastas-publicas-${slug}`);
    }

    for (const urlPath of urls) {
      try {
        await humanDelay(2000, 4000);
        const client = createClient();

        const response = await client.get(urlPath, {
          headers: {
            'Cookie': sessionCookies,
            'Referer': BASE_URL,
          },
        });

        if (response.status !== 200) continue;

        const html = typeof response.data === 'string' ? response.data : '';
        sessionCookies = mergeCookies(sessionCookies, extractCookies(response.headers));

        const $ = cheerio.load(html);

        // Selectores de cards de subastas
        const selectors = [
          '.card-subasta', '.subasta-item', '.resultado-subasta',
          '.list-group-item', '.auction-card', 'article.subasta',
          '.card', '.col-md-6 .card', '.col-lg-4 .card',
        ];

        let found = false;
        for (const sel of selectors) {
          const elements = $(sel);
          if (elements.length === 0) continue;

          elements.each((idx, el) => {
            if (allResults.length >= 50) return;
            const item = parseAuctionCard($, el, allResults.length);
            if (item) {
              item.id = `alertasub-${pType}-${allResults.length}`;
              if (!item.province && provinces?.[0]) item.province = provinces[0];
              allResults.push(item);
            }
          });
          found = true;
          break;
        }

        // Fallback: buscar en todo el body
        if (!found) {
          $('a[href*="subasta"], a[href*="/ficha/"]').each((idx, el) => {
            if (allResults.length >= 50) return;
            const $a = $(el);
            const title = $a.text().trim();
            const href = $a.attr('href');
            if (!title || title.length < 10) return;

            const parentText = $a.parent().text() || '';
            const valorMatch = parentText.match(/([\d.,]+)\s*€/);
            const valor = valorMatch ? parseNum(valorMatch[1]) : null;

            if (valor && valor > 1000) {
              allResults.push({
                id: `alertasub-${pType}-${allResults.length}`,
                title,
                propertyType: pType,
                location: provinces?.[0] || 'España',
                province: provinces?.[0] || '',
                auctionSource: 'Subasta pública',
                valorTasacion: valor,
                pujaMinima: null,
                price: Math.round(valor * 0.7),
                marketValue: valor,
                discount: 30,
                surface: null,
                refCatastral: null,
                status: 'activa',
                deadline: null,
                url: href ? (href.startsWith('http') ? href : `${BASE_URL}${href}`) : '',
                imageUrl: null,
                description: `Subasta activa. Valor: €${valor.toLocaleString('es-ES')}.`,
                tags: ['subasta', pType],
              });
            }
          });
        }

        logger.info(`[AlertaSubastas] ${allResults.length} subastas de ${pType} extraídas`);
      } catch (error: any) {
        logger.warn(`[AlertaSubastas] Error scraping ${urlPath}: ${error.message}`);
      }
    }
  }

  if (allResults.length > 0) {
    await setCachedData(cacheKey, allResults, CACHE_TTL);
  }

  return allResults;
}

// ============================================================================
// UTILIDADES
// ============================================================================

function parseNum(text: string): number | null {
  if (!text) return null;
  const cleaned = text.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

export function isAlertaSubastasConfigured(): boolean {
  return isConfigured();
}

export function invalidateSession(): void {
  sessionCookies = '';
  sessionExpiry = 0;
}
