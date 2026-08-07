import { describe, it, expect } from "vitest";
import { analyzeOpportunity } from "@/lib/underwriting";
import { analyzeStr } from "@/lib/underwriting/str";
import { DEFAULT_ASSUMPTIONS } from "@/lib/underwriting/assumptions";

describe("Escenario turístico (STR)", () => {
  it("calcula ADR, ocupación y NOI coherentes", () => {
    const r = analyzeStr({
      price: 150000,
      acquisitionCosts: 15000,
      capex: 20000,
      area: 70,
      monthlyRentLT: 900,
      longTermNoi: 6000,
      assumptions: DEFAULT_ASSUMPTIONS,
    });
    // ADR ≈ (900/30)*2.2 = 66
    expect(r.adr).toBe(66);
    expect(r.occupancy).toBeCloseTo(0.65);
    expect(r.grossAnnual).toBeGreaterThan(0);
    expect(r.furnishingCapex).toBe(Math.round(DEFAULT_ASSUMPTIONS.strFurnishingPerSqm * 70));
    expect(r.warnings.length).toBeGreaterThan(0); // aviso de licencia VUT
  });

  it("compara con el alquiler tradicional (vsLongTerm)", () => {
    const r = analyzeStr({
      price: 150000,
      acquisitionCosts: 15000,
      capex: 20000,
      area: 70,
      monthlyRentLT: 900,
      longTermNoi: 6000,
      assumptions: DEFAULT_ASSUMPTIONS,
    });
    expect(typeof r.vsLongTerm).toBe("number");
  });

  it("analyzeOpportunity incluye el escenario STR cuando hay renta", () => {
    const a = analyzeOpportunity({ askingPrice: 100000, province: "Madrid", builtArea: 70, marketRentMonthly: 900 });
    expect(a.str).not.toBeNull();
    expect(a.str!.netYield).toBeGreaterThan(0);
  });
});
