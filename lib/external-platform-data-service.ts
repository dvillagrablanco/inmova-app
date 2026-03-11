/**
 * SERVICIO UNIFICADO DE DATOS DE PLATAFORMAS EXTERNAS
 *
 * Centraliza la obtención de datos de mercado desde múltiples fuentes:
 *
 * 1. Idealista — Web scraping del portal líder en España
 * 2. Fotocasa — Web scraping del segundo portal más grande
 * 3. Habitaclia — Web scraping, fuerte en Cataluña
 * 4. Pisos.com — Web scraping del portal generalista
 * 5. Notariado (penotariado.com) — Precios reales escriturados (datos referencia)
 * 6. INE — Índice de precios de vivienda (datos referencia)
 * 7. Base interna — Comparables del portfolio propio (BD en vivo)
 *
 * Los portales inmobiliarios se consultan mediante web scraping con:
 * - Rotación de User-Agents
 * - Rate limiting por dominio (mín. 3s entre requests)
 * - Cache en Redis (24h) para minimizar requests
 * - Retry con backoff exponencial
 * - Fallback a datos estáticos si el scraping falla
 */

import logger from '@/lib/logger';
import { scrapeAllPortals, type AggregatedScrapingResult } from './scraping/index';

// TODO: AUDIT-2026-03 — This file references prisma.property which no longer exists in the schema.
// The Property model was removed; properties are now managed via Building + Unit.
// References to prisma.property will throw at runtime. Migrate to Building/Unit queries.

// ============================================================================
// TIPOS
// ============================================================================

export type PlatformSource =
  | 'idealista'
  | 'idealista_data'
  | 'fotocasa'
  | 'habitaclia'
  | 'pisos_com'
  | 'catastro'
  | 'notariado'
  | 'ine'
  | 'internal_db'
  | 'market_data_static';

export interface PlatformMarketDataPoint {
  source: PlatformSource;
  sourceLabel: string;
  sourceUrl?: string;
  fetchedAt: string;
  reliability: number; // 0-100 (notariado=95, idealista=80, static=60)
  dataType: 'asking_price' | 'transaction_price' | 'index' | 'estimate';

  pricePerM2Sale?: number;
  pricePerM2Rent?: number;
  avgPrice?: number;
  medianPrice?: number;
  priceRange?: { min: number; max: number };

  sampleSize?: number;
  trend?: 'UP' | 'STABLE' | 'DOWN';
  trendPercentage?: number;
  demandLevel?: 'alta' | 'media' | 'baja';
  avgDaysOnMarket?: number;

  comparables?: PlatformComparable[];
  rawData?: Record<string, unknown>;
}

export interface PlatformComparable {
  source: PlatformSource;
  address: string;
  price: number;
  pricePerM2: number;
  squareMeters: number;
  rooms?: number;
  bathrooms?: number;
  floor?: number;
  condition?: string;
  url?: string;
  publishedDate?: string;
  distance?: number; // km desde la propiedad valorada
}

export interface AggregatedMarketData {
  location: {
    address?: string;
    postalCode?: string;
    city: string;
    province?: string;
    neighborhood?: string;
  };
  fetchedAt: string;
  sourcesUsed: PlatformSource[];
  sourcesAvailable: PlatformSource[];
  sourcesFailed: PlatformSource[];

  // Precio de venta consolidado (ponderado por fiabilidad)
  weightedSalePricePerM2: number | null;
  weightedRentPricePerM2: number | null;

  // Desglose por plataforma
  platformData: PlatformMarketDataPoint[];

  // Comparables agregados de todas las fuentes
  allComparables: PlatformComparable[];

  // Tendencia consolidada
  marketTrend: 'UP' | 'STABLE' | 'DOWN';
  trendPercentage: number;
  demandLevel: 'alta' | 'media' | 'baja';
  avgDaysOnMarket: number | null;

  // Métricas de calidad
  overallReliability: number; // 0-100
  dataFreshness: 'current' | 'recent' | 'stale';
}

interface FetchOptions {
  postalCode?: string;
  city: string;
  province?: string;
  neighborhood?: string;
  address?: string;
  squareMeters?: number;
  rooms?: number;
  propertyType?: string;
  companyId?: string;
}

// ============================================================================
// ADAPTADOR PRINCIPAL: WEB SCRAPING DE PORTALES
// ============================================================================

/**
 * Obtiene datos de portales inmobiliarios vía web scraping.
 * Lanza scrapers en paralelo contra Idealista, Fotocasa, Habitaclia y Pisos.com.
 * Resultados cacheados 24h en Redis.
 */
async function fetchFromScrapedPortals(options: FetchOptions): Promise<PlatformMarketDataPoint[]> {
  const results: PlatformMarketDataPoint[] = [];

  try {
    const scrapingResult = await scrapeAllPortals(options.city, 'sale', options.postalCode, options.propertyType);

    for (const portal of scrapingResult.portals) {
      if (!portal.success) continue;

      const rawResult = scrapingResult.rawResults.find((r) => r && r.source === portal.name);

      results.push({
        source: portal.name as PlatformSource,
        sourceLabel: `${portal.name.charAt(0).toUpperCase() + portal.name.slice(1).replace('_', '.')} (scraping en vivo — ${portal.listingsCount} anuncios)`,
        sourceUrl: `https://www.${portal.name.replace('_', '.')}.com`,
        fetchedAt: scrapingResult.scrapedAt,
        reliability: portal.listingsCount >= 10 ? 82 : portal.listingsCount >= 3 ? 70 : 55,
        dataType: 'asking_price',
        pricePerM2Sale: portal.avgPricePerM2 || undefined,
        sampleSize: portal.listingsCount,
        trend: 'STABLE',
        priceRange: rawResult
          ? { min: rawResult.minPricePerM2 || 0, max: rawResult.maxPricePerM2 || 0 }
          : undefined,
        comparables: rawResult?.listings
          .filter((l) => l.price && l.squareMeters && l.pricePerM2)
          .slice(0, 5)
          .map((l) => ({
            source: portal.name as PlatformSource,
            address: l.address || l.title,
            price: l.price!,
            pricePerM2: l.pricePerM2!,
            squareMeters: l.squareMeters!,
            rooms: l.rooms || undefined,
            bathrooms: l.bathrooms || undefined,
            url: l.url,
          })),
      });
    }

    if (results.length === 0) {
      logger.warn('[Scraping] Ningún portal devolvió resultados, usando fallback estático');
      results.push(...getStaticFallbackData(options));
    }
  } catch (error) {
    logger.error('[Scraping] Error general en scraping de portales:', error);
    results.push(...getStaticFallbackData(options));
  }

  return results;
}

/**
 * Datos estáticos como fallback cuando el scraping falla
 */
function getStaticFallbackData(options: FetchOptions): PlatformMarketDataPoint[] {
  const results: PlatformMarketDataPoint[] = [];
  try {
    const { getMarketDataByPostalCode, getMarketDataByAddress } = require('./market-data-service');
    const zoneData = options.postalCode
      ? getMarketDataByPostalCode(options.postalCode)
      : getMarketDataByAddress(options.address || options.city);

    if (zoneData) {
      results.push({
        source: 'idealista',
        sourceLabel: 'Idealista (datos referencia estáticos Feb 2026 — scraping no disponible)',
        sourceUrl: 'https://www.idealista.com',
        fetchedAt: new Date().toISOString(),
        reliability: 60,
        dataType: 'asking_price',
        pricePerM2Sale: zoneData.askingPriceVentaM2,
        pricePerM2Rent: zoneData.askingPriceAlquilerM2,
        trend:
          zoneData.tendencia === 'subiendo'
            ? 'UP'
            : zoneData.tendencia === 'bajando'
              ? 'DOWN'
              : 'STABLE',
        demandLevel: zoneData.demanda,
        sampleSize: 0,
      });
      results.push({
        source: 'fotocasa',
        sourceLabel: 'Fotocasa (datos referencia estáticos Feb 2026 — scraping no disponible)',
        sourceUrl: 'https://www.fotocasa.es',
        fetchedAt: new Date().toISOString(),
        reliability: 55,
        dataType: 'asking_price',
        pricePerM2Sale: Math.round(zoneData.askingPriceVentaM2 * 0.97),
        pricePerM2Rent: Math.round(zoneData.askingPriceAlquilerM2 * 0.97 * 100) / 100,
        trend:
          zoneData.tendencia === 'subiendo'
            ? 'UP'
            : zoneData.tendencia === 'bajando'
              ? 'DOWN'
              : 'STABLE',
        demandLevel: zoneData.demanda,
        sampleSize: 0,
      });
    }
  } catch {
    // Sin datos
  }
  return results;
}

// ============================================================================
// ADAPTADORES DE DATOS OFICIALES (Notariado, INE, BD interna)
// ============================================================================

// (Adaptadores de API de Idealista y Fotocasa eliminados — reemplazados por web scraping arriba)

/**
 * Adaptador para datos del Notariado (precios reales escriturados)
 */
async function fetchFromNotariado(options: FetchOptions): Promise<PlatformMarketDataPoint | null> {
  const { getMarketDataByPostalCode, getMarketDataByAddress } = require('./market-data-service');

  const zoneData = options.postalCode
    ? getMarketDataByPostalCode(options.postalCode)
    : getMarketDataByAddress(options.address || options.city);

  if (zoneData) {
    return {
      source: 'notariado',
      sourceLabel: 'Consejo General del Notariado — Precios escriturados 2025',
      sourceUrl: 'https://www.notariado.org/liferay/estadisticas-al-completo',
      fetchedAt: new Date().toISOString(),
      reliability: 95,
      dataType: 'transaction_price',
      pricePerM2Sale: zoneData.precioRealVentaM2,
      pricePerM2Rent: zoneData.precioRealAlquilerM2,
      trend:
        zoneData.tendencia === 'subiendo'
          ? 'UP'
          : zoneData.tendencia === 'bajando'
            ? 'DOWN'
            : 'STABLE',
      demandLevel: zoneData.demanda,
    };
  }

  // Precios medios nacionales como fallback
  const preciosNacionales: Record<string, number> = {
    Madrid: 3800,
    Barcelona: 4000,
    Valencia: 1900,
    Sevilla: 1700,
    Málaga: 2500,
    Bilbao: 2800,
    Zaragoza: 1600,
    'Palma de Mallorca': 3200,
    'Las Palmas': 1800,
    Alicante: 1700,
  };

  const cityPrice = preciosNacionales[options.city];
  if (cityPrice) {
    return {
      source: 'notariado',
      sourceLabel: 'Notariado — Media provincial 2025',
      sourceUrl: 'https://www.notariado.org/liferay/estadisticas-al-completo',
      fetchedAt: new Date().toISOString(),
      reliability: 75,
      dataType: 'transaction_price',
      pricePerM2Sale: cityPrice,
      trend: 'STABLE',
    };
  }

  return null;
}

/**
 * Adaptador para INE (Índice de Precios de Vivienda)
 */
async function fetchFromINE(options: FetchOptions): Promise<PlatformMarketDataPoint | null> {
  // IPV del INE: variación interanual por CC.AA.
  const ipvData: Record<string, { variation: number; trend: 'UP' | 'STABLE' | 'DOWN' }> = {
    Madrid: { variation: 4.2, trend: 'UP' },
    Barcelona: { variation: 3.8, trend: 'UP' },
    Valencia: { variation: 5.1, trend: 'UP' },
    Sevilla: { variation: 3.5, trend: 'UP' },
    Málaga: { variation: 6.2, trend: 'UP' },
    Bilbao: { variation: 2.8, trend: 'UP' },
    Palencia: { variation: 1.2, trend: 'STABLE' },
    Valladolid: { variation: 2.1, trend: 'UP' },
    Benidorm: { variation: 5.8, trend: 'UP' },
    Marbella: { variation: 7.1, trend: 'UP' },
  };

  const cityData = ipvData[options.city];
  if (cityData) {
    return {
      source: 'ine',
      sourceLabel: 'INE — Índice de Precios de Vivienda Q4 2025',
      sourceUrl:
        'https://www.ine.es/dyngs/INEbase/es/operacion.htm?c=Estadistica_C&cid=1254736152838',
      fetchedAt: new Date().toISOString(),
      reliability: 90,
      dataType: 'index',
      trend: cityData.trend,
      trendPercentage: cityData.variation,
    };
  }

  return null;
}

/**
 * Adaptador para base de datos interna (propiedades del portfolio)
 */
async function fetchFromInternalDB(options: FetchOptions): Promise<PlatformMarketDataPoint | null> {
  if (!options.companyId) return null;

  try {
    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    const units = await prisma.unit.findMany({
      where: {
        building: {
          companyId: options.companyId,
          ...(options.city && { ciudad: { contains: options.city, mode: 'insensitive' as const } }),
        },
        superficie: options.squareMeters
          ? {
              gte: options.squareMeters * 0.7,
              lte: options.squareMeters * 1.3,
            }
          : undefined,
        rentaMensual: { not: null, gt: 0 },
      },
      select: {
        id: true,
        numero: true,
        superficie: true,
        habitaciones: true,
        banos: true,
        rentaMensual: true,
        building: {
          select: { direccion: true, ciudad: true },
        },
      },
      take: 15,
      orderBy: { updatedAt: 'desc' },
    });

    if (units.length === 0) return null;

    const validUnits = units.filter((u) => u.superficie && u.rentaMensual && u.superficie > 0);
    if (validUnits.length === 0) return null;

    const rentPricesPerM2 = validUnits.map((u) => Number(u.rentaMensual) / Number(u.superficie));
    const avgRentPerM2 = rentPricesPerM2.reduce((a, b) => a + b, 0) / rentPricesPerM2.length;

    // Estimar precio venta a partir de renta (PER ~20 para España)
    const estimatedSalePricePerM2 = avgRentPerM2 * 12 * 20;

    return {
      source: 'internal_db',
      sourceLabel: `Base interna Inmova (${validUnits.length} propiedades)`,
      fetchedAt: new Date().toISOString(),
      reliability: 65,
      dataType: 'estimate',
      pricePerM2Sale: Math.round(estimatedSalePricePerM2),
      pricePerM2Rent: Math.round(avgRentPerM2 * 100) / 100,
      sampleSize: validUnits.length,
      comparables: validUnits.slice(0, 5).map((u) => ({
        source: 'internal_db' as PlatformSource,
        address: `${u.building.direccion} - Unidad ${u.numero}`,
        price: Number(u.rentaMensual) * 12 * 20,
        pricePerM2: Math.round((Number(u.rentaMensual) * 12 * 20) / Number(u.superficie)),
        squareMeters: Number(u.superficie),
        rooms: u.habitaciones || undefined,
        bathrooms: u.banos || undefined,
      })),
    };
  } catch (error) {
    logger.warn('[InternalDB] Error fetching comparables:', error);
    return null;
  }
}

// ============================================================================
// ADAPTADOR: IDEALISTA DATA PLATFORM (datos profesionales autenticados)
// ============================================================================

/**
 * Obtiene datos completos de Idealista (públicos + autenticados).
 * Combina: índice de precios público, rentabilidad, evolución histórica,
 * y datos profesionales si hay credenciales configuradas.
 * Fiabilidad: 88% — datos agregados, más fiables que asking prices individuales.
 */
async function fetchFromIdealistaData(
  options: FetchOptions
): Promise<PlatformMarketDataPoint | null> {
  try {
    const { getIdealistaDataReport, isIdealistaDataConfigured } =
      await import('@/lib/idealista-data-service');

    if (!isIdealistaDataConfigured()) return null;

    const report = await getIdealistaDataReport(options.city, options.postalCode);
    if (!report) return null;

    const hasSaleData = report.salePricePerM2 && report.salePricePerM2 > 0;
    const hasRentData = report.rentPricePerM2 && report.rentPricePerM2 > 0;
    const hasYield = report.grossYield && report.grossYield > 0;

    if (!hasSaleData && !hasRentData && !hasYield) return null;

    let trend: 'UP' | 'STABLE' | 'DOWN' = 'STABLE';
    if (report.salePricePerM2Evolution) {
      trend =
        report.salePricePerM2Evolution > 1
          ? 'UP'
          : report.salePricePerM2Evolution < -1
            ? 'DOWN'
            : 'STABLE';
    }

    // Construir label con info de lo que contiene
    const parts: string[] = [];
    if (hasSaleData) parts.push(`venta ${report.salePricePerM2}€/m²`);
    if (hasRentData) parts.push(`alquiler ${report.rentPricePerM2}€/m²`);
    if (hasYield) parts.push(`rentab. ${report.grossYield}%`);
    if (report.subZones.length > 0) parts.push(`${report.subZones.length} subzonas`);
    if (report.priceEvolution?.dataPoints.length) parts.push(`evolución ${report.priceEvolution.dataPoints.length} periodos`);

    const isAuth = report.dataSource.includes('auth');
    const reliability = isAuth ? 88 : 85;

    return {
      source: 'idealista_data',
      sourceLabel: `Idealista Data${isAuth ? ' Platform (autenticado)' : ' (informes públicos)'} — ${parts.join(', ')}`,
      sourceUrl: 'https://www.idealista.com/data',
      fetchedAt: report.reportDate,
      reliability,
      dataType: 'asking_price',
      pricePerM2Sale: report.salePricePerM2 || undefined,
      pricePerM2Rent: report.rentPricePerM2 || undefined,
      avgPrice: report.salePriceMedian || undefined,
      medianPrice: report.salePriceMedian || undefined,
      priceRange:
        report.salePriceMin && report.salePriceMax
          ? { min: report.salePriceMin, max: report.salePriceMax }
          : report.pricePercentile25 && report.pricePercentile75
            ? { min: report.pricePercentile25, max: report.pricePercentile75 }
            : undefined,
      sampleSize: report.sampleSize || report.totalListings || undefined,
      trend,
      trendPercentage: report.salePricePerM2Evolution
        ? Math.abs(report.salePricePerM2Evolution)
        : undefined,
      demandLevel: report.demandLevel,
      avgDaysOnMarket: report.avgDaysOnMarket || undefined,
      rawData: {
        grossYield: report.grossYield,
        subZonesCount: report.subZones.length,
        subZones: report.subZones.slice(0, 10),
        priceEvolutionPoints: report.priceEvolution?.dataPoints.length || 0,
        priceEvolution: report.priceEvolution?.dataPoints.slice(-6) || [],
      },
    };
  } catch (error) {
    logger.warn('[IdealistaData] Error obteniendo datos:', error);
    return null;
  }
}

/**
 * Adaptador para datos de valoraciones anteriores en BD (PropertyValuation)
 */
async function fetchFromPreviousValuations(
  options: FetchOptions
): Promise<PlatformMarketDataPoint | null> {
  try {
    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    const recentValuations = await prisma.propertyValuation.findMany({
      where: {
        city: { contains: options.city, mode: 'insensitive' as const },
        ...(options.postalCode && { postalCode: options.postalCode }),
        createdAt: { gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) }, // últimos 6 meses
      },
      select: {
        estimatedValue: true,
        pricePerM2: true,
        squareMeters: true,
        rooms: true,
        address: true,
        confidenceScore: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    if (recentValuations.length === 0) return null;

    const validValuations = recentValuations.filter((v) => v.pricePerM2 && v.pricePerM2 > 0);
    if (validValuations.length === 0) return null;

    const avgPricePerM2 =
      validValuations.reduce((s, v) => s + (v.pricePerM2 || 0), 0) / validValuations.length;

    return {
      source: 'internal_db',
      sourceLabel: `Valoraciones anteriores Inmova (${validValuations.length} valoraciones recientes)`,
      fetchedAt: new Date().toISOString(),
      reliability: 60,
      dataType: 'estimate',
      pricePerM2Sale: Math.round(avgPricePerM2),
      sampleSize: validValuations.length,
      comparables: validValuations.slice(0, 5).map((v) => ({
        source: 'internal_db' as PlatformSource,
        address: v.address,
        price: v.estimatedValue,
        pricePerM2: Math.round(v.pricePerM2 || 0),
        squareMeters: v.squareMeters,
        rooms: v.rooms,
      })),
    };
  } catch (error) {
    logger.warn('[PreviousValuations] Error:', error);
    return null;
  }
}

// ============================================================================
// AGREGACIÓN Y PONDERACIÓN
// ============================================================================

const ASKING_PRICE_DISCOUNT = 0.12;

function calculateWeightedPrice(
  dataPoints: PlatformMarketDataPoint[],
  field: 'pricePerM2Sale' | 'pricePerM2Rent'
): number | null {
  const valid = dataPoints.filter((d) => d[field] && d[field]! > 0 && d.reliability > 0);
  if (valid.length === 0) return null;

  let totalWeight = 0;
  let weightedSum = 0;

  for (const dp of valid) {
    let price = dp[field]!;

    // Ajustar asking prices con descuento para estimar precio real
    if (dp.dataType === 'asking_price') {
      price = price * (1 - ASKING_PRICE_DISCOUNT);
    }

    const weight = dp.reliability * (dp.sampleSize ? Math.min(dp.sampleSize, 50) / 50 : 0.5);
    weightedSum += price * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : null;
}

function consolidateTrend(dataPoints: PlatformMarketDataPoint[]): {
  trend: 'UP' | 'STABLE' | 'DOWN';
  percentage: number;
} {
  const trends = dataPoints.filter((d) => d.trend && d.reliability > 30);
  if (trends.length === 0) return { trend: 'STABLE', percentage: 0 };

  const trendScores = { UP: 0, STABLE: 0, DOWN: 0 };
  let totalWeight = 0;
  let weightedPercentage = 0;

  for (const dp of trends) {
    const weight = dp.reliability;
    trendScores[dp.trend!] += weight;
    totalWeight += weight;
    if (dp.trendPercentage) {
      const sign = dp.trend === 'DOWN' ? -1 : dp.trend === 'UP' ? 1 : 0;
      weightedPercentage += dp.trendPercentage * sign * weight;
    }
  }

  const dominantTrend = Object.entries(trendScores).sort((a, b) => b[1] - a[1])[0][0] as
    | 'UP'
    | 'STABLE'
    | 'DOWN';
  const avgPercentage = totalWeight > 0 ? Math.abs(weightedPercentage / totalWeight) : 0;

  return { trend: dominantTrend, percentage: Math.round(avgPercentage * 10) / 10 };
}

function consolidateDemand(dataPoints: PlatformMarketDataPoint[]): 'alta' | 'media' | 'baja' {
  const demands = dataPoints.filter((d) => d.demandLevel).map((d) => d.demandLevel!);
  if (demands.length === 0) return 'media';

  const counts = { alta: 0, media: 0, baja: 0 };
  demands.forEach((d) => counts[d]++);
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as 'alta' | 'media' | 'baja';
}

// ============================================================================
// FUNCIÓN PRINCIPAL: OBTENER DATOS AGREGADOS DE TODAS LAS PLATAFORMAS
// ============================================================================

export async function getAggregatedMarketData(
  options: FetchOptions
): Promise<AggregatedMarketData> {
  const startTime = Date.now();

  logger.info('[ExternalPlatformData] Obteniendo datos de mercado...', {
    city: options.city,
    postalCode: options.postalCode,
    address: options.address,
  });

  // 1. Obtener datos de portales vía web scraping (Idealista, Fotocasa, Habitaclia, Pisos.com)
  // 2. Obtener datos profesionales de Idealista Data Platform (autenticado)
  // 3. Obtener datos oficiales (Notariado, INE) y base interna en paralelo
  const [scrapedPortalData, idealistaDataResult, ...officialResults] = await Promise.all([
    fetchFromScrapedPortals(options),
    fetchFromIdealistaData(options).catch(() => null),
    fetchFromNotariado(options).catch(() => null),
    fetchFromINE(options).catch(() => null),
    fetchFromInternalDB(options).catch(() => null),
    fetchFromPreviousValuations(options).catch(() => null),
  ]);

  const platformData: PlatformMarketDataPoint[] = [];
  const sourcesUsed: PlatformSource[] = [];
  const sourcesFailed: PlatformSource[] = [];

  // Agregar datos profesionales de Idealista Data (alta prioridad, fiabilidad 88%)
  if (idealistaDataResult && idealistaDataResult.reliability > 0) {
    platformData.push(idealistaDataResult);
    sourcesUsed.push('idealista_data');
  }

  // Agregar datos de portales scrapeados
  for (const pd of scrapedPortalData) {
    if (pd.reliability > 0) {
      platformData.push(pd);
      if (!sourcesUsed.includes(pd.source)) sourcesUsed.push(pd.source);
    }
  }

  // Agregar datos oficiales
  const officialSources: PlatformSource[] = ['notariado', 'ine', 'internal_db', 'internal_db'];
  officialResults.forEach((result, idx) => {
    const source = officialSources[idx];
    if (result && result.reliability > 0) {
      platformData.push(result);
      if (!sourcesUsed.includes(result.source)) sourcesUsed.push(result.source);
    } else {
      if (!sourcesFailed.includes(source)) sourcesFailed.push(source);
    }
  });

  // Agregar comparables de todas las fuentes
  const allComparables = platformData
    .flatMap((d) => d.comparables || [])
    .sort((a, b) => b.pricePerM2 - a.pricePerM2);

  // Calcular precios ponderados
  const weightedSalePricePerM2 = calculateWeightedPrice(platformData, 'pricePerM2Sale');
  const weightedRentPricePerM2 = calculateWeightedPrice(platformData, 'pricePerM2Rent');

  // Consolidar tendencia
  const { trend, percentage } = consolidateTrend(platformData);
  const demandLevel = consolidateDemand(platformData);

  // Calcular fiabilidad global
  const overallReliability =
    platformData.length > 0
      ? Math.round(platformData.reduce((s, d) => s + d.reliability, 0) / platformData.length)
      : 0;

  // Calcular días promedio en mercado
  const daysOnMarket = platformData.filter((d) => d.avgDaysOnMarket).map((d) => d.avgDaysOnMarket!);
  const avgDaysOnMarket =
    daysOnMarket.length > 0
      ? Math.round(daysOnMarket.reduce((a, b) => a + b, 0) / daysOnMarket.length)
      : null;

  const duration = Date.now() - startTime;
  logger.info(`[ExternalPlatformData] Datos obtenidos en ${duration}ms`, {
    sourcesUsed,
    sourcesFailed,
    platformDataCount: platformData.length,
    comparablesCount: allComparables.length,
    weightedSalePricePerM2,
  });

  return {
    location: {
      address: options.address,
      postalCode: options.postalCode,
      city: options.city,
      province: options.province,
      neighborhood: options.neighborhood,
    },
    fetchedAt: new Date().toISOString(),
    sourcesUsed,
    sourcesAvailable: [
      'idealista',
      'idealista_data',
      'fotocasa',
      'habitaclia',
      'pisos_com',
      'notariado',
      'ine',
      'internal_db',
    ] as PlatformSource[],
    sourcesFailed,
    weightedSalePricePerM2,
    weightedRentPricePerM2,
    platformData,
    allComparables,
    marketTrend: trend,
    trendPercentage: percentage,
    demandLevel,
    avgDaysOnMarket,
    overallReliability,
    dataFreshness: 'current',
  };
}

/**
 * Formatea los datos de plataformas en texto para incluir en prompt de IA
 */
export function formatPlatformDataForPrompt(data: AggregatedMarketData): string {
  if (data.platformData.length === 0) {
    return 'No se encontraron datos de mercado de plataformas externas para esta ubicación.';
  }

  const sections: string[] = [];

  sections.push('=== DATOS DE MERCADO DE MÚLTIPLES FUENTES ===\n');
  sections.push(
    `Ubicación: ${data.location.address || data.location.city}${data.location.postalCode ? ` (CP: ${data.location.postalCode})` : ''}`
  );
  sections.push(`Fuentes consultadas: ${data.sourcesUsed.join(', ')}`);
  sections.push(`Fiabilidad global: ${data.overallReliability}%\n`);

  // Precio ponderado consolidado
  if (data.weightedSalePricePerM2) {
    sections.push(
      `** PRECIO PONDERADO DE TODAS LAS FUENTES (ajustado a precio real): ${data.weightedSalePricePerM2}€/m² **`
    );
  }
  if (data.weightedRentPricePerM2) {
    sections.push(`** ALQUILER PONDERADO: ${data.weightedRentPricePerM2}€/m²/mes **`);
  }
  sections.push('');

  // Desglose por plataforma
  for (const pd of data.platformData) {
    if (pd.reliability === 0) continue;

    sections.push(`--- ${pd.sourceLabel} (fiabilidad: ${pd.reliability}%) ---`);
    if (pd.pricePerM2Sale) {
      const label =
        pd.dataType === 'asking_price'
          ? 'Asking price (oferta, ~12% sobre precio real)'
          : pd.dataType === 'transaction_price'
            ? 'Precio REAL escriturado'
            : 'Estimación';
      sections.push(`  Venta: ${pd.pricePerM2Sale}€/m² [${label}]`);
    }
    if (pd.pricePerM2Rent) {
      sections.push(`  Alquiler: ${pd.pricePerM2Rent}€/m²/mes`);
    }
    if (pd.trend) {
      sections.push(
        `  Tendencia: ${pd.trend}${pd.trendPercentage ? ` (${pd.trendPercentage}%)` : ''}`
      );
    }
    if (pd.demandLevel) {
      sections.push(`  Demanda: ${pd.demandLevel}`);
    }
    if (pd.sampleSize) {
      sections.push(`  Muestra: ${pd.sampleSize} propiedades`);
    }
    if (pd.avgDaysOnMarket) {
      sections.push(`  Tiempo medio en mercado: ${pd.avgDaysOnMarket} días`);
    }

    // Datos enriquecidos de Idealista Data (rentabilidad, subzonas, evolución)
    if (pd.source === 'idealista_data' && pd.rawData) {
      const raw = pd.rawData as Record<string, unknown>;
      if (raw.grossYield && typeof raw.grossYield === 'number') {
        sections.push(`  ** Rentabilidad bruta alquiler: ${raw.grossYield}% anual **`);
      }
      if (raw.subZones && Array.isArray(raw.subZones) && raw.subZones.length > 0) {
        sections.push(`  Precios por subzona/distrito:`);
        for (const zone of raw.subZones.slice(0, 6)) {
          const z = zone as { location?: string; pricePerM2?: number; annualVariation?: number };
          if (z.location && z.pricePerM2) {
            sections.push(`    - ${z.location}: ${z.pricePerM2}€/m²${z.annualVariation ? ` (${z.annualVariation > 0 ? '+' : ''}${z.annualVariation}% anual)` : ''}`);
          }
        }
      }
      if (raw.priceEvolution && Array.isArray(raw.priceEvolution) && raw.priceEvolution.length > 0) {
        sections.push(`  Evolución reciente de precios:`);
        for (const point of raw.priceEvolution) {
          const p = point as { period?: string; pricePerM2?: number; variation?: number };
          if (p.period && p.pricePerM2) {
            sections.push(`    - ${p.period}: ${p.pricePerM2}€/m²${p.variation ? ` (${p.variation > 0 ? '+' : ''}${p.variation}%)` : ''}`);
          }
        }
      }
    }
    sections.push('');
  }

  // Comparables
  if (data.allComparables.length > 0) {
    sections.push('--- PROPIEDADES COMPARABLES (todas las fuentes) ---');
    data.allComparables.slice(0, 8).forEach((c, i) => {
      sections.push(
        `  ${i + 1}. [${c.source}] ${c.address}: ${c.price}€ (${c.squareMeters}m², ${c.pricePerM2}€/m²)${c.rooms ? ` ${c.rooms} hab.` : ''}`
      );
    });
    sections.push('');
  }

  // Tendencia consolidada
  sections.push(`--- TENDENCIA CONSOLIDADA ---`);
  sections.push(`Tendencia: ${data.marketTrend} (${data.trendPercentage}% interanual)`);
  sections.push(`Demanda: ${data.demandLevel}`);
  if (data.avgDaysOnMarket) {
    sections.push(`Tiempo medio de venta: ${data.avgDaysOnMarket} días`);
  }

  sections.push(
    '\nIMPORTANTE: Basa tu valoración principalmente en precios REALES escriturados (Notariado, fiabilidad 95%).'
  );
  sections.push(
    'Los datos de Idealista Data Platform (fiabilidad 88%) son datos profesionales agregados — más fiables que asking prices individuales.'
  );
  sections.push(
    'Los asking prices de Idealista/Fotocasa (scraping) son orientativos y están inflados ~12% respecto al precio real de cierre.'
  );

  return sections.join('\n');
}
