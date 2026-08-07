// INMOSEARCH — Comparables de mercado a nivel fino (barrio/distrito/municipio)
// -----------------------------------------------------------------------------
// La media provincial (data/market.ts) se queda corta en ciudades grandes: en
// Madrid el €/m² de Salamanca dobla al de Villaverde. Esta capa aporta €/m² de
// venta y renta a nivel de DISTRITO (Madrid/Barcelona) y MUNICIPIO (los que se
// desvían mucho de su provincia), con resolución por CÓDIGO POSTAL o por nombre.
//
// AVISO: valores ORIENTATIVOS (2024/2025), pensados como semilla ampliable. La
// vía de producción es enchufar un índice por zona (informes idealista/uDA) en
// `finerMarket`. Los comparables propios del usuario siempre prevalecen.
// -----------------------------------------------------------------------------
import { normalizeKey } from "./market";

export type Granularity = "codigo_postal" | "distrito" | "municipio" | "provincia" | "nacional";

export interface ZoneMarket {
  saleEurSqm: number;
  rentEurSqmMonth: number;
  name: string; // nombre legible
  level: "distrito" | "municipio";
  province: string; // provincia a la que pertenece (clave normalizada)
}

// --- Distritos y municipios con mercado propio -------------------------------
export const ZONE_MARKET: Record<string, ZoneMarket> = {
  // Madrid capital (distritos)
  MADRID_CENTRO: { saleEurSqm: 5200, rentEurSqmMonth: 21, name: "Madrid · Centro", level: "distrito", province: "MADRID" },
  MADRID_SALAMANCA: { saleEurSqm: 6800, rentEurSqmMonth: 23, name: "Madrid · Salamanca", level: "distrito", province: "MADRID" },
  MADRID_CHAMBERI: { saleEurSqm: 6000, rentEurSqmMonth: 22, name: "Madrid · Chamberí", level: "distrito", province: "MADRID" },
  MADRID_CHAMARTIN: { saleEurSqm: 5900, rentEurSqmMonth: 20, name: "Madrid · Chamartín", level: "distrito", province: "MADRID" },
  MADRID_RETIRO: { saleEurSqm: 5600, rentEurSqmMonth: 20, name: "Madrid · Retiro", level: "distrito", province: "MADRID" },
  MADRID_ARGANZUELA: { saleEurSqm: 4700, rentEurSqmMonth: 19, name: "Madrid · Arganzuela", level: "distrito", province: "MADRID" },
  MADRID_MONCLOA: { saleEurSqm: 5200, rentEurSqmMonth: 19, name: "Madrid · Moncloa-Aravaca", level: "distrito", province: "MADRID" },
  MADRID_TETUAN: { saleEurSqm: 4300, rentEurSqmMonth: 18, name: "Madrid · Tetuán", level: "distrito", province: "MADRID" },
  MADRID_CIUDAD_LINEAL: { saleEurSqm: 3400, rentEurSqmMonth: 16, name: "Madrid · Ciudad Lineal", level: "distrito", province: "MADRID" },
  MADRID_HORTALEZA: { saleEurSqm: 4100, rentEurSqmMonth: 16, name: "Madrid · Hortaleza", level: "distrito", province: "MADRID" },
  MADRID_LATINA: { saleEurSqm: 2900, rentEurSqmMonth: 15, name: "Madrid · Latina", level: "distrito", province: "MADRID" },
  MADRID_CARABANCHEL: { saleEurSqm: 2600, rentEurSqmMonth: 15, name: "Madrid · Carabanchel", level: "distrito", province: "MADRID" },
  MADRID_USERA: { saleEurSqm: 2600, rentEurSqmMonth: 15, name: "Madrid · Usera", level: "distrito", province: "MADRID" },
  MADRID_PUENTE_VALLECAS: { saleEurSqm: 2500, rentEurSqmMonth: 15, name: "Madrid · Puente de Vallecas", level: "distrito", province: "MADRID" },
  MADRID_VILLAVERDE: { saleEurSqm: 2100, rentEurSqmMonth: 13, name: "Madrid · Villaverde", level: "distrito", province: "MADRID" },
  MADRID_SAN_BLAS: { saleEurSqm: 3100, rentEurSqmMonth: 15, name: "Madrid · San Blas", level: "distrito", province: "MADRID" },
  // Barcelona capital (distritos)
  BARCELONA_CIUTAT_VELLA: { saleEurSqm: 4300, rentEurSqmMonth: 21, name: "Barcelona · Ciutat Vella", level: "distrito", province: "BARCELONA" },
  BARCELONA_EIXAMPLE: { saleEurSqm: 5000, rentEurSqmMonth: 20, name: "Barcelona · Eixample", level: "distrito", province: "BARCELONA" },
  BARCELONA_SARRIA: { saleEurSqm: 6000, rentEurSqmMonth: 20, name: "Barcelona · Sarrià-Sant Gervasi", level: "distrito", province: "BARCELONA" },
  BARCELONA_GRACIA: { saleEurSqm: 4600, rentEurSqmMonth: 19, name: "Barcelona · Gràcia", level: "distrito", province: "BARCELONA" },
  BARCELONA_LES_CORTS: { saleEurSqm: 5200, rentEurSqmMonth: 19, name: "Barcelona · Les Corts", level: "distrito", province: "BARCELONA" },
  BARCELONA_SANTS: { saleEurSqm: 3800, rentEurSqmMonth: 18, name: "Barcelona · Sants-Montjuïc", level: "distrito", province: "BARCELONA" },
  BARCELONA_SANT_MARTI: { saleEurSqm: 4300, rentEurSqmMonth: 19, name: "Barcelona · Sant Martí", level: "distrito", province: "BARCELONA" },
  BARCELONA_NOU_BARRIS: { saleEurSqm: 2600, rentEurSqmMonth: 15, name: "Barcelona · Nou Barris", level: "distrito", province: "BARCELONA" },
  // Municipios que se desvían mucho de su provincia
  MARBELLA: { saleEurSqm: 3500, rentEurSqmMonth: 14, name: "Marbella", level: "municipio", province: "MALAGA" },
  ESTEPONA: { saleEurSqm: 2800, rentEurSqmMonth: 12, name: "Estepona", level: "municipio", province: "MALAGA" },
  POZUELO_DE_ALARCON: { saleEurSqm: 4600, rentEurSqmMonth: 16, name: "Pozuelo de Alarcón", level: "municipio", province: "MADRID" },
  LAS_ROZAS: { saleEurSqm: 3500, rentEurSqmMonth: 14, name: "Las Rozas", level: "municipio", province: "MADRID" },
  GETAFE: { saleEurSqm: 2600, rentEurSqmMonth: 13, name: "Getafe", level: "municipio", province: "MADRID" },
  ALCORCON: { saleEurSqm: 2500, rentEurSqmMonth: 13, name: "Alcorcón", level: "municipio", province: "MADRID" },
  MOSTOLES: { saleEurSqm: 2100, rentEurSqmMonth: 12, name: "Móstoles", level: "municipio", province: "MADRID" },
  SANT_CUGAT_DEL_VALLES: { saleEurSqm: 4300, rentEurSqmMonth: 16, name: "Sant Cugat del Vallès", level: "municipio", province: "BARCELONA" },
  SITGES: { saleEurSqm: 4200, rentEurSqmMonth: 15, name: "Sitges", level: "municipio", province: "BARCELONA" },
  LHOSPITALET_DE_LLOBREGAT: { saleEurSqm: 3200, rentEurSqmMonth: 16, name: "L'Hospitalet de Llobregat", level: "municipio", province: "BARCELONA" },
  BADALONA: { saleEurSqm: 2700, rentEurSqmMonth: 14, name: "Badalona", level: "municipio", province: "BARCELONA" },
  GETXO: { saleEurSqm: 3500, rentEurSqmMonth: 13, name: "Getxo", level: "municipio", province: "BIZKAIA" },
  // Rías Baixas (Pontevedra) — municipios costeros que se desvían de la media provincial
  VIGO: { saleEurSqm: 2000, rentEurSqmMonth: 9, name: "Vigo", level: "municipio", province: "PONTEVEDRA" },
  PONTEVEDRA_CIUDAD: { saleEurSqm: 2000, rentEurSqmMonth: 9, name: "Pontevedra", level: "municipio", province: "PONTEVEDRA" },
  SANXENXO: { saleEurSqm: 2900, rentEurSqmMonth: 10, name: "Sanxenxo", level: "municipio", province: "PONTEVEDRA" },
  PORTONOVO: { saleEurSqm: 2600, rentEurSqmMonth: 10, name: "Portonovo", level: "municipio", province: "PONTEVEDRA" },
  O_GROVE: { saleEurSqm: 2100, rentEurSqmMonth: 9, name: "O Grove", level: "municipio", province: "PONTEVEDRA" },
  POIO: { saleEurSqm: 1900, rentEurSqmMonth: 8, name: "Poio", level: "municipio", province: "PONTEVEDRA" },
  MARIN: { saleEurSqm: 1500, rentEurSqmMonth: 8, name: "Marín", level: "municipio", province: "PONTEVEDRA" },
  CANGAS: { saleEurSqm: 1800, rentEurSqmMonth: 8, name: "Cangas", level: "municipio", province: "PONTEVEDRA" },
  BAIONA: { saleEurSqm: 2700, rentEurSqmMonth: 9, name: "Baiona", level: "municipio", province: "PONTEVEDRA" },
  NIGRAN: { saleEurSqm: 2300, rentEurSqmMonth: 9, name: "Nigrán", level: "municipio", province: "PONTEVEDRA" },
};

// --- Resolución por código postal → clave de zona ----------------------------
// Curado para los CP donde la media provincial más engaña (Madrid/Barcelona) y
// algunos municipios. Ampliable.
export const POSTAL_TO_ZONE: Record<string, string> = {
  // Madrid capital
  "28001": "MADRID_SALAMANCA", "28006": "MADRID_SALAMANCA", "28028": "MADRID_SALAMANCA",
  "28002": "MADRID_CHAMARTIN", "28016": "MADRID_CHAMARTIN", "28036": "MADRID_CHAMARTIN",
  "28003": "MADRID_CHAMBERI", "28010": "MADRID_CHAMBERI", "28015": "MADRID_CHAMBERI",
  "28004": "MADRID_CENTRO", "28005": "MADRID_CENTRO", "28012": "MADRID_CENTRO", "28013": "MADRID_CENTRO",
  "28009": "MADRID_RETIRO", "28007": "MADRID_RETIRO", "28014": "MADRID_RETIRO",
  "28045": "MADRID_ARGANZUELA",
  "28020": "MADRID_TETUAN", "28039": "MADRID_TETUAN",
  "28008": "MADRID_MONCLOA", "28023": "MADRID_MONCLOA",
  "28017": "MADRID_CIUDAD_LINEAL", "28027": "MADRID_CIUDAD_LINEAL",
  "28025": "MADRID_CARABANCHEL", "28019": "MADRID_CARABANCHEL", "28047": "MADRID_CARABANCHEL",
  "28026": "MADRID_USERA",
  "28018": "MADRID_PUENTE_VALLECAS", "28038": "MADRID_PUENTE_VALLECAS",
  "28021": "MADRID_VILLAVERDE", "28041": "MADRID_VILLAVERDE",
  // Municipios Madrid
  "28223": "POZUELO_DE_ALARCON", "28224": "POZUELO_DE_ALARCON",
  "28230": "LAS_ROZAS", "28231": "LAS_ROZAS", "28232": "LAS_ROZAS",
  "28901": "GETAFE", "28902": "GETAFE", "28903": "GETAFE",
  "28921": "ALCORCON", "28922": "ALCORCON",
  "28931": "MOSTOLES", "28932": "MOSTOLES", "28933": "MOSTOLES",
  // Barcelona capital
  "08001": "BARCELONA_CIUTAT_VELLA", "08002": "BARCELONA_CIUTAT_VELLA", "08003": "BARCELONA_CIUTAT_VELLA",
  "08007": "BARCELONA_EIXAMPLE", "08008": "BARCELONA_EIXAMPLE", "08009": "BARCELONA_EIXAMPLE", "08010": "BARCELONA_EIXAMPLE", "08011": "BARCELONA_EIXAMPLE",
  "08006": "BARCELONA_SARRIA", "08017": "BARCELONA_SARRIA", "08022": "BARCELONA_SARRIA",
  "08012": "BARCELONA_GRACIA", "08023": "BARCELONA_GRACIA", "08024": "BARCELONA_GRACIA",
  "08028": "BARCELONA_LES_CORTS", "08029": "BARCELONA_LES_CORTS",
  "08014": "BARCELONA_SANTS", "08004": "BARCELONA_SANTS",
  "08005": "BARCELONA_SANT_MARTI", "08018": "BARCELONA_SANT_MARTI", "08019": "BARCELONA_SANT_MARTI",
  "08016": "BARCELONA_NOU_BARRIS", "08042": "BARCELONA_NOU_BARRIS",
  // Municipios Barcelona
  "08172": "SANT_CUGAT_DEL_VALLES", "08173": "SANT_CUGAT_DEL_VALLES", "08174": "SANT_CUGAT_DEL_VALLES",
  "08870": "SITGES",
  "08901": "LHOSPITALET_DE_LLOBREGAT", "08902": "LHOSPITALET_DE_LLOBREGAT", "08903": "LHOSPITALET_DE_LLOBREGAT",
  "08911": "BADALONA", "08912": "BADALONA", "08913": "BADALONA",
  // Costa del Sol
  "29600": "MARBELLA", "29601": "MARBELLA", "29602": "MARBELLA", "29603": "MARBELLA", "29604": "MARBELLA",
  "29680": "ESTEPONA", "29688": "ESTEPONA",
  // País Vasco
  "48930": "GETXO", "48991": "GETXO", "48992": "GETXO",
  // Rías Baixas (Pontevedra)
  "36201": "VIGO", "36202": "VIGO", "36203": "VIGO", "36204": "VIGO", "36205": "VIGO", "36206": "VIGO",
  "36207": "VIGO", "36208": "VIGO", "36209": "VIGO", "36210": "VIGO", "36211": "VIGO", "36212": "VIGO",
  "36213": "VIGO", "36214": "VIGO", "36215": "VIGO", "36216": "VIGO",
  "36001": "PONTEVEDRA_CIUDAD", "36002": "PONTEVEDRA_CIUDAD", "36003": "PONTEVEDRA_CIUDAD", "36004": "PONTEVEDRA_CIUDAD",
  "36960": "SANXENXO", "36966": "SANXENXO", "36970": "PORTONOVO",
  "36980": "O_GROVE", "36988": "O_GROVE",
  "36005": "POIO", "36994": "POIO", "36995": "POIO",
  "36900": "MARIN", "36910": "MARIN",
  "36940": "CANGAS", "36948": "CANGAS",
  "36300": "BAIONA",
  "36350": "NIGRAN", "36340": "NIGRAN",
};

export interface FinerMarketHit {
  saleEurSqm: number;
  rentEurSqmMonth: number;
  zoneName: string;
  granularity: Granularity; // "codigo_postal" (vía CP) | "distrito" | "municipio"
}

/** Devuelve comparables finos por CP o por nombre de municipio/distrito.
 * Null si no hay una coincidencia fina (el llamador cae a provincia). */
export function finerMarket(
  postalCode?: string | null,
  city?: string | null,
  province?: string | null,
  extraText?: string | null
): FinerMarketHit | null {
  // 1) Por código postal (lo más preciso).
  if (postalCode) {
    const cp = postalCode.trim().slice(0, 5);
    const zoneKey = POSTAL_TO_ZONE[cp];
    if (zoneKey && ZONE_MARKET[zoneKey]) {
      const z = ZONE_MARKET[zoneKey];
      return { saleEurSqm: z.saleEurSqm, rentEurSqmMonth: z.rentEurSqmMonth, zoneName: z.name, granularity: "codigo_postal" };
    }
  }

  const text = normalizeKey([city, extraText].filter(Boolean).join(" "));
  const prov = province ? normalizeKey(province) : null;

  // 2) Por municipio (seguro por nombre).
  for (const [key, z] of Object.entries(ZONE_MARKET)) {
    if (z.level !== "municipio") continue;
    if (text.includes(key) || text.includes(normalizeKey(z.name))) {
      return { saleEurSqm: z.saleEurSqm, rentEurSqmMonth: z.rentEurSqmMonth, zoneName: z.name, granularity: "municipio" };
    }
  }

  // 3) Por distrito (solo si la provincia coincide, para evitar ambigüedades
  //    como "Salamanca" distrito de Madrid vs provincia de Salamanca).
  for (const [, z] of Object.entries(ZONE_MARKET)) {
    if (z.level !== "distrito") continue;
    if (prov && prov !== z.province) continue;
    const districtName = normalizeKey(z.name.split("·")[1] ?? z.name);
    if (districtName && text.includes(districtName)) {
      return { saleEurSqm: z.saleEurSqm, rentEurSqmMonth: z.rentEurSqmMonth, zoneName: z.name, granularity: "distrito" };
    }
  }

  return null;
}
