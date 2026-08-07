// INMOSEARCH — Escenario FLIP (comprar, reformar, vender)
import type { CostLine, FlipResult, InvestorAssumptions } from "@/lib/types";
import { round } from "./acquisition";

interface FlipInputs {
  price: number;
  acquisitionCosts: number;
  capex: number;
  arv: number; // valor de venta tras reforma
  assumptions: InvestorAssumptions;
}

/** Analiza la operación como flip: calcula costes de holding y venta, beneficio
 * bruto, margen sobre coste, ROI sobre capital propio y ROI anualizado. */
export function analyzeFlip({ price, acquisitionCosts, capex, arv, assumptions: a }: FlipInputs): FlipResult {
  const loanAmount = a.ltv * price;

  // --- Costes de holding durante el proyecto -------------------------------
  const months = a.projectMonths;
  const financingInterest = loanAmount * a.mortgageRate * (months / 12);
  const ibi = price * a.ibiAnnualPct * (months / 12);
  const community = a.communityMonthly * months;
  const insurance = a.insuranceAnnual * (months / 12);
  const utilities = a.utilitiesMonthly * months;
  const holdingCosts = financingInterest + ibi + community + insurance + utilities;

  // --- Costes de venta ------------------------------------------------------
  const sellAgency = arv * a.sellAgencyPct;
  const plusvalia = arv * a.plusvaliaMunicipalPct;
  const sellingCosts = sellAgency + plusvalia + a.sellingCostsFixed;

  // --- Totales --------------------------------------------------------------
  const totalInvestment = price + acquisitionCosts + capex + holdingCosts + sellingCosts;
  const grossProfit = arv - totalInvestment;
  const equity = totalInvestment - loanAmount; // capital propio aportado
  const marginOnCost = totalInvestment > 0 ? (grossProfit / totalInvestment) * 100 : 0;
  const roiOnEquity = equity > 0 ? (grossProfit / equity) * 100 : 0;
  const annualizedRoi = months > 0 ? roiOnEquity * (12 / months) : roiOnEquity;

  const breakdown: CostLine[] = [
    { label: "Precio de compra", amount: round(price) },
    { label: "Costes de adquisición", amount: round(acquisitionCosts) },
    { label: "Reforma (CapEx)", amount: round(capex) },
    { label: "Intereses financiación (holding)", amount: round(financingInterest) },
    { label: "IBI + comunidad + seguro + suministros (holding)", amount: round(ibi + community + insurance + utilities) },
    { label: "Comisión de venta", amount: round(sellAgency) },
    { label: "Plusvalía municipal + costes de venta", amount: round(plusvalia + a.sellingCostsFixed) },
  ];

  return {
    arv: round(arv),
    totalInvestment: round(totalInvestment),
    acquisitionCosts: round(acquisitionCosts),
    capex: round(capex),
    holdingCosts: round(holdingCosts),
    sellingCosts: round(sellingCosts),
    grossProfit: round(grossProfit),
    marginOnCost: r2(marginOnCost),
    roiOnEquity: r2(roiOnEquity),
    annualizedRoi: r2(annualizedRoi),
    equity: round(equity),
    breakdown,
    meetsThreshold: marginOnCost >= a.minFlipMargin,
  };
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}
