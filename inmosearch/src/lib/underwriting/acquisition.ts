// INMOSEARCH — Costes de adquisición (compra)
import type { CostLine, InvestorAssumptions } from "@/lib/types";
import { itpForCcaa } from "@/lib/data/regions";

export interface AcquisitionCosts {
  total: number;
  itpRate: number;
  lines: CostLine[];
}

/** Calcula todos los costes de compra de una vivienda de segunda mano:
 * ITP (según CCAA), notaría, registro, gestoría, due diligence legal y, si
 * aplica, comisión de compra (personal shopper). */
export function computeAcquisitionCosts(
  price: number,
  ccaa: string | null | undefined,
  a: InvestorAssumptions
): AcquisitionCosts {
  const itpRate = itpForCcaa(ccaa);
  const lines: CostLine[] = [
    { label: `ITP (${(itpRate * 100).toFixed(1)}%)`, amount: round(price * itpRate) },
    { label: "Notaría", amount: round(price * a.notaryPct) },
    { label: "Registro de la propiedad", amount: round(price * a.registryPct) },
    { label: "Gestoría", amount: a.gestoriaFixed },
    { label: "Due diligence legal", amount: a.legalDueDiligence },
  ];
  if (a.buyAgencyPct > 0) {
    lines.push({ label: "Comisión de compra", amount: round(price * a.buyAgencyPct) });
  }
  const total = lines.reduce((s, l) => s + l.amount, 0);
  return { total: round(total), itpRate, lines };
}

export function round(n: number): number {
  return Math.round(n);
}
