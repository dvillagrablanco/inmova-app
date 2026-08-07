// INMOSEARCH — Alertas de nuevas oportunidades que encajan
//
// Tras un barrido, si aparecen oportunidades nuevas que cumplen el perfil, se
// genera un resumen (digest) y se entrega por los canales configurados:
//  - Webhook (ALERTS_WEBHOOK_URL): Slack, Make, Zapier, n8n, o un endpoint de
//    email propio. Se envía tanto `text` (para Slack) como `digest` (JSON).
//  - Email vía Resend (ALERTS_RESEND_API_KEY + ALERTS_EMAIL_FROM/TO): API HTTP
//    simple, sin SMTP.
// Todo es opcional: si no hay canales configurados, no se envía nada.
import type { OpportunityDTO } from "@/lib/opportunity";
import { formatEur, formatPct, label } from "@/lib/format";

export interface AlertItem {
  id: string;
  title: string;
  location: string;
  propertyType: string;
  score: number;
  verdict: string;
  askingPrice: number;
  mao: number | null;
  discountToMarket: number | null;
  netYield: number | null;
  flipMargin: number | null;
  url: string | null;
}

export interface AlertDigest {
  profileName: string;
  runId: string;
  count: number;
  items: AlertItem[];
}

export function alertsConfigured(): boolean {
  return Boolean(
    process.env.ALERTS_WEBHOOK_URL ||
      (process.env.ALERTS_RESEND_API_KEY && process.env.ALERTS_EMAIL_FROM && process.env.ALERTS_EMAIL_TO)
  );
}

export function buildDigest(profileName: string, runId: string, dtos: OpportunityDTO[]): AlertDigest {
  const items: AlertItem[] = dtos.map((o) => ({
    id: o.id,
    title: o.title,
    location: [o.city, o.province].filter(Boolean).join(", ") || "—",
    propertyType: o.propertyType,
    score: o.score ?? 0,
    verdict: o.verdict ?? "—",
    askingPrice: o.askingPrice,
    mao: o.analysis?.mao?.recommended ?? null,
    discountToMarket: o.analysis?.discountToMarket ?? null,
    netYield: o.analysis?.rental?.netYield ?? null,
    flipMargin: o.analysis?.flip?.marginOnCost ?? null,
    url: o.sourceUrl ?? null,
  }));
  // Mejores primero.
  items.sort((a, b) => b.score - a.score);
  return { profileName, runId, count: items.length, items };
}

export function renderText(d: AlertDigest, baseUrl?: string): string {
  const lines = [`INMOSEARCH · ${d.count} nueva(s) oportunidad(es) para "${d.profileName}":`, ""];
  for (const it of d.items) {
    const parts = [
      `• [${it.score}/${it.verdict}] ${it.title} (${it.location})`,
      `  ${formatEur(it.askingPrice)}` +
        (it.discountToMarket != null ? ` · ${it.discountToMarket > 0 ? "-" : "+"}${Math.abs(it.discountToMarket).toFixed(0)}% vs mercado` : "") +
        (it.mao != null ? ` · MAO ${formatEur(it.mao)}` : "") +
        (it.flipMargin != null ? ` · flip ${formatPct(it.flipMargin)}` : "") +
        (it.netYield != null ? ` · rent. ${formatPct(it.netYield)}` : ""),
    ];
    if (baseUrl) parts.push(`  ${baseUrl}/opportunities/${it.id}`);
    if (it.url) parts.push(`  Anuncio: ${it.url}`);
    lines.push(parts.join("\n"));
  }
  return lines.join("\n");
}

export function renderHtml(d: AlertDigest, baseUrl?: string): string {
  const rows = d.items
    .map((it) => {
      const link = baseUrl ? `${baseUrl}/opportunities/${it.id}` : it.url ?? "#";
      const dto =
        it.discountToMarket != null
          ? `${it.discountToMarket > 0 ? "−" : "+"}${Math.abs(it.discountToMarket).toFixed(0)}%`
          : "—";
      return `<tr>
        <td style="padding:8px;border-bottom:1px solid #eee"><b>${it.score}</b> · ${escapeHtml(label(it.verdict))}</td>
        <td style="padding:8px;border-bottom:1px solid #eee"><a href="${link}">${escapeHtml(it.title)}</a><br><span style="color:#888">${escapeHtml(it.location)}</span></td>
        <td style="padding:8px;border-bottom:1px solid #eee">${formatEur(it.askingPrice)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${dto}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${it.mao != null ? formatEur(it.mao) : "—"}</td>
      </tr>`;
    })
    .join("");
  return `<div style="font-family:system-ui,Arial,sans-serif;max-width:640px">
    <h2>INMOSEARCH · ${d.count} nueva(s) oportunidad(es)</h2>
    <p style="color:#555">Perfil: <b>${escapeHtml(d.profileName)}</b></p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead><tr style="text-align:left;color:#888">
        <th style="padding:8px">Score</th><th style="padding:8px">Inmueble</th><th style="padding:8px">Precio</th><th style="padding:8px">vs mercado</th><th style="padding:8px">MAO</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

export interface DeliveryResult {
  channels: { name: string; ok: boolean; error?: string }[];
}

/** Entrega el digest por todos los canales configurados. Nunca lanza. */
export async function deliverDigest(d: AlertDigest): Promise<DeliveryResult> {
  const baseUrl = process.env.APP_BASE_URL || undefined;
  const channels: DeliveryResult["channels"] = [];

  const webhook = process.env.ALERTS_WEBHOOK_URL;
  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: renderText(d, baseUrl), digest: d }),
      });
      channels.push({ name: "webhook", ok: res.ok, error: res.ok ? undefined : `HTTP ${res.status}` });
    } catch (e) {
      channels.push({ name: "webhook", ok: false, error: e instanceof Error ? e.message : String(e) });
    }
  }

  const key = process.env.ALERTS_RESEND_API_KEY;
  const from = process.env.ALERTS_EMAIL_FROM;
  const to = process.env.ALERTS_EMAIL_TO;
  if (key && from && to) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: to.split(",").map((s) => s.trim()),
          subject: `INMOSEARCH · ${d.count} oportunidad(es) — ${d.profileName}`,
          html: renderHtml(d, baseUrl),
        }),
      });
      channels.push({ name: "email", ok: res.ok, error: res.ok ? undefined : `HTTP ${res.status}` });
    } catch (e) {
      channels.push({ name: "email", ok: false, error: e instanceof Error ? e.message : String(e) });
    }
  }

  return { channels };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
