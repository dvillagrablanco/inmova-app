// INMOSEARCH — Señales de oportunidad y veredicto
import type {
  DealSignal,
  FlipResult,
  InvestorAssumptions,
  MarketValuation,
  RentalResult,
  Verdict,
} from "@/lib/types";

interface SignalInput {
  flip: FlipResult | null;
  rental: RentalResult | null;
  discountToMarket: number | null; // %
  capexRatio: number | null; // capex / precio
  capexLevel: string | null;
  valuation: MarketValuation;
  assumptions: InvestorAssumptions;
}

/** Deriva las banderas de oportunidad que se muestran de un vistazo. */
export function computeSignals(i: SignalInput): DealSignal[] {
  const s: DealSignal[] = [];
  const a = i.assumptions;

  // --- Descuento vs mercado (señal principal) ---
  if (i.discountToMarket != null) {
    if (i.discountToMarket >= 15) s.push(sig("chollo", "Muy por debajo de mercado", "positive"));
    else if (i.discountToMarket >= 8) s.push(sig("bajo_mercado", "Bajo mercado", "positive"));
    else if (i.discountToMarket <= -5) s.push(sig("sobre_mercado", "Por encima de mercado", "negative"));
  }

  // --- Flip ---
  if (i.flip?.meetsThreshold) {
    const strong = i.flip.marginOnCost >= a.minFlipMargin + 10;
    s.push(sig("flip", strong ? "Flip muy rentable" : "Flip rentable", "positive"));
  }

  // --- Alquiler ---
  if (i.rental?.meetsThreshold) s.push(sig("rent", "Alquiler rentable", "positive"));
  if (i.rental && i.rental.netYield >= a.minNetYield + 2)
    s.push(sig("alta_rent", "Alta rentabilidad", "positive"));
  if (i.rental && i.rental.monthlyCashflow > 0) s.push(sig("cashflow", "Cashflow positivo", "positive"));

  // --- Versatilidad ---
  if (i.flip?.meetsThreshold && i.rental?.meetsThreshold)
    s.push(sig("doble", "Doble estrategia", "positive"));

  // --- Riesgo / reforma ---
  if (i.capexLevel === "LAVADO_CARA") s.push(sig("reforma_ligera", "Reforma ligera", "neutral"));
  if (i.capexRatio != null && i.capexRatio >= 0.4) s.push(sig("capex_alto", "CapEx elevado", "negative"));

  // --- Calidad del dato ---
  if (i.valuation.source === "PROVIDED") s.push(sig("comparables", "Comparables propios", "neutral"));
  else if (i.valuation.confidence === "baja") s.push(sig("sin_datos", "Zona sin datos fiables", "negative"));

  // Positivas primero, luego neutrales, luego negativas; máximo 6.
  const order = { positive: 0, neutral: 1, negative: 2 } as const;
  return s.sort((x, y) => order[x.tone] - order[y.tone]).slice(0, 6);
}

/** Veredicto claro para el usuario. */
export function computeVerdict(
  score: number,
  flipOk: boolean,
  rentOk: boolean
): Verdict {
  if (score >= 65 && (flipOk || rentOk)) return "INVERTIR";
  if (score < 45 && !flipOk && !rentOk) return "DESCARTAR";
  return "VIGILAR";
}

function sig(key: string, label: string, tone: DealSignal["tone"]): DealSignal {
  return { key, label, tone };
}
