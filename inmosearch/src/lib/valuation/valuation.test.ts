import { describe, it, expect } from "vitest";
import { estimateMarket } from "@/lib/valuation";
import { detectProvince, marketForProvince } from "@/lib/data/market";
import { analyzeOpportunity } from "@/lib/underwriting";
import { parseListing } from "@/lib/intake/parse";

describe("Datos de mercado por provincia", () => {
  it("encuentra provincias con acentos y alias", () => {
    expect(marketForProvince("Madrid")?.saleEurSqm).toBeGreaterThan(0);
    expect(marketForProvince("A Coruña")?.saleEurSqm).toBeGreaterThan(0);
    expect(marketForProvince("Gipuzkoa")?.saleEurSqm).toBeGreaterThan(0);
  });
  it("detecta provincia por ciudad", () => {
    expect(detectProvince("Piso en Vigo")).toBe("PONTEVEDRA");
    expect(detectProvince("Ático en el centro de Bilbao")).toBe("BIZKAIA");
  });
});

describe("Valoración automática", () => {
  it("rellena ARV y renta con datos de mercado si no se aportan", () => {
    const v = estimateMarket({ province: "Madrid", area: 80, condition: "A_REFORMAR" });
    expect(v.source).toBe("MARKET_DATA");
    expect(v.arvPricePerSqm).toBeGreaterThan(0);
    expect(v.marketRentMonthly).toBeGreaterThan(0);
    expect(v.confidence).not.toBe("baja");
  });
  it("los valores aportados por el usuario prevalecen", () => {
    const v = estimateMarket({ province: "Madrid", area: 80, providedArvPerSqm: 5000, providedRentMonthly: 2000 });
    expect(v.arvPricePerSqm).toBe(5000);
    expect(v.marketRentMonthly).toBe(2000);
    expect(v.source).toBe("PROVIDED");
  });
  it("usa la media nacional con baja confianza si no hay provincia", () => {
    const v = estimateMarket({ area: 80 });
    expect(v.confidence).toBe("baja");
    expect(v.arvPricePerSqm).toBeGreaterThan(0);
  });
  it("los datos de mercado externos (Idealista Data) prevalecen sobre las tablas internas", () => {
    const base = estimateMarket({ province: "Madrid", city: "Madrid", area: 80 });
    const withData = estimateMarket({
      province: "Madrid",
      city: "Madrid",
      area: 80,
      marketOverride: { saleEurSqm: 1234, rentEurSqmMonth: 5, zoneName: "Madrid", provider: "Idealista Data" },
    });
    // El precio de venta de mercado usado debe ser el del proveedor externo.
    expect(withData.saleEurSqm).toBe(1234);
    expect(withData.rentEurSqmMonth).toBe(5);
    expect(withData.confidence).toBe("alta");
    expect(withData.saleEurSqm).not.toBe(base.saleEurSqm);
    expect(withData.notes.join(" ")).toContain("Idealista Data");
  });
});

describe("Análisis con valoración automática y descuento", () => {
  it("analiza con solo precio + área + provincia (sin comparables)", () => {
    const r = analyzeOpportunity({
      askingPrice: 100000,
      province: "Madrid",
      builtArea: 80,
      condition: "A_REFORMAR",
    });
    expect(r.flip).not.toBeNull(); // ARV auto
    expect(r.rental).not.toBeNull(); // renta auto
    expect(r.discountToMarket).not.toBeNull();
    expect(["INVERTIR", "VIGILAR", "DESCARTAR"]).toContain(r.verdict);
  });
  it("marca descuento positivo cuando el precio está por debajo de mercado", () => {
    // Madrid ~3900 €/m²; comprar a 1250 €/m² es un gran descuento.
    const r = analyzeOpportunity({ askingPrice: 100000, province: "Madrid", builtArea: 80 });
    expect(r.discountToMarket!).toBeGreaterThan(50);
    expect(r.signals.some((s) => s.tone === "positive")).toBe(true);
  });
});

describe("Parser de anuncios", () => {
  it("extrae precio, superficie, habitaciones y estado", () => {
    const p = parseListing("Piso en Carabanchel, Madrid. 3 habitaciones, 1 baño, 72 m². Para reformar. 118.000 €");
    expect(p.askingPrice).toBe(118000);
    expect(p.builtArea).toBe(72);
    expect(p.rooms).toBe(3);
    expect(p.baths).toBe(1);
    expect(p.condition).toBe("A_REFORMAR");
    expect(p.province).toMatch(/MADRID/i);
    expect(p.confidence).toBe("alta");
  });
  it("detecta ático y precio con € pegado", () => {
    const p = parseListing("Ático reformado en Vigo de 90m2 por 189000€");
    expect(p.propertyType).toBe("ATICO");
    expect(p.askingPrice).toBe(189000);
    expect(p.builtArea).toBe(90);
  });
  it("marca precio faltante", () => {
    const p = parseListing("Bonito piso en el centro, luminoso y reformado");
    expect(p.askingPrice).toBeNull();
    expect(p.missing).toContain("precio");
  });
});
