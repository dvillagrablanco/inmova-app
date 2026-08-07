// INMOSEARCH — Estimador de CapEx (reforma) basado en reglas
import { CAPEX_BANDS, CONDITION_TO_CAPEX_LEVEL } from "@/lib/data/regions";
import type { CapexLevel, Condition } from "@/lib/types";

export interface CapexBreakdownLine {
  label: string;
  amount: number;
}

export interface CapexEstimate {
  level: CapexLevel;
  total: number;
  perSqm: number;
  area: number;
  breakdown: CapexBreakdownLine[];
  source: "RULE_BASED" | "AI_VISION" | "MANUAL";
  notes?: string;
}

interface RuleBasedInput {
  area?: number | null; // superficie de referencia (m²)
  level?: CapexLevel | null;
  condition?: Condition | null;
  baths?: number | null;
}

/** Reparto orientativo de las partidas de una reforma integral (proporciones
 * típicas del sector; suman 1). Para niveles inferiores se usa un subconjunto. */
const INTEGRAL_SPLIT: { label: string; pct: number }[] = [
  { label: "Demolición y albañilería", pct: 0.18 },
  { label: "Fontanería y saneamiento", pct: 0.12 },
  { label: "Electricidad", pct: 0.12 },
  { label: "Cocina (mobiliario y electrodomésticos)", pct: 0.14 },
  { label: "Baños (sanitarios y alicatado)", pct: 0.14 },
  { label: "Solados y pavimentos", pct: 0.1 },
  { label: "Carpintería y puertas", pct: 0.08 },
  { label: "Pintura y acabados", pct: 0.06 },
  { label: "Licencias, proyecto y dirección de obra", pct: 0.06 },
];

/** Estima el coste de reforma a partir de la superficie y el nivel/estado. */
export function estimateCapexRuleBased(input: RuleBasedInput): CapexEstimate {
  const level = resolveLevel(input.level, input.condition);
  const band = CAPEX_BANDS[level];
  const area = input.area && input.area > 0 ? input.area : 80; // fallback prudente
  const perSqm = band.perSqm;
  let total = area * perSqm;

  // Ajuste por nº de baños en reformas medias/integrales (los baños encarecen).
  if (input.baths && input.baths > 1 && level !== "LAVADO_CARA") {
    total += (input.baths - 1) * 2500;
  }

  const breakdown = buildBreakdown(level, total);

  return {
    level,
    total: Math.round(total),
    perSqm: Math.round(perSqm),
    area,
    breakdown,
    source: "RULE_BASED",
    notes: `Estimación por reglas: ${band.label} a ${perSqm} €/m² sobre ${area} m².`,
  };
}

function resolveLevel(level?: CapexLevel | null, condition?: Condition | null): CapexLevel {
  if (level) return level;
  if (condition) {
    const mapped = CONDITION_TO_CAPEX_LEVEL[condition];
    if (mapped) return mapped as CapexLevel;
    if (condition === "REFORMADO" || condition === "OBRA_NUEVA") return "LAVADO_CARA";
  }
  return "REFORMA_MEDIA";
}

function buildBreakdown(level: CapexLevel, total: number): CapexBreakdownLine[] {
  if (level === "LAVADO_CARA") {
    return [
      { label: "Pintura y pequeños arreglos", amount: Math.round(total * 0.55) },
      { label: "Actualización de baño/cocina puntual", amount: Math.round(total * 0.3) },
      { label: "Limpieza y home staging", amount: Math.round(total * 0.15) },
    ];
  }
  if (level === "REFORMA_MEDIA") {
    const subset = INTEGRAL_SPLIT.filter((l) =>
      ["Cocina (mobiliario y electrodomésticos)", "Baños (sanitarios y alicatado)", "Solados y pavimentos", "Carpintería y puertas", "Pintura y acabados", "Fontanería y saneamiento"].includes(l.label)
    );
    const sum = subset.reduce((s, l) => s + l.pct, 0);
    return subset.map((l) => ({ label: l.label, amount: Math.round((l.pct / sum) * total) }));
  }
  // REFORMA_INTEGRAL
  return INTEGRAL_SPLIT.map((l) => ({ label: l.label, amount: Math.round(l.pct * total) }));
}
