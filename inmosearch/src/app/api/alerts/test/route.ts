import { NextResponse } from "next/server";
import { alertsConfigured, buildDigest, deliverDigest, renderText } from "@/lib/alerts";
import { listOpportunities } from "@/lib/opportunity";

export const dynamic = "force-dynamic";

/** Envía una alerta de prueba con las últimas oportunidades que encajan, para
 * verificar la configuración de canales (webhook / email). */
export async function POST() {
  const configured = alertsConfigured();
  const sample = (await listOpportunities({ matchedOnly: true })).slice(0, 5);
  const dtos = sample.length > 0 ? sample : (await listOpportunities({})).slice(0, 3);
  const digest = buildDigest("Prueba de alertas", "test", dtos);

  if (!configured) {
    return NextResponse.json({
      configured: false,
      message:
        "No hay canales de alerta configurados. Define ALERTS_WEBHOOK_URL o ALERTS_RESEND_API_KEY + ALERTS_EMAIL_FROM/TO.",
      preview: renderText(digest, process.env.APP_BASE_URL || undefined),
    });
  }

  const delivery = await deliverDigest(digest);
  return NextResponse.json({ configured: true, channels: delivery.channels, count: digest.count });
}
