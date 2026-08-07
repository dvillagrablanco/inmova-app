// INMOSEARCH — Orquestador del análisis de una oportunidad
import type { AnalysisResult, Condition, InvestorAssumptions } from "@/lib/types";
import { computeAcquisitionCosts } from "./acquisition";
import { analyzeFlip } from "./flip";
import { analyzeRental } from "./rental";
import { scoreOpportunity } from "./score";
import { computeSignals, computeVerdict } from "./signals";
import { computeMao } from "./mao";
import { resolveAssumptions } from "./assumptions";
import { estimateCapexRuleBased } from "@/lib/capex/estimator";
import { estimateMarket } from "@/lib/valuation";
import { detectMotivation } from "@/lib/intake/distress";
import { itpForCcaa } from "@/lib/data/regions";

export { resolveAssumptions, DEFAULT_ASSUMPTIONS } from "./assumptions";
export { analyzeFlip } from "./flip";
export { analyzeRental } from "./rental";
export { scoreOpportunity } from "./score";
export { computeSignals, computeVerdict } from "./signals";
export { computeAcquisitionCosts } from "./acquisition";

export interface AnalyzeInput {
  askingPrice: number;
  ccaa?: string | null;
  province?: string | null;
  city?: string | null;
  postalCode?: string | null;
  address?: string | null;
  propertyType?: string | null;
  builtArea?: number | null;
  usableArea?: number | null;
  baths?: number | null;
  condition?: Condition | null;
  arvPricePerSqm?: number | null;
  marketRentMonthly?: number | null;
  /** Texto del anuncio (título + descripción) para detectar motivación. */
  text?: string | null;
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
  let capexLevel = input.capexLevel ?? null;
  if (capex == null) {
    const est = estimateCapexRuleBased({
      area,
      condition: input.condition ?? null,
      baths: input.baths ?? null,
    });
    capex = est.total;
    capexLevel = est.level;
    warnings.push("CapEx estimado por reglas (no se aportó valor ni análisis de imágenes).");
  }

  // --- Valoración automática de mercado -------------------------------------
  // Rellena ARV y renta de mercado si no se aportan, para poder analizar la
  // oportunidad con solo precio + superficie + ubicación.
  const valuation = estimateMarket({
    province: input.province,
    city: input.city,
    ccaa: input.ccaa,
    postalCode: input.postalCode,
    address: input.address,
    area,
    condition: input.condition ?? null,
    providedArvPerSqm: input.arvPricePerSqm,
    providedRentMonthly: input.marketRentMonthly,
  });

  // --- Derivados ------------------------------------------------------------
  const pricePerSqm = area ? Math.round(price / area) : null;
  const arvPerSqm = valuation.arvPricePerSqm;
  const arv = arvPerSqm && area ? Math.round(arvPerSqm * area) : null;
  const monthlyRent = valuation.marketRentMonthly;

  if (!area) warnings.push("Sin superficie: precio/m², ARV y CapEx usan valores por defecto.");
  if (!arv) warnings.push("Sin ARV: no se puede analizar el flip (falta superficie o datos de zona).");
  if (!monthlyRent) warnings.push("Sin renta estimada: no se puede analizar el alquiler (falta superficie o datos de zona).");
  if (valuation.confidence === "baja")
    warnings.push("Valoración de baja confianza: afina la ubicación o introduce comparables propios.");

  // Descuento del precio de compra frente al precio de mercado as-is (€/m²).
  const discountToMarket =
    pricePerSqm && valuation.saleEurSqm
      ? Math.round(((valuation.saleEurSqm - pricePerSqm) / valuation.saleEurSqm) * 100 * 100) / 100
      : null;

  const acquisition = computeAcquisitionCosts(price, input.ccaa, a);
  const allInCost = price + acquisition.total + capex;
  const discountToArv = arv ? Math.round(((arv - allInCost) / arv) * 100 * 100) / 100 : null;

  // --- Escenarios -----------------------------------------------------------
  const flip = arv
    ? analyzeFlip({ price, acquisitionCosts: acquisition.total, capex, arv, assumptions: a })
    : null;
  const rental = monthlyRent
    ? analyzeRental({
        price,
        acquisitionCosts: acquisition.total,
        capex,
        monthlyRent,
        assumptions: a,
      })
    : null;

  // --- MAO (máximo precio de compra recomendado) ----------------------------
  const itpRate = itpForCcaa(input.ccaa);
  const mao = computeMao({ askingPrice: price, arv, capex, monthlyRent, itpRate, assumptions: a });

  // --- Motivación del vendedor ----------------------------------------------
  const motivation = detectMotivation(input.text);

  // --- Scoring, señales y veredicto -----------------------------------------
  const { score, rating, bestStrategy, reasons } = scoreOpportunity(flip, rental, a, discountToMarket);
  const signals = computeSignals({
    flip,
    rental,
    discountToMarket,
    capexRatio: price > 0 ? capex / price : null,
    capexLevel,
    valuation,
    assumptions: a,
  });
  // Señales adicionales: MAO y motivación del vendedor.
  if (mao.recommended != null && mao.recommended >= price)
    signals.unshift({ key: "bajo_mao", label: "Por debajo de tu precio máximo", tone: "positive" });
  if (motivation.score >= 40)
    signals.push({ key: "motivado", label: "Vendedor motivado", tone: "positive" });
  if (motivation.cues.length > 0) reasons.push(`Motivación del vendedor: ${motivation.cues.join(", ")}.`);

  const verdict = computeVerdict(score, flip?.meetsThreshold ?? false, rental?.meetsThreshold ?? false);

  return {
    pricePerSqm,
    arv,
    discountToArv,
    discountToMarket,
    capex,
    valuation,
    flip,
    rental,
    score,
    rating,
    verdict,
    bestStrategy,
    signals,
    mao,
    motivation,
    reasons,
    assumptions: a,
    warnings,
  };
}
