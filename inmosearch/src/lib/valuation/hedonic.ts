// INMOSEARCH — Ajuste hedónico (AVM) de la valoración
// -----------------------------------------------------------------------------
// Ajusta el €/m² objetivo (ARV) de la zona según las características del activo
// que persisten tras la reforma: planta, ascensor, antigüedad del edificio,
// tamaño y tipo. Un 5º sin ascensor vale menos que un 2º con ascensor aunque
// estén en la misma calle. Factores ORIENTATIVOS y editables. La condición
// (a reformar/reformado) NO se aplica aquí: ya la recoge la prima de reforma
// del ARV, para no contarla dos veces.
// -----------------------------------------------------------------------------
import type { Condition, PropertyType } from "@/lib/types";

export interface HedonicInput {
  area?: number | null;
  floor?: string | null;
  hasElevator?: boolean | null;
  yearBuilt?: number | null;
  propertyType?: PropertyType | string | null;
  condition?: Condition | null;
}

export interface HedonicResult {
  factor: number; // multiplicador total (p.ej. 0.92 = -8%)
  adjustments: { label: string; pct: number }[]; // desglose en % (−8, +5…)
}

/** Interpreta el campo "planta" en un número y flags de bajo/ático. */
function parseFloor(floor?: string | null): { n: number | null; isGround: boolean; isTop: boolean } {
  if (!floor) return { n: null, isGround: false, isTop: false };
  const s = floor
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
  const isGround = /\b(bajo|baja|planta baja|entreplanta|semisotano|sotano)\b/.test(s);
  const isTop = /\batico\b/.test(s);
  const m = s.match(/-?\d{1,2}/);
  const n = m ? parseInt(m[0], 10) : null;
  return { n, isGround, isTop };
}

/** Calcula el factor de ajuste hedónico sobre el €/m² de la zona. */
export function hedonicAdjust(input: HedonicInput): HedonicResult {
  const adj: { label: string; pct: number }[] = [];
  const { n: floorN, isGround, isTop } = parseFloor(input.floor);
  const hasElevator = input.hasElevator ?? null;

  // Ascensor y planta (interactúan).
  if (hasElevator === false && floorN != null && floorN >= 2) {
    adj.push({ label: floorN >= 4 ? "Sin ascensor, planta alta" : "Sin ascensor", pct: floorN >= 4 ? -12 : -8 });
  } else if (hasElevator === true) {
    adj.push({ label: "Con ascensor", pct: 2 });
  }
  if (isTop) adj.push({ label: "Ático", pct: 6 });
  if (isGround) adj.push({ label: "Planta baja", pct: -5 });

  // Antigüedad del edificio.
  if (input.yearBuilt) {
    if (input.yearBuilt < 1960) adj.push({ label: "Edificio antiguo (<1960)", pct: -4 });
    else if (input.yearBuilt >= 2000) adj.push({ label: "Edificio reciente (≥2000)", pct: 2 });
  }

  // Tamaño (efecto €/m²: los pequeños valen más por m²; los muy grandes, menos).
  if (input.area) {
    if (input.area < 35) adj.push({ label: "Superficie pequeña (<35 m²)", pct: 4 });
    else if (input.area > 140) adj.push({ label: "Superficie grande (>140 m²)", pct: -5 });
  }

  // Factor total, acotado a ±20% para evitar extremos.
  const raw = adj.reduce((f, a) => f * (1 + a.pct / 100), 1);
  const factor = Math.max(0.8, Math.min(1.2, Math.round(raw * 1000) / 1000));
  return { factor, adjustments: adj };
}
