// INMOSEARCH — Ingesta automática de alertas por buzón IMAP
//
// Revisa un buzón de correo (donde recibes las alertas de Idealista/Fotocasa/
// Habitaclia), parsea los anuncios y crea las oportunidades. Es lectura de TU
// propio correo — legal y sin tocar los portales. Se configura por variables
// de entorno y se dispara por cron (/api/ingest/email/poll).
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { parseEmailListings } from "./email";
import { parsedToInput } from "./parse";
import { ingestOpportunity } from "@/lib/opportunity";

export function imapEnabled(): boolean {
  return Boolean(process.env.IMAP_HOST && process.env.IMAP_USER && process.env.IMAP_PASSWORD);
}

export interface ImapResult {
  processed: number; // emails de portales procesados
  imported: number;
  duplicates: number;
  errors: string[];
}

const PORTAL_RE = /idealista|fotocasa|habitaclia|pisos\.com|milanuncios/i;

/** Conecta al buzón, procesa los emails no leídos de portales y crea las
 * oportunidades. Marca como leídos los procesados (salvo IMAP_MARK_SEEN=false). */
export async function pollImapAlerts(): Promise<ImapResult> {
  if (!imapEnabled()) throw new Error("IMAP no configurado (faltan IMAP_HOST/USER/PASSWORD).");

  const client = new ImapFlow({
    host: process.env.IMAP_HOST!,
    port: Number(process.env.IMAP_PORT || 993),
    secure: process.env.IMAP_TLS !== "false",
    auth: { user: process.env.IMAP_USER!, pass: process.env.IMAP_PASSWORD! },
    logger: false,
  });

  const mailbox = process.env.IMAP_MAILBOX || "INBOX";
  const markSeen = process.env.IMAP_MARK_SEEN !== "false";
  const result: ImapResult = { processed: 0, imported: 0, duplicates: 0, errors: [] };

  await client.connect();
  const lock = await client.getMailboxLock(mailbox);
  try {
    for await (const msg of client.fetch({ seen: false }, { source: true, envelope: true, uid: true })) {
      const from = (msg.envelope?.from ?? []).map((f) => `${f.name ?? ""} ${f.address ?? ""}`).join(" ");
      const subject = msg.envelope?.subject ?? "";
      let content = "";
      try {
        const parsed = await simpleParser(msg.source as Buffer);
        content = (parsed.html || parsed.text || "").toString();
      } catch (e) {
        result.errors.push(`parse: ${e instanceof Error ? e.message : e}`);
        continue;
      }

      if (!PORTAL_RE.test(`${from} ${subject} ${content}`)) continue; // no es de portales
      result.processed++;

      for (const p of parseEmailListings(content)) {
        const input = parsedToInput(p);
        if (!input) continue;
        try {
          const r = await ingestOpportunity(input, { dedupKey: p.sourceUrl ? `imap:${p.sourceUrl}` : undefined });
          if (r.status === "duplicate") result.duplicates++;
          else result.imported++;
        } catch (e) {
          result.errors.push(String(e));
        }
      }

      if (markSeen) {
        try {
          await client.messageFlagsAdd(msg.uid, ["\\Seen"], { uid: true });
        } catch {
          /* ignora fallos al marcar */
        }
      }
    }
  } finally {
    lock.release();
    await client.logout();
  }

  return result;
}
