import { describe, it, expect } from "vitest";
import { buildDigest, renderText } from "@/lib/alerts";
import type { OpportunityDTO } from "@/lib/opportunity";

function dto(over: Partial<OpportunityDTO>): OpportunityDTO {
  return {
    id: "x",
    title: "Piso",
    city: "Madrid",
    province: "Madrid",
    propertyType: "PISO",
    askingPrice: 100000,
    score: 50,
    verdict: "VIGILAR",
    sourceUrl: null,
    analysis: null,
    ...(over as OpportunityDTO),
  } as OpportunityDTO;
}

describe("Digest de alertas", () => {
  it("ordena por score descendente y cuenta", () => {
    const d = buildDigest("Perfil", "run1", [
      dto({ id: "a", title: "A", score: 60 }),
      dto({ id: "b", title: "B", score: 90 }),
      dto({ id: "c", title: "C", score: 75 }),
    ]);
    expect(d.count).toBe(3);
    expect(d.items.map((i) => i.id)).toEqual(["b", "c", "a"]);
  });

  it("renderiza texto con título, precio y perfil", () => {
    const d = buildDigest("Flip Madrid", "run1", [
      dto({ id: "a", title: "Piso en Salamanca", askingPrice: 250000, score: 88, verdict: "INVERTIR" }),
    ]);
    const txt = renderText(d);
    expect(txt).toContain("Flip Madrid");
    expect(txt).toContain("Piso en Salamanca");
    expect(txt).toContain("88");
  });

  it("extrae métricas del análisis (MAO, descuento)", () => {
    const d = buildDigest("P", "r", [
      dto({
        id: "a",
        analysis: {
          mao: { recommended: 180000 },
          discountToMarket: 20,
          rental: { netYield: 7 },
          flip: { marginOnCost: 22 },
        } as OpportunityDTO["analysis"],
      }),
    ]);
    expect(d.items[0].mao).toBe(180000);
    expect(d.items[0].discountToMarket).toBe(20);
    expect(d.items[0].netYield).toBe(7);
    expect(d.items[0].flipMargin).toBe(22);
  });
});
