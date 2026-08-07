// INMOSEARCH — Estimación de CapEx a partir de imágenes con Claude Vision
//
// Analiza las fotos del inmueble para evaluar el estado de cocina, baños,
// suelos, carpintería e instalaciones, y estima el coste de reforma (€/m²).
// Requiere ANTHROPIC_API_KEY. Si no está configurada, devuelve null y el
// llamador recurre al estimador determinista basado en reglas.
import Anthropic from "@anthropic-ai/sdk";
import { CAPEX_BANDS } from "@/lib/data/regions";
import type { CapexEstimate } from "./estimator";

export interface VisionCapexInput {
  images: string[]; // URLs de imágenes
  area?: number | null; // m² de referencia
  propertyType?: string | null;
  description?: string | null;
}

interface VisionModelOutput {
  level: "LAVADO_CARA" | "REFORMA_MEDIA" | "REFORMA_INTEGRAL";
  perSqm: number;
  confidence: number; // 0-1
  rooms: { area: string; condition: string; note: string }[];
  breakdown: { label: string; amount: number }[];
  summary: string;
}

const MAX_IMAGES = 8;

export async function estimateCapexFromImages(input: VisionCapexInput): Promise<CapexEstimate | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || input.images.length === 0) return null;

  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";
  const area = input.area && input.area > 0 ? input.area : 80;

  const imageBlocks = (
    await Promise.all(input.images.slice(0, MAX_IMAGES).map(fetchImageBlock))
  ).filter((b): b is Anthropic.ImageBlockParam => b !== null);

  if (imageBlocks.length === 0) return null;

  const bands = Object.entries(CAPEX_BANDS)
    .map(([k, v]) => `- ${k} (${v.label}, ~${v.perSqm} €/m²): ${v.description}`)
    .join("\n");

  const prompt = `Eres un aparejador experto en reformas de vivienda en España. Analiza las fotos de este inmueble y estima el coste de reforma (CapEx).

Contexto:
- Tipo: ${input.propertyType ?? "vivienda"}
- Superficie de referencia: ${area} m²
- Descripción del anuncio: ${input.description ?? "(sin descripción)"}

Niveles de reforma de referencia en España (2024/2025):
${bands}

Evalúa el estado visible de: cocina, baños, suelos, carpintería/puertas, paredes/pintura e instalaciones (si son deducibles). Determina el nivel de reforma más adecuado y un coste por m² realista para ${area} m². Ten en cuenta el mercado español.

Responde ÚNICAMENTE con un objeto JSON válido (sin texto adicional, sin markdown) con esta forma exacta:
{
  "level": "LAVADO_CARA" | "REFORMA_MEDIA" | "REFORMA_INTEGRAL",
  "perSqm": number,
  "confidence": number,
  "rooms": [{ "area": string, "condition": string, "note": string }],
  "breakdown": [{ "label": string, "amount": number }],
  "summary": string
}`;

  try {
    const resp = await client.messages.create({
      model,
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: [...imageBlocks, { type: "text", text: prompt }],
        },
      ],
    });

    const text = resp.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    const parsed = parseJson(text);
    if (!parsed) return null;

    const perSqm = Math.round(parsed.perSqm);
    const total = Math.round(perSqm * area);
    const breakdown =
      parsed.breakdown && parsed.breakdown.length > 0
        ? parsed.breakdown.map((b) => ({ label: b.label, amount: Math.round(b.amount) }))
        : [{ label: "Reforma estimada por análisis de imágenes", amount: total }];

    const roomsNote = parsed.rooms?.map((r) => `${r.area}: ${r.condition}`).join("; ");

    return {
      level: parsed.level,
      total,
      perSqm,
      area,
      breakdown,
      source: "AI_VISION",
      notes: `IA (Claude Vision, confianza ${(parsed.confidence * 100).toFixed(0)}%): ${parsed.summary}${roomsNote ? ` · Estancias: ${roomsNote}` : ""}`,
    };
  } catch (err) {
    console.error("[capex/vision] error llamando a la IA:", err);
    return null;
  }
}

const ALLOWED_MEDIA = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
type AllowedMedia = (typeof ALLOWED_MEDIA)[number];

/** Descarga una imagen y la codifica en base64 como bloque de imagen para la API. */
async function fetchImageBlock(url: string): Promise<Anthropic.ImageBlockParam | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const ct = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    const media_type: AllowedMedia = (ALLOWED_MEDIA as readonly string[]).includes(ct)
      ? (ct as AllowedMedia)
      : "image/jpeg";
    const data = Buffer.from(await res.arrayBuffer()).toString("base64");
    return { type: "image", source: { type: "base64", media_type, data } };
  } catch {
    return null;
  }
}

function parseJson(text: string): VisionModelOutput | null {
  try {
    // Extrae el primer bloque {...} por si el modelo añade texto alrededor.
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    const json = JSON.parse(text.slice(start, end + 1));
    if (!json.level || typeof json.perSqm !== "number") return null;
    return json as VisionModelOutput;
  } catch {
    return null;
  }
}
