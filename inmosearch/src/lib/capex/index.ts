// INMOSEARCH — CapEx: fachada que combina IA (visión) y reglas
import type { Condition, CapexLevel } from "@/lib/types";
import { estimateCapexRuleBased, type CapexEstimate } from "./estimator";
import { estimateCapexFromImages } from "./vision";

export type { CapexEstimate, CapexBreakdownLine } from "./estimator";
export { estimateCapexRuleBased } from "./estimator";
export { estimateCapexFromImages } from "./vision";

interface EstimateCapexInput {
  images?: string[];
  area?: number | null;
  level?: CapexLevel | null;
  condition?: Condition | null;
  baths?: number | null;
  propertyType?: string | null;
  description?: string | null;
  useVision?: boolean; // si true y hay imágenes+API key, intenta IA primero
}

/** Estima CapEx: intenta análisis por IA de las imágenes cuando se solicita y
 * es posible; si no, cae al modelo determinista basado en reglas. */
export async function estimateCapex(input: EstimateCapexInput): Promise<CapexEstimate> {
  if (input.useVision && input.images && input.images.length > 0) {
    const ai = await estimateCapexFromImages({
      images: input.images,
      area: input.area,
      propertyType: input.propertyType,
      description: input.description,
    });
    if (ai) return ai;
  }
  return estimateCapexRuleBased({
    area: input.area,
    level: input.level,
    condition: input.condition,
    baths: input.baths,
  });
}
