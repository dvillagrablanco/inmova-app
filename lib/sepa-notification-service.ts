/**
 * SEPA NOTIFICATION SERVICE
 *
 * Envía el link de autorización de mandato SEPA al inquilino
 * por email, SMS y/o WhatsApp usando los servicios configurados.
 */

import { sendEmail } from '@/lib/email-service';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface SepaNotificationParams {
  tenantName: string;
  tenantEmail: string;
  tenantPhone?: string;
  redirectUrl: string;
  companyName: string;
  rentAmount?: number;
  channels: ('email' | 'sms' | 'whatsapp')[];
}

export interface SepaNotificationResult {
  email: { sent: boolean; error?: string };
  sms: { sent: boolean; error?: string };
  whatsapp: { sent: boolean; error?: string };
}

// ============================================================================
// EMAIL TEMPLATE
// ============================================================================

function buildSepaEmailHtml(params: SepaNotificationParams): string {
  const rentLine = params.rentAmount
    ? `<p style="font-size:16px;color:#1a1a1a;"><strong>Importe mensual:</strong> ${params.rentAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>`
    : '';

  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0891b2,#0e7490);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;">Autorización de Domiciliación Bancaria</h1>
            <p style="margin:8px 0 0;color:#cffafe;font-size:14px;">SEPA Direct Debit — ${params.companyName}</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="font-size:16px;color:#374151;">Hola <strong>${params.tenantName}</strong>,</p>
            <p style="font-size:15px;color:#4b5563;line-height:1.6;">
              ${params.companyName} utiliza domiciliación bancaria SEPA para el cobro del alquiler.
              Para activar el pago automático, necesitamos que autorices la domiciliación
              haciendo clic en el botón de abajo.
            </p>
            ${rentLine}
            <p style="font-size:14px;color:#6b7280;line-height:1.5;">
              En la siguiente página segura de GoCardless, introduce tu IBAN (número de cuenta)
              y confirma la autorización. El proceso tarda menos de 2 minutos.
            </p>
            <!-- CTA -->
            <div style="text-align:center;margin:32px 0;">
              <a href="${params.redirectUrl}"
                 style="display:inline-block;background:#0891b2;color:#ffffff;padding:16px 40px;
                        font-size:16px;font-weight:600;text-decoration:none;border-radius:8px;
                        box-shadow:0 2px 4px rgba(8,145,178,0.3);">
                Autorizar domiciliación SEPA
              </a>
            </div>
            <p style="font-size:13px;color:#9ca3af;text-align:center;">
              Si el botón no funciona, copia y pega esta URL en tu navegador:<br>
              <a href="${params.redirectUrl}" style="color:#0891b2;word-break:break-all;">${params.redirectUrl}</a>
            </p>
            <!-- Info -->
            <div style="background:#f0fdfa;border:1px solid #ccfbf1;border-radius:8px;padding:20px;margin-top:24px;">
              <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#0e7490;">¿Qué es una domiciliación SEPA?</p>
              <ul style="margin:0;padding-left:20px;font-size:13px;color:#4b5563;line-height:1.6;">
                <li>Es una orden de pago recurrente segura regulada por la UE</li>
                <li>Se cobra automáticamente cada mes en la fecha acordada</li>
                <li>Puedes cancelarla en cualquier momento desde tu banco</li>
                <li>Tienes derecho a devolución hasta 8 semanas después del cobro</li>
              </ul>
            </div>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
              Este email ha sido enviado por ${params.companyName} a través de INMOVA.<br>
              Si no esperabas este mensaje, puedes ignorarlo.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ============================================================================
// SMS / WHATSAPP MESSAGE
// ============================================================================

function buildSepaSmsMessage(params: SepaNotificationParams): string {
  const rent = params.rentAmount
    ? ` (${params.rentAmount}€/mes)`
    : '';
  return (
    `${params.companyName}: Hola ${params.tenantName.split(' ')[0]}, ` +
    `necesitamos que autorices la domiciliación bancaria SEPA para el pago del alquiler${rent}. ` +
    `Haz clic aquí para introducir tu IBAN: ${params.redirectUrl}`
  );
}

// ============================================================================
// SEND FUNCTIONS
// ============================================================================

async function sendSepaEmail(params: SepaNotificationParams): Promise<{ sent: boolean; error?: string }> {
  try {
    const html = buildSepaEmailHtml(params);
    const sent = await sendEmail({
      to: params.tenantEmail,
      subject: `Autorización de domiciliación bancaria SEPA — ${params.companyName}`,
      html,
    });
    return { sent };
  } catch (e: any) {
    logger.error('[SEPA Notify] Email error:', e);
    return { sent: false, error: e.message };
  }
}

async function sendSepaSms(params: SepaNotificationParams): Promise<{ sent: boolean; error?: string }> {
  if (!params.tenantPhone) return { sent: false, error: 'Sin teléfono' };

  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      return { sent: false, error: 'Twilio no configurado' };
    }

    const twilio = (await import('twilio')).default;
    const client = twilio(accountSid, authToken);

    const message = buildSepaSmsMessage(params);
    const phone = params.tenantPhone.startsWith('+') ? params.tenantPhone : `+34${params.tenantPhone}`;

    await client.messages.create({
      body: message,
      from: fromNumber,
      to: phone,
    });

    logger.info(`[SEPA Notify] SMS sent to ${phone}`);
    return { sent: true };
  } catch (e: any) {
    logger.error('[SEPA Notify] SMS error:', e);
    return { sent: false, error: e.message };
  }
}

async function sendSepaWhatsApp(params: SepaNotificationParams): Promise<{ sent: boolean; error?: string }> {
  if (!params.tenantPhone) return { sent: false, error: 'Sin teléfono' };

  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER;

    if (!accountSid || !authToken || !whatsappFrom) {
      return { sent: false, error: 'Twilio WhatsApp no configurado' };
    }

    const twilio = (await import('twilio')).default;
    const client = twilio(accountSid, authToken);

    const message = buildSepaSmsMessage(params);
    const phone = params.tenantPhone.startsWith('+') ? params.tenantPhone : `+34${params.tenantPhone}`;

    await client.messages.create({
      body: message,
      from: `whatsapp:${whatsappFrom}`,
      to: `whatsapp:${phone}`,
    });

    logger.info(`[SEPA Notify] WhatsApp sent to ${phone}`);
    return { sent: true };
  } catch (e: any) {
    logger.error('[SEPA Notify] WhatsApp error:', e);
    return { sent: false, error: e.message };
  }
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

/**
 * Enviar notificación de autorización SEPA al inquilino por los canales elegidos.
 */
export async function sendSepaAuthorization(params: SepaNotificationParams): Promise<SepaNotificationResult> {
  const result: SepaNotificationResult = {
    email: { sent: false },
    sms: { sent: false },
    whatsapp: { sent: false },
  };

  const promises: Promise<void>[] = [];

  if (params.channels.includes('email')) {
    promises.push(sendSepaEmail(params).then(r => { result.email = r; }));
  }
  if (params.channels.includes('sms')) {
    promises.push(sendSepaSms(params).then(r => { result.sms = r; }));
  }
  if (params.channels.includes('whatsapp')) {
    promises.push(sendSepaWhatsApp(params).then(r => { result.whatsapp = r; }));
  }

  await Promise.all(promises);

  logger.info(
    `[SEPA Notify] ${params.tenantName}: ` +
    `email=${result.email.sent}, sms=${result.sms.sent}, wa=${result.whatsapp.sent}`
  );

  return result;
}
