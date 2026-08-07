import { describe, it, expect } from "vitest";
import { matchProfile, type MatchCandidate } from "@/lib/profiles/match";
import { searchProfileInputSchema } from "@/lib/types";

function candidate(over: Partial<MatchCandidate> = {}): MatchCandidate {
  return {
    propertyType: "PISO",
    askingPrice: 100000,
    area: 80,
    pricePerSqm: 1250,
    rooms: 3,
    condition: "A_REFORMAR",
    netYield: 7,
    flipMargin: 20,
    discountToMarket: 25,
    text: "Piso a reformar con ascensor en Madrid",
    zoneText: "Madrid Madrid 28020",
    ...over,
  };
}

const profile = (over: Record<string, unknown> = {}) =>
  searchProfileInputSchema.parse({
    name: "Test",
    zones: ["Madrid"],
    sources: ["boe"],
    propertyTypes: ["PISO"],
    maxPrice: 130000,
    maxPricePerSqm: 2000,
    minNetYield: 6,
    minFlipMargin: 15,
    minDiscountToMarket: 10,
    ...over,
  });

describe("matchProfile", () => {
  it("acepta una oportunidad que cumple todo el buy-box", () => {
    const r = matchProfile(candidate(), profile());
    expect(r.matched).toBe(true);
    expect(r.matchScore).toBe(100);
    expect(r.failed).toHaveLength(0);
  });

  it("rechaza por zona (criterio hard)", () => {
    const r = matchProfile(candidate({ zoneText: "Sevilla" }), profile());
    expect(r.matched).toBe(false);
    expect(r.failed).toContain("Zona");
  });

  it("rechaza por precio máximo (criterio hard)", () => {
    const r = matchProfile(candidate({ askingPrice: 200000 }), profile());
    expect(r.matched).toBe(false);
    expect(r.failed).toContain("Precio máximo");
  });

  it("rechaza si no alcanza la rentabilidad mínima", () => {
    const r = matchProfile(candidate({ netYield: 3 }), profile());
    expect(r.matched).toBe(false);
    expect(r.failed).toContain("Rent. neta mín.");
  });

  it("filtra por palabras clave", () => {
    const withKw = profile({ keywords: "terraza, exterior" });
    expect(matchProfile(candidate(), withKw).matched).toBe(false); // no menciona terraza/exterior
    expect(matchProfile(candidate({ text: "Piso exterior muy luminoso" }), withKw).matched).toBe(true);
  });

  it("sin criterios, todo encaja", () => {
    const empty = searchProfileInputSchema.parse({ name: "Vacío", sources: ["boe"] });
    const r = matchProfile(candidate(), empty);
    expect(r.matched).toBe(true);
    expect(r.matchScore).toBe(100);
  });
});
