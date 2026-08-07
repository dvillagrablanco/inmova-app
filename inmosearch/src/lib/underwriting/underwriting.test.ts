import { describe, it, expect } from "vitest";
import { analyzeOpportunity } from "@/lib/underwriting";
import { annualMortgagePayment } from "@/lib/underwriting/rental";
import { computeAcquisitionCosts } from "@/lib/underwriting/acquisition";
import { DEFAULT_ASSUMPTIONS } from "@/lib/underwriting/assumptions";
import { itpForCcaa } from "@/lib/data/regions";

describe("ITP por CCAA", () => {
  it("usa el tipo de Madrid (6%)", () => {
    expect(itpForCcaa("MADRID")).toBeCloseTo(0.06);
  });
  it("normaliza nombres con acentos y variantes", () => {
    expect(itpForCcaa("Cataluña")).toBeCloseTo(0.1);
    expect(itpForCcaa("comunitat valenciana")).toBeCloseTo(0.1);
  });
  it("cae al tipo por defecto si no conoce la CCAA", () => {
    expect(itpForCcaa("Narnia")).toBeCloseTo(0.08);
  });
});

describe("Costes de adquisición", () => {
  it("suma ITP + notaría + registro + fijos", () => {
    const r = computeAcquisitionCosts(100000, "MADRID", DEFAULT_ASSUMPTIONS);
    // ITP 6% = 6000, notaría 0.4% = 400, registro 0.3% = 300, gestoría 400, legal 500
    expect(r.total).toBe(6000 + 400 + 300 + 400 + 500);
  });
});

describe("Hipoteca (cuota francesa)", () => {
  it("calcula la cuota anual de forma coherente", () => {
    const annual = annualMortgagePayment(100000, 0.035, 25);
    // ~ 500,62 €/mes -> ~6008 €/año
    expect(annual).toBeGreaterThan(5800);
    expect(annual).toBeLessThan(6200);
  });
  it("con principal 0 devuelve 0", () => {
    expect(annualMortgagePayment(0, 0.03, 20)).toBe(0);
  });
});

describe("analyzeOpportunity — flip", () => {
  const result = analyzeOpportunity({
    askingPrice: 100000,
    ccaa: "MADRID",
    builtArea: 80,
    condition: "A_REFORMAR",
    arvPricePerSqm: 3000, // ARV = 240.000
    capex: 40000,
  });

  it("calcula ARV y precio/m²", () => {
    expect(result.arv).toBe(240000);
    expect(result.pricePerSqm).toBe(1250);
  });
  it("produce beneficio positivo con margen razonable", () => {
    expect(result.flip).not.toBeNull();
    expect(result.flip!.grossProfit).toBeGreaterThan(0);
    expect(result.flip!.marginOnCost).toBeGreaterThan(10);
  });
  it("asigna score y rating", () => {
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(["A", "B", "C", "D"]).toContain(result.rating);
  });
});

describe("analyzeOpportunity — alquiler", () => {
  const result = analyzeOpportunity({
    askingPrice: 100000,
    ccaa: "COMUNIDAD_VALENCIANA",
    builtArea: 85,
    marketRentMonthly: 850,
    capex: 15000,
  });

  it("calcula rentabilidad neta y cashflow", () => {
    expect(result.rental).not.toBeNull();
    expect(result.rental!.grossYield).toBeGreaterThan(0);
    expect(result.rental!.netYield).toBeLessThan(result.rental!.grossYield);
    expect(typeof result.rental!.monthlyCashflow).toBe("number");
  });
});

describe("analyzeOpportunity — bajada de precio y días en mercado", () => {
  const r = analyzeOpportunity({
    askingPrice: 128000,
    province: "Madrid",
    builtArea: 80,
    initialPrice: 150000,
    daysOnMarket: 120,
    text: "Piso rebajado",
  });
  it("calcula el % de bajada desde el precio inicial", () => {
    // (150000-128000)/150000 = 14,67%
    expect(r.priceDropPct).toBeGreaterThan(14);
    expect(r.priceDropPct).toBeLessThan(15);
  });
  it("expone días en mercado y añade señales", () => {
    expect(r.daysOnMarket).toBe(120);
    expect(r.signals.some((s) => s.key === "bajada")).toBe(true);
    expect(r.signals.some((s) => s.key === "dom")).toBe(true);
  });
  it("sin precio inicial no hay bajada", () => {
    const r2 = analyzeOpportunity({ askingPrice: 128000, province: "Madrid", builtArea: 80 });
    expect(r2.priceDropPct).toBeNull();
  });
});

describe("analyzeOpportunity — sin datos suficientes", () => {
  it("avisa cuando faltan ARV y renta", () => {
    const r = analyzeOpportunity({ askingPrice: 100000, capex: 10000 });
    expect(r.flip).toBeNull();
    expect(r.rental).toBeNull();
    expect(r.warnings.length).toBeGreaterThan(0);
    expect(r.bestStrategy).toBe("NONE");
  });
});
