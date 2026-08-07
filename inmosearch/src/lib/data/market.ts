// INMOSEARCH — Datos de mercado por provincia (valoración automática)
// -----------------------------------------------------------------------------
// AVISO: valores ORIENTATIVOS (ballpark 2024/2025) de precio medio de venta
// (€/m²) y renta media (€/m²/mes) por provincia. Sirven para estimar el ARV y
// la renta de mercado cuando no los aportas, y para calcular el DESCUENTO frente
// a mercado (la señal clave de una oportunidad). Verifica siempre con
// comparables reales de la zona concreta antes de decidir. Son fácilmente
// editables y pensados para afinarse con datos propios.
// -----------------------------------------------------------------------------

export interface ProvinceMarket {
  /** Precio medio de venta de mercado (€/m²). */
  saleEurSqm: number;
  /** Renta media de mercado (€/m²/mes). */
  rentEurSqmMonth: number;
}

/** Datos por provincia (clave normalizada en MAYÚSCULAS_SIN_ACENTOS). */
export const PROVINCE_MARKET: Record<string, ProvinceMarket> = {
  MADRID: { saleEurSqm: 3900, rentEurSqmMonth: 17 },
  BARCELONA: { saleEurSqm: 4300, rentEurSqmMonth: 18 },
  GIPUZKOA: { saleEurSqm: 3300, rentEurSqmMonth: 14 },
  BIZKAIA: { saleEurSqm: 2900, rentEurSqmMonth: 13 },
  ARABA: { saleEurSqm: 2500, rentEurSqmMonth: 11 },
  BALEARS: { saleEurSqm: 3900, rentEurSqmMonth: 15 },
  MALAGA: { saleEurSqm: 3000, rentEurSqmMonth: 13 },
  CADIZ: { saleEurSqm: 2000, rentEurSqmMonth: 10 },
  SEVILLA: { saleEurSqm: 2000, rentEurSqmMonth: 10 },
  VALENCIA: { saleEurSqm: 2100, rentEurSqmMonth: 12 },
  ALICANTE: { saleEurSqm: 1900, rentEurSqmMonth: 10 },
  CASTELLON: { saleEurSqm: 1300, rentEurSqmMonth: 8 },
  LAS_PALMAS: { saleEurSqm: 2100, rentEurSqmMonth: 11 },
  SANTA_CRUZ_DE_TENERIFE: { saleEurSqm: 2100, rentEurSqmMonth: 11 },
  GIRONA: { saleEurSqm: 2500, rentEurSqmMonth: 12 },
  TARRAGONA: { saleEurSqm: 1600, rentEurSqmMonth: 9 },
  LLEIDA: { saleEurSqm: 1200, rentEurSqmMonth: 8 },
  ZARAGOZA: { saleEurSqm: 1800, rentEurSqmMonth: 9 },
  HUESCA: { saleEurSqm: 1400, rentEurSqmMonth: 8 },
  TERUEL: { saleEurSqm: 1000, rentEurSqmMonth: 6 },
  A_CORUNA: { saleEurSqm: 1700, rentEurSqmMonth: 8 },
  PONTEVEDRA: { saleEurSqm: 1700, rentEurSqmMonth: 8 },
  LUGO: { saleEurSqm: 1200, rentEurSqmMonth: 6 },
  OURENSE: { saleEurSqm: 1100, rentEurSqmMonth: 6 },
  ASTURIAS: { saleEurSqm: 1600, rentEurSqmMonth: 8 },
  CANTABRIA: { saleEurSqm: 1900, rentEurSqmMonth: 9 },
  NAVARRA: { saleEurSqm: 1700, rentEurSqmMonth: 9 },
  LA_RIOJA: { saleEurSqm: 1500, rentEurSqmMonth: 8 },
  MURCIA: { saleEurSqm: 1300, rentEurSqmMonth: 8 },
  ALMERIA: { saleEurSqm: 1500, rentEurSqmMonth: 8 },
  GRANADA: { saleEurSqm: 1700, rentEurSqmMonth: 8 },
  CORDOBA: { saleEurSqm: 1500, rentEurSqmMonth: 8 },
  JAEN: { saleEurSqm: 1000, rentEurSqmMonth: 6 },
  HUELVA: { saleEurSqm: 1300, rentEurSqmMonth: 7 },
  TOLEDO: { saleEurSqm: 1100, rentEurSqmMonth: 7 },
  CIUDAD_REAL: { saleEurSqm: 900, rentEurSqmMonth: 6 },
  CUENCA: { saleEurSqm: 900, rentEurSqmMonth: 6 },
  GUADALAJARA: { saleEurSqm: 1400, rentEurSqmMonth: 8 },
  ALBACETE: { saleEurSqm: 1100, rentEurSqmMonth: 7 },
  VALLADOLID: { saleEurSqm: 1600, rentEurSqmMonth: 8 },
  SALAMANCA: { saleEurSqm: 1600, rentEurSqmMonth: 8 },
  LEON: { saleEurSqm: 1200, rentEurSqmMonth: 7 },
  BURGOS: { saleEurSqm: 1500, rentEurSqmMonth: 8 },
  PALENCIA: { saleEurSqm: 1200, rentEurSqmMonth: 7 },
  ZAMORA: { saleEurSqm: 1100, rentEurSqmMonth: 6 },
  AVILA: { saleEurSqm: 1100, rentEurSqmMonth: 7 },
  SEGOVIA: { saleEurSqm: 1400, rentEurSqmMonth: 8 },
  SORIA: { saleEurSqm: 1200, rentEurSqmMonth: 7 },
  CACERES: { saleEurSqm: 1100, rentEurSqmMonth: 7 },
  BADAJOZ: { saleEurSqm: 1100, rentEurSqmMonth: 7 },
  CEUTA: { saleEurSqm: 2000, rentEurSqmMonth: 10 },
  MELILLA: { saleEurSqm: 1900, rentEurSqmMonth: 10 },
};

/** Media nacional de respaldo cuando no se identifica la provincia. */
export const NATIONAL_AVERAGE: ProvinceMarket = { saleEurSqm: 1900, rentEurSqmMonth: 11 };

/** Alias de nombres de provincia (bilingües / variantes) → clave canónica. */
const PROVINCE_ALIASES: Record<string, string> = {
  GUIPUZCOA: "GIPUZKOA",
  SAN_SEBASTIAN: "GIPUZKOA",
  DONOSTIA: "GIPUZKOA",
  VIZCAYA: "BIZKAIA",
  BILBAO: "BIZKAIA",
  ALAVA: "ARABA",
  VITORIA: "ARABA",
  ILLES_BALEARS: "BALEARS",
  BALEARES: "BALEARS",
  PALMA: "BALEARS",
  MALLORCA: "BALEARS",
  VALENCIA_VALENCIA: "VALENCIA",
  VALÈNCIA: "VALENCIA",
  ALACANT: "ALICANTE",
  CASTELLO: "CASTELLON",
  A_CORUÑA: "A_CORUNA",
  CORUNA: "A_CORUNA",
  LA_CORUNA: "A_CORUNA",
  TENERIFE: "SANTA_CRUZ_DE_TENERIFE",
  GRAN_CANARIA: "LAS_PALMAS",
};

/** Ciudades importantes → provincia, para identificar la zona en texto libre. */
const CITY_TO_PROVINCE: Record<string, string> = {
  MADRID: "MADRID",
  BARCELONA: "BARCELONA",
  VALENCIA: "VALENCIA",
  SEVILLA: "SEVILLA",
  ZARAGOZA: "ZARAGOZA",
  MALAGA: "MALAGA",
  MURCIA: "MURCIA",
  PALMA: "BALEARS",
  BILBAO: "BIZKAIA",
  ALICANTE: "ALICANTE",
  CORDOBA: "CORDOBA",
  VALLADOLID: "VALLADOLID",
  VIGO: "PONTEVEDRA",
  GIJON: "ASTURIAS",
  OVIEDO: "ASTURIAS",
  GRANADA: "GRANADA",
  CORUNA: "A_CORUNA",
  VITORIA: "ARABA",
  SANTANDER: "CANTABRIA",
  PAMPLONA: "NAVARRA",
  DONOSTIA: "GIPUZKOA",
  SAN_SEBASTIAN: "GIPUZKOA",
  ALMERIA: "ALMERIA",
  CASTELLON: "CASTELLON",
  LOGRONO: "LA_RIOJA",
  BADAJOZ: "BADAJOZ",
  SALAMANCA: "SALAMANCA",
  HUELVA: "HUELVA",
  TARRAGONA: "TARRAGONA",
  LEON: "LEON",
  CADIZ: "CADIZ",
  JEREZ: "CADIZ",
  GIRONA: "GIRONA",
  TOLEDO: "TOLEDO",
  ALBACETE: "ALBACETE",
  MARBELLA: "MALAGA",
  CUENCA: "CUENCA",
};

/** Normaliza texto a la forma MAYÚSCULAS_SIN_ACENTOS_CON_GUIONES_BAJOS. */
export function normalizeKey(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/** Devuelve los datos de mercado para una provincia (con alias y respaldo). */
export function marketForProvince(province?: string | null): ProvinceMarket | null {
  if (!province) return null;
  const key = normalizeKey(province);
  const canonical = PROVINCE_ALIASES[key] ?? key;
  return PROVINCE_MARKET[canonical] ?? null;
}

/** Intenta identificar la provincia a partir de texto libre (provincia o
 * ciudad conocida). Devuelve la clave canónica o null. */
export function detectProvince(text?: string | null): string | null {
  if (!text) return null;
  const norm = normalizeKey(text);
  const tokens = new Set(norm.split("_"));
  // 1) coincidencia directa con provincia o alias
  for (const key of Object.keys(PROVINCE_MARKET)) {
    if (norm.includes(key)) return key;
  }
  for (const [alias, canon] of Object.entries(PROVINCE_ALIASES)) {
    if (norm.includes(alias)) return canon;
  }
  // 2) por ciudad conocida
  for (const [city, prov] of Object.entries(CITY_TO_PROVINCE)) {
    if (tokens.has(city) || norm.includes(city)) return prov;
  }
  return null;
}

export const PROVINCE_LIST = Object.keys(PROVINCE_MARKET);
