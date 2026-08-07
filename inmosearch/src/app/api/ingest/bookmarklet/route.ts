import { NextRequest, NextResponse } from "next/server";
import { parseEmailListings } from "@/lib/intake/email";
import { parseListing, parsedToInput } from "@/lib/intake/parse";
import { createOpportunity, ingestOpportunity } from "@/lib/opportunity";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Recibe el contenido de una página de Idealista/Fotocasa desde el bookmarklet
 * (form POST desde el navegador del usuario) y crea la(s) oportunidad(es).
 * Es la navegación del propio usuario, no un scraper del servidor. */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const text = ((form.get("text") as string) || "").toString();
    const url = ((form.get("url") as string) || "").toString();
    const origin = req.nextUrl.origin;

    if (text.trim().length < 20) {
      return redirectMsg(origin, "No se pudo leer la página. Abre una ficha o listado y vuelve a pulsar.");
    }

    // Página de resultados: varios anuncios. Ficha: uno.
    const multi = parseEmailListings(text);
    if (multi.length > 1) {
      let imported = 0;
      for (const p of multi) {
        const input = parsedToInput(p);
        if (!input) continue;
        try {
          const r = await ingestOpportunity(input, { dedupKey: p.sourceUrl ? `bm:${p.sourceUrl}` : undefined });
          if (r.status !== "duplicate") imported++;
        } catch {
          /* ignora fallos individuales */
        }
      }
      return NextResponse.redirect(`${origin}/?imported=${imported}`, 303);
    }

    // Ficha individual: usa la URL real de la página como origen.
    const parsed = parseListing(text);
    if (!parsed.askingPrice) {
      return redirectMsg(origin, "No detecté el precio en la página. Prueba en la ficha del inmueble (no en el listado).");
    }
    const input = parsedToInput(parsed);
    if (!input) return redirectMsg(origin, "No se pudo procesar el anuncio.");
    if (url && /^https?:\/\//i.test(url)) {
      input.sourceUrl = url;
      input.source = /idealista\./i.test(url) ? "IDEALISTA" : /fotocasa\./i.test(url) ? "MANUAL" : input.source;
    }
    const dto = await createOpportunity(input);
    return NextResponse.redirect(`${origin}/opportunities/${dto.id}`, 303);
  } catch (err) {
    console.error("[POST /api/ingest/bookmarklet]", err);
    return redirectMsg(req.nextUrl.origin, "Error al procesar el anuncio.");
  }
}

function redirectMsg(origin: string, msg: string) {
  return new NextResponse(
    `<!doctype html><meta charset="utf-8"><title>INMOSEARCH</title>` +
      `<body style="font-family:system-ui;padding:40px;max-width:520px;margin:auto">` +
      `<h2>INMOSEARCH</h2><p>${msg}</p><p><a href="${origin}">Ir a INMOSEARCH</a></p></body>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

// El navegador puede lanzar una preflight OPTIONS en algunos casos.
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
