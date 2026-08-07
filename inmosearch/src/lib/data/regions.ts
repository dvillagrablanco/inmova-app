// INMOSEARCH — Datos de referencia del mercado español
// -----------------------------------------------------------------------------
// AVISO: Estos valores son ORIENTATIVOS (a fecha 2024/2025) y sirven como punto
// de partida del análisis. Los tipos de ITP tienen tramos, reducciones y
// condiciones específicas por Comunidad Autónoma que cambian con frecuencia.
// Verifica siempre el tipo aplicable a tu operación concreta antes de decidir.
// -----------------------------------------------------------------------------

/** Tipo general orientativo de ITP (Impuesto de Transmisiones Patrimoniales)
 * para vivienda de segunda mano, por Comunidad Autónoma. Valor decimal (0.07 = 7%). */
export const ITP_BY_CCAA: Record<string, number> = {
  ANDALUCIA: 0.07,
  ARAGON: 0.08,
  ASTURIAS: 0.08,
  BALEARES: 0.08,
  CANARIAS: 0.065,
  CANTABRIA: 0.09,
  CASTILLA_LA_MANCHA: 0.09,
  CASTILLA_Y_LEON: 0.08,
  CATALUNA: 0.1,
  COMUNIDAD_VALENCIANA: 0.1,
  EXTREMADURA: 0.08,
  GALICIA: 0.08,
  MADRID: 0.06,
  MURCIA: 0.08,
  NAVARRA: 0.06,
  PAIS_VASCO: 0.07,
  LA_RIOJA: 0.07,
  CEUTA: 0.06,
  MELILLA: 0.06,
};

/** Tipo de ITP por defecto si no se conoce la CCAA (media prudente). */
export const DEFAULT_ITP = 0.08;

export function itpForCcaa(ccaa?: string | null): number {
  if (!ccaa) return DEFAULT_ITP;
  const key = normalizeCcaa(ccaa);
  return ITP_BY_CCAA[key] ?? DEFAULT_ITP;
}

/** Normaliza el nombre de la CCAA a la clave usada en ITP_BY_CCAA. */
export function normalizeCcaa(input: string): string {
  const s = input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita acentos/diacríticos
    .toUpperCase()
    .replace(/[^A-Z]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const aliases: Record<string, string> = {
    C_VALENCIANA: "COMUNIDAD_VALENCIANA",
    VALENCIA: "COMUNIDAD_VALENCIANA",
    COMUNITAT_VALENCIANA: "COMUNIDAD_VALENCIANA",
    CATALUNYA: "CATALUNA",
    CASTILLA_LEON: "CASTILLA_Y_LEON",
    EUSKADI: "PAIS_VASCO",
    RIOJA: "LA_RIOJA",
  };
  return aliases[s] ?? s;
}

/** Bandas orientativas de coste de reforma en España (€/m² sobre superficie
 * construida), 2024/2025. */
export const CAPEX_BANDS: Record<string, { perSqm: number; label: string; description: string }> = {
  LAVADO_CARA: {
    perSqm: 250,
    label: "Lavado de cara",
    description: "Pintura, pequeños arreglos, limpieza, actualización cosmética. Sin tocar instalaciones.",
  },
  REFORMA_MEDIA: {
    perSqm: 550,
    label: "Reforma media",
    description: "Cocina y baños nuevos, suelos, carpintería, actualización parcial de instalaciones.",
  },
  REFORMA_INTEGRAL: {
    perSqm: 1000,
    label: "Reforma integral",
    description: "Todo a nuevo: fontanería, electricidad, distribución, cocina, baños, suelos y acabados.",
  },
};

/** Mapea el estado declarado del inmueble a un nivel de reforma sugerido. */
// "A reformar" en los anuncios españoles suele significar reforma MEDIA (cocina,
// baños, suelos, algo de instalaciones), no una integral. Los inmuebles que
// requieren reforma integral se anuncian como "para rehabilitar/integral/ruina".
// Por eso A_REFORMAR mapea a REFORMA_MEDIA por defecto (ajustable con el nivel
// manual, el CapEx aportado o el análisis de imágenes con IA).
export const CONDITION_TO_CAPEX_LEVEL: Record<string, keyof typeof CAPEX_BANDS | null> = {
  A_REFORMAR: "REFORMA_MEDIA",
  REFORMA_PARCIAL: "REFORMA_MEDIA",
  BUEN_ESTADO: "LAVADO_CARA",
  REFORMADO: null,
  OBRA_NUEVA: null,
};

export const CCAA_LIST = Object.keys(ITP_BY_CCAA);
