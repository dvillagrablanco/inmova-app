// INMOSEARCH — Orquestador del análisis de una oportunidad
import type { AnalysisResult, Condition, InvestorAssumptions } from "@/lib/types";
import { computeAcquisitionCosts } from "./acquisition";
import { analyzeFlip } from "./flip";
import { analyzeRental } from "./rental";
import { scoreOpportunity } from "./score";
import { resolveAssumptions } from "./assumptions";
import { estimateCapexRuleBased } from "@/lib/capex/estimator";

export { resolveAssumptions, DEFAULT_ASSUMPTIONS } from "./assumptions";
export { analyzeFlip } from "./flip";
export { analyzeRental } from "./rental";
export { scoreOpportunity } from "./score";
export { computeAcquisitionCosts } from "./acquisition";

export interface AnalyzeInput {
  askingPrice: number;
  ccaa?: string | null;
  builtArea?: number | null;
  usableArea?: number | null;
  baths?: number | null;
  condition?: Condition | null;
  arvPricePerSqm?: number | null;
  marketRentMonthly?: number | null;
  /** CapEx ya estimado (p.ej. por IA). Si no se pasa, se calcula por reglas. */
  capex?: number | null;
  capexLevel?: string | null;
}

/** Analiza una oportunidad de principio a fin: costes, escenarios flip y
 * alquiler, y puntuación. Función pura (no toca la base de datos). */
export function analyzeOpportunity(
  input: AnalyzeInput,
  overrides?: Partial<InvestorAssumptions>
): AnalysisResult {
  const a = resolveAssumptions(overrides);
  const warnings: string[] = [];

  const price = input.askingPrice;
  const area = input.builtArea ?? input.usableArea ?? null;

  // --- CapEx ----------------------------------------------------------------
  let capex = input.capex ?? null;
  if (capex == null) {
    const est = estimateCapexRuleBased({
      area,
      condition: input.condition ?? null,
      baths: input.baths ?? null,
    });
    capex = est.total;
    warnings.push("CapEx estimado por reglas (no se aportó valor ni análisis de imágenes).");
  }

  // --- Derivados ------------------------------------------------------------
  const pricePerSqm = area ? Math.round(price / area) : null;
  const arv = input.arvPricePerSqm && area ? Math.round(input.arvPricePerSqm * area) : null;
  if (!arv) warnings.push("Sin ARV (valor de venta): falta €/m² objetivo o superficie. No se puede analizar el flip.");
  if (!input.marketRentMonthly) warnings.push("Sin renta de mercado: no se puede analizar el alquiler.");
  if (!area) warnings.push("Sin superficie: precio/m² y CapEx usan valores por defecto.");

  const acquisition = computeAcquisitionCosts(price, input.ccaa, a);

  const allInCost = price + acquisition.total + capex;
  const discountToArv = arv ? Math.round(((arv - allInCost) / arv) * 100 * 100) / 100 : null;

  // --- Escenarios -----------------------------------------------------------
  const flip = arv
    ? analyzeFlip({ price, acquisitionCosts: acquisition.total, capex, arv, assumptions: a })
    : null;
  const rental = input.marketRentMonthly
    ? analyzeRental({
        price,
        acquisitionCosts: acquisition.total,
        capex,
        monthlyRent: input.marketRentMonthly,
        assumptions: a,
      })
    : null;

  // --- Scoring --------------------------------------------------------------
  const { score, rating, bestStrategy, reasons } = scoreOpportunity(flip, rental, a);

  return {
    pricePerSqm,
    arv,
    discountToArv,
    capex,
    flip,
    rental,
    score,
    rating,
    bestStrategy,
    reasons,
    assumptions: a,
    warnings,
  };
}
