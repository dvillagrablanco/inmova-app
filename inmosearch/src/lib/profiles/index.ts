// INMOSEARCH — Capa de servicio de perfiles de activos (buy-box)
import type { SearchProfile } from "@prisma/client";
import { prisma } from "@/lib/db";
import { searchProfileInputSchema, type SearchProfileInput } from "@/lib/types";

export { matchProfile } from "./match";
export type { MatchCandidate } from "./match";

export interface ProfileDTO
  extends Omit<SearchProfile, "zones" | "sources" | "propertyTypes" | "conditions"> {
  zones: string[];
  sources: string[];
  propertyTypes: string[];
  conditions: string[];
}

export function toProfileDTO(p: SearchProfile): ProfileDTO {
  return {
    ...p,
    zones: parse(p.zones),
    sources: parse(p.sources),
    propertyTypes: parse(p.propertyTypes),
    conditions: parse(p.conditions),
  };
}

/** Convierte un DTO/registro en el input tipado usado por el matcher. */
export function profileToInput(p: ProfileDTO): SearchProfileInput {
  return {
    name: p.name,
    active: p.active,
    zones: p.zones,
    sources: p.sources as SearchProfileInput["sources"],
    propertyTypes: p.propertyTypes as SearchProfileInput["propertyTypes"],
    minPrice: p.minPrice ?? undefined,
    maxPrice: p.maxPrice ?? undefined,
    minArea: p.minArea ?? undefined,
    maxPricePerSqm: p.maxPricePerSqm ?? undefined,
    minRooms: p.minRooms ?? undefined,
    conditions: p.conditions as SearchProfileInput["conditions"],
    minNetYield: p.minNetYield ?? undefined,
    minFlipMargin: p.minFlipMargin ?? undefined,
    minDiscountToMarket: p.minDiscountToMarket ?? undefined,
    keywords: p.keywords ?? undefined,
    schedule: p.schedule as SearchProfileInput["schedule"],
  };
}

function parse(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function toDbData(input: SearchProfileInput) {
  return {
    name: input.name,
    active: input.active,
    zones: JSON.stringify(input.zones),
    sources: JSON.stringify(input.sources),
    propertyTypes: JSON.stringify(input.propertyTypes),
    minPrice: input.minPrice ?? null,
    maxPrice: input.maxPrice ?? null,
    minArea: input.minArea ?? null,
    maxPricePerSqm: input.maxPricePerSqm ?? null,
    minRooms: input.minRooms ?? null,
    conditions: JSON.stringify(input.conditions),
    minNetYield: input.minNetYield ?? null,
    minFlipMargin: input.minFlipMargin ?? null,
    minDiscountToMarket: input.minDiscountToMarket ?? null,
    keywords: input.keywords ?? null,
    schedule: input.schedule,
  };
}

export async function createProfile(raw: unknown): Promise<ProfileDTO> {
  const input = searchProfileInputSchema.parse(raw);
  const rec = await prisma.searchProfile.create({ data: toDbData(input) });
  return toProfileDTO(rec);
}

export async function updateProfile(id: string, raw: unknown): Promise<ProfileDTO> {
  const input = searchProfileInputSchema.parse(raw);
  const rec = await prisma.searchProfile.update({ where: { id }, data: toDbData(input) });
  return toProfileDTO(rec);
}

export async function listProfiles(): Promise<ProfileDTO[]> {
  const recs = await prisma.searchProfile.findMany({ orderBy: { createdAt: "desc" } });
  return recs.map(toProfileDTO);
}

export async function getProfile(id: string): Promise<ProfileDTO | null> {
  const rec = await prisma.searchProfile.findUnique({ where: { id } });
  return rec ? toProfileDTO(rec) : null;
}

export async function deleteProfile(id: string): Promise<void> {
  await prisma.searchProfile.delete({ where: { id } });
}

/** Perfiles activos que toca barrer según su programación y la última ejecución. */
export async function profilesDue(now: Date): Promise<ProfileDTO[]> {
  const recs = await prisma.searchProfile.findMany({ where: { active: true } });
  return recs
    .map(toProfileDTO)
    .filter((p) => p.schedule !== "manual" && isDue(p.schedule, p.lastRunAt, now));
}

function isDue(schedule: string, lastRunAt: Date | null, now: Date): boolean {
  if (!lastRunAt) return true;
  const hours = (now.getTime() - new Date(lastRunAt).getTime()) / 3_600_000;
  switch (schedule) {
    case "6h":
      return hours >= 6;
    case "daily":
      return hours >= 24;
    case "weekly":
      return hours >= 24 * 7;
    default:
      return false;
  }
}
