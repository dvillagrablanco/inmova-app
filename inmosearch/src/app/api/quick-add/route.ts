import { NextRequest, NextResponse } from "next/server";
import { parseListing, parsedToInput } from "@/lib/intake/parse";
import { createOpportunity } from "@/lib/opportunity";

export const dynamic = "force-dynamic";

/** Alta rápida: pega el texto (o URL + texto) de un anuncio y lo analiza.
 * Body: { text: string, preview?: boolean, useVision?: boolean } */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text: string = (body?.text ?? "").toString();
    if (text.trim().length < 10) {
      return NextResponse.json({ error: "Pega el texto del anuncio (precio, m², ubicación…)." }, { status: 400 });
    }

    const parsed = parseListing(text);

    if (body?.preview) {
      return NextResponse.json({ parsed });
    }

    const input = parsedToInput(parsed);
    if (!input) {
      return NextResponse.json(
        { error: "No he podido detectar el precio. Añádelo al texto o usa el alta manual.", parsed },
        { status: 422 }
      );
    }

    const opportunity = await createOpportunity(input, { useVision: Boolean(body?.useVision) });
    return NextResponse.json({ opportunity, parsed }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/quick-add]", err);
    return NextResponse.json({ error: "Error al procesar el anuncio" }, { status: 500 });
  }
}
