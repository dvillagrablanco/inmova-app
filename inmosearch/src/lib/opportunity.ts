// INMOSEARCH — Capa de servicio de oportunidades (persistencia + análisis)
import type { Opportunity, Prisma } from "@prisma/client";
import { prisma } from "./db";
import { analyzeOpportunity } from "./underwriting";
import { estimateCapex, type CapexEstimate } from "./capex";
import {
  opportunityInputSchema,
  type AnalysisResult,
  type CapexLevel,
  type Condition,
  type OpportunityInput,
} from "./types";

export interface OpportunityDTO extends Omit<Opportunity, "images" | "capexBreakdown" | "analysis"> {
  images: string[];
  capexBreakdown: { label: string; amount: number }[];
  analysis: AnalysisResult | null;
}

/** Convierte un registro de Prisma en un DTO con los campos JSON parseados. */
export function toDTO(o: Opportunity): OpportunityDTO {
  return {
    ...o,
    images: safeParse<string[]>(o.images, []),
    capexBreakdown: safeParse<{ label: string; amount: number }[]>(o.capexBreakdown, []),
    analysis: o.analysis ? safeParse<AnalysisResult | null>(o.analysis, null) : null,
  };
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

interface AnalyzeOptions {
  useVision?: boolean; // analizar imágenes con IA
}

/** Calcula CapEx + análisis para un input y devuelve el payload a persistir. */
async function buildAnalyzedPayload(
  input: OpportunityInput,
  opts: AnalyzeOptions = {}
): Promise<{ capex: CapexEstimate; analysis: AnalysisResult }> {
  const area = input.builtArea ?? input.usableArea ?? null;
  const capex = await estimateCapex({
    images: input.images,
    area,
    condition: input.condition as Condition | undefined,
    baths: input.baths,
    propertyType: input.propertyType,
    description: input.description,
    useVision: opts.useVision,
  });

  const analysis = analyzeOpportunity({
    askingPrice: input.askingPrice,
    ccaa: input.ccaa,
    province: input.province,
    city: input.city,
    propertyType: input.propertyType,
    builtArea: input.builtArea,
    usableArea: input.usableArea,
    baths: input.baths,
    condition: input.condition as Condition | undefined,
    arvPricePerSqm: input.arvPricePerSqm,
    marketRentMonthly: input.marketRentMonthly,
    capex: capex.total,
    capexLevel: capex.level,
  });

  return { capex, analysis };
}

function toDbData(input: OpportunityInput, capex: CapexEstimate, analysis: AnalysisResult) {
  const area = input.builtArea ?? input.usableArea ?? null;
  return {
    source: input.source,
    sourceUrl: input.sourceUrl || null,
    sourceRef: input.sourceRef || null,
    title: input.title,
    address: input.address || null,
    city: input.city || null,
    province: input.province || null,
    ccaa: input.ccaa || null,
    postalCode: input.postalCode || null,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
    propertyType: input.propertyType,
    askingPrice: input.askingPrice,
    builtArea: input.builtArea ?? null,
    usableArea: input.usableArea ?? null,
    rooms: input.rooms ?? null,
    baths: input.baths ?? null,
    floor: input.floor || null,
    hasElevator: input.hasElevator,
    yearBuilt: input.yearBuilt ?? null,
    condition: input.condition || null,
    description: input.description || null,
    images: JSON.stringify(input.images ?? []),
    arvPricePerSqm: input.arvPricePerSqm ?? null,
    marketRentMonthly: input.marketRentMonthly ?? null,
    capexLevel: capex.level as CapexLevel,
    capexEstimate: capex.total,
    capexPerSqm: capex.perSqm,
    capexBreakdown: JSON.stringify(capex.breakdown),
    capexSource: capex.source,
    analysis: JSON.stringify(analysis),
    score: analysis.score,
    rating: analysis.rating,
    verdict: analysis.verdict,
    bestStrategy: analysis.bestStrategy,
  } satisfies Prisma.OpportunityUncheckedCreateInput;
}

/** Crea una oportunidad: valida, estima CapEx, analiza y persiste. */
export async function createOpportunity(
  rawInput: unknown,
  opts: AnalyzeOptions = {}
): Promise<OpportunityDTO> {
  const input = opportunityInputSchema.parse(rawInput);
  const { capex, analysis } = await buildAnalyzedPayload(input, opts);
  const record = await prisma.opportunity.create({ data: toDbData(input, capex, analysis) });
  return toDTO(record);
}

/** Vuelve a analizar una oportunidad existente (p.ej. tras activar la IA de
 * imágenes o cambiar comparables). */
export async function reanalyzeOpportunity(id: string, opts: AnalyzeOptions = {}): Promise<OpportunityDTO> {
  const existing = await prisma.opportunity.findUnique({ where: { id } });
  if (!existing) throw new Error("Oportunidad no encontrada");
  const dto = toDTO(existing);
  const input: OpportunityInput = {
    source: existing.source as OpportunityInput["source"],
    sourceUrl: existing.sourceUrl || "",
    sourceRef: existing.sourceRef || undefined,
    title: existing.title,
    address: existing.address || undefined,
    city: existing.city || undefined,
    province: existing.province || undefined,
    ccaa: existing.ccaa || undefined,
    postalCode: existing.postalCode || undefined,
    lat: existing.lat ?? undefined,
    lng: existing.lng ?? undefined,
    propertyType: existing.propertyType as OpportunityInput["propertyType"],
    askingPrice: existing.askingPrice,
    builtArea: existing.builtArea ?? undefined,
    usableArea: existing.usableArea ?? undefined,
    rooms: existing.rooms ?? undefined,
    baths: existing.baths ?? undefined,
    floor: existing.floor || undefined,
    hasElevator: existing.hasElevator,
    yearBuilt: existing.yearBuilt ?? undefined,
    condition: existing.condition as OpportunityInput["condition"],
    description: existing.description || undefined,
    images: dto.images,
    arvPricePerSqm: existing.arvPricePerSqm ?? undefined,
    marketRentMonthly: existing.marketRentMonthly ?? undefined,
  };
  const { capex, analysis } = await buildAnalyzedPayload(input, opts);
  const record = await prisma.opportunity.update({
    where: { id },
    data: {
      capexLevel: capex.level,
      capexEstimate: capex.total,
      capexPerSqm: capex.perSqm,
      capexBreakdown: JSON.stringify(capex.breakdown),
      capexSource: capex.source,
      analysis: JSON.stringify(analysis),
      score: analysis.score,
      rating: analysis.rating,
      verdict: analysis.verdict,
      bestStrategy: analysis.bestStrategy,
    },
  });
  return toDTO(record);
}

export interface ListFilters {
  status?: string;
  minScore?: number;
  ccaa?: string;
  strategy?: string;
  verdict?: string;
}

export async function listOpportunities(filters: ListFilters = {}): Promise<OpportunityDTO[]> {
  const where: Prisma.OpportunityWhereInput = {};
  if (filters.status) where.status = filters.status;
  if (filters.ccaa) where.ccaa = filters.ccaa;
  if (filters.strategy) where.bestStrategy = filters.strategy;
  if (filters.verdict) where.verdict = filters.verdict;
  if (typeof filters.minScore === "number") where.score = { gte: filters.minScore };

  const records = await prisma.opportunity.findMany({
    where,
    orderBy: [{ score: "desc" }, { createdAt: "desc" }],
  });
  return records.map(toDTO);
}

export async function getOpportunity(id: string): Promise<OpportunityDTO | null> {
  const record = await prisma.opportunity.findUnique({ where: { id } });
  return record ? toDTO(record) : null;
}

export async function updateStatus(id: string, status: string, notes?: string): Promise<OpportunityDTO> {
  const record = await prisma.opportunity.update({
    where: { id },
    data: { status, ...(notes !== undefined ? { notes } : {}) },
  });
  return toDTO(record);
}

export async function deleteOpportunity(id: string): Promise<void> {
  await prisma.opportunity.delete({ where: { id } });
}
