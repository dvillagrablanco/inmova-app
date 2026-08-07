// INMOSEARCH — Ingestión de alertas por email (vía legal para Idealista/Fotocasa)
//
// En lugar de raspar los portales (prohibido por sus Términos), el usuario crea
// ALERTAS con sus criterios en Idealista/Fotocasa/Habitaclia. Esos correos
// llegan a su bandeja y aquí se parsean para crear las oportunidades. Puedes:
//  - Reenviar el email a un buzón conectado a un webhook (p.ej. SendGrid Inbound
//    Parse / Mailgun Routes) que haga POST a /api/ingest/email.
//  - O pegar el contenido del email en la UI.
import { parseListing, type ParsedListing } from "./parse";

const PORTAL_URL_RE =
  /https?:\/\/(?:www\.)?(?:idealista\.com|fotocasa\.es|habitaclia\.com|pisos\.com|milanuncios\.com)\/[^\s)"'<>]+/i;

// Separador de anuncio (carácter de control) que se antepone a cada enlace para
// trocear el email en bloques: un anuncio = su título + su enlace + sus
// detalles, hasta el siguiente enlace. Evita que un anuncio herede datos del
// anterior.
const SEP = String.fromCharCode(1);

/** Convierte HTML de email en texto, conservando los enlaces junto a su texto y
 * marcando el inicio de cada anuncio con el separador. */
function textify(content: string): string {
  const withLinks = content.replace(
    /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
    (_m, href, txt) => `${SEP}${txt} (${href}) `
  );
  const noScripts = withLinks
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ");
  const noTags = noScripts.replace(/<[^>]+>/g, " ");
  // Colapsa espacios en blanco (el separador no es whitespace, se conserva).
  return decodeEntities(noTags).replace(/[ \t\r\n\f\v]+/g, " ").trim();
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&euro;/g, "€")
    .replace(/&#8364;/g, "€")
    .replace(/&#8217;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
}

/** Extrae los anuncios de un email de alerta (HTML o texto). */
export function parseEmailListings(content: string): ParsedListing[] {
  const text = textify(content);

  // Trocea por separador: cada bloque contiene un anuncio completo.
  const blocks = text
    .split(SEP)
    .map((b) => b.trim())
    .filter((b) => b.length > 0);

  const results: ParsedListing[] = [];
  for (const block of blocks) {
    const urlMatch = block.match(PORTAL_URL_RE);
    if (!urlMatch) continue; // bloques sin enlace de portal (cabecera, pie...)
    const parsed = parseListing(block);
    if (parsed.askingPrice) {
      parsed.sourceUrl = urlMatch[0];
      results.push(parsed);
    }
  }

  // Fallback: sin bloques con URL, intenta un único anuncio del texto completo.
  if (results.length === 0) {
    const parsed = parseListing(text.replace(new RegExp(SEP, "g"), " "));
    if (parsed.askingPrice) results.push(parsed);
  }

  return dedupe(results);
}

function dedupe(list: ParsedListing[]): ParsedListing[] {
  const seen = new Set<string>();
  return list.filter((p) => {
    const key = p.sourceUrl || `${p.title}:${p.askingPrice}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
