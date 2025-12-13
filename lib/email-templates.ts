/**
 * Email Templates
 * Plantillas HTML para los diferentes tipos de emails
 */

import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CompanyInfo {
  nombre: string;
  email?: string;
  telefono?: string;
}

// ============================================
// TEMPLATE BASE
// ============================================
const baseTemplate = (content: string, companyName: string) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notificación ${companyName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background-color: #000000; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">${companyName}</h1>
              <p style="margin: 8px 0 0; color: #cccccc; font-size: 14px;">Innovación Inmobiliaria</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #666666; font-size: 12px; line-height: 1.5;">
                Este es un mensaje automático, por favor no responda a este correo.<br>
                Si tiene alguna pregunta, contáctenos a través de nuestro portal web.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

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
    <h2 style="margin: 0 0 20px; color: #000000; font-size: 24px;">Recibo de Pago</h2>
    
    <p style="color: #333333; font-size: 16px; line-height: 1.6;">
      Estimado/a <strong>${tenantName}</strong>,
    </p>
    
    <p style="color: #333333; font-size: 16px; line-height: 1.6;">
      Le confirmamos que hemos registrado su pago correspondiente al periodo <strong>${periodo}</strong>.
    </p>
    
    <table style="width: 100%; margin: 30px 0; border-collapse: collapse;">
      <tr>
        <td style="padding: 15px; background-color: #f9f9f9; border: 1px solid #eeeeee;">
          <strong style="color: #000000;">Propiedad:</strong>
        </td>
        <td style="padding: 15px; background-color: #ffffff; border: 1px solid #eeeeee; color: #333333;">
          ${edificio} - Unidad ${unidad}
        </td>
      </tr>
      <tr>
        <td style="padding: 15px; background-color: #f9f9f9; border: 1px solid #eeeeee;">
          <strong style="color: #000000;">Periodo:</strong>
        </td>
        <td style="padding: 15px; background-color: #ffffff; border: 1px solid #eeeeee; color: #333333;">
          ${periodo}
        </td>
      </tr>
      <tr>
        <td style="padding: 15px; background-color: #f9f9f9; border: 1px solid #eeeeee;">
          <strong style="color: #000000;">Fecha de Pago:</strong>
        </td>
        <td style="padding: 15px; background-color: #ffffff; border: 1px solid #eeeeee; color: #333333;">
          ${format(fechaPago, "dd 'de' MMMM 'de' yyyy", { locale: es })}
        </td>
      </tr>
      <tr>
        <td style="padding: 15px; background-color: #000000; border: 1px solid #000000;">
          <strong style="color: #ffffff;">Total Pagado:</strong>
        </td>
        <td style="padding: 15px; background-color: #000000; border: 1px solid #000000;">
          <strong style="color: #ffffff; font-size: 20px;">${monto.toFixed(2)} €</strong>
        </td>
      </tr>
    </table>
    
    <p style="color: #333333; font-size: 16px; line-height: 1.6;">
      Adjunto encontrará su recibo en formato PDF.
    </p>
    
    <p style="color: #333333; font-size: 16px; line-height: 1.6;">
      Gracias por su puntualidad.
    </p>
    
    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-top: 30px;">
      Atentamente,<br>
      <strong>${company.nombre}</strong>
    </p>
  `;

  return {
    subject: `Recibo de Pago - ${periodo}`,
    html: baseTemplate(content, company.nombre),
    text: `Estimado/a ${tenantName},\n\nLe confirmamos que hemos registrado su pago correspondiente al periodo ${periodo}.\n\nPropiedad: ${edificio} - Unidad ${unidad}\nPeriodo: ${periodo}\nFecha de Pago: ${format(fechaPago, "dd 'de' MMMM 'de' yyyy", { locale: es })}\nTotal Pagado: ${monto.toFixed(2)} €\n\nGracias por su puntualidad.\n\nAtentamente,\n${company.nombre}`,
  };
};

// ============================================
// RECORDATORIO DE PAGO
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
  const urgencia = diasRestantes <= 1 ? 'alto' : diasRestantes <= 3 ? 'medio' : 'bajo';
  const urgenciaColor = urgencia === 'alto' ? '#dc2626' : urgencia === 'medio' ? '#f59e0b' : '#3b82f6';
  const urgenciaTexto = diasRestantes === 0 ? 'HOY' : diasRestantes === 1 ? 'MAÑANA' : `en ${diasRestantes} días`;

  const content = `
    <div style="padding: 20px; background-color: ${urgenciaColor}; border-radius: 8px; margin-bottom: 30px;">
      <h2 style="margin: 0; color: #ffffff; font-size: 24px; text-align: center;">
        ⚠️ Recordatorio de Pago
      </h2>
      <p style="margin: 10px 0 0; color: #ffffff; font-size: 18px; text-align: center; font-weight: bold;">
        Vence ${urgenciaTexto}
      </p>
    </div>
    
    <p style="color: #333333; font-size: 16px; line-height: 1.6;">
      Estimado/a <strong>${tenantName}</strong>,
    </p>
    
    <p style="color: #333333; font-size: 16px; line-height: 1.6;">
      Le recordamos que el pago correspondiente al periodo <strong>${periodo}</strong> vence ${urgenciaTexto === 'HOY' ? 'hoy' : urgenciaTexto.toLowerCase()}.
    </p>
    
    <table style="width: 100%; margin: 30px 0; border-collapse: collapse;">
      <tr>
        <td style="padding: 15px; background-color: #f9f9f9; border: 1px solid #eeeeee;">
          <strong style="color: #000000;">Propiedad:</strong>
        </td>
        <td style="padding: 15px; background-color: #ffffff; border: 1px solid #eeeeee; color: #333333;">
          ${edificio} - Unidad ${unidad}
        </td>
      </tr>
      <tr>
        <td style="padding: 15px; background-color: #f9f9f9; border: 1px solid #eeeeee;">
          <strong style="color: #000000;">Periodo:</strong>
        </td>
        <td style="padding: 15px; background-color: #ffffff; border: 1px solid #eeeeee; color: #333333;">
          ${periodo}
        </td>
      </tr>
      <tr>
        <td style="padding: 15px; background-color: #f9f9f9; border: 1px solid #eeeeee;">
          <strong style="color: #000000;">Fecha de Vencimiento:</strong>
        </td>
        <td style="padding: 15px; background-color: #ffffff; border: 1px solid #eeeeee; color: #333333;">
          ${format(fechaVencimiento, "dd 'de' MMMM 'de' yyyy", { locale: es })}
        </td>
      </tr>
      <tr>
        <td style="padding: 15px; background-color: ${urgenciaColor}; border: 1px solid ${urgenciaColor};">
          <strong style="color: #ffffff;">Monto a Pagar:</strong>
        </td>
        <td style="padding: 15px; background-color: ${urgenciaColor}; border: 1px solid ${urgenciaColor};">
          <strong style="color: #ffffff; font-size: 20px;">${monto.toFixed(2)} €</strong>
        </td>
      </tr>
    </table>
    
    <p style="color: #333333; font-size: 16px; line-height: 1.6;">
      Por favor, realice el pago lo antes posible para evitar cargos adicionales.
    </p>
    
    ${company.telefono || company.email ? `
    <p style="color: #333333; font-size: 16px; line-height: 1.6;">
      Si ya realizó el pago o tiene alguna consulta, contáctenos:
      ${company.telefono ? `<br><strong>Teléfono:</strong> ${company.telefono}` : ''}
      ${company.email ? `<br><strong>Email:</strong> ${company.email}` : ''}
    </p>
    ` : ''}
    
    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-top: 30px;">
      Atentamente,<br>
      <strong>${company.nombre}</strong>
    </p>
  `;

  return {
    subject: `⚠️ Recordatorio: Pago ${periodo} vence ${urgenciaTexto}`,
    html: baseTemplate(content, company.nombre),
    text: `Estimado/a ${tenantName},\n\nLe recordamos que el pago correspondiente al periodo ${periodo} vence ${urgenciaTexto.toLowerCase()}.\n\nPropiedad: ${edificio} - Unidad ${unidad}\nPeriodo: ${periodo}\nFecha de Vencimiento: ${format(fechaVencimiento, "dd 'de' MMMM 'de' yyyy", { locale: es })}\nMonto a Pagar: ${monto.toFixed(2)} €\n\nPor favor, realice el pago lo antes posible para evitar cargos adicionales.\n\nAtentamente,\n${company.nombre}`,
  };
};

// ============================================
// ALERTA DE CONTRATO PRÓXIMO A VENCER
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
  const content = `
    <div style="padding: 20px; background-color: #f59e0b; border-radius: 8px; margin-bottom: 30px;">
      <h2 style="margin: 0; color: #ffffff; font-size: 24px; text-align: center;">
        📅 Contrato Próximo a Vencer
      </h2>
      <p style="margin: 10px 0 0; color: #ffffff; font-size: 18px; text-align: center; font-weight: bold;">
        ${diasRestantes} días restantes
      </p>
    </div>
    
    <p style="color: #333333; font-size: 16px; line-height: 1.6;">
      Estimado/a <strong>${tenantName}</strong>,
    </p>
    
    <p style="color: #333333; font-size: 16px; line-height: 1.6;">
      Le informamos que su contrato de arrendamiento vencerá próximamente.
    </p>
    
    <table style="width: 100%; margin: 30px 0; border-collapse: collapse;">
      <tr>
        <td style="padding: 15px; background-color: #f9f9f9; border: 1px solid #eeeeee;">
          <strong style="color: #000000;">Propiedad:</strong>
        </td>
        <td style="padding: 15px; background-color: #ffffff; border: 1px solid #eeeeee; color: #333333;">
          ${edificio} - Unidad ${unidad}
        </td>
      </tr>
      <tr>
        <td style="padding: 15px; background-color: #f9f9f9; border: 1px solid #eeeeee;">
          <strong style="color: #000000;">Renta Mensual:</strong>
        </td>
        <td style="padding: 15px; background-color: #ffffff; border: 1px solid #eeeeee; color: #333333;">
          ${rentaMensual.toFixed(2)} €
        </td>
      </tr>
      <tr>
        <td style="padding: 15px; background-color: #f59e0b; border: 1px solid #f59e0b;">
          <strong style="color: #ffffff;">Fecha de Vencimiento:</strong>
        </td>
        <td style="padding: 15px; background-color: #f59e0b; border: 1px solid #f59e0b;">
          <strong style="color: #ffffff; font-size: 18px;">${format(fechaFin, "dd 'de' MMMM 'de' yyyy", { locale: es })}</strong>
        </td>
      </tr>
    </table>
    
    <p style="color: #333333; font-size: 16px; line-height: 1.6;">
      Si desea renovar su contrato, por favor contáctenos lo antes posible para coordinar los detalles.
    </p>
    
    ${company.telefono || company.email ? `
    <p style="color: #333333; font-size: 16px; line-height: 1.6;">
      Puede comunicarse con nosotros a través de:
      ${company.telefono ? `<br><strong>Teléfono:</strong> ${company.telefono}` : ''}
      ${company.email ? `<br><strong>Email:</strong> ${company.email}` : ''}
    </p>
    ` : ''}
    
    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-top: 30px;">
      Atentamente,<br>
      <strong>${company.nombre}</strong>
    </p>
  `;

  return {
    subject: `📅 Su contrato vence en ${diasRestantes} días`,
    html: baseTemplate(content, company.nombre),
    text: `Estimado/a ${tenantName},\n\nLe informamos que su contrato de arrendamiento vencerá en ${diasRestantes} días.\n\nPropiedad: ${edificio} - Unidad ${unidad}\nRenta Mensual: ${rentaMensual.toFixed(2)} €\nFecha de Vencimiento: ${format(fechaFin, "dd 'de' MMMM 'de' yyyy", { locale: es })}\n\nSi desea renovar su contrato, por favor contáctenos lo antes posible.\n\nAtentamente,\n${company.nombre}`,
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
  const content = `
    <div style="padding: 20px; background-color: #3b82f6; border-radius: 8px; margin-bottom: 30px;">
      <h2 style="margin: 0; color: #ffffff; font-size: 24px; text-align: center;">
        🔧 Mantenimiento Programado
      </h2>
    </div>
    
    <p style="color: #333333; font-size: 16px; line-height: 1.6;">
      Estimado/a <strong>${tenantName}</strong>,
    </p>
    
    <p style="color: #333333; font-size: 16px; line-height: 1.6;">
      Le informamos que se ha programado un trabajo de mantenimiento en su propiedad.
    </p>
    
    <table style="width: 100%; margin: 30px 0; border-collapse: collapse;">
      <tr>
        <td style="padding: 15px; background-color: #f9f9f9; border: 1px solid #eeeeee;">
          <strong style="color: #000000;">Propiedad:</strong>
        </td>
        <td style="padding: 15px; background-color: #ffffff; border: 1px solid #eeeeee; color: #333333;">
          ${edificio} - Unidad ${unidad}
        </td>
      </tr>
      <tr>
        <td style="padding: 15px; background-color: #f9f9f9; border: 1px solid #eeeeee;">
          <strong style="color: #000000;">Trabajo:</strong>
        </td>
        <td style="padding: 15px; background-color: #ffffff; border: 1px solid #eeeeee; color: #333333;">
          ${titulo}
        </td>
      </tr>
      <tr>
        <td style="padding: 15px; background-color: #f9f9f9; border: 1px solid #eeeeee;">
          <strong style="color: #000000;">Descripción:</strong>
        </td>
        <td style="padding: 15px; background-color: #ffffff; border: 1px solid #eeeeee; color: #333333;">
          ${descripcion}
        </td>
      </tr>
      ${proveedor ? `
      <tr>
        <td style="padding: 15px; background-color: #f9f9f9; border: 1px solid #eeeeee;">
          <strong style="color: #000000;">Proveedor:</strong>
        </td>
        <td style="padding: 15px; background-color: #ffffff; border: 1px solid #eeeeee; color: #333333;">
          ${proveedor}
        </td>
      </tr>
      ` : ''}
      <tr>
        <td style="padding: 15px; background-color: #3b82f6; border: 1px solid #3b82f6;">
          <strong style="color: #ffffff;">Fecha Programada:</strong>
        </td>
        <td style="padding: 15px; background-color: #3b82f6; border: 1px solid #3b82f6;">
          <strong style="color: #ffffff; font-size: 18px;">${format(fechaProgramada, "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}</strong>
        </td>
      </tr>
    </table>
    
    <p style="color: #333333; font-size: 16px; line-height: 1.6;">
      Por favor, asegúrese de estar disponible en la fecha y hora indicadas, o de facilitar el acceso a la propiedad.
    </p>
    
    ${company.telefono || company.email ? `
    <p style="color: #333333; font-size: 16px; line-height: 1.6;">
      Si necesita reprogramar, contáctenos:
      ${company.telefono ? `<br><strong>Teléfono:</strong> ${company.telefono}` : ''}
      ${company.email ? `<br><strong>Email:</strong> ${company.email}` : ''}
    </p>
    ` : ''}
    
    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-top: 30px;">
      Atentamente,<br>
      <strong>${company.nombre}</strong>
    </p>
  `;

  return {
    subject: `🔧 Mantenimiento programado: ${titulo}`,
    html: baseTemplate(content, company.nombre),
    text: `Estimado/a ${tenantName},\n\nLe informamos que se ha programado un trabajo de mantenimiento en su propiedad.\n\nPropiedad: ${edificio} - Unidad ${unidad}\nTrabajo: ${titulo}\nDescripción: ${descripcion}${proveedor ? `\nProveedor: ${proveedor}` : ''}\nFecha Programada: ${format(fechaProgramada, "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}\n\nPor favor, asegúrese de estar disponible en la fecha y hora indicadas.\n\nAtentamente,\n${company.nombre}`,
  };
};
