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
import { finerMarket, type Granularity } from "@/lib/data/zones";
import { hedonicAdjust } from "./hedonic";
import type { Condition, MarketValuation, PropertyType } from "@/lib/types";

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
  postalCode?: string | null;
  address?: string | null;
  area?: number | null;
  condition?: Condition | null;
  floor?: string | null;
  hasElevator?: boolean | null;
  yearBuilt?: number | null;
  propertyType?: PropertyType | string | null;
  providedArvPerSqm?: number | null;
  providedRentMonthly?: number | null;
}

/** Estima ARV y renta de mercado. Prioridad de comparables: aportados por el
 * usuario > barrio/distrito/municipio (por CP o nombre) > provincia > nacional. */
export function estimateMarket(input: ValuationInput): MarketValuation {
  const notes: string[] = [];

  // 1) Identificar provincia (para respaldo y para desambiguar distritos).
  const provinceGuess =
    input.province ||
    detectProvince(input.city) ||
    detectProvince(input.province) ||
    null;

  let market: ProvinceMarket | null = null;
  let resolvedProvince = provinceGuess;
  let dataConfidence: MarketValuation["confidence"] = "media";
  let zoneName: string | null = null;
  let granularity: Granularity = "provincia";

  // 2) Intento fino: barrio/distrito/municipio (por CP o por nombre).
  const fine = finerMarket(input.postalCode, input.city, provinceGuess, input.address);
  if (fine) {
    market = { saleEurSqm: fine.saleEurSqm, rentEurSqmMonth: fine.rentEurSqmMonth };
    zoneName = fine.zoneName;
    granularity = fine.granularity;
    dataConfidence = "alta";
    notes.push(`Comparables de zona (${fine.zoneName}, ${labelGranularity(fine.granularity)}): venta ${fine.saleEurSqm} €/m², renta ${fine.rentEurSqmMonth} €/m²/mes.`);
  }

  // 3) Respaldo por provincia.
  if (!market) {
    market = marketForProvince(provinceGuess) ?? marketForProvince(input.city);
  }

  if (!market) {
    market = NATIONAL_AVERAGE;
    resolvedProvince = resolvedProvince || null;
    granularity = "nacional";
    dataConfidence = "baja";
    notes.push("Sin zona/provincia identificada: se usa la media nacional. Ajusta la ubicación o los comparables.");
  }

  const area = input.area && input.area > 0 ? input.area : null;

  // 2) ARV (€/m² objetivo tras reforma).
  const premium =
    input.condition === "REFORMADO" || input.condition === "OBRA_NUEVA"
      ? GOOD_CONDITION_PREMIUM
      : REFORMED_TARGET_PREMIUM;

  // Ajuste hedónico (AVM): características que persisten tras la reforma.
  const hedonic = hedonicAdjust({
    area,
    floor: input.floor,
    hasElevator: input.hasElevator,
    yearBuilt: input.yearBuilt,
    propertyType: input.propertyType,
  });
  const marketArvPerSqm = Math.round(market.saleEurSqm * premium * hedonic.factor);

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

  if (source !== "PROVIDED" && granularity === "provincia" && resolvedProvince) {
    notes.push(
      `Valoración de mercado por provincia (${resolvedProvince.replace(/_/g, " ")}): venta ${market.saleEurSqm} €/m², renta ${market.rentEurSqmMonth} €/m²/mes.`
    );
  }
  if (!usingProvidedArv) {
    const hedTxt = hedonic.adjustments.length
      ? ` · ajuste hedónico ${(hedonic.factor >= 1 ? "+" : "")}${Math.round((hedonic.factor - 1) * 100)}% (${hedonic.adjustments.map((a) => a.label).join(", ")})`
      : "";
    notes.push(`ARV objetivo estimado: ${arvPricePerSqm} €/m² (prima reforma ${premium}${hedTxt}).`);
  }

  // Si el usuario aporta ambos comparables, la fuente prevalece sobre la zona.
  const finalGranularity: MarketValuation["granularity"] = source === "PROVIDED" ? "provincia" : granularity;

  return {
    province: resolvedProvince,
    zoneName: source === "PROVIDED" ? null : zoneName,
    granularity: finalGranularity,
    saleEurSqm: market.saleEurSqm,
    rentEurSqmMonth: market.rentEurSqmMonth,
    arvPricePerSqm,
    marketRentMonthly,
    source,
    confidence: dataConfidence,
    hedonicFactor: usingProvidedArv ? 1 : hedonic.factor,
    hedonicAdjustments: usingProvidedArv ? [] : hedonic.adjustments,
    notes,
  };
}

function labelGranularity(g: Granularity): string {
  switch (g) {
    case "codigo_postal":
      return "código postal";
    case "distrito":
      return "distrito";
    case "municipio":
      return "municipio";
    case "provincia":
      return "provincia";
    default:
      return "nacional";
  }
}
