import { describe, it, expect } from "vitest";
import { computeMao } from "@/lib/underwriting/mao";
import { analyzeFlip } from "@/lib/underwriting/flip";
import { analyzeRental } from "@/lib/underwriting/rental";
import { computeAcquisitionCosts } from "@/lib/underwriting/acquisition";
import { DEFAULT_ASSUMPTIONS } from "@/lib/underwriting/assumptions";

const a = DEFAULT_ASSUMPTIONS;

describe("MAO — máximo precio de compra", () => {
  it("el MAO flip produce exactamente el margen objetivo (roundtrip)", () => {
    const arv = 240000;
    const capex = 40000;
    const mao = computeMao({ askingPrice: 999999, arv, capex, monthlyRent: null, itpRate: 0.06, assumptions: a });
    expect(mao.flipMao).not.toBeNull();
    const acq = computeAcquisitionCosts(mao.flipMao!, "MADRID", a);
    const flip = analyzeFlip({ price: mao.flipMao!, acquisitionCosts: acq.total, capex, arv, assumptions: a });
    // Comprando al MAO, el margen debe quedar en el objetivo (±0,5 pts por redondeo).
    expect(flip.marginOnCost).toBeGreaterThan(a.minFlipMargin - 0.6);
    expect(flip.marginOnCost).toBeLessThan(a.minFlipMargin + 0.6);
  });

  it("el MAO alquiler produce la rentabilidad neta objetivo (roundtrip)", () => {
    const rent = 900;
    const capex = 15000;
    const mao = computeMao({ askingPrice: 999999, arv: null, capex, monthlyRent: rent, itpRate: 0.06, assumptions: a });
    expect(mao.rentMao).not.toBeNull();
    const acq = computeAcquisitionCosts(mao.rentMao!, "MADRID", a);
    const rental = analyzeRental({ price: mao.rentMao!, acquisitionCosts: acq.total, capex, monthlyRent: rent, assumptions: a });
    expect(rental.netYield).toBeGreaterThan(a.minNetYield - 0.6);
    expect(rental.netYield).toBeLessThan(a.minNetYield + 0.6);
  });

  it("vsAsking positivo cuando el pedido está por debajo del MAO", () => {
    const mao = computeMao({ askingPrice: 100000, arv: 240000, capex: 40000, monthlyRent: 900, itpRate: 0.06, assumptions: a });
    expect(mao.recommended).not.toBeNull();
    expect(mao.vsAsking).not.toBeNull();
    expect(mao.recommended!).toBeGreaterThan(100000);
    expect(mao.vsAsking!).toBeGreaterThan(0);
  });
});
