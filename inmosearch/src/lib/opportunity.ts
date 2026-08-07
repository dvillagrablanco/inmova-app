// INMOSEARCH — Capa de servicio de oportunidades (persistencia + análisis)
import type { Opportunity, Prisma } from "@prisma/client";
import { prisma } from "./db";
import { analyzeOpportunity } from "./underwriting";
import { fetchMarketData } from "./valuation";
import { estimateCapex, type CapexEstimate } from "./capex";
import { matchProfile, type MatchCandidate } from "./profiles/match";
import { catastroEnabled, enrichFromCatastro } from "./enrichment/catastro";
import {
  opportunityInputSchema,
  type AnalysisResult,
  type CapexLevel,
  type Condition,
  type OpportunityInput,
  type SearchProfileInput,
} from "./types";

export interface OpportunityDTO extends Omit<Opportunity, "images" | "capexBreakdown" | "analysis" | "priceHistory"> {
  images: string[];
  capexBreakdown: { label: string; amount: number }[];
  analysis: AnalysisResult | null;
  priceHistory: { date: string; price: number }[];
  daysOnMarket: number; // días desde publicación/primera detección (calculado)
}

/** Convierte un registro de Prisma en un DTO con los campos JSON parseados. */
export function toDTO(o: Opportunity): OpportunityDTO {
  return {
    ...o,
    images: safeParse<string[]>(o.images, []),
    capexBreakdown: safeParse<{ label: string; amount: number }[]>(o.capexBreakdown, []),
    analysis: o.analysis ? safeParse<AnalysisResult | null>(o.analysis, null) : null,
    priceHistory: safeParse<{ date: string; price: number }[]>(o.priceHistory, []),
    daysOnMarket: daysOnMarket(o.firstListedAt, o.createdAt),
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
  opts: AnalyzeOptions = {},
  meta: { initialPrice?: number | null; daysOnMarket?: number | null } = {}
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

  // Datos de mercado reales de proveedor externo (Idealista Data / feed
  // autorizado) si está configurado; si no, null y se usan las tablas internas.
  const marketOverride = await fetchMarketData({
    province: input.province,
    city: input.city,
    postalCode: input.postalCode,
    address: input.address,
    propertyType: input.propertyType,
  });

  const analysis = analyzeOpportunity({
    askingPrice: input.askingPrice,
    ccaa: input.ccaa,
    province: input.province,
    city: input.city,
    postalCode: input.postalCode,
    address: input.address,
    propertyType: input.propertyType,
    builtArea: input.builtArea,
    usableArea: input.usableArea,
    baths: input.baths,
    floor: input.floor,
    hasElevator: input.hasElevator,
    yearBuilt: input.yearBuilt,
    condition: input.condition as Condition | undefined,
    arvPricePerSqm: input.arvPricePerSqm,
    marketRentMonthly: input.marketRentMonthly,
    initialPrice: meta.initialPrice ?? input.initialPrice ?? null,
    daysOnMarket: meta.daysOnMarket ?? null,
    text: `${input.title} ${input.description ?? ""}`,
    capex: capex.total,
    capexLevel: capex.level,
    marketOverride,
  });

  return { capex, analysis };
}

/** Días desde la publicación (o primera detección). */
export function daysOnMarket(firstListedAt: Date | null, createdAt: Date, now = new Date()): number {
  const from = firstListedAt ?? createdAt;
  return Math.max(0, Math.floor((now.getTime() - new Date(from).getTime()) / 86_400_000));
}

function toDbData(
  input: OpportunityInput,
  capex: CapexEstimate,
  analysis: AnalysisResult,
  priceMeta: { initialPrice: number; priceHistory: string; firstListedAt: Date | null }
) {
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
    firstListedAt: priceMeta.firstListedAt,
    initialPrice: priceMeta.initialPrice,
    priceHistory: priceMeta.priceHistory,
    priceDropPct: analysis.priceDropPct,
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
  const now = new Date();
  const firstListedAt = input.firstListedAt ? new Date(input.firstListedAt) : null;
  const initialPrice = input.initialPrice ?? input.askingPrice;
  const dom = daysOnMarket(firstListedAt, now, now);
  const { capex, analysis } = await buildAnalyzedPayload(input, opts, { initialPrice, daysOnMarket: dom });
  const priceHistory = JSON.stringify([{ date: now.toISOString(), price: input.askingPrice }]);
  const record = await prisma.opportunity.create({
    data: toDbData(input, capex, analysis, { initialPrice, priceHistory, firstListedAt }),
  });
  return toDTO(record);
}

function toMatchCandidate(input: OpportunityInput, analysis: AnalysisResult): MatchCandidate {
  return {
    propertyType: input.propertyType,
    askingPrice: input.askingPrice,
    area: input.builtArea ?? input.usableArea ?? null,
    pricePerSqm: analysis.pricePerSqm,
    rooms: input.rooms ?? null,
    condition: input.condition ?? null,
    netYield: analysis.rental?.netYield ?? null,
    flipMargin: analysis.flip?.marginOnCost ?? null,
    discountToMarket: analysis.discountToMarket,
    text: `${input.title} ${input.description ?? ""}`,
    zoneText: [input.city, input.province, input.postalCode].filter(Boolean).join(" "),
  };
}

export interface IngestOptions extends AnalyzeOptions {
  profileId?: string;
  profileInput?: SearchProfileInput; // para calcular el match con el buy-box
  dedupKey?: string;
}

export interface IngestResult {
  dto: OpportunityDTO | null;
  status: "created" | "duplicate" | "updated";
  priceDropped?: boolean;
}

/** Ingesta desde un barrido: deduplica, enriquece con Catastro, analiza,
 * calcula el encaje con el perfil y persiste. En duplicados, si el precio ha
 * cambiado, actualiza la oportunidad (historial + bajada + reanálisis). */
export async function ingestOpportunity(rawInput: unknown, opts: IngestOptions = {}): Promise<IngestResult> {
  const input = opportunityInputSchema.parse(rawInput);
  const now = new Date();

  // 1) Deduplicación por clave estable.
  if (opts.dedupKey) {
    const existing = await prisma.opportunity.findUnique({ where: { dedupKey: opts.dedupKey } });
    if (existing) {
      if (input.askingPrice === existing.askingPrice) return { dto: toDTO(existing), status: "duplicate" };
      // El precio ha cambiado: actualiza historial y reanaliza.
      const initialPrice = existing.initialPrice ?? existing.askingPrice;
      const history = safeParse<{ date: string; price: number }[]>(existing.priceHistory, []);
      history.push({ date: now.toISOString(), price: input.askingPrice });
      const dom = daysOnMarket(existing.firstListedAt, existing.createdAt, now);
      const { capex, analysis } = await buildAnalyzedPayload(input, opts, { initialPrice, daysOnMarket: dom });
      let matched = existing.matched;
      let matchScore = existing.matchScore;
      if (opts.profileInput) {
        const r = matchProfile(toMatchCandidate(input, analysis), opts.profileInput);
        matched = r.matched;
        matchScore = r.matchScore;
      }
      const updated = await prisma.opportunity.update({
        where: { id: existing.id },
        data: {
          askingPrice: input.askingPrice,
          initialPrice,
          priceHistory: JSON.stringify(history),
          priceDropPct: analysis.priceDropPct,
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
          matched,
          matchScore,
        },
      });
      return { dto: toDTO(updated), status: "updated", priceDropped: input.askingPrice < existing.askingPrice };
    }
  }

  // 2) Enriquecimiento con Catastro (superficie/año reales) si está activo.
  let enriched = false;
  if (catastroEnabled()) {
    const cat = await enrichFromCatastro({ province: input.province, city: input.city, address: input.address });
    if (cat) {
      enriched = true;
      if (cat.builtArea && !input.builtArea) input.builtArea = cat.builtArea;
      if (cat.yearBuilt && !input.yearBuilt) input.yearBuilt = cat.yearBuilt;
    }
  }

  // 3) Análisis.
  const firstListedAt = input.firstListedAt ? new Date(input.firstListedAt) : null;
  const initialPrice = input.initialPrice ?? input.askingPrice;
  const dom = daysOnMarket(firstListedAt, now, now);
  const { capex, analysis } = await buildAnalyzedPayload(input, opts, { initialPrice, daysOnMarket: dom });

  // 4) Encaje con el perfil (buy-box).
  let matched = false;
  let matchScore: number | null = null;
  if (opts.profileInput) {
    const r = matchProfile(toMatchCandidate(input, analysis), opts.profileInput);
    matched = r.matched;
    matchScore = r.matchScore;
  }

  // 5) Persistencia.
  const priceHistory = JSON.stringify([{ date: now.toISOString(), price: input.askingPrice }]);
  const record = await prisma.opportunity.create({
    data: {
      ...toDbData(input, capex, analysis, { initialPrice, priceHistory, firstListedAt }),
      dedupKey: opts.dedupKey ?? null,
      profileId: opts.profileId ?? null,
      matched,
      matchScore,
      enriched,
    },
  });
  return { dto: toDTO(record), status: "created" };
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
    initialPrice: existing.initialPrice ?? undefined,
  };
  const dom = daysOnMarket(existing.firstListedAt, existing.createdAt);
  const initialPrice = existing.initialPrice ?? existing.askingPrice;
  const { capex, analysis } = await buildAnalyzedPayload(input, opts, { initialPrice, daysOnMarket: dom });
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
      priceDropPct: analysis.priceDropPct,
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
  profileId?: string;
  matchedOnly?: boolean;
}

export async function listOpportunities(filters: ListFilters = {}): Promise<OpportunityDTO[]> {
  const where: Prisma.OpportunityWhereInput = {};
  if (filters.status) where.status = filters.status;
  if (filters.ccaa) where.ccaa = filters.ccaa;
  if (filters.strategy) where.bestStrategy = filters.strategy;
  if (filters.verdict) where.verdict = filters.verdict;
  if (filters.profileId) where.profileId = filters.profileId;
  if (filters.matchedOnly) where.matched = true;
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
