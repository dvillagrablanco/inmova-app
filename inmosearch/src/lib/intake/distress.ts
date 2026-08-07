// INMOSEARCH — Detección de motivación del vendedor / urgencia
// Inspirado en los "distress signals" de PropStream, adaptado al mercado
// español: analiza el texto del anuncio en busca de pistas de venta motivada,
// urgencia o margen de negociación. Alimenta el scoring y las señales.

interface Cue {
  re: RegExp;
  label: string;
  weight: number;
}

const CUES: Cue[] = [
  { re: /\burge\b|urgent|se vende ya|venta urgente|hay que vender/i, label: "Urge vender", weight: 30 },
  { re: /por (traslado|mudanza|jubilaci[oó]n|emigraci[oó]n)/i, label: "Venta por traslado", weight: 22 },
  { re: /herencia|herederos|testamentar/i, label: "Herencia", weight: 22 },
  { re: /divorcio|separaci[oó]n|reparto/i, label: "Divorcio/reparto", weight: 22 },
  { re: /embargo|deuda|liquidaci[oó]n|concurso/i, label: "Embargo/deuda", weight: 28 },
  { re: /adjudicad|banco|entidad bancaria|reo\b|repose[ií]d/i, label: "Activo bancario/REO", weight: 20 },
  { re: /rebajad|rebaja|bajada de precio|nuevo precio|antes \d|precio reducido/i, label: "Precio rebajado", weight: 26 },
  { re: /negociable|admite oferta|escucho ofertas|abierto a ofertas/i, label: "Precio negociable", weight: 24 },
  { re: /oportunidad|ocasi[oó]n|chollo|ganga|inversor/i, label: "Oportunidad/inversor", weight: 12 },
  { re: /ocupad|no visitable|con inquilino|okupa/i, label: "Ocupado / no visitable", weight: 14 },
  { re: /mejor precio|precio m[ií]nimo|no negociable el precio/i, label: "Precio ajustado", weight: 8 },
  { re: /liquidamos|vendo por debajo|por debajo de mercado|below market/i, label: "Por debajo de mercado", weight: 26 },
];

export interface MotivationResult {
  score: number; // 0-100
  cues: string[];
}

/** Analiza el texto del anuncio y devuelve una puntuación de motivación (0-100)
 * y las pistas detectadas. */
export function detectMotivation(text?: string | null): MotivationResult {
  if (!text) return { score: 0, cues: [] };
  const found = new Map<string, number>();
  for (const c of CUES) {
    if (c.re.test(text)) found.set(c.label, c.weight);
  }
  const raw = [...found.values()].reduce((s, w) => s + w, 0);
  // Saturación suave: 2+ señales fuertes ya dan una puntuación alta.
  const score = Math.min(100, Math.round(raw));
  return { score, cues: [...found.keys()] };
}
