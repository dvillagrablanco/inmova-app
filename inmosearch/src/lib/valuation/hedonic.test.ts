import { describe, it, expect } from "vitest";
import { hedonicAdjust } from "@/lib/valuation/hedonic";
import { estimateMarket } from "@/lib/valuation";

describe("Ajuste hedónico (AVM)", () => {
  it("penaliza un 4º sin ascensor", () => {
    const r = hedonicAdjust({ floor: "4", hasElevator: false });
    expect(r.factor).toBeLessThan(1);
    expect(r.adjustments.some((a) => a.pct < 0)).toBe(true);
  });
  it("prima un ático con ascensor", () => {
    const r = hedonicAdjust({ floor: "Ático", hasElevator: true });
    expect(r.factor).toBeGreaterThan(1);
  });
  it("acota el factor a ±20%", () => {
    const r = hedonicAdjust({ floor: "6", hasElevator: false, yearBuilt: 1950, area: 200 });
    expect(r.factor).toBeGreaterThanOrEqual(0.8);
    expect(r.factor).toBeLessThanOrEqual(1.2);
  });
  it("neutro sin datos", () => {
    expect(hedonicAdjust({}).factor).toBe(1);
  });
});

describe("Valoración aplica el ajuste hedónico al ARV", () => {
  it("un 5º sin ascensor tiene ARV menor que un 2º con ascensor en la misma zona", () => {
    const base = { province: "Madrid", city: "Madrid", postalCode: "28006", area: 80 };
    const malo = estimateMarket({ ...base, floor: "5", hasElevator: false });
    const bueno = estimateMarket({ ...base, floor: "2", hasElevator: true });
    expect(malo.arvPricePerSqm!).toBeLessThan(bueno.arvPricePerSqm!);
    expect(malo.hedonicFactor!).toBeLessThan(1);
  });
});
