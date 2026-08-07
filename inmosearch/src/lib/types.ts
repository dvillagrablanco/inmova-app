// INMOSEARCH — Tipos de dominio compartidos y validación (zod)
import { z } from "zod";

// --- Enumeraciones (validadas a nivel de app; SQLite no soporta enums) -------
export const SOURCES = ["MANUAL", "IDEALISTA", "REO_BANK", "AUCTION", "CSV", "MOCK", "BOE", "HTTP"] as const;
export const PROPERTY_TYPES = ["PISO", "CASA", "ATICO", "DUPLEX", "ESTUDIO", "LOCAL", "OTRO"] as const;
export const CONDITIONS = ["A_REFORMAR", "REFORMA_PARCIAL", "BUEN_ESTADO", "REFORMADO", "OBRA_NUEVA"] as const;
export const CAPEX_LEVELS = ["LAVADO_CARA", "REFORMA_MEDIA", "REFORMA_INTEGRAL"] as const;
export const STRATEGIES = ["FLIP", "RENT", "BOTH", "NONE"] as const;
export const STATUSES = ["NEW", "SHORTLISTED", "PURSUING", "DISCARDED", "CLOSED"] as const;
export const RATINGS = ["A", "B", "C", "D"] as const;
export const VERDICTS = ["INVERTIR", "VIGILAR", "DESCARTAR"] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];
export type Condition = (typeof CONDITIONS)[number];
export type CapexLevel = (typeof CAPEX_LEVELS)[number];
export type Strategy = (typeof STRATEGIES)[number];
export type Rating = (typeof RATINGS)[number];
export type Verdict = (typeof VERDICTS)[number];

// --- Input de una oportunidad (creación/edición) -----------------------------
export const opportunityInputSchema = z.object({
  source: z.enum(SOURCES).default("MANUAL"),
  sourceUrl: z.string().url().optional().or(z.literal("")),
  sourceRef: z.string().optional(),
  title: z.string().min(3, "Título demasiado corto"),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  ccaa: z.string().optional(),
  postalCode: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  propertyType: z.enum(PROPERTY_TYPES).default("PISO"),
  askingPrice: z.number().int().positive("El precio debe ser positivo"),
  builtArea: z.number().positive().optional(),
  usableArea: z.number().positive().optional(),
  rooms: z.number().int().nonnegative().optional(),
  baths: z.number().int().nonnegative().optional(),
  floor: z.string().optional(),
  hasElevator: z.boolean().default(false),
  yearBuilt: z.number().int().optional(),
  condition: z.enum(CONDITIONS).optional(),
  description: z.string().optional(),
  images: z.array(z.string().url()).default([]),
  arvPricePerSqm: z.number().positive().optional(),
  marketRentMonthly: z.number().positive().optional(),
});

export type OpportunityInput = z.infer<typeof opportunityInputSchema>;

// --- Perfil de activos (buy-box) + zonas + fuentes ---------------------------
export const SWEEP_SOURCES = ["boe", "idealista", "reo-banks", "http", "mock"] as const;
export const SWEEP_SCHEDULES = ["weekly", "daily", "6h", "manual"] as const;
export type SweepSchedule = (typeof SWEEP_SCHEDULES)[number];

export const searchProfileInputSchema = z.object({
  name: z.string().min(2, "Nombre demasiado corto"),
  active: z.boolean().default(true),
  zones: z.array(z.string().min(1)).default([]),
  sources: z.array(z.enum(SWEEP_SOURCES)).default(["mock"]),
  propertyTypes: z.array(z.enum(PROPERTY_TYPES)).default([]),
  minPrice: z.number().int().nonnegative().optional(),
  maxPrice: z.number().int().positive().optional(),
  minArea: z.number().positive().optional(),
  maxPricePerSqm: z.number().positive().optional(),
  minRooms: z.number().int().nonnegative().optional(),
  conditions: z.array(z.enum(CONDITIONS)).default([]),
  minNetYield: z.number().optional(),
  minFlipMargin: z.number().optional(),
  minDiscountToMarket: z.number().optional(),
  keywords: z.string().optional(),
  schedule: z.enum(SWEEP_SCHEDULES).default("weekly"),
});

export type SearchProfileInput = z.infer<typeof searchProfileInputSchema>;

/** Resultado de comprobar una oportunidad contra un perfil de activos. */
export interface MatchResult {
  matched: boolean;
  matchScore: number; // 0-100 de encaje
  passed: string[]; // criterios cumplidos
  failed: string[]; // criterios no cumplidos
}

// --- Supuestos del inversor (parámetros de underwriting) ---------------------
export interface InvestorAssumptions {
  // Financiación
  ltv: number; // loan-to-value (0-1)
  mortgageRate: number; // TIN anual (0-1)
  mortgageTermYears: number;
  // Costes de adquisición (los que no dependen de la CCAA)
  notaryPct: number; // sobre precio compra
  registryPct: number;
  gestoriaFixed: number; // €
  legalDueDiligence: number; // €
  buyAgencyPct: number; // comisión de compra (personal shopper), si aplica
  // Flip
  projectMonths: number; // duración total del proyecto (compra->venta)
  sellAgencyPct: number; // comisión de venta
  sellingCostsFixed: number; // home staging, certificado energético, etc.
  plusvaliaMunicipalPct: number; // aproximación sobre precio venta (vendedor)
  // Holding mensual (durante la obra/venta)
  ibiAnnualPct: number; // IBI anual aprox. sobre valor
  communityMonthly: number; // gastos de comunidad €/mes
  insuranceAnnual: number; // seguro €/año
  utilitiesMonthly: number; // suministros durante obra €/mes
  // Alquiler (explotación)
  vacancyPct: number; // % de meses vacíos
  mgmtPct: number; // gestión / administración sobre renta
  maintenancePct: number; // mantenimiento sobre renta
  nonPaymentReservePct: number; // reserva por impago
  landlordInsuranceAnnual: number; // seguro de impago/hogar €/año
  // Umbrales de decisión
  minNetYield: number; // % rentabilidad neta mínima (alquiler)
  minFlipMargin: number; // % margen mínimo (flip)
}

// --- Resultado del análisis --------------------------------------------------
export interface CostLine {
  label: string;
  amount: number;
}

export interface FlipResult {
  arv: number; // valor de venta tras reforma
  totalInvestment: number; // capital total invertido (sin financiación)
  acquisitionCosts: number;
  capex: number;
  holdingCosts: number;
  sellingCosts: number;
  grossProfit: number; // beneficio antes de impuestos de sociedades
  marginOnCost: number; // beneficio / coste total (%)
  roiOnEquity: number; // beneficio / capital propio aportado (%)
  annualizedRoi: number; // ROI anualizado (%)
  equity: number; // capital propio necesario
  breakdown: CostLine[];
  meetsThreshold: boolean;
}

export interface RentalResult {
  monthlyRent: number;
  grossYield: number; // % renta bruta anual / inversión total
  effectiveGrossIncome: number; // renta anual ajustada por vacancia/impago
  operatingExpenses: number; // gastos anuales de explotación
  noi: number; // net operating income anual
  netYield: number; // % NOI / inversión total
  annualDebtService: number;
  annualCashflow: number; // NOI - servicio de deuda
  monthlyCashflow: number;
  cashOnCash: number; // % cashflow / capital propio
  equity: number;
  breakdown: CostLine[];
  meetsThreshold: boolean;
}

// --- Valoración de mercado ---------------------------------------------------
export type MarketGranularity = "codigo_postal" | "distrito" | "municipio" | "provincia" | "nacional";

export interface MarketValuation {
  province: string | null;
  zoneName: string | null; // barrio/distrito/municipio si se resolvió fino
  granularity: MarketGranularity; // nivel de los comparables usados
  saleEurSqm: number | null; // precio medio de venta de mercado (as-is)
  rentEurSqmMonth: number | null; // renta media de mercado
  arvPricePerSqm: number | null; // €/m² objetivo de venta usado en el análisis
  marketRentMonthly: number | null; // renta de mercado usada en el análisis
  source: "PROVIDED" | "MARKET_DATA" | "MIXED" | "NONE";
  confidence: "alta" | "media" | "baja";
  notes: string[];
}

// --- Señales de oportunidad --------------------------------------------------
export interface DealSignal {
  key: string;
  label: string;
  tone: "positive" | "neutral" | "negative";
}

// --- Máximo precio de compra recomendado (MAO) -------------------------------
export interface MaoResult {
  flipMao: number | null; // precio máx. para cumplir el margen flip objetivo
  rentMao: number | null; // precio máx. para cumplir la rent. neta objetivo
  recommended: number | null; // recomendado según la mejor estrategia viable
  targetFlipMargin: number; // % objetivo usado
  targetNetYield: number; // % objetivo usado
  vsAsking: number | null; // % del MAO recomendado frente al precio pedido
}

// --- Motivación del vendedor / señales de urgencia ---------------------------
export interface MotivationResult {
  score: number; // 0-100 (probabilidad de venta motivada/urgente)
  cues: string[]; // pistas detectadas en el texto
}

export interface AnalysisResult {
  // Entradas derivadas
  pricePerSqm: number | null;
  arv: number | null;
  discountToArv: number | null; // % descuento del all-in frente al ARV
  discountToMarket: number | null; // % que el precio de compra está por debajo del mercado as-is
  capex: number;
  valuation: MarketValuation;
  // Escenarios
  flip: FlipResult | null;
  rental: RentalResult | null;
  // Síntesis
  score: number; // 0-100
  rating: Rating;
  verdict: Verdict; // INVERTIR | VIGILAR | DESCARTAR
  bestStrategy: Strategy;
  signals: DealSignal[]; // banderas de oportunidad
  mao: MaoResult; // máximo precio de compra recomendado
  motivation: MotivationResult; // señales de venta motivada/urgente
  reasons: string[]; // explicación legible de la puntuación
  assumptions: InvestorAssumptions;
  warnings: string[];
}
