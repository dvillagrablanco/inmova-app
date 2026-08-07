import { NextRequest, NextResponse } from "next/server";
import { parseEmailListings } from "@/lib/intake/email";
import { parsedToInput } from "@/lib/intake/parse";
import { ingestOpportunity } from "@/lib/opportunity";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Ingesta de una alerta por email (Idealista/Fotocasa/Habitaclia...).
 * Acepta:
 *  - JSON: { html?: string, text?: string, preview?: boolean }
 *  - form-urlencoded (webhooks tipo SendGrid Inbound Parse): campos html/text.
 * Deduplica por URL del anuncio. */
export async function POST(req: NextRequest) {
  try {
    const { html, text, preview } = await readBody(req);
    const content = html || text || "";
    if (content.trim().length < 20) {
      return NextResponse.json({ error: "Contenido de email vacío o insuficiente." }, { status: 400 });
    }

    const listings = parseEmailListings(content);
    if (preview) {
      return NextResponse.json({ found: listings.length, listings });
    }

    let imported = 0;
    let duplicates = 0;
    const errors: string[] = [];
    for (const p of listings) {
      const input = parsedToInput(p);
      if (!input) continue;
      try {
        const res = await ingestOpportunity(input, {
          dedupKey: p.sourceUrl ? `email:${p.sourceUrl}` : undefined,
        });
        if (res.status === "duplicate") duplicates++;
        else imported++;
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e));
      }
    }

    return NextResponse.json({ found: listings.length, imported, duplicates, errors });
  } catch (err) {
    console.error("[POST /api/ingest/email]", err);
    return NextResponse.json({ error: "Error al procesar el email" }, { status: 500 });
  }
}

async function readBody(req: NextRequest): Promise<{ html?: string; text?: string; preview?: boolean }> {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const b = await req.json();
    return { html: b.html, text: b.text, preview: Boolean(b.preview) };
  }
  // form-urlencoded / multipart (webhooks de email)
  const form = await req.formData();
  return {
    html: (form.get("html") as string) || undefined,
    text: (form.get("text") as string) || (form.get("body-plain") as string) || undefined,
    preview: false,
  };
}
