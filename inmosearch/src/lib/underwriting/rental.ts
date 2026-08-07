// INMOSEARCH — Escenario ALQUILER (comprar, reformar, alquilar)
import type { CostLine, InvestorAssumptions, RentalResult } from "@/lib/types";
import { round } from "./acquisition";

interface RentalInputs {
  price: number;
  acquisitionCosts: number;
  capex: number;
  monthlyRent: number;
  assumptions: InvestorAssumptions;
}

/** Analiza la operación como alquiler a largo plazo: rentabilidad bruta y neta,
 * NOI, servicio de deuda, cashflow mensual y cash-on-cash. */
export function analyzeRental({ price, acquisitionCosts, capex, monthlyRent, assumptions: a }: RentalInputs): RentalResult {
  const totalInvestment = price + acquisitionCosts + capex;
  const grossAnnualRent = monthlyRent * 12;
  const grossYield = totalInvestment > 0 ? (grossAnnualRent / totalInvestment) * 100 : 0;

  // Ingresos efectivos (descontando vacancia)
  const effectiveGrossIncome = grossAnnualRent * (1 - a.vacancyPct);

  // Gastos de explotación anuales
  const ibi = price * a.ibiAnnualPct;
  const community = a.communityMonthly * 12;
  const insurance = a.landlordInsuranceAnnual;
  const management = grossAnnualRent * a.mgmtPct;
  const maintenance = grossAnnualRent * a.maintenancePct;
  const nonPaymentReserve = grossAnnualRent * a.nonPaymentReservePct;
  const operatingExpenses = ibi + community + insurance + management + maintenance + nonPaymentReserve;

  const noi = effectiveGrossIncome - operatingExpenses;
  const netYield = totalInvestment > 0 ? (noi / totalInvestment) * 100 : 0;

  // Financiación
  const loanAmount = a.ltv * price;
  const annualDebtService = annualMortgagePayment(loanAmount, a.mortgageRate, a.mortgageTermYears);
  const annualCashflow = noi - annualDebtService;
  const equity = totalInvestment - loanAmount;
  const cashOnCash = equity > 0 ? (annualCashflow / equity) * 100 : 0;

  const breakdown: CostLine[] = [
    { label: "Renta bruta anual", amount: round(grossAnnualRent) },
    { label: `Vacancia (${(a.vacancyPct * 100).toFixed(0)}%)`, amount: -round(grossAnnualRent * a.vacancyPct) },
    { label: "IBI", amount: -round(ibi) },
    { label: "Comunidad", amount: -round(community) },
    { label: "Seguros", amount: -round(insurance) },
    { label: "Gestión", amount: -round(management) },
    { label: "Mantenimiento", amount: -round(maintenance) },
    { label: "Reserva por impago", amount: -round(nonPaymentReserve) },
    { label: "Servicio de deuda (hipoteca)", amount: -round(annualDebtService) },
  ];

  return {
    monthlyRent: round(monthlyRent),
    grossYield: r2(grossYield),
    effectiveGrossIncome: round(effectiveGrossIncome),
    operatingExpenses: round(operatingExpenses),
    noi: round(noi),
    netYield: r2(netYield),
    annualDebtService: round(annualDebtService),
    annualCashflow: round(annualCashflow),
    monthlyCashflow: round(annualCashflow / 12),
    cashOnCash: r2(cashOnCash),
    equity: round(equity),
    breakdown,
    meetsThreshold: netYield >= a.minNetYield,
  };
}

/** Cuota anual de una hipoteca francesa (cuota constante). */
export function annualMortgagePayment(principal: number, annualRate: number, years: number): number {
  if (principal <= 0) return 0;
  const r = annualRate / 12;
  const n = years * 12;
  if (r === 0) return (principal / n) * 12;
  const monthly = (principal * r) / (1 - Math.pow(1 + r, -n));
  return monthly * 12;
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}
