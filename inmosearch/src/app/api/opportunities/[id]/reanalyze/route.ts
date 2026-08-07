import { NextRequest, NextResponse } from "next/server";
import { reanalyzeOpportunity } from "@/lib/opportunity";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const useVision = Boolean(body?.useVision);
    const dto = await reanalyzeOpportunity(params.id, { useVision });
    return NextResponse.json({ opportunity: dto });
  } catch (err) {
    console.error("[POST /api/opportunities/:id/reanalyze]", err);
    const msg = err instanceof Error ? err.message : "Error al reanalizar";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
