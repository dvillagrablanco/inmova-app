import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { createOpportunity, listOpportunities } from "@/lib/opportunity";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const opportunities = await listOpportunities({
    status: sp.get("status") ?? undefined,
    ccaa: sp.get("ccaa") ?? undefined,
    strategy: sp.get("strategy") ?? undefined,
    verdict: sp.get("verdict") ?? undefined,
    profileId: sp.get("profileId") ?? undefined,
    matchedOnly: sp.get("matched") === "1",
    minScore: sp.get("minScore") ? Number(sp.get("minScore")) : undefined,
  });
  return NextResponse.json({ opportunities });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const useVision = Boolean(body?.useVision);
    const dto = await createOpportunity(body, { useVision });
    return NextResponse.json({ opportunity: dto }, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "Datos inválidos", issues: err.issues }, { status: 400 });
    }
    console.error("[POST /api/opportunities]", err);
    return NextResponse.json({ error: "Error al crear la oportunidad" }, { status: 500 });
  }
}
