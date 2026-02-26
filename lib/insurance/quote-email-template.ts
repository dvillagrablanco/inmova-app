import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QuoteEmailParams {
  company: {
    nombre: string;
    cif?: string | null;
    direccion?: string | null;
    codigoPostal?: string | null;
    ciudad?: string | null;
    telefono?: string | null;
    email?: string | null;
    logoUrl?: string | null;
    colorPrimario?: string | null;
    colorSecundario?: string | null;
    pieDocumento?: string | null;
  };
  provider: {
    nombre: string;
    contactoNombre?: string | null;
    contactoEmail?: string | null;
  };
  request: {
    codigo: string;
    tipoSeguro: string;
    descripcion: string;
    sumaAsegurada?: number | null;
    coberturasSolicitadas: string[];
    direccionInmueble?: string | null;
    superficieM2?: number | null;
    anoConstruccion?: number | null;
    usoPrincipal?: string | null;
    fechaLimiteRespuesta?: Date | null;
  };
  replyToEmail: string;
  appUrl?: string;
}

// ---------------------------------------------------------------------------
// Insurance type labels (Spanish)
// ---------------------------------------------------------------------------

export const INSURANCE_TYPE_LABELS: Record<string, string> = {
  incendio: 'Incendio',
  robo: 'Robo',
  responsabilidad_civil: 'Responsabilidad Civil',
  hogar: 'Hogar',
  comunidad: 'Comunidad / Edificio',
  vida: 'Vida',
  accidentes: 'Accidentes',
  impago_alquiler: 'Impago de Alquiler',
  otro: 'Otro',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function esc(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: Date): string {
  return format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
}

function resolveColor(custom: string | null | undefined, fallback: string): string {
  return custom?.trim() || fallback;
}

function insuranceLabel(key: string): string {
  return INSURANCE_TYPE_LABELS[key] ?? key;
}

function buildCompanyAddress(company: QuoteEmailParams['company']): string {
  const parts: string[] = [];
  if (company.direccion) parts.push(esc(company.direccion));
  const cityLine = [company.codigoPostal, company.ciudad].filter(Boolean).join(' ');
  if (cityLine) parts.push(esc(cityLine));
  return parts.join(' · ');
}

function buildSubheaderParts(company: QuoteEmailParams['company']): string {
  const pieces: string[] = [];
  if (company.cif) pieces.push(`CIF: ${esc(company.cif)}`);
  const addr = buildCompanyAddress(company);
  if (addr) pieces.push(addr);
  return pieces.join(' &nbsp;|&nbsp; ');
}

// ---------------------------------------------------------------------------
// Main template: Quote Request
// ---------------------------------------------------------------------------

export function generateQuoteRequestEmail(params: QuoteEmailParams): string {
  const { company, provider, request, replyToEmail } = params;

  const primaryColor = resolveColor(company.colorPrimario, '#1a1a2e');
  const secondaryColor = resolveColor(company.colorSecundario, '#16213e');
  const accentColor = primaryColor;

  const greeting = provider.contactoNombre
    ? `Estimado/a ${esc(provider.contactoNombre)},`
    : `Estimado equipo de ${esc(provider.nombre)},`;

  const subheader = buildSubheaderParts(company);
  const today = formatDate(new Date());

  const detailRows = buildDetailRows(request, accentColor);
  const coberturasHtml = buildCoberturasHtml(request.coberturasSolicitadas, accentColor);
  const deadlineHtml = buildDeadlineHtml(request.fechaLimiteRespuesta, accentColor);

  const mailtoSubject = encodeURIComponent(
    `Cotización ${request.codigo} - ${insuranceLabel(request.tipoSeguro)}`
  );
  const mailtoHref = `mailto:${replyToEmail}?subject=${mailtoSubject}`;

  const logoHtml = company.logoUrl
    ? `<img src="${esc(company.logoUrl)}" alt="${esc(company.nombre)}" style="max-height:48px;max-width:200px;margin-bottom:8px;display:block;" />`
    : '';

  return `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Solicitud de Cotización ${esc(request.codigo)}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f0f2f5;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f0f2f5;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" style="max-width:640px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- HEADER -->
          <tr>
            <td style="background-color:${accentColor};padding:28px 40px;text-align:center;">
              ${logoHtml}
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">${esc(company.nombre)}</h1>
            </td>
          </tr>

          <!-- SUBHEADER -->
          ${
            subheader
              ? `
          <tr>
            <td style="background-color:${secondaryColor};padding:10px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.75);line-height:1.5;">${subheader}</p>
            </td>
          </tr>`
              : ''
          }

          <!-- DATE & REF -->
          <tr>
            <td style="padding:28px 40px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="font-size:12px;color:#888888;">${today}</td>
                  <td align="right" style="font-size:12px;color:#888888;">Ref: <strong style="color:#555555;">${esc(request.codigo)}</strong></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- GREETING & INTRO -->
          <tr>
            <td style="padding:24px 40px 0;">
              <p style="margin:0 0 16px;font-size:15px;color:#333333;line-height:1.6;">${greeting}</p>
              <p style="margin:0 0 16px;font-size:15px;color:#333333;line-height:1.6;">
                Desde <strong>${esc(company.nombre)}</strong> le contactamos para solicitarle una cotización de seguro para uno de nuestros inmuebles gestionados.
                A continuación le detallamos la información relevante:
              </p>
            </td>
          </tr>

          <!-- DETAILS BOX -->
          <tr>
            <td style="padding:8px 40px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f8f9fb;border-radius:6px;border:1px solid #e8eaed;">
                <tr>
                  <td style="padding:20px 24px 8px;">
                    <h2 style="margin:0 0 16px;font-size:15px;font-weight:700;color:${accentColor};text-transform:uppercase;letter-spacing:0.5px;">Datos de la solicitud</h2>
                  </td>
                </tr>
                ${detailRows}
              </table>
            </td>
          </tr>

          <!-- COBERTURAS -->
          ${coberturasHtml}

          <!-- DESCRIPTION -->
          ${
            request.descripcion
              ? `
          <tr>
            <td style="padding:20px 40px 0;">
              <h3 style="margin:0 0 10px;font-size:14px;font-weight:700;color:#333333;">Información adicional</h3>
              <p style="margin:0;font-size:14px;color:#555555;line-height:1.6;background-color:#fafafa;padding:14px 18px;border-radius:6px;border-left:3px solid ${accentColor};">${esc(request.descripcion)}</p>
            </td>
          </tr>`
              : ''
          }

          <!-- DEADLINE -->
          ${deadlineHtml}

          <!-- CTA -->
          <tr>
            <td style="padding:28px 40px 0;" align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="border-radius:6px;background-color:${accentColor};">
                    <a href="${mailtoHref}" target="_blank" style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;letter-spacing:0.3px;">Enviar Cotización</a>
                  </td>
                </tr>
              </table>
              <p style="margin:12px 0 0;font-size:12px;color:#999999;">O responda directamente a <a href="mailto:${esc(replyToEmail)}" style="color:${accentColor};">${esc(replyToEmail)}</a></p>
            </td>
          </tr>

          <!-- SPACER -->
          <tr><td style="padding:16px 0;"></td></tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:24px 40px;background-color:#fafafa;border-top:1px solid #eeeeee;">
              ${company.pieDocumento ? `<p style="margin:0 0 12px;font-size:12px;color:#777777;line-height:1.5;text-align:center;">${esc(company.pieDocumento)}</p>` : ''}
              <p style="margin:0;font-size:11px;color:#aaaaaa;text-align:center;line-height:1.5;">
                Gestionado con <strong style="color:#888888;">Inmova App</strong> &mdash; Plataforma de Gestión Inmobiliaria
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Reminder template
// ---------------------------------------------------------------------------

export function generateQuoteReminderEmail(params: QuoteEmailParams): string {
  const { company, provider, request, replyToEmail } = params;

  const primaryColor = resolveColor(company.colorPrimario, '#1a1a2e');
  const secondaryColor = resolveColor(company.colorSecundario, '#16213e');
  const accentColor = primaryColor;

  const greeting = provider.contactoNombre
    ? `Estimado/a ${esc(provider.contactoNombre)},`
    : `Estimado equipo de ${esc(provider.nombre)},`;

  const subheader = buildSubheaderParts(company);

  const deadlineText = request.fechaLimiteRespuesta
    ? formatDate(request.fechaLimiteRespuesta)
    : null;

  const mailtoSubject = encodeURIComponent(
    `Cotización ${request.codigo} - ${insuranceLabel(request.tipoSeguro)} (Recordatorio)`
  );
  const mailtoHref = `mailto:${replyToEmail}?subject=${mailtoSubject}`;

  const logoHtml = company.logoUrl
    ? `<img src="${esc(company.logoUrl)}" alt="${esc(company.nombre)}" style="max-height:48px;max-width:200px;margin-bottom:8px;display:block;" />`
    : '';

  return `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Recordatorio - Cotización ${esc(request.codigo)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f2f5;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f0f2f5;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" style="max-width:640px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- HEADER -->
          <tr>
            <td style="background-color:${accentColor};padding:24px 40px;text-align:center;">
              ${logoHtml}
              <h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">${esc(company.nombre)}</h1>
            </td>
          </tr>

          <!-- SUBHEADER -->
          ${
            subheader
              ? `
          <tr>
            <td style="background-color:${secondaryColor};padding:8px 40px;text-align:center;">
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.7);">${subheader}</p>
            </td>
          </tr>`
              : ''
          }

          <!-- REMINDER BADGE -->
          <tr>
            <td style="padding:24px 40px 0;" align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:#fff3e0;border:1px solid #ffe0b2;border-radius:4px;padding:8px 20px;">
                    <p style="margin:0;font-size:13px;font-weight:600;color:#e65100;letter-spacing:0.3px;">&#9888; RECORDATORIO</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:20px 40px 0;">
              <p style="margin:0 0 14px;font-size:15px;color:#333333;line-height:1.6;">${greeting}</p>
              <p style="margin:0 0 14px;font-size:15px;color:#333333;line-height:1.6;">
                Le recordamos que tenemos pendiente de recibir su cotización para la solicitud <strong>${esc(request.codigo)}</strong>
                correspondiente a un seguro de <strong>${esc(insuranceLabel(request.tipoSeguro))}</strong>.
              </p>
              ${
                deadlineText
                  ? `
              <p style="margin:0 0 14px;font-size:15px;color:#333333;line-height:1.6;">
                La fecha límite de respuesta es el <strong style="color:${accentColor};">${deadlineText}</strong>.
              </p>`
                  : ''
              }
              <p style="margin:0 0 14px;font-size:15px;color:#333333;line-height:1.6;">
                Quedamos a su disposición para cualquier información adicional que pueda necesitar.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:24px 40px 0;" align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="border-radius:6px;background-color:${accentColor};">
                    <a href="${mailtoHref}" target="_blank" style="display:inline-block;padding:12px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">Enviar Cotización</a>
                  </td>
                </tr>
              </table>
              <p style="margin:10px 0 0;font-size:12px;color:#999999;">O responda directamente a <a href="mailto:${esc(replyToEmail)}" style="color:${accentColor};">${esc(replyToEmail)}</a></p>
            </td>
          </tr>

          <!-- SPACER -->
          <tr><td style="padding:14px 0;"></td></tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:20px 40px;background-color:#fafafa;border-top:1px solid #eeeeee;">
              ${company.pieDocumento ? `<p style="margin:0 0 10px;font-size:12px;color:#777777;line-height:1.5;text-align:center;">${esc(company.pieDocumento)}</p>` : ''}
              <p style="margin:0;font-size:11px;color:#aaaaaa;text-align:center;">
                Gestionado con <strong style="color:#888888;">Inmova App</strong> &mdash; Plataforma de Gestión Inmobiliaria
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Private: build detail rows
// ---------------------------------------------------------------------------

function buildDetailRows(request: QuoteEmailParams['request'], accentColor: string): string {
  const rows: Array<{ label: string; value: string }> = [];

  rows.push({ label: 'Tipo de seguro', value: insuranceLabel(request.tipoSeguro) });

  if (request.direccionInmueble) {
    rows.push({ label: 'Dirección del inmueble', value: request.direccionInmueble });
  }
  if (request.superficieM2 != null) {
    rows.push({ label: 'Superficie', value: `${request.superficieM2.toLocaleString('es-ES')} m²` });
  }
  if (request.anoConstruccion != null) {
    rows.push({ label: 'Año de construcción', value: String(request.anoConstruccion) });
  }
  if (request.usoPrincipal) {
    rows.push({ label: 'Uso principal', value: request.usoPrincipal });
  }
  if (request.sumaAsegurada != null) {
    rows.push({ label: 'Suma asegurada', value: formatCurrency(request.sumaAsegurada) });
  }

  return rows
    .map(
      (r, i) => `
                <tr>
                  <td style="padding:6px 24px 6px;${i === rows.length - 1 ? 'padding-bottom:18px;' : ''}">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td width="42%" style="font-size:13px;color:#777777;padding:4px 0;vertical-align:top;">${esc(r.label)}</td>
                        <td width="58%" style="font-size:14px;color:#222222;font-weight:600;padding:4px 0;vertical-align:top;">${esc(r.value)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>`
    )
    .join('');
}

// ---------------------------------------------------------------------------
// Private: coberturas list
// ---------------------------------------------------------------------------

function buildCoberturasHtml(coberturas: string[], accentColor: string): string {
  if (!coberturas.length) return '';

  const items = coberturas
    .map(
      (c) =>
        `<tr>
          <td width="20" style="vertical-align:top;padding:3px 0;font-size:14px;color:${accentColor};">&#8226;</td>
          <td style="vertical-align:top;padding:3px 0;font-size:14px;color:#333333;">${esc(c)}</td>
        </tr>`
    )
    .join('');

  return `
          <tr>
            <td style="padding:20px 40px 0;">
              <h3 style="margin:0 0 12px;font-size:14px;font-weight:700;color:#333333;">Coberturas solicitadas</h3>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                ${items}
              </table>
            </td>
          </tr>`;
}

// ---------------------------------------------------------------------------
// Private: deadline banner
// ---------------------------------------------------------------------------

function buildDeadlineHtml(date: Date | null | undefined, accentColor: string): string {
  if (!date) return '';

  return `
          <tr>
            <td style="padding:24px 40px 0;" align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f0f4ff;border-radius:6px;border:1px solid #d6e0f5;">
                <tr>
                  <td style="padding:16px 24px;text-align:center;">
                    <p style="margin:0 0 4px;font-size:12px;color:#666666;text-transform:uppercase;letter-spacing:0.5px;">Fecha límite de respuesta</p>
                    <p style="margin:0;font-size:18px;font-weight:700;color:${accentColor};">${formatDate(date)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
}
