// INMOSEARCH — Máximo precio de compra recomendado (MAO)
// Responde a la pregunta del inversor: "¿cuánto puedo ofrecer como máximo para
// que la operación cumpla mis objetivos?". Se resuelve despejando el precio de
// compra en las fórmulas de margen flip y de rentabilidad neta de alquiler.
import type { InvestorAssumptions, MaoResult } from "@/lib/types";

interface MaoInput {
  askingPrice: number;
  arv: number | null;
  capex: number;
  monthlyRent: number | null;
  itpRate: number; // tipo ITP aplicable (decimal)
  assumptions: InvestorAssumptions;
}

export function computeMao({ askingPrice, arv, capex, monthlyRent, itpRate, assumptions: a }: MaoInput): MaoResult {
  const flipMao = arv ? maxOfferForFlip(arv, capex, itpRate, a) : null;
  const rentMao = monthlyRent ? maxOfferForRental(monthlyRent, capex, itpRate, a) : null;

  const candidates = [flipMao, rentMao].filter((x): x is number => x != null && x > 0);
  const recommended = candidates.length ? Math.max(...candidates) : null;
  const vsAsking = recommended != null && askingPrice > 0 ? r2(((recommended - askingPrice) / askingPrice) * 100) : null;

  return {
    flipMao: flipMao != null && flipMao > 0 ? Math.round(flipMao) : null,
    rentMao: rentMao != null && rentMao > 0 ? Math.round(rentMao) : null,
    recommended: recommended != null ? Math.round(recommended) : null,
    targetFlipMargin: a.minFlipMargin,
    targetNetYield: a.minNetYield,
    vsAsking,
  };
}

/** Precio máx. de compra para que el margen sobre coste alcance el objetivo. */
function maxOfferForFlip(arv: number, capex: number, itpRate: number, a: InvestorAssumptions): number {
  const kAcq = itpRate + a.notaryPct + a.registryPct + a.buyAgencyPct; // costes % sobre precio
  const fixedAcq = a.gestoriaFixed + a.legalDueDiligence;
  const months = a.projectMonths;
  const kHold = a.ltv * a.mortgageRate * (months / 12) + a.ibiAnnualPct * (months / 12);
  const fixedHold = a.communityMonthly * months + a.insuranceAnnual * (months / 12) + a.utilitiesMonthly * months;
  const selling = arv * (a.sellAgencyPct + a.plusvaliaMunicipalPct) + a.sellingCostsFixed;

  // totalInvestment = A*P + B ; queremos ARV/(1+m) >= totalInvestment
  const A = 1 + kAcq + kHold;
  const B = fixedAcq + capex + fixedHold + selling;
  const m = a.minFlipMargin / 100;
  return (arv / (1 + m) - B) / A;
}

/** Precio máx. de compra para que la rent. neta alcance el objetivo. */
function maxOfferForRental(monthlyRent: number, capex: number, itpRate: number, a: InvestorAssumptions): number {
  const grossAnnual = monthlyRent * 12;
  const egi = grossAnnual * (1 - a.vacancyPct);
  const opexNoIbi =
    a.communityMonthly * 12 +
    a.landlordInsuranceAnnual +
    grossAnnual * (a.mgmtPct + a.maintenancePct + a.nonPaymentReservePct);
  const noi0 = egi - opexNoIbi; // NOI antes de restar el IBI (que depende del precio)

  const kAcq = itpRate + a.notaryPct + a.registryPct + a.buyAgencyPct;
  const C = a.gestoriaFixed + a.legalDueDiligence + capex;
  const y = a.minNetYield / 100;

  // NOI0 - P*ibi >= y*(P*(1+kAcq) + C)  =>  P <= (NOI0 - y*C)/(y*(1+kAcq) + ibi)
  const denom = y * (1 + kAcq) + a.ibiAnnualPct;
  if (denom <= 0) return 0;
  return (noi0 - y * C) / denom;
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}
