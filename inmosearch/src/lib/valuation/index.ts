// INMOSEARCH — Valoración automática de mercado
// Rellena el ARV (venta objetivo) y la renta de mercado cuando no los aportas,
// a partir de datos por provincia, y expone el precio de mercado "as-is" para
// calcular el descuento (la señal clave de una oportunidad).
import {
  NATIONAL_AVERAGE,
  detectProvince,
  marketForProvince,
  type ProvinceMarket,
} from "@/lib/data/market";
import type { Condition, MarketValuation } from "@/lib/types";

/** Prima del precio objetivo tras reforma frente al precio medio de mercado.
 * Prudente: una vivienda bien reformada se vende en torno a la media o algo por
 * encima. Editable. */
const REFORMED_TARGET_PREMIUM = 1.05;
/** Si ya está en buen estado/reformada, el objetivo es la media de mercado. */
const GOOD_CONDITION_PREMIUM = 1.0;

export interface ValuationInput {
  province?: string | null;
  city?: string | null;
  ccaa?: string | null;
  area?: number | null;
  condition?: Condition | null;
  providedArvPerSqm?: number | null;
  providedRentMonthly?: number | null;
}

/** Estima ARV y renta de mercado. Los valores aportados por el usuario siempre
 * prevalecen; el resto se completa con los datos de mercado por provincia. */
export function estimateMarket(input: ValuationInput): MarketValuation {
  const notes: string[] = [];

  // 1) Identificar provincia y datos de mercado.
  const provinceGuess =
    input.province ||
    detectProvince(input.city) ||
    detectProvince(input.province) ||
    null;
  let market: ProvinceMarket | null = marketForProvince(provinceGuess) ?? marketForProvince(input.city);
  let resolvedProvince = provinceGuess;
  let dataConfidence: MarketValuation["confidence"] = "media";

  if (!market) {
    market = NATIONAL_AVERAGE;
    resolvedProvince = resolvedProvince || null;
    dataConfidence = "baja";
    notes.push("Sin provincia identificada: se usa la media nacional. Ajusta la ubicación o los comparables.");
  }

  const area = input.area && input.area > 0 ? input.area : null;

  // 2) ARV (€/m² objetivo tras reforma).
  const premium =
    input.condition === "REFORMADO" || input.condition === "OBRA_NUEVA"
      ? GOOD_CONDITION_PREMIUM
      : REFORMED_TARGET_PREMIUM;
  const marketArvPerSqm = Math.round(market.saleEurSqm * premium);

  const usingProvidedArv = input.providedArvPerSqm != null && input.providedArvPerSqm > 0;
  const usingProvidedRent = input.providedRentMonthly != null && input.providedRentMonthly > 0;

  const arvPricePerSqm = usingProvidedArv ? input.providedArvPerSqm! : marketArvPerSqm;

  // 3) Renta de mercado (€/mes).
  const marketRentMonthly = usingProvidedRent
    ? input.providedRentMonthly!
    : area
      ? Math.round(market.rentEurSqmMonth * area)
      : null;

  // 4) Fuente y confianza.
  let source: MarketValuation["source"];
  if (usingProvidedArv && usingProvidedRent) {
    source = "PROVIDED";
    dataConfidence = "alta";
  } else if (!usingProvidedArv && !usingProvidedRent) {
    source = "MARKET_DATA";
  } else {
    source = "MIXED";
  }

  if (source !== "PROVIDED" && resolvedProvince && dataConfidence !== "baja") {
    notes.push(
      `Valoración de mercado por provincia (${resolvedProvince.replace(/_/g, " ")}): venta ${market.saleEurSqm} €/m², renta ${market.rentEurSqmMonth} €/m²/mes.`
    );
  }
  if (!usingProvidedArv) notes.push(`ARV objetivo estimado: ${arvPricePerSqm} €/m² (prima reforma ${premium}).`);

  return {
    province: resolvedProvince,
    saleEurSqm: market.saleEurSqm,
    rentEurSqmMonth: market.rentEurSqmMonth,
    arvPricePerSqm,
    marketRentMonthly,
    source,
    confidence: dataConfidence,
    notes,
  };
}
