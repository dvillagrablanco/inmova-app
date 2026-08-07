import { NextRequest, NextResponse } from "next/server";
import { normalizeToInput, searchConnectors } from "@/lib/connectors";
import { createOpportunity } from "@/lib/opportunity";

export const dynamic = "force-dynamic";

/** Busca en uno o varios conectores e importa las oportunidades encontradas,
 * analizándolas al vuelo. Body: { connectorIds?, location?, minPrice?,
 * maxPrice?, propertyType?, maxResults?, useVision? } */
export async function POST(req: NextRequest) {
  try {
    const b = await req.json().catch(() => ({}));
    const results = await searchConnectors(
      {
        location: b.location,
        minPrice: b.minPrice ? Number(b.minPrice) : undefined,
        maxPrice: b.maxPrice ? Number(b.maxPrice) : undefined,
        propertyType: b.propertyType,
        maxResults: b.maxResults ? Number(b.maxResults) : 20,
      },
      b.connectorIds
    );

    let imported = 0;
    const errors: string[] = [];
    for (const r of results) {
      if (r.error) errors.push(`${r.connectorName}: ${r.error}`);
      for (const listing of r.listings) {
        try {
          await createOpportunity(normalizeToInput(listing, r.connectorId), {
            useVision: Boolean(b.useVision),
          });
          imported++;
        } catch (e) {
          errors.push(`${r.connectorName}/${listing.sourceRef}: ${e instanceof Error ? e.message : e}`);
        }
      }
    }

    return NextResponse.json({ imported, errors });
  } catch (err) {
    console.error("[POST /api/connectors/import]", err);
    return NextResponse.json({ error: "Error al importar" }, { status: 500 });
  }
}
