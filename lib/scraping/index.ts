/**
 * ORQUESTADOR DE SCRAPING DE PORTALES INMOBILIARIOS
 *
 * Ejecuta scrapers en paralelo contra Idealista, Fotocasa,
 * Habitaclia y Pisos.com, agrega los resultados y devuelve
 * un resumen de mercado unificado.
 */

import logger from '@/lib/logger';
import { scrapeIdealista } from './idealista-scraper';
import { scrapeFotocasa } from './fotocasa-scraper';
import { scrapeHabitaclia } from './habitaclia-scraper';
import { scrapePisosCom } from './pisos-com-scraper';
import { getCachedData, setCachedData, type ScrapedMarketSummary, type ScrapedListing } from './scraping-base';

export type { ScrapedMarketSummary, ScrapedListing } from './scraping-base';

export interface AggregatedScrapingResult {
  city: string;
  postalCode?: string;
  operation: 'sale' | 'rent';
  scrapedAt: string;

  portals: {
    name: string;
    success: boolean;
    listingsCount: number;
    avgPricePerM2: number | null;
    medianPricePerM2: number | null;
  }[];

  // Agregados de todos los portales
  totalListings: number;
  weightedAvgPricePerM2: number | null;
  medianPricePerM2: number | null;
  minPricePerM2: number | null;
  maxPricePerM2: number | null;
  avgPrice: number | null;

  // Top comparables (mejores de cada portal)
  topComparables: ScrapedListing[];

  // Resultados crudos por portal
  rawResults: (ScrapedMarketSummary | null)[];
}

// Pesos de fiabilidad por portal (asking prices)
const PORTAL_WEIGHTS: Record<string, number> = {
  idealista: 1.0,
  fotocasa: 0.9,
  pisos_com: 0.8,
  habitaclia: 0.85,
};

export async function scrapeAllPortals(
  city: string,
  operation: 'sale' | 'rent' = 'sale',
  postalCode?: string,
  propertyType?: string,
): Promise<AggregatedScrapingResult> {
  const pType = propertyType || 'vivienda';
  const cacheKey = `aggregated:${city.toLowerCase()}:${operation}:${pType}${postalCode ? `:${postalCode}` : ''}`;

  const cached = await getCachedData<AggregatedScrapingResult>(cacheKey);
  if (cached) {
    logger.info(`[Scraping] Cache HIT para ${city} (${operation}, ${pType})`);
    return cached;
  }

  const startTime = Date.now();
  logger.info(`[Scraping] Iniciando scraping de ${city} (${operation}, ${pType}) en todos los portales...`);

  // Idealista soporta todos los tipos; otros portales solo vivienda
  const results = await Promise.allSettled([
    scrapeIdealista(city, operation, postalCode, pType),
    scrapeFotocasa(city, operation, postalCode),
    scrapeHabitaclia(city, operation, postalCode),
    scrapePisosCom(city, operation, postalCode),
  ]);

  const portalNames = ['idealista', 'fotocasa', 'habitaclia', 'pisos_com'];
  const rawResults: (ScrapedMarketSummary | null)[] = results.map((r) =>
    r.status === 'fulfilled' ? r.value : null,
  );

  const portals = portalNames.map((name, idx) => {
    const result = rawResults[idx];
    return {
      name,
      success: !!result && result.totalListings > 0,
      listingsCount: result?.totalListings || 0,
      avgPricePerM2: result?.avgPricePerM2 || null,
      medianPricePerM2: result?.medianPricePerM2 || null,
    };
  });

  // Calcular media ponderada de precio/m² de todos los portales
  let weightedSum = 0;
  let weightTotal = 0;
  const allPricesPerM2: number[] = [];
  const allPrices: number[] = [];
  const allListings: ScrapedListing[] = [];

  for (let i = 0; i < rawResults.length; i++) {
    const result = rawResults[i];
    if (!result || !result.avgPricePerM2) continue;

    const portalName = portalNames[i];
    const weight = (PORTAL_WEIGHTS[portalName] || 0.7) * Math.min(result.totalListings, 30) / 30;
    weightedSum += result.avgPricePerM2 * weight;
    weightTotal += weight;

    for (const listing of result.listings) {
      if (listing.pricePerM2) allPricesPerM2.push(listing.pricePerM2);
      if (listing.price) allPrices.push(listing.price);
      allListings.push(listing);
    }
  }

  allPricesPerM2.sort((a, b) => a - b);

  // Top comparables: los 10 mejores listings con datos completos
  const topComparables = allListings
    .filter((l) => l.price && l.squareMeters && l.pricePerM2)
    .sort((a, b) => {
      // Priorizar los que tienen más datos
      const scoreA = (a.rooms ? 1 : 0) + (a.bathrooms ? 1 : 0) + (a.floor ? 1 : 0);
      const scoreB = (b.rooms ? 1 : 0) + (b.bathrooms ? 1 : 0) + (b.floor ? 1 : 0);
      return scoreB - scoreA;
    })
    .slice(0, 10);

  const aggregated: AggregatedScrapingResult = {
    city,
    postalCode,
    operation,
    scrapedAt: new Date().toISOString(),
    portals,
    totalListings: allListings.length,
    weightedAvgPricePerM2: weightTotal > 0 ? Math.round(weightedSum / weightTotal) : null,
    medianPricePerM2:
      allPricesPerM2.length > 0
        ? Math.round(allPricesPerM2[Math.floor(allPricesPerM2.length / 2)])
        : null,
    minPricePerM2: allPricesPerM2.length > 0 ? Math.round(allPricesPerM2[0]) : null,
    maxPricePerM2:
      allPricesPerM2.length > 0
        ? Math.round(allPricesPerM2[allPricesPerM2.length - 1])
        : null,
    avgPrice:
      allPrices.length > 0
        ? Math.round(allPrices.reduce((a, b) => a + b, 0) / allPrices.length)
        : null,
    topComparables,
    rawResults,
  };

  const duration = Date.now() - startTime;
  const successCount = portals.filter((p) => p.success).length;

  logger.info(
    `[Scraping] Completado en ${duration}ms — ${successCount}/${portalNames.length} portales OK, ${allListings.length} listings totales`,
  );

  // Cachear 24h
  if (allListings.length > 0) {
    await setCachedData(cacheKey, aggregated, 24 * 60 * 60);
  }

  return aggregated;
}
