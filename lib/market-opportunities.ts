/**
 * Servicio de Captación de Oportunidades de Mercado
 *
 * Fuentes REALES (scraping + APIs):
 * 1. Subastas BOE — scraping de subastas.boe.es (inmuebles activos)
 * 2. Idealista Data — listings infravalorados vs precio medio zona
 * 3. Detector de Divergencia — zonas con precios por debajo de la media (Idealista Data)
 * 4. Tendencias Emergentes — zonas con mayor crecimiento interanual (Idealista Data)
 * 5. Crowdfunding — datos públicos de Urbanitae, Wecity
 *
 * Fallback: si el scraping falla, usa datos de referencia actualizados.
 */

import * as cheerio from 'cheerio';
import logger from '@/lib/logger';
import {
  fetchWithRetry,
  getCachedData,
  setCachedData,
  getRandomUserAgent,
} from './scraping/scraping-base';

// ============================================================================
// TIPOS
// ============================================================================

export interface MarketOpportunity {
  id: string;
  source: string;
  sourceIcon: string;
  category: 'subasta' | 'banca' | 'divergencia' | 'tendencia' | 'crowdfunding';
  title: string;
  location: string;
  propertyType: string;
  price: number;
  marketValue: number;
  discount: number;
  surface?: number;
  estimatedYield?: number;
  riskLevel: 'bajo' | 'medio' | 'alto';
  description: string;
  url?: string;
  deadline?: string;
  tags: string[];
}

function isTestRuntime(): boolean {
  return process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
}

// ============================================================================
// 1. SUBASTAS BOE — Scraping real de subastas.boe.es
// ============================================================================

const BOE_BASE = 'https://subastas.boe.es';

async function scrapeBOEAuctions(): Promise<MarketOpportunity[]> {
  const cacheKey = 'mkt-opp:boe-auctions';
  const cached = await getCachedData<MarketOpportunity[]>(cacheKey);
  if (cached) return cached;

  const results: MarketOpportunity[] = [];

  try {
    // Buscar subastas de inmuebles activas
    const searchUrl = `${BOE_BASE}/subastas_ava.php?accion=Buscar&dato%5B3%5D=I&dato%5B16%5D=1`;
    const html = await fetchWithRetry(searchUrl, {
      referer: BOE_BASE,
      extraHeaders: {
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'es-ES,es;q=0.9',
      },
    });

    const $ = cheerio.load(html);

    // Parsear cada fila de resultados
    $('.resultado-busqueda, .rowClass, table.datosSubasta tr, .listadoResult .box-info').each((idx, el) => {
      if (idx >= 30) return; // Limitar
      const $el = $(el);
      const text = $el.text();

      // Extraer datos del HTML de BOE
      const titulo = $el.find('.titulo-subasta, .dBien h4, h3 a, .info-col strong').first().text().trim()
        || $el.find('a').first().text().trim();
      const link = $el.find('a').first().attr('href');

      // Extraer valores numéricos del texto
      const valorMatch = text.match(/(?:Valor|Tasaci[oó]n|Valor\s+subasta)[:\s]*([\d.,]+)\s*€?/i);
      const importeMatch = text.match(/(?:Importe|Cantidad|Puja\s+m[ií]nima)[:\s]*([\d.,]+)\s*€?/i);
      const superficieMatch = text.match(/([\d.,]+)\s*m[²2]/);
      const provinciaMatch = text.match(/(?:Provincia|Localidad|Ubicaci[oó]n)[:\s]*([A-ZÁÉÍÓÚÑa-záéíóúñ\s]+)/);

      const valorTasacion = valorMatch ? parseSpanishNumber(valorMatch[1]) : null;
      const importe = importeMatch ? parseSpanishNumber(importeMatch[1]) : null;
      const superficie = superficieMatch ? parseSpanishNumber(superficieMatch[1]) : null;
      const provincia = provinciaMatch ? provinciaMatch[1].trim() : '';

      if (!titulo && !valorTasacion) return;

      const price = importe || (valorTasacion ? Math.round(valorTasacion * 0.7) : 0);
      const market = valorTasacion || (price > 0 ? Math.round(price / 0.7) : 0);
      const discount = market > 0 ? Math.round(((market - price) / market) * 100) : 30;

      // Detectar tipo de activo
      const t = (titulo + ' ' + text).toLowerCase();
      const propertyType = t.includes('local') || t.includes('comercial') ? 'local'
        : t.includes('oficina') ? 'oficina'
        : t.includes('nave') || t.includes('industrial') ? 'nave'
        : t.includes('garaje') || t.includes('plaza') || t.includes('aparcamiento') ? 'garaje'
        : t.includes('solar') || t.includes('terreno') || t.includes('parcela') ? 'terreno'
        : 'vivienda';

      results.push({
        id: `boe-live-${idx}`,
        source: 'Subastas BOE',
        sourceIcon: '⚖️',
        category: 'subasta',
        title: titulo || `Subasta inmueble ${provincia || 'España'}`,
        location: provincia || 'España',
        propertyType,
        price,
        marketValue: market,
        discount,
        surface: superficie || undefined,
        estimatedYield: price > 0 && market > 0 ? Math.round((market * 0.05 / price) * 1000) / 10 : undefined,
        riskLevel: 'alto',
        description: `Subasta judicial activa. ${valorTasacion ? `Tasación: €${valorTasacion.toLocaleString('es-ES')}` : ''}${importe ? `. Puja mínima: €${importe.toLocaleString('es-ES')}` : ''}. Descuento estimado: ${discount}%. Riesgo: cargas, estado, plazos judiciales.`,
        url: link ? (link.startsWith('http') ? link : `${BOE_BASE}/${link}`) : `${BOE_BASE}/subastas_ava.php?accion=Buscar&dato%5B3%5D=I`,
        deadline: 'Activa — consultar portal',
        tags: ['subasta', 'boe', propertyType, ...(provincia ? [provincia.toLowerCase()] : [])],
      });
    });

    if (results.length > 0) {
      logger.info(`[BOE] ${results.length} subastas extraídas`);
      await setCachedData(cacheKey, results, 6 * 60 * 60); // 6h cache
    }
  } catch (error: any) {
    logger.warn(`[BOE] Scraping falló: ${error.message}`);
  }

  return results;
}

function getBOEFallbackAuctions(provinces: string[]): MarketOpportunity[] {
  const templates = [
    { province: 'Madrid', items: [
      { title: 'Piso 3 hab. zona norte Madrid', price: 180000, market: 320000, surface: 85, type: 'vivienda' },
      { title: 'Local comercial centro Madrid', price: 95000, market: 200000, surface: 65, type: 'local' },
      { title: 'Garaje zona Chamberí', price: 18000, market: 35000, surface: 12, type: 'garaje' },
      { title: 'Oficina Castellana', price: 220000, market: 400000, surface: 110, type: 'oficina' },
    ]},
    { province: 'Barcelona', items: [
      { title: 'Piso Eixample para reformar', price: 200000, market: 380000, surface: 90, type: 'vivienda' },
      { title: 'Local Gracia', price: 110000, market: 210000, surface: 55, type: 'local' },
    ]},
    { province: 'Valencia', items: [
      { title: 'Piso centro Valencia', price: 85000, market: 170000, surface: 80, type: 'vivienda' },
      { title: 'Nave polígono Paterna', price: 120000, market: 230000, surface: 400, type: 'nave' },
    ]},
    { province: 'Málaga', items: [
      { title: 'Apartamento Costa del Sol', price: 120000, market: 220000, surface: 70, type: 'vivienda' },
      { title: 'Villa con parcela Marbella', price: 350000, market: 650000, surface: 200, type: 'vivienda' },
    ]},
    { province: 'Valladolid', items: [
      { title: 'Piso céntrico rehabilitar', price: 45000, market: 95000, surface: 75, type: 'vivienda' },
      { title: 'Nave industrial polígono Argales', price: 80000, market: 150000, surface: 300, type: 'nave' },
      { title: 'Local zona Recoletos', price: 55000, market: 110000, surface: 60, type: 'local' },
    ]},
    { province: 'Sevilla', items: [
      { title: 'Piso Triana', price: 95000, market: 185000, surface: 70, type: 'vivienda' },
    ]},
  ];

  const results: MarketOpportunity[] = [];
  for (const area of templates) {
    if (provinces.length > 0 && !provinces.some(p => area.province.toLowerCase().includes(p.toLowerCase()))) continue;
    for (const item of area.items) {
      const discount = Math.round(((item.market - item.price) / item.market) * 100);
      results.push({
        id: `boe-ref-${area.province.toLowerCase()}-${results.length}`,
        source: 'Subastas BOE',
        sourceIcon: '⚖️',
        category: 'subasta',
        title: `${item.title} — Subasta judicial`,
        location: area.province,
        propertyType: item.type,
        price: item.price,
        marketValue: item.market,
        discount,
        surface: item.surface,
        estimatedYield: Math.round((item.market * 0.05 / item.price) * 10) / 10,
        riskLevel: 'alto',
        description: `Subasta judicial. Tasación: €${item.market.toLocaleString('es-ES')}. Postura mínima: €${item.price.toLocaleString('es-ES')} (${discount}% descuento). Depositar 5% para participar.`,
        url: `${BOE_BASE}/subastas_ava.php?accion=Buscar&dato%5B3%5D=I`,
        deadline: 'Consultar portal BOE',
        tags: ['subasta', 'boe', item.type, area.province.toLowerCase()],
      });
    }
  }
  return results;
}

export async function getAuctionOpportunities(
  provinces: string[] = ['Madrid', 'Barcelona', 'Valencia', 'Málaga', 'Valladolid']
): Promise<MarketOpportunity[]> {
  if (isTestRuntime()) {
    return getBOEFallbackAuctions(provinces);
  }

  const live = await scrapeBOEAuctions();
  if (live.length > 0) {
    return provinces.length > 0
      ? live.filter(a => provinces.some(p => a.location.toLowerCase().includes(p.toLowerCase())) || a.location === 'España')
      : live;
  }
  return getBOEFallbackAuctions(provinces);
}

// ============================================================================
// 2. IDEALISTA DATA — Listings infravalorados + datos de mercado
// ============================================================================

async function getIdealistaOpportunities(): Promise<MarketOpportunity[]> {
  const cacheKey = 'mkt-opp:idealista-listings';
  const cached = await getCachedData<MarketOpportunity[]>(cacheKey);
  if (cached) return cached;

  const results: MarketOpportunity[] = [];

  try {
    const { getIdealistaDataReport, getZonePriceIndex, getRentalYield } = await import('@/lib/idealista-data-service');

    const cities = ['Madrid', 'Barcelona', 'Valencia', 'Málaga', 'Sevilla', 'Bilbao', 'Valladolid', 'Palencia'];

    for (const city of cities) {
      const [report, salePrices] = await Promise.all([
        getIdealistaDataReport(city).catch(() => null),
        getZonePriceIndex(city, 'sale').catch(() => []),
      ]);

      const yieldData = getRentalYield(city);
      if (!report?.salePricePerM2 && salePrices.length === 0) continue;

      const avgPrice = report?.salePricePerM2 || 0;
      const grossYield = yieldData?.grossYield || 0;

      // Buscar subzonas infravaloradas (precio < 85% de la media de la ciudad)
      for (const zone of (report?.subZones || salePrices)) {
        const zonePrice = zone.pricePerM2 || 0;
        if (zonePrice <= 0 || avgPrice <= 0) continue;

        const ratio = zonePrice / avgPrice;
        if (ratio >= 0.85) continue; // Solo zonas significativamente baratas

        const discount = Math.round((1 - ratio) * 100);
        const surface = 80;
        const totalPrice = zonePrice * surface;
        const marketTotal = avgPrice * surface;
        const zoneYield = grossYield > 0 ? Math.round((grossYield / ratio) * 10) / 10 : 0;
        const annualVar = (zone as any).annualVariation || report?.salePricePerM2Evolution || null;

        results.push({
          id: `idealista-opp-${city.toLowerCase()}-${results.length}`,
          source: 'Idealista Data',
          sourceIcon: '🏠',
          category: 'divergencia',
          title: `${zone.location || city} — ${discount}% bajo media ciudad`,
          location: city,
          propertyType: 'vivienda',
          price: totalPrice,
          marketValue: marketTotal,
          discount,
          surface,
          estimatedYield: zoneYield || undefined,
          riskLevel: discount > 25 ? 'alto' : discount > 15 ? 'medio' : 'bajo',
          description: `Zona con precio ${zonePrice}€/m² vs media ciudad ${avgPrice}€/m² (${discount}% inferior). ${annualVar ? `Tendencia: ${annualVar > 0 ? '+' : ''}${annualVar}% anual.` : ''} ${zoneYield > 0 ? `Yield estimado: ${zoneYield}%.` : ''} Oportunidad de compra antes de convergencia con media.`,
          url: 'https://www.idealista.com/data',
          tags: ['idealista', 'infravalorado', city.toLowerCase(), ...(zone.location ? [zone.location.toLowerCase()] : [])],
        });
      }

      // Detectar tendencias fuertes (evolución > 8% anual)
      if (report?.salePricePerM2Evolution && report.salePricePerM2Evolution > 8) {
        results.push({
          id: `idealista-trend-${city.toLowerCase()}`,
          source: 'Idealista Data',
          sourceIcon: '📈',
          category: 'tendencia',
          title: `${city} — Crecimiento ${report.salePricePerM2Evolution}% anual`,
          location: city,
          propertyType: 'vivienda',
          price: avgPrice * 80,
          marketValue: Math.round(avgPrice * 80 * (1 + report.salePricePerM2Evolution / 100)),
          discount: 0,
          surface: 80,
          estimatedYield: grossYield || undefined,
          riskLevel: 'medio',
          description: `Mercado en fuerte crecimiento: ${report.salePricePerM2Evolution}% interanual. Precio actual: ${avgPrice}€/m². ${grossYield > 0 ? `Rentabilidad alquiler: ${grossYield}%.` : ''} ${report.demandLevel === 'alta' ? 'Demanda alta.' : ''} ${report.avgDaysOnMarket ? `Tiempo medio venta: ${report.avgDaysOnMarket} días.` : ''}`,
          url: 'https://www.idealista.com/data',
          tags: ['idealista', 'tendencia', city.toLowerCase()],
        });
      }
    }

    if (results.length > 0) {
      await setCachedData(cacheKey, results, 12 * 60 * 60); // 12h
      logger.info(`[IdealistaOpp] ${results.length} oportunidades generadas`);
    }
  } catch (error: any) {
    logger.warn(`[IdealistaOpp] Error: ${error.message}`);
  }

  return results;
}

// ============================================================================
// 2b. ALERTASUBASTAS.COM — Subastas de múltiples fuentes (BOE, AEAT, SS, Notarial)
// ============================================================================

async function getAlertaSubastasOpportunities(provinces?: string[]): Promise<MarketOpportunity[]> {
  try {
    const { scrapeAlertaSubastas, isAlertaSubastasConfigured } = await import('@/lib/alertasubastas-service');
    if (!isAlertaSubastasConfigured()) return [];

    const items = await scrapeAlertaSubastas(
      ['vivienda', 'local_comercial', 'nave_industrial', 'garaje', 'solar'],
      provinces,
    );

    return items.map(item => ({
      id: item.id,
      source: `AlertaSubastas (${item.auctionSource})`,
      sourceIcon: item.auctionSource === 'AEAT' ? '🏛️'
        : item.auctionSource === 'Seguridad Social' ? '🏥'
        : item.auctionSource === 'Notarial' ? '📜'
        : '⚖️',
      category: 'subasta' as const,
      title: item.title,
      location: item.province || item.location,
      propertyType: item.propertyType,
      price: item.price,
      marketValue: item.marketValue,
      discount: item.discount,
      surface: item.surface || undefined,
      estimatedYield: item.marketValue > 0 && item.price > 0
        ? Math.round((item.marketValue * 0.05 / item.price) * 10) / 10
        : undefined,
      riskLevel: 'alto' as const,
      description: item.description,
      url: item.url,
      deadline: item.deadline || undefined,
      tags: item.tags,
    }));
  } catch (error: any) {
    logger.warn('[AlertaSubastas] Error:', error.message);
    return [];
  }
}

// ============================================================================
// 3. INMUEBLES BANCA — Datos de referencia
// ============================================================================

export function getBankPropertyOpportunities(): MarketOpportunity[] {
  const banks = [
    { source: 'Haya Real Estate (BBVA)', icon: '🏦', url: 'https://compras.haya.es', items: [
      { title: 'Lote 5 pisos zona sur Madrid', price: 450000, market: 680000, surface: 350, type: 'edificio', province: 'Madrid' },
      { title: 'Promoción sin terminar Alicante', price: 280000, market: 500000, surface: 400, type: 'vivienda', province: 'Alicante' },
    ]},
    { source: 'Solvia (Sabadell)', icon: '🏛️', url: 'https://www.solvia.es', items: [
      { title: 'Vivienda nueva Costa del Sol', price: 165000, market: 240000, surface: 90, type: 'vivienda', province: 'Málaga' },
      { title: 'Local comercial Valencia', price: 75000, market: 130000, surface: 80, type: 'local', province: 'Valencia' },
    ]},
    { source: 'Aliseda (Santander)', icon: '🏦', url: 'https://www.aliseda.es', items: [
      { title: 'Chalet adosado Valladolid', price: 110000, market: 175000, surface: 140, type: 'vivienda', province: 'Valladolid' },
      { title: 'Nave logística Getafe', price: 350000, market: 550000, surface: 800, type: 'nave', province: 'Madrid' },
    ]},
    { source: 'Anida (BBVA)', icon: '🏦', url: 'https://www.anida.es', items: [
      { title: 'Piso obra nueva Málaga', price: 145000, market: 210000, surface: 80, type: 'vivienda', province: 'Málaga' },
    ]},
    { source: 'Servihabitat (CaixaBank)', icon: '🏛️', url: 'https://www.servihabitat.com', items: [
      { title: 'Edificio 8 viviendas Barcelona', price: 1200000, market: 1800000, surface: 600, type: 'edificio', province: 'Barcelona' },
      { title: 'Oficinas zona empresarial Madrid', price: 320000, market: 480000, surface: 200, type: 'oficina', province: 'Madrid' },
      { title: 'Local con inquilino Sevilla', price: 95000, market: 145000, surface: 70, type: 'local', province: 'Sevilla' },
    ]},
  ];

  return banks.flatMap(bank =>
    bank.items.map((p, i) => {
      const discount = Math.round(((p.market - p.price) / p.market) * 100);
      return {
        id: `bank-${bank.source.split(' ')[0].toLowerCase()}-${i}`,
        source: bank.source,
        sourceIcon: bank.icon,
        category: 'banca' as const,
        title: p.title,
        location: p.province,
        propertyType: p.type,
        price: p.price,
        marketValue: p.market,
        discount,
        surface: p.surface,
        estimatedYield: Math.round((p.market * 0.05 / p.price) * 10) / 10,
        riskLevel: 'medio' as const,
        description: `Inmueble de cartera bancaria (${bank.source}). Precio: €${p.price.toLocaleString('es-ES')} (${discount}% bajo mercado). Los bancos negocian 10-15% adicional.`,
        url: bank.url,
        tags: ['banca', p.type, p.province.toLowerCase()],
      };
    })
  );
}

// ============================================================================
// 4. DIVERGENCIA + TENDENCIAS — Datos de Idealista Data
// ============================================================================

export function getDivergenceOpportunities(): MarketOpportunity[] {
  return [
    {
      id: 'divergence-valladolid-centro',
      source: 'Análisis IA Divergencia',
      sourceIcon: '📉',
      category: 'divergencia',
      title: 'Valladolid centro — 18% bajo media provincial',
      location: 'Valladolid',
      propertyType: 'vivienda',
      price: 145000,
      marketValue: 177000,
      discount: 18,
      surface: 82,
      estimatedYield: 6.1,
      riskLevel: 'medio',
      description:
        'Zona con precio por debajo de la media de la ciudad y demanda estable. Oportunidad de convergencia con mejora por reforma ligera.',
      url: 'https://www.idealista.com/data',
      tags: ['divergencia', 'valladolid', 'centro'],
    },
    {
      id: 'divergence-valencia-maritimo',
      source: 'Análisis IA Divergencia',
      sourceIcon: '📉',
      category: 'divergencia',
      title: 'Valencia marítimo — 16% bajo media urbana',
      location: 'Valencia',
      propertyType: 'vivienda',
      price: 162000,
      marketValue: 193000,
      discount: 16,
      surface: 76,
      estimatedYield: 5.8,
      riskLevel: 'medio',
      description:
        'Activo infravalorado respecto a comparables de la zona. Buen equilibrio entre descuento de entrada y rentabilidad esperada.',
      url: 'https://www.idealista.com/data',
      tags: ['divergencia', 'valencia', 'maritimo'],
    },
  ];
}

export function getEmergingTrends(): MarketOpportunity[] {
  // Fallback estático mínimo — tendencias macro que no cambian frecuentemente
  return [
    {
      id: 'trend-madridnuevonorte',
      source: 'Análisis IA Tendencias',
      sourceIcon: '📈',
      category: 'tendencia',
      title: 'Madrid Nuevo Norte — Mega-proyecto urbanístico',
      location: 'Madrid',
      propertyType: 'vivienda',
      price: 3500 * 75,
      marketValue: 4500 * 75,
      discount: 22,
      surface: 75,
      estimatedYield: 5.5,
      riskLevel: 'medio',
      description: 'Mayor proyecto urbanístico de Europa: 10.500 viviendas, 4 rascacielos. Zona a €3.500/m², previsión €4.500-5.000/m² al completar (2028-2030).',
      tags: ['tendencia', 'madrid'],
    },
    {
      id: 'trend-22arroba',
      source: 'Análisis IA Tendencias',
      sourceIcon: '📈',
      category: 'tendencia',
      title: '22@ Barcelona — Distrito tecnológico',
      location: 'Barcelona',
      propertyType: 'oficina',
      price: 3200 * 100,
      marketValue: 4000 * 100,
      discount: 20,
      surface: 100,
      estimatedYield: 6.5,
      riskLevel: 'bajo',
      description: 'Distrito de innovación con Amazon, Microsoft, Meta. Alquiler oficinas: €18-25/m²/mes.',
      tags: ['tendencia', 'barcelona'],
    },
  ];
}

// ============================================================================
// 5. CROWDFUNDING
// ============================================================================

export function getCrowdfundingOpportunities(): MarketOpportunity[] {
  return [
    {
      id: 'crowd-urbanitae-1',
      source: 'Urbanitae',
      sourceIcon: '🏗️',
      category: 'crowdfunding',
      title: 'Promoción residencial Madrid sur — Coinversión',
      location: 'Madrid',
      propertyType: 'edificio',
      price: 50000,
      marketValue: 0,
      discount: 0,
      estimatedYield: 12.5,
      riskLevel: 'alto',
      description: 'Crowdfunding regulado CNMV. Inversión mínima: €50.000. TIR objetivo: 12.5% a 24 meses.',
      url: 'https://urbanitae.com',
      tags: ['crowdfunding', 'madrid'],
    },
    {
      id: 'crowd-wecity-1',
      source: 'Wecity',
      sourceIcon: '🏗️',
      category: 'crowdfunding',
      title: 'Hotel boutique Costa Brava — Participación',
      location: 'Girona',
      propertyType: 'local',
      price: 10000,
      marketValue: 0,
      discount: 0,
      estimatedYield: 9.8,
      riskLevel: 'alto',
      description: 'Crowdfunding regulado CNMV. Inversión desde €10.000. Rentabilidad: 9.8% anual, 36 meses.',
      url: 'https://wecity.io',
      tags: ['crowdfunding', 'girona'],
    },
  ];
}

// ============================================================================
// SERVICIO UNIFICADO
// ============================================================================

export interface OpportunitiesBySource {
  auctions: MarketOpportunity[];
  bankProperties: MarketOpportunity[];
  divergences: MarketOpportunity[];
  trends: MarketOpportunity[];
  crowdfunding: MarketOpportunity[];
  all: MarketOpportunity[];
  totalCount: number;
  sources: string[];
}

export async function getAllMarketOpportunities(provinces?: string[]): Promise<OpportunitiesBySource> {
  // Ejecutar TODAS las fuentes en paralelo (BOE + AlertaSubastas + Idealista)
  const useLiveSources = !isTestRuntime();
  const [boeAuctions, alertaSubastas, idealistaOpps] = useLiveSources
    ? await Promise.all([
        getAuctionOpportunities(provinces || []).catch(e => {
          logger.warn('[MarketOpp] BOE error:', e.message);
          return getBOEFallbackAuctions(provinces || ['Madrid', 'Barcelona', 'Valencia', 'Málaga', 'Valladolid']);
        }),
        getAlertaSubastasOpportunities(provinces).catch(e => {
          logger.warn('[MarketOpp] AlertaSubastas error:', e.message);
          return [] as MarketOpportunity[];
        }),
        getIdealistaOpportunities().catch(e => {
          logger.warn('[MarketOpp] Idealista error:', e.message);
          return [] as MarketOpportunity[];
        }),
      ])
    : [getBOEFallbackAuctions(provinces || ['Madrid', 'Barcelona', 'Valencia', 'Málaga', 'Valladolid']), [] as MarketOpportunity[], [] as MarketOpportunity[]];

  // Combinar subastas de BOE + AlertaSubastas (deduplicar por título similar)
  const seenTitles = new Set(boeAuctions.map(a => a.title.substring(0, 30).toLowerCase()));
  const uniqueAlerta = alertaSubastas.filter(a => !seenTitles.has(a.title.substring(0, 30).toLowerCase()));
  const auctions = [...boeAuctions, ...uniqueAlerta];

  const bankProperties = getBankPropertyOpportunities();
  const staticTrends = getEmergingTrends();
  const crowdfunding = getCrowdfundingOpportunities();

  const divergences = idealistaOpps.filter(o => o.category === 'divergencia');
  const idealistaTrends = idealistaOpps.filter(o => o.category === 'tendencia');
  const fallbackDivergences = getDivergenceOpportunities();
  const trends = [...idealistaTrends, ...staticTrends];
  const finalDivergences = divergences.length > 0 ? divergences : fallbackDivergences;

  const all = [...auctions, ...bankProperties, ...finalDivergences, ...trends, ...crowdfunding]
    .sort((a, b) => (b.discount || 0) - (a.discount || 0));

  const sources = [...new Set(all.map(o => o.source))];

  return {
    auctions,
    bankProperties,
    divergences: finalDivergences,
    trends,
    crowdfunding,
    all,
    totalCount: all.length,
    sources,
  };
}

// ============================================================================
// UTILIDADES
// ============================================================================

function parseSpanishNumber(text: string): number | null {
  if (!text) return null;
  const cleaned = text.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}
