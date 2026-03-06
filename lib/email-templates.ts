/**
 * Email Templates
 * Plantillas HTML profesionales con branding de Inmova + sociedad emisora
 */

import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface CompanyInfo {
  nombre: string;
  email?: string;
  telefono?: string;
  logoUrl?: string;
  direccion?: string;
  cif?: string;
}

// ============================================
// TEMPLATE BASE — Look & feel Inmova + branding sociedad
// ============================================
export const baseTemplate = (content: string, company: CompanyInfo) => {
  const companyName = company.nombre;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://inmovaapp.com';

  const logoBlock = company.logoUrl
    ? `<img src="${company.logoUrl}" alt="${companyName}" style="max-height: 48px; max-width: 200px; display: inline-block;" />`
    : `<span style="font-size: 22px; font-weight: 700; color: #1a1a2e; letter-spacing: -0.3px;">${companyName}</span>`;

  return `<!DOCTYPE html>
<html lang="es" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${companyName}</title>
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; background-color: #f4f5f7;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">

          <!-- Header: logo sociedad -->
          <tr>
            <td style="padding: 28px 40px; border-bottom: 1px solid #eef0f2;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%;">
                <tr>
                  <td style="vertical-align: middle;">
                    ${logoBlock}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 36px 40px 28px;">
              ${content}
            </td>
          </tr>

          <!-- Datos de contacto -->
          ${company.email || company.telefono ? `
          <tr>
            <td style="padding: 0 40px 28px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; background-color: #f8f9fb; border-radius: 8px; padding: 20px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0 0 4px; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Contacto</p>
                    ${company.telefono ? `<p style="margin: 6px 0 0; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 14px; color: #374151;">Tel.: ${company.telefono}</p>` : ''}
                    ${company.email ? `<p style="margin: 4px 0 0; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 14px; color: #374151;">${company.email}</p>` : ''}
                    ${company.direccion ? `<p style="margin: 4px 0 0; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 13px; color: #6b7280;">${company.direccion}</p>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #fafafa; border-top: 1px solid #eef0f2;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%;">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.6; color: #9ca3af;">
                      Este correo ha sido enviado por <strong style="color: #6b7280;">${companyName}</strong>
                      ${company.cif ? ` (CIF: ${company.cif})` : ''}
                      a trav\u00e9s de la plataforma Inmova.
                    </p>
                    <p style="margin: 8px 0 0; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 11px; color: #9ca3af;">
                      Si tiene alguna consulta, por favor responda directamente a este correo
                      ${company.email ? ` o escriba a <a href="mailto:${company.email}" style="color: #6366f1; text-decoration: none;">${company.email}</a>` : ''}.
                    </p>
                    <p style="margin: 12px 0 0;">
                      <a href="${appUrl}" style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 11px; color: #a5b4fc; text-decoration: none;">Gestionado con Inmova</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

export function detailRow(label: string, value: string, highlight?: boolean): string {
  const bgColor = highlight ? '#f0f4ff' : '#ffffff';
  return `
  <tr>
    <td style="padding: 12px 16px; background-color: #f9fafb; border-bottom: 1px solid #f0f1f3; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 600; color: #6b7280; width: 40%;">${label}</td>
    <td style="padding: 12px 16px; background-color: ${bgColor}; border-bottom: 1px solid #f0f1f3; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 14px; color: #1f2937;">${value}</td>
  </tr>`;
}

// ============================================
// RECIBO DE PAGO
// ============================================
export const paymentReceiptEmail = ({
  tenantName,
  periodo,
  monto,
  fechaPago,
  unidad,
  edificio,
  company,
}: {
  tenantName: string;
  periodo: string;
  monto: number;
  fechaPago: Date;
  unidad: string;
  edificio: string;
  company: CompanyInfo;
}) => {
  const content = `
    <p style="margin: 0 0 6px; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 14px; color: #6b7280;">Recibo de pago</p>
    <h2 style="margin: 0 0 24px; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 22px; font-weight: 700; color: #1a1a2e;">Pago registrado correctamente</h2>

    <p style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #374151;">
      Estimado/a <strong>${tenantName}</strong>,
    </p>

    <p style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #374151;">
      Le confirmamos que hemos recibido su pago correspondiente al periodo <strong>${periodo}</strong>. A continuaci\u00f3n encontrar\u00e1 los detalles:
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin: 24px 0; border-collapse: collapse; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
      ${detailRow('Inmueble', `${edificio} \u2014 Unidad ${unidad}`)}
      ${detailRow('Periodo', periodo)}
      ${detailRow('Fecha de pago', format(fechaPago, "d 'de' MMMM 'de' yyyy", { locale: es }))}
      ${detailRow('Importe', `<strong style="font-size: 16px; color: #059669;">${monto.toFixed(2)} \u20ac</strong>`, true)}
    </table>

    <p style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #374151;">
      Si lo desea, puede descargar el recibo en formato PDF desde su \u00e1rea privada.
    </p>

    <p style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #374151;">
      Le agradecemos su puntualidad. Quedamos a su disposici\u00f3n para cualquier consulta.
    </p>

    <p style="margin-top: 28px; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #374151;">
      Reciba un cordial saludo,<br>
      <strong>${company.nombre}</strong>
    </p>
  `;

  return {
    subject: `${company.nombre} \u2014 Recibo de pago \u2014 ${periodo}`,
    html: baseTemplate(content, company),
    text: `Estimado/a ${tenantName},\n\nLe confirmamos que hemos recibido su pago correspondiente al periodo ${periodo}.\n\nInmueble: ${edificio} - Unidad ${unidad}\nPeriodo: ${periodo}\nFecha de pago: ${format(fechaPago, "d 'de' MMMM 'de' yyyy", { locale: es })}\nImporte: ${monto.toFixed(2)} \u20ac\n\nLe agradecemos su puntualidad.\n\nReciba un cordial saludo,\n${company.nombre}`,
  };
};

// ============================================
// RECORDATORIO DE PAGO (preventivo, pre-vencimiento)
// ============================================
export const paymentReminderEmail = ({
  tenantName,
  periodo,
  monto,
  fechaVencimiento,
  diasRestantes,
  unidad,
  edificio,
  company,
}: {
  tenantName: string;
  periodo: string;
  monto: number;
  fechaVencimiento: Date;
  diasRestantes: number;
  unidad: string;
  edificio: string;
  company: CompanyInfo;
}) => {
  const fechaStr = format(fechaVencimiento, "d 'de' MMMM 'de' yyyy", { locale: es });

  let intro: string;
  if (diasRestantes === 0) {
    intro = `le recordamos amablemente que el pago correspondiente al periodo <strong>${periodo}</strong> vence <strong>hoy, ${fechaStr}</strong>.`;
  } else if (diasRestantes === 1) {
    intro = `le recordamos amablemente que el pago correspondiente al periodo <strong>${periodo}</strong> vence <strong>ma\u00f1ana, ${fechaStr}</strong>.`;
  } else {
    intro = `nos ponemos en contacto con usted para recordarle que el pago correspondiente al periodo <strong>${periodo}</strong> vence el pr\u00f3ximo <strong>${fechaStr}</strong> (dentro de ${diasRestantes} d\u00edas).`;
  }

  const content = `
    <p style="margin: 0 0 6px; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 14px; color: #6b7280;">Aviso de pr\u00f3ximo vencimiento</p>
    <h2 style="margin: 0 0 24px; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 22px; font-weight: 700; color: #1a1a2e;">Recordatorio de pago</h2>

    <p style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #374151;">
      Estimado/a <strong>${tenantName}</strong>,
    </p>

    <p style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #374151;">
      Desde <strong>${company.nombre}</strong>, ${intro}
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin: 24px 0; border-collapse: collapse; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
      ${detailRow('Inmueble', `${edificio} \u2014 Unidad ${unidad}`)}
      ${detailRow('Periodo', periodo)}
      ${detailRow('Fecha de vencimiento', fechaStr)}
      ${detailRow('Importe', `<strong style="font-size: 16px;">${monto.toFixed(2)} \u20ac</strong>`, true)}
    </table>

    <p style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #374151;">
      Si ya ha efectuado el pago, le rogamos que ignore este mensaje. En ocasiones los cruces entre env\u00edos y recepciones de pagos pueden generar comunicaciones innecesarias y le pedimos disculpas por las molestias.
    </p>

    <p style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #374151;">
      Para cualquier consulta o aclaraci\u00f3n, no dude en ponerse en contacto con nosotros. Estaremos encantados de atenderle.
    </p>

    <p style="margin-top: 28px; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #374151;">
      Reciba un cordial saludo,<br>
      <strong>${company.nombre}</strong>
    </p>
  `;

  const subjectText = diasRestantes === 0
    ? `Aviso de vencimiento hoy \u2014 ${periodo}`
    : diasRestantes === 1
      ? `Aviso de vencimiento ma\u00f1ana \u2014 ${periodo}`
      : `Pr\u00f3ximo vencimiento \u2014 ${periodo}`;

  return {
    subject: `${company.nombre} \u2014 ${subjectText}`,
    html: baseTemplate(content, company),
    text: `Estimado/a ${tenantName},\n\nDesde ${company.nombre}, le recordamos amablemente que el pago correspondiente al periodo ${periodo} vence el ${fechaStr}.\n\nInmueble: ${edificio} - Unidad ${unidad}\nPeriodo: ${periodo}\nFecha de vencimiento: ${fechaStr}\nImporte: ${monto.toFixed(2)} \u20ac\n\nSi ya ha efectuado el pago, le rogamos que ignore este mensaje.\n\nPara cualquier consulta, no dude en ponerse en contacto con nosotros.\n\nReciba un cordial saludo,\n${company.nombre}`,
  };
};

// ============================================
// ALERTA DE CONTRATO PR\u00d3XIMO A VENCER
// ============================================
export const contractExpirationEmail = ({
  tenantName,
  fechaFin,
  diasRestantes,
  unidad,
  edificio,
  rentaMensual,
  company,
}: {
  tenantName: string;
  fechaFin: Date;
  diasRestantes: number;
  unidad: string;
  edificio: string;
  rentaMensual: number;
  company: CompanyInfo;
}) => {
  const fechaStr = format(fechaFin, "d 'de' MMMM 'de' yyyy", { locale: es });

  const content = `
    <p style="margin: 0 0 6px; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 14px; color: #6b7280;">Informaci\u00f3n sobre su contrato</p>
    <h2 style="margin: 0 0 24px; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 22px; font-weight: 700; color: #1a1a2e;">Pr\u00f3ximo vencimiento de contrato</h2>

    <p style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #374151;">
      Estimado/a <strong>${tenantName}</strong>,
    </p>

    <p style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #374151;">
      Desde <strong>${company.nombre}</strong> le informamos de que su contrato de arrendamiento finalizar\u00e1 el pr\u00f3ximo <strong>${fechaStr}</strong> (dentro de ${diasRestantes} d\u00edas).
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin: 24px 0; border-collapse: collapse; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
      ${detailRow('Inmueble', `${edificio} \u2014 Unidad ${unidad}`)}
      ${detailRow('Renta mensual', `${rentaMensual.toFixed(2)} \u20ac`)}
      ${detailRow('Fecha de finalizaci\u00f3n', `<strong>${fechaStr}</strong>`, true)}
    </table>

    <p style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #374151;">
      Si desea renovar su contrato o tiene cualquier consulta al respecto, le invitamos a ponerse en contacto con nosotros a su mayor conveniencia para que podamos gestionar los tr\u00e1mites oportunos.
    </p>

    <p style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #374151;">
      Quedamos a su entera disposici\u00f3n.
    </p>

    <p style="margin-top: 28px; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #374151;">
      Reciba un cordial saludo,<br>
      <strong>${company.nombre}</strong>
    </p>
  `;

  return {
    subject: `${company.nombre} \u2014 Su contrato finaliza en ${diasRestantes} d\u00edas`,
    html: baseTemplate(content, company),
    text: `Estimado/a ${tenantName},\n\nDesde ${company.nombre} le informamos de que su contrato de arrendamiento finalizar\u00e1 el ${fechaStr} (dentro de ${diasRestantes} d\u00edas).\n\nInmueble: ${edificio} - Unidad ${unidad}\nRenta mensual: ${rentaMensual.toFixed(2)} \u20ac\nFecha de finalizaci\u00f3n: ${fechaStr}\n\nSi desea renovar su contrato, le invitamos a ponerse en contacto con nosotros.\n\nReciba un cordial saludo,\n${company.nombre}`,
  };
};

// ============================================
// MANTENIMIENTO PROGRAMADO
// ============================================
export const maintenanceScheduledEmail = ({
  tenantName,
  titulo,
  descripcion,
  fechaProgramada,
  unidad,
  edificio,
  proveedor,
  company,
}: {
  tenantName: string;
  titulo: string;
  descripcion: string;
  fechaProgramada: Date;
  unidad: string;
  edificio: string;
  proveedor?: string;
  company: CompanyInfo;
}) => {
  const fechaStr = format(fechaProgramada, "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es });

  const content = `
    <p style="margin: 0 0 6px; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 14px; color: #6b7280;">Aviso de mantenimiento</p>
    <h2 style="margin: 0 0 24px; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 22px; font-weight: 700; color: #1a1a2e;">Mantenimiento programado</h2>

    <p style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #374151;">
      Estimado/a <strong>${tenantName}</strong>,
    </p>

    <p style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #374151;">
      Desde <strong>${company.nombre}</strong> le comunicamos que se ha programado una intervenci\u00f3n de mantenimiento en su inmueble. A continuaci\u00f3n le facilitamos los detalles:
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin: 24px 0; border-collapse: collapse; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
      ${detailRow('Inmueble', `${edificio} \u2014 Unidad ${unidad}`)}
      ${detailRow('Intervenci\u00f3n', titulo)}
      ${detailRow('Descripci\u00f3n', descripcion)}
      ${proveedor ? detailRow('Profesional asignado', proveedor) : ''}
      ${detailRow('Fecha y hora', `<strong>${fechaStr}</strong>`, true)}
    </table>

    <p style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #374151;">
      Le rogamos que facilite el acceso al inmueble en la fecha y hora indicadas. Si necesita reprogramar la visita, no dude en contactarnos con la mayor antelaci\u00f3n posible.
    </p>

    <p style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #374151;">
      Disculpe las molestias y gracias por su colaboraci\u00f3n.
    </p>

    <p style="margin-top: 28px; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #374151;">
      Reciba un cordial saludo,<br>
      <strong>${company.nombre}</strong>
    </p>
  `;

  return {
    subject: `${company.nombre} \u2014 Mantenimiento programado: ${titulo}`,
    html: baseTemplate(content, company),
    text: `Estimado/a ${tenantName},\n\nDesde ${company.nombre} le comunicamos que se ha programado una intervenci\u00f3n de mantenimiento en su inmueble.\n\nInmueble: ${edificio} - Unidad ${unidad}\nIntervenci\u00f3n: ${titulo}\nDescripci\u00f3n: ${descripcion}${proveedor ? `\nProfesional: ${proveedor}` : ''}\nFecha y hora: ${fechaStr}\n\nLe rogamos que facilite el acceso al inmueble. Si necesita reprogramar, cont\u00e1ctenos.\n\nReciba un cordial saludo,\n${company.nombre}`,
  };
};
