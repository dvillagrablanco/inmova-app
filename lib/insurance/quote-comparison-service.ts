import type { PrismaClient } from '@/types/prisma-types';
import logger from '@/lib/logger';

async function getPrisma(): Promise<PrismaClient> {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// ─── Types ───────────────────────────────────────────────────────────

export interface QuotationComparisonItem {
  id: string;
  provider: string;
  primaAnual: number;
  primaMensual: number | null;
  sumaAsegurada: number;
  franquicia: number | null;
  coberturas: string[];
  exclusiones: string[];
  condicionesEspeciales: string | null;
  scoreIA: number | null;
  validaHasta: string | null;
}

export interface ComparisonSummary {
  cheapest: { id: string; provider: string; primaAnual: number };
  bestCoverage: { id: string; provider: string; coberturasCount: number };
  bestValue: { id: string; provider: string; ratio: number };
  averagePremium: number;
  premiumRange: { min: number; max: number };
}

export interface CoverageMatrixEntry {
  cobertura: string;
  providers: Record<string, boolean>;
}

export interface QuotationComparison {
  quotations: QuotationComparisonItem[];
  summary: ComparisonSummary;
  coverageMatrix: CoverageMatrixEntry[];
}

export interface RankedQuotation {
  quotationId: string;
  rank: number;
  score: number;
  details: {
    priceScore: number;
    coverageScore: number;
    franquiciaScore: number;
    iaScore: number;
    provider: string;
    primaAnual: number;
    coberturasCount: number;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────

function buildCoverageMatrix(quotations: QuotationComparisonItem[]): CoverageMatrixEntry[] {
  const allCoberturas = new Set<string>();
  for (const q of quotations) {
    for (const c of q.coberturas) {
      allCoberturas.add(c);
    }
  }

  return Array.from(allCoberturas)
    .sort()
    .map((cobertura) => ({
      cobertura,
      providers: Object.fromEntries(
        quotations.map((q) => [q.id, q.coberturas.includes(cobertura)])
      ),
    }));
}

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 1;
  return (value - min) / (max - min);
}

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Compare multiple insurance quotations side by side.
 * Returns structured comparison data with summary stats and a coverage matrix.
 */
export async function compareQuotations(quotationIds: string[]): Promise<QuotationComparison> {
  if (quotationIds.length === 0) {
    throw new Error('At least one quotation ID is required');
  }

  const prisma = await getPrisma();

  const rawQuotations = await prisma.insuranceQuotation.findMany({
    where: { id: { in: quotationIds } },
    include: { provider: { select: { id: true, nombre: true } } },
  });

  if (rawQuotations.length === 0) {
    throw new Error('No quotations found for the provided IDs');
  }

  const quotations: QuotationComparisonItem[] = rawQuotations.map((q) => ({
    id: q.id,
    provider: q.provider.nombre,
    primaAnual: q.primaAnual,
    primaMensual: q.primaMensual,
    sumaAsegurada: q.sumaAsegurada,
    franquicia: q.franquicia,
    coberturas: q.coberturas ?? [],
    exclusiones: q.exclusiones ?? [],
    condicionesEspeciales: q.condicionesEspeciales,
    scoreIA: q.scoreIA,
    validaHasta: q.validaHasta?.toISOString() ?? null,
  }));

  const cheapest = quotations.reduce((prev, cur) =>
    cur.primaAnual < prev.primaAnual ? cur : prev
  );

  const bestCoverage = quotations.reduce((prev, cur) =>
    cur.coberturas.length > prev.coberturas.length ? cur : prev
  );

  const bestValue = quotations.reduce((prev, cur) => {
    const curRatio = cur.primaAnual > 0 ? cur.coberturas.length / cur.primaAnual : 0;
    const prevRatio = prev.primaAnual > 0 ? prev.coberturas.length / prev.primaAnual : 0;
    return curRatio > prevRatio ? cur : prev;
  });
  const bestValueRatio =
    bestValue.primaAnual > 0 ? bestValue.coberturas.length / bestValue.primaAnual : 0;

  const premiums = quotations.map((q) => q.primaAnual);
  const averagePremium = premiums.reduce((sum, p) => sum + p, 0) / premiums.length;

  const summary: ComparisonSummary = {
    cheapest: {
      id: cheapest.id,
      provider: cheapest.provider,
      primaAnual: cheapest.primaAnual,
    },
    bestCoverage: {
      id: bestCoverage.id,
      provider: bestCoverage.provider,
      coberturasCount: bestCoverage.coberturas.length,
    },
    bestValue: {
      id: bestValue.id,
      provider: bestValue.provider,
      ratio: Math.round(bestValueRatio * 10000) / 10000,
    },
    averagePremium: Math.round(averagePremium * 100) / 100,
    premiumRange: {
      min: Math.min(...premiums),
      max: Math.max(...premiums),
    },
  };

  const coverageMatrix = buildCoverageMatrix(quotations);

  logger.info('Quotation comparison completed', {
    count: quotations.length,
    cheapestId: cheapest.id,
  });

  return { quotations, summary, coverageMatrix };
}

/**
 * Rank quotations by a composite score.
 * Weights: price 40%, coverage count 30%, franquicia (lower=better) 20%, IA score 10%.
 */
export async function rankQuotations(quotationIds: string[]): Promise<RankedQuotation[]> {
  if (quotationIds.length === 0) {
    throw new Error('At least one quotation ID is required');
  }

  const prisma = await getPrisma();

  const rawQuotations = await prisma.insuranceQuotation.findMany({
    where: { id: { in: quotationIds } },
    include: { provider: { select: { id: true, nombre: true } } },
  });

  if (rawQuotations.length === 0) {
    throw new Error('No quotations found for the provided IDs');
  }

  const prices = rawQuotations.map((q) => q.primaAnual);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const coverageCounts = rawQuotations.map((q) => (q.coberturas ?? []).length);
  const minCov = Math.min(...coverageCounts);
  const maxCov = Math.max(...coverageCounts);

  const franquicias = rawQuotations.map((q) => q.franquicia).filter((f): f is number => f !== null);
  const minFranq = franquicias.length > 0 ? Math.min(...franquicias) : 0;
  const maxFranq = franquicias.length > 0 ? Math.max(...franquicias) : 0;

  const iaScores = rawQuotations.map((q) => q.scoreIA).filter((s): s is number => s !== null);
  const minIA = iaScores.length > 0 ? Math.min(...iaScores) : 0;
  const maxIA = iaScores.length > 0 ? Math.max(...iaScores) : 100;

  const WEIGHT_PRICE = 0.4;
  const WEIGHT_COVERAGE = 0.3;
  const WEIGHT_FRANQUICIA = 0.2;
  const WEIGHT_IA = 0.1;

  const scored = rawQuotations.map((q) => {
    // Lower price is better -> invert normalization
    const priceScore = maxPrice === minPrice ? 1 : 1 - normalize(q.primaAnual, minPrice, maxPrice);

    // Higher coverage count is better
    const covCount = (q.coberturas ?? []).length;
    const coverageScore = maxCov === minCov ? 1 : normalize(covCount, minCov, maxCov);

    // Lower franquicia is better -> invert
    const franquiciaScore =
      q.franquicia !== null && maxFranq !== minFranq
        ? 1 - normalize(q.franquicia, minFranq, maxFranq)
        : 0.5; // neutral if not set

    // Higher IA score is better
    const iaScore = q.scoreIA !== null ? normalize(q.scoreIA, minIA, maxIA) : 0.5;

    const compositeScore =
      priceScore * WEIGHT_PRICE +
      coverageScore * WEIGHT_COVERAGE +
      franquiciaScore * WEIGHT_FRANQUICIA +
      iaScore * WEIGHT_IA;

    return {
      quotationId: q.id,
      score: Math.round(compositeScore * 10000) / 10000,
      details: {
        priceScore: Math.round(priceScore * 100) / 100,
        coverageScore: Math.round(coverageScore * 100) / 100,
        franquiciaScore: Math.round(franquiciaScore * 100) / 100,
        iaScore: Math.round(iaScore * 100) / 100,
        provider: q.provider.nombre,
        primaAnual: q.primaAnual,
        coberturasCount: covCount,
      },
    };
  });

  scored.sort((a, b) => b.score - a.score);

  const ranked: RankedQuotation[] = scored.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));

  logger.info('Quotation ranking completed', {
    count: ranked.length,
    topId: ranked[0]?.quotationId,
  });

  return ranked;
}
