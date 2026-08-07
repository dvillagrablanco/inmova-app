import { describe, it, expect } from "vitest";
import { detectMotivation } from "@/lib/intake/distress";
import { parseEmailListings } from "@/lib/intake/email";

describe("Motivación del vendedor", () => {
  it("puntúa alto con varias señales de urgencia", () => {
    const r = detectMotivation("Urge vender por herencia. Precio negociable, se admiten ofertas.");
    expect(r.score).toBeGreaterThanOrEqual(40);
    expect(r.cues).toContain("Urge vender");
    expect(r.cues).toContain("Herencia");
  });
  it("puntúa 0 sin señales", () => {
    const r = detectMotivation("Bonito piso reformado, muy luminoso y bien comunicado.");
    expect(r.score).toBe(0);
    expect(r.cues).toHaveLength(0);
  });
});

describe("Parser de alertas por email", () => {
  const emailHtml = `
    <html><body>
      <h2>Nuevos anuncios para tu búsqueda</h2>
      <div>
        <a href="https://www.idealista.com/inmueble/12345678/">Piso en Carabanchel, Madrid</a>
        <p>72 m², 3 hab, para reformar. 118.000 &euro;</p>
      </div>
      <div>
        <a href="https://www.idealista.com/inmueble/87654321/">Ático en Vigo</a>
        <p>90 m², 2 hab, reformado. 189.000 &euro;</p>
      </div>
    </body></html>`;

  it("extrae varios anuncios con su URL", () => {
    const listings = parseEmailListings(emailHtml);
    expect(listings.length).toBe(2);
    expect(listings[0].askingPrice).toBe(118000);
    expect(listings[0].sourceUrl).toContain("idealista.com/inmueble/12345678");
    expect(listings[1].askingPrice).toBe(189000);
  });

  it("deduplica anuncios repetidos por URL", () => {
    const dup = emailHtml + emailHtml;
    const listings = parseEmailListings(dup);
    expect(listings.length).toBe(2);
  });
});
