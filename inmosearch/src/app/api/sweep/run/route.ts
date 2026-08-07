import { NextRequest, NextResponse } from "next/server";
import { runDueSweeps } from "@/lib/sweep";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Endpoint del cron: ejecuta los barridos que tocan según su programación.
 * Protegido con SWEEP_SECRET (cabecera Authorization: Bearer <secret> o
 * ?secret=). Si no se define SWEEP_SECRET, se permite (útil en desarrollo). */
export async function POST(req: NextRequest) {
  return handle(req);
}

// Vercel Cron y GitHub Actions pueden invocarlo por GET.
export async function GET(req: NextRequest) {
  return handle(req);
}

async function handle(req: NextRequest) {
  // Acepta SWEEP_SECRET (nuestro) o CRON_SECRET (el que inyecta Vercel Cron).
  const secret = process.env.SWEEP_SECRET || process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization") || "";
    const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    const qp = req.nextUrl.searchParams.get("secret");
    if (bearer !== secret && qp !== secret) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  try {
    const outcomes = await runDueSweeps(new Date());
    const totals = outcomes.reduce(
      (acc, o) => ({
        imported: acc.imported + o.imported,
        matched: acc.matched + o.matched,
        duplicates: acc.duplicates + o.duplicates,
      }),
      { imported: 0, matched: 0, duplicates: 0 }
    );
    return NextResponse.json({ ranProfiles: outcomes.length, totals, outcomes });
  } catch (err) {
    console.error("[GET/POST /api/sweep/run]", err);
    return NextResponse.json({ error: "Error en el barrido" }, { status: 500 });
  }
}
