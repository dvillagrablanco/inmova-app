// INMOSEARCH — Escenario de alquiler turístico / de temporada (STR)
// Estima ingresos por explotación turística a partir de la renta tradicional
// (ADR ≈ diaria prorrateada × premium) y la ocupación, con los mayores costes
// del STR (plataforma, gestión, limpieza, suministros) y el coste de amueblar.
// Informativo: NO entra en el scoring principal (que usa flip y alquiler
// tradicional), pero avisa cuando el STR mejora mucho la rentabilidad.
import type { CostLine, InvestorAssumptions, StrResult } from "@/lib/types";
import { round } from "./acquisition";
import { annualMortgagePayment } from "./rental";

interface StrInputs {
  price: number;
  acquisitionCosts: number;
  capex: number;
  area: number | null;
  monthlyRentLT: number; // renta tradicional de referencia
  longTermNoi: number | null; // NOI del alquiler tradicional (para comparar)
  assumptions: InvestorAssumptions;
  /** Zona turística/playa: sube el ADR y ajusta la ocupación (estacional). */
  touristic?: boolean;
}

export function analyzeStr({
  price,
  acquisitionCosts,
  capex,
  area,
  monthlyRentLT,
  longTermNoi,
  assumptions: a,
  touristic = false,
}: StrInputs): StrResult {
  // En zona turística el ADR de temporada es bastante mayor que la diaria
  // prorrateada del alquiler tradicional; la ocupación anual, algo menor por
  // estacionalidad.
  const dailyPremium = touristic ? a.strDailyPremium * 1.5 : a.strDailyPremium;
  const occupancy = touristic ? Math.min(a.strOccupancy, 0.55) : a.strOccupancy;
  const adr = Math.round((monthlyRentLT / 30) * dailyPremium);
  const grossAnnual = adr * occupancy * 365;

  const furnishingCapex = area ? Math.round(a.strFurnishingPerSqm * area) : 6000;
  const totalInvestment = price + acquisitionCosts + capex + furnishingCapex;

  const platform = grossAnnual * a.strPlatformPct;
  const mgmt = grossAnnual * a.strMgmtPct;
  const cleaning = grossAnnual * a.strCleaningPct;
  const utilities = a.strUtilitiesMonthly * 12;
  const ibi = price * a.ibiAnnualPct;
  const community = a.communityMonthly * 12;
  const insurance = a.strInsuranceAnnual;
  const maintenance = grossAnnual * a.maintenancePct;
  const operatingExpenses = platform + mgmt + cleaning + utilities + ibi + community + insurance + maintenance;

  const noi = grossAnnual - operatingExpenses;
  const netYield = totalInvestment > 0 ? (noi / totalInvestment) * 100 : 0;

  const loanAmount = a.ltv * price;
  const annualDebtService = annualMortgagePayment(loanAmount, a.mortgageRate, a.mortgageTermYears);
  const monthlyCashflow = Math.round((noi - annualDebtService) / 12);

  const vsLongTerm = longTermNoi && longTermNoi > 0 ? Math.round(((noi - longTermNoi) / longTermNoi) * 100) : null;

  const breakdown: CostLine[] = [
    { label: `Ingresos brutos (${adr} €/noche × ${(occupancy * 100).toFixed(0)}%)`, amount: round(grossAnnual) },
    { label: "Comisiones de plataforma", amount: -round(platform) },
    { label: "Gestión", amount: -round(mgmt) },
    { label: "Limpieza", amount: -round(cleaning) },
    { label: "Suministros", amount: -round(utilities) },
    { label: "IBI + comunidad + seguro + mantenimiento", amount: -round(ibi + community + insurance + maintenance) },
  ];

  return {
    adr,
    occupancy,
    grossAnnual: round(grossAnnual),
    operatingExpenses: round(operatingExpenses),
    noi: round(noi),
    netYield: Math.round(netYield * 100) / 100,
    monthlyCashflow,
    furnishingCapex,
    vsLongTerm,
    breakdown,
    warnings: [
      "El alquiler turístico requiere licencia (VUT) y muchas ciudades lo restringen o lo han limitado. Verifica la normativa local y de la comunidad de propietarios.",
      "ADR y ocupación son estimaciones a partir de la renta tradicional; ajústalos con datos reales de la zona (AirDNA/observación).",
    ],
  };
}
