// INMOSEARCH — Encaje de una oportunidad con un perfil de activos (buy-box)
import type { MatchResult, SearchProfileInput } from "@/lib/types";

export interface MatchCandidate {
  propertyType: string;
  askingPrice: number;
  area: number | null;
  pricePerSqm: number | null;
  rooms: number | null;
  condition: string | null;
  netYield: number | null; // %
  flipMargin: number | null; // %
  discountToMarket: number | null; // %
  text: string; // título + descripción (para palabras clave)
  zoneText: string; // ciudad/provincia/CP (para zonas)
}

interface Criterion {
  label: string;
  applies: boolean;
  ok: boolean;
  hard: boolean; // si un criterio "hard" falla, no hay match
}

/** Comprueba una oportunidad contra el buy-box del perfil. */
export function matchProfile(c: MatchCandidate, p: SearchProfileInput): MatchResult {
  const crits: Criterion[] = [];

  // --- Zona (hard) ---
  if (p.zones.length > 0) {
    const zt = norm(c.zoneText);
    const ok = p.zones.some((z) => zt.includes(norm(z)));
    crits.push({ label: "Zona", applies: true, ok, hard: true });
  }

  // --- Tipo (hard) ---
  if (p.propertyTypes.length > 0) {
    crits.push({ label: "Tipo", applies: true, ok: p.propertyTypes.includes(c.propertyType as never), hard: true });
  }

  // --- Precio (hard) ---
  if (p.minPrice != null) crits.push({ label: "Precio mínimo", applies: true, ok: c.askingPrice >= p.minPrice, hard: true });
  if (p.maxPrice != null) crits.push({ label: "Precio máximo", applies: true, ok: c.askingPrice <= p.maxPrice, hard: true });

  // --- Superficie / €·m² ---
  if (p.minArea != null) crits.push({ label: "Superficie mínima", applies: true, ok: (c.area ?? 0) >= p.minArea, hard: false });
  if (p.maxPricePerSqm != null)
    crits.push({ label: "€/m² máximo", applies: true, ok: (c.pricePerSqm ?? Infinity) <= p.maxPricePerSqm, hard: false });
  if (p.minRooms != null) crits.push({ label: "Habitaciones", applies: true, ok: (c.rooms ?? 0) >= p.minRooms, hard: false });

  // --- Estado ---
  if (p.conditions.length > 0)
    crits.push({ label: "Estado", applies: true, ok: c.condition != null && p.conditions.includes(c.condition as never), hard: false });

  // --- Umbrales financieros ---
  if (p.minNetYield != null)
    crits.push({ label: "Rent. neta mín.", applies: true, ok: (c.netYield ?? -Infinity) >= p.minNetYield, hard: false });
  if (p.minFlipMargin != null)
    crits.push({ label: "Margen flip mín.", applies: true, ok: (c.flipMargin ?? -Infinity) >= p.minFlipMargin, hard: false });
  if (p.minDiscountToMarket != null)
    crits.push({
      label: "Descuento mín.",
      applies: true,
      ok: (c.discountToMarket ?? -Infinity) >= p.minDiscountToMarket,
      hard: false,
    });

  // --- Palabras clave ---
  const kws = (p.keywords ?? "")
    .split(",")
    .map((k) => norm(k.trim()))
    .filter(Boolean);
  if (kws.length > 0) {
    const t = norm(c.text);
    crits.push({ label: "Palabras clave", applies: true, ok: kws.some((k) => t.includes(k)), hard: false });
  }

  const applicable = crits.filter((x) => x.applies);
  const passed = applicable.filter((x) => x.ok);
  const failed = applicable.filter((x) => !x.ok);
  const hardFail = failed.some((x) => x.hard);

  const matchScore = applicable.length === 0 ? 100 : Math.round((passed.length / applicable.length) * 100);
  const matched = !hardFail && failed.filter((x) => !x.hard).length === 0;

  return {
    matched,
    matchScore,
    passed: passed.map((x) => x.label),
    failed: failed.map((x) => x.label),
  };
}

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}
