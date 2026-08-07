import { describe, it, expect } from "vitest";
import { finerMarket } from "@/lib/data/zones";
import { estimateMarket } from "@/lib/valuation";

describe("Comparables finos (barrio/distrito/municipio)", () => {
  it("resuelve por código postal (distrito de Madrid)", () => {
    const r = finerMarket("28006", "Madrid", "Madrid");
    expect(r).not.toBeNull();
    expect(r!.granularity).toBe("codigo_postal");
    expect(r!.zoneName).toContain("Salamanca");
    expect(r!.saleEurSqm).toBeGreaterThan(6000);
  });

  it("resuelve por municipio por nombre (Marbella ≠ media de Málaga)", () => {
    const r = finerMarket(null, "Marbella", "Málaga");
    expect(r).not.toBeNull();
    expect(r!.granularity).toBe("municipio");
    expect(r!.saleEurSqm).toBeGreaterThan(3000);
  });

  it("no confunde el distrito Salamanca de Madrid con la provincia de Salamanca", () => {
    // Sin CP ni contexto de Madrid, 'Salamanca' NO debe resolver a distrito.
    const r = finerMarket(null, "Salamanca", "Salamanca");
    expect(r).toBeNull();
  });

  it("devuelve null si no hay zona fina (cae a provincia en el llamador)", () => {
    expect(finerMarket("47001", "Valladolid", "Valladolid")).toBeNull();
  });
});

describe("Valoración usa comparables finos", () => {
  it("un piso en 28006 se valora por distrito (Salamanca), no por media de Madrid", () => {
    const v = estimateMarket({ province: "Madrid", city: "Madrid", postalCode: "28006", area: 80 });
    expect(v.granularity).toBe("codigo_postal");
    expect(v.zoneName).toContain("Salamanca");
    // Salamanca (~6800) es bastante mayor que la media provincial de Madrid (3900).
    expect(v.saleEurSqm!).toBeGreaterThan(5000);
    expect(v.confidence).toBe("alta");
  });

  it("sin CP conocido, cae a la media provincial", () => {
    const v = estimateMarket({ province: "Madrid", city: "Madrid", postalCode: "28099", area: 80 });
    expect(v.granularity).toBe("provincia");
  });
});
