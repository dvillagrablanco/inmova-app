import { NextRequest, NextResponse } from "next/server";
import { analyzeOpportunity } from "@/lib/underwriting";
import type { Condition } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Análisis rápido sin persistir — para previsualizar en el formulario. */
export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    if (!b?.askingPrice || Number(b.askingPrice) <= 0) {
      return NextResponse.json({ error: "Falta el precio (askingPrice)" }, { status: 400 });
    }
    const analysis = analyzeOpportunity(
      {
        askingPrice: Number(b.askingPrice),
        ccaa: b.ccaa ?? null,
        province: b.province ?? null,
        city: b.city ?? null,
        propertyType: b.propertyType ?? null,
        builtArea: b.builtArea ? Number(b.builtArea) : null,
        usableArea: b.usableArea ? Number(b.usableArea) : null,
        baths: b.baths ? Number(b.baths) : null,
        condition: (b.condition as Condition) ?? null,
        arvPricePerSqm: b.arvPricePerSqm ? Number(b.arvPricePerSqm) : null,
        marketRentMonthly: b.marketRentMonthly ? Number(b.marketRentMonthly) : null,
        text: b.text ?? b.description ?? null,
        capex: b.capex ? Number(b.capex) : null,
      },
      b.assumptions
    );
    return NextResponse.json({ analysis });
  } catch (err) {
    console.error("[POST /api/analyze]", err);
    return NextResponse.json({ error: "Error al analizar" }, { status: 500 });
  }
}
