import { NextRequest, NextResponse } from "next/server";
import { imapEnabled, pollImapAlerts } from "@/lib/intake/imap";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Revisa el buzón IMAP e importa las alertas de portales. Pensado para cron.
 * Protegido con SWEEP_SECRET / CRON_SECRET (igual que /api/sweep/run). */
export async function POST(req: NextRequest) {
  return handle(req);
}
export async function GET(req: NextRequest) {
  return handle(req);
}

async function handle(req: NextRequest) {
  const secret = process.env.SWEEP_SECRET || process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization") || "";
    const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    const qp = req.nextUrl.searchParams.get("secret");
    if (bearer !== secret && qp !== secret) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  if (!imapEnabled()) {
    return NextResponse.json({ error: "IMAP no configurado (IMAP_HOST/USER/PASSWORD)." }, { status: 400 });
  }

  try {
    const result = await pollImapAlerts();
    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/ingest/email/poll]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error IMAP" }, { status: 500 });
  }
}
