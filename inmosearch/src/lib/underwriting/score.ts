// INMOSEARCH — Scoring y criba de oportunidades
import type { FlipResult, InvestorAssumptions, Rating, RentalResult, Strategy } from "@/lib/types";

export interface ScoreOutput {
  score: number;
  rating: Rating;
  bestStrategy: Strategy;
  reasons: string[];
}

/** Puntúa la oportunidad combinando el mejor de los dos escenarios (flip y
 * alquiler). La puntuación 0-100 refleja lo atractiva que es la operación bajo
 * la mejor estrategia disponible; se explica en `reasons`. */
export function scoreOpportunity(
  flip: FlipResult | null,
  rental: RentalResult | null,
  a: InvestorAssumptions,
  discountToMarket?: number | null
): ScoreOutput {
  const reasons: string[] = [];

  const flipScore = flip ? scoreFlip(flip.marginOnCost, a.minFlipMargin) : null;
  const rentScore = rental ? scoreRental(rental.netYield, a.minNetYield) : null;

  if (flip) {
    reasons.push(
      `Flip: margen ${flip.marginOnCost.toFixed(1)}% (umbral ${a.minFlipMargin}%), ROI anualizado ${flip.annualizedRoi.toFixed(0)}%.`
    );
  }
  if (rental) {
    reasons.push(
      `Alquiler: rent. neta ${rental.netYield.toFixed(1)}% (umbral ${a.minNetYield}%), cashflow ${rental.monthlyCashflow >= 0 ? "+" : ""}${rental.monthlyCashflow}€/mes.`
    );
  }

  // Estrategia recomendada
  let bestStrategy: Strategy = "NONE";
  const flipOk = flip?.meetsThreshold ?? false;
  const rentOk = rental?.meetsThreshold ?? false;
  if (flipOk && rentOk) bestStrategy = "BOTH";
  else if (flipOk) bestStrategy = "FLIP";
  else if (rentOk) bestStrategy = "RENT";
  else {
    // Ninguno supera umbral: sugiere el de mayor sub-score si existe
    if ((flipScore ?? -1) >= (rentScore ?? -1) && flipScore !== null) bestStrategy = "FLIP";
    else if (rentScore !== null) bestStrategy = "RENT";
    else bestStrategy = "NONE";
  }

  // Puntuación final = mejor sub-score disponible + bonus si ambos cumplen
  const candidates = [flipScore, rentScore].filter((s): s is number => s !== null);
  let score = candidates.length ? Math.max(...candidates) : 0;
  if (flipOk && rentOk) {
    score = Math.min(100, score + 8); // versatilidad: sirve para flip y alquiler
    reasons.push("Bonus de versatilidad: rentable tanto en flip como en alquiler.");
  }

  // Ajuste por descuento frente a mercado (señal de oportunidad):
  // hasta +12 si está muy por debajo de mercado; penaliza si está por encima.
  if (discountToMarket != null) {
    const adj = clamp2(discountToMarket * 0.6, -10, 12);
    score += adj;
    if (discountToMarket >= 8)
      reasons.push(`Precio ${discountToMarket.toFixed(0)}% por debajo del mercado de la zona.`);
    else if (discountToMarket <= -5)
      reasons.push(`Precio ${Math.abs(discountToMarket).toFixed(0)}% por encima del mercado de la zona.`);
  }

  score = Math.round(Math.max(0, Math.min(100, score)));

  return { score, rating: ratingFromScore(score), bestStrategy, reasons };
}

/** Convierte margen de flip (%) en sub-score 0-100 con anclas en el umbral. */
function scoreFlip(margin: number, threshold: number): number {
  return piecewise(margin, [
    { x: 0, y: 0 },
    { x: threshold, y: 60 },
    { x: threshold + 15, y: 100 },
  ]);
}

/** Convierte rentabilidad neta de alquiler (%) en sub-score 0-100. */
function scoreRental(netYield: number, threshold: number): number {
  return piecewise(netYield, [
    { x: 0, y: 0 },
    { x: threshold, y: 60 },
    { x: threshold + 4, y: 100 },
  ]);
}

/** Interpolación lineal por tramos, con recorte a [0, 100]. */
function piecewise(x: number, pts: { x: number; y: number }[]): number {
  if (x <= pts[0].x) return clamp(pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    if (x <= pts[i].x) {
      const a = pts[i - 1];
      const b = pts[i];
      const t = (x - a.x) / (b.x - a.x);
      return clamp(a.y + t * (b.y - a.y));
    }
  }
  return clamp(pts[pts.length - 1].y);
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n));
}

function clamp2(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function ratingFromScore(score: number): Rating {
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  return "D";
}
