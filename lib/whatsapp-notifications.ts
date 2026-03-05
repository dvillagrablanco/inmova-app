/**
 * WhatsApp Notifications via Twilio
 * 
 * Sends WhatsApp messages for critical events (unpaid rent, contract expiry).
 * More effective than email for tenant communication in Spain.
 * 
 * Requires: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER
 */

import logger from '@/lib/logger';

interface WhatsAppMessage {
  to: string; // Phone number with country code (e.g., +34612345678)
  body: string;
}

/**
 * Send WhatsApp message via Twilio
 */
export async function sendWhatsApp(message: WhatsAppMessage): Promise<{ success: boolean; sid?: string; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    logger.debug('[WhatsApp] Twilio not configured, skipping');
    return { success: false, error: 'Twilio not configured' };
  }

  // Normalize phone number
  let phone = message.to.replace(/\s/g, '');
  if (!phone.startsWith('+')) phone = '+34' + phone; // Default Spain
  if (phone === '+34000000000' || phone.length < 10) {
    return { success: false, error: 'Invalid phone number' };
  }

  try {
    const twilio = (await import('twilio')).default;
    const client = twilio(accountSid, authToken);

    const result = await client.messages.create({
      body: message.body,
      from: `whatsapp:${fromNumber}`,
      to: `whatsapp:${phone}`,
    });

    logger.info(`[WhatsApp] Sent to ${phone}: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (error: any) {
    logger.error(`[WhatsApp] Error sending to ${phone}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send payment reminder via WhatsApp
 */
export async function sendPaymentReminder(tenantPhone: string, tenantName: string, amount: number, dueDate: string): Promise<{ success: boolean }> {
  const body = `📋 Inmova - Recordatorio de pago\n\nHola ${tenantName},\n\nLe recordamos que tiene un pago pendiente:\n💰 Importe: ${amount.toLocaleString('es-ES')}€\n📅 Vencimiento: ${dueDate}\n\nPuede realizar el pago a través de su portal de inquilino.\n\nGracias.`;
  return sendWhatsApp({ to: tenantPhone, body });
}

/**
 * Send overdue payment alert via WhatsApp
 */
export async function sendOverdueAlert(tenantPhone: string, tenantName: string, amount: number, daysPastDue: number): Promise<{ success: boolean }> {
  const body = `⚠️ Inmova - Pago vencido\n\nEstimado/a ${tenantName},\n\nSu pago de ${amount.toLocaleString('es-ES')}€ lleva ${daysPastDue} días vencido.\n\nLe rogamos regularice la situación a la mayor brevedad.\n\nPara cualquier consulta, contacte con su gestor.`;
  return sendWhatsApp({ to: tenantPhone, body });
}

/**
 * Send contract expiry notice via WhatsApp
 */
export async function sendContractExpiryNotice(tenantPhone: string, tenantName: string, expiryDate: string, daysUntil: number): Promise<{ success: boolean }> {
  const body = `📝 Inmova - Aviso de contrato\n\nHola ${tenantName},\n\nSu contrato de alquiler vence el ${expiryDate} (en ${daysUntil} días).\n\nSi desea renovar, contacte con su gestor para tramitar la renovación.\n\nGracias.`;
  return sendWhatsApp({ to: tenantPhone, body });
}
