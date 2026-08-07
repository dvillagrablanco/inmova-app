// INMOSEARCH — Supuestos del inversor (parámetros de underwriting)
import type { InvestorAssumptions } from "@/lib/types";

/** Supuestos por defecto, calibrados para el mercado español de inversión
 * (compra de vivienda de segunda mano para flip o alquiler). Todos son
 * sobrescribibles por oportunidad. Las cifras son prudentes y editables. */
export const DEFAULT_ASSUMPTIONS: InvestorAssumptions = {
  // --- Financiación ---
  ltv: 0.7, // 70% financiado
  mortgageRate: 0.035, // 3,5% TIN
  mortgageTermYears: 25,

  // --- Costes de adquisición (además del ITP, que se calcula por CCAA) ---
  notaryPct: 0.004, // 0,4%
  registryPct: 0.003, // 0,3%
  gestoriaFixed: 400,
  legalDueDiligence: 500,
  buyAgencyPct: 0, // 0 si compras directo; sube si usas personal shopper

  // --- Flip ---
  projectMonths: 8, // compra -> reforma -> venta
  sellAgencyPct: 0.03, // 3% comisión de venta
  sellingCostsFixed: 1200, // home staging, certificado energético, fotos...
  plusvaliaMunicipalPct: 0.005, // aprox. 0,5% sobre precio de venta

  // --- Holding mensual (durante obra/venta) ---
  ibiAnnualPct: 0.005, // IBI ~0,5% anual del valor
  communityMonthly: 60,
  insuranceAnnual: 300,
  utilitiesMonthly: 50,

  // --- Alquiler (explotación) ---
  vacancyPct: 0.05, // 5% de vacancia
  mgmtPct: 0.06, // 6% gestión (o self-management si 0)
  maintenancePct: 0.05, // 5% mantenimiento sobre renta
  nonPaymentReservePct: 0.02, // 2% reserva por impago
  landlordInsuranceAnnual: 350, // seguro hogar + impago

  // --- Umbrales de decisión ---
  minNetYield: envNumber("DEFAULT_MIN_NET_YIELD", 6), // %
  minFlipMargin: envNumber("DEFAULT_MIN_FLIP_MARGIN", 15), // %
};

function envNumber(key: string, fallback: number): number {
  const v = typeof process !== "undefined" ? process.env?.[key] : undefined;
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

/** Mezcla supuestos por defecto con overrides parciales. */
export function resolveAssumptions(overrides?: Partial<InvestorAssumptions>): InvestorAssumptions {
  return { ...DEFAULT_ASSUMPTIONS, ...(overrides ?? {}) };
}
