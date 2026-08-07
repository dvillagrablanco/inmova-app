// INMOSEARCH — Utilidades de formato (locale es-ES)
const eur = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const eur2 = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

const num = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });

export function formatEur(n: number | null | undefined, decimals = false): string {
  if (n == null || Number.isNaN(n)) return "—";
  return (decimals ? eur2 : eur).format(n);
}

export function formatPct(n: number | null | undefined, digits = 1): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${n.toFixed(digits)}%`;
}

export function formatNum(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return num.format(n);
}

const LABELS: Record<string, string> = {
  A_REFORMAR: "A reformar",
  REFORMA_PARCIAL: "Reforma parcial",
  BUEN_ESTADO: "Buen estado",
  REFORMADO: "Reformado",
  OBRA_NUEVA: "Obra nueva",
  LAVADO_CARA: "Lavado de cara",
  REFORMA_MEDIA: "Reforma media",
  REFORMA_INTEGRAL: "Reforma integral",
  FLIP: "Flip",
  RENT: "Alquiler",
  BOTH: "Flip + Alquiler",
  NONE: "Sin encaje",
  NEW: "Nueva",
  SHORTLISTED: "Preseleccionada",
  PURSUING: "En curso",
  DISCARDED: "Descartada",
  CLOSED: "Cerrada",
  PISO: "Piso",
  CASA: "Casa",
  ATICO: "Ático",
  DUPLEX: "Dúplex",
  ESTUDIO: "Estudio",
  LOCAL: "Local",
  OTRO: "Otro",
  MANUAL: "Manual",
  IDEALISTA: "Idealista",
  REO_BANK: "Banca/REO",
  AUCTION: "Subasta",
  CSV: "CSV",
  MOCK: "Demo",
  RULE_BASED: "Reglas",
  AI_VISION: "IA (imágenes)",
  NONE_SRC: "—",
};

export function label(key: string | null | undefined): string {
  if (!key) return "—";
  return LABELS[key] ?? key;
}
