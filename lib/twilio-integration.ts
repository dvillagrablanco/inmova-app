/**
 * TWILIO INTEGRATION SERVICE
 * SMS y WhatsApp Business API
 * Comunicación multi-canal con inquilinos
 */

import { logger } from '@/lib/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type MessageChannel = 'sms' | 'whatsapp';
export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'failed' | 'read';

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  whatsappNumber?: string;
  enabled: boolean;
}

export interface SendMessageParams {
  to: string;
  message: string;
  channel?: MessageChannel;
  mediaUrls?: string[];
  scheduledAt?: Date;
}

export interface MessageResult {
  id: string;
  status: MessageStatus;
  to: string;
  channel: MessageChannel;
  sentAt: Date;
  errorMessage?: string;
}

export interface VerificationParams {
  phoneNumber: string;
  channel?: MessageChannel;
}

export interface VerificationCheckParams {
  phoneNumber: string;
  code: string;
}

// ============================================================================
// TWILIO CLIENT
// ============================================================================

export class TwilioClient {
  private accountSid: string;
  private authToken: string;
  private phoneNumber: string;
  private whatsappNumber?: string;
  private baseUrl: string = 'https://api.twilio.com/2010-04-01';

  constructor(config: TwilioConfig) {
    this.accountSid = config.accountSid;
    this.authToken = config.authToken;
    this.phoneNumber = config.phoneNumber;
    this.whatsappNumber = config.whatsappNumber;
  }

  /**
   * Generar headers de autenticación básica
   */
  private getAuthHeaders(): HeadersInit {
    const credentials = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
    
    return {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    };
  }

  /**
   * Normalizar número de teléfono al formato E.164
   */
  private normalizePhoneNumber(phone: string): string {
    // Eliminar espacios, guiones, paréntesis
    let normalized = phone.replace(/[\s\-\(\)]/g, '');
    
    // Si no empieza con +, agregar +34 (España por defecto)
    if (!normalized.startsWith('+')) {
      normalized = '+34' + normalized;
    }
    
    return normalized;
  }

  /**
   * Enviar SMS
   */
  async sendSMS(params: SendMessageParams): Promise<MessageResult> {
    try {
      const from = this.phoneNumber;
      const to = this.normalizePhoneNumber(params.to);

      const body = new URLSearchParams({
        From: from,
        To: to,
        Body: params.message,
      });

      // Añadir media si existe
      if (params.mediaUrls && params.mediaUrls.length > 0) {
        params.mediaUrls.forEach(url => {
          body.append('MediaUrl', url);
        });
      }

      const response = await fetch(
        `${this.baseUrl}/Accounts/${this.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: body.toString(),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Twilio SMS error: ${error.message || response.statusText}`);
      }

      const data = await response.json();

      logger.info(`SMS sent successfully to ${to}`, { messageSid: data.sid });

      return {
        id: data.sid,
        status: data.status as MessageStatus,
        to: params.to,
        channel: 'sms',
        sentAt: new Date(),
      };
    } catch (error) {
      logger.error('Error sending SMS:', error);
      throw error;
    }
  }

  /**
   * Enviar mensaje de WhatsApp
   */
  async sendWhatsApp(params: SendMessageParams): Promise<MessageResult> {
    try {
      if (!this.whatsappNumber) {
        throw new Error('WhatsApp number not configured');
      }

      const from = `whatsapp:${this.whatsappNumber}`;
      const to = `whatsapp:${this.normalizePhoneNumber(params.to)}`;

      const body = new URLSearchParams({
        From: from,
        To: to,
        Body: params.message,
      });

      // Añadir media si existe
      if (params.mediaUrls && params.mediaUrls.length > 0) {
        params.mediaUrls.forEach(url => {
          body.append('MediaUrl', url);
        });
      }

      const response = await fetch(
        `${this.baseUrl}/Accounts/${this.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: body.toString(),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Twilio WhatsApp error: ${error.message || response.statusText}`);
      }

      const data = await response.json();

      logger.info(`WhatsApp sent successfully to ${to}`, { messageSid: data.sid });

      return {
        id: data.sid,
        status: data.status as MessageStatus,
        to: params.to,
        channel: 'whatsapp',
        sentAt: new Date(),
      };
    } catch (error) {
      logger.error('Error sending WhatsApp:', error);
      throw error;
    }
  }

  /**
   * Enviar mensaje (detecta automáticamente el canal)
   */
  async sendMessage(params: SendMessageParams): Promise<MessageResult> {
    const channel = params.channel || 'sms';

    if (channel === 'whatsapp') {
      return this.sendWhatsApp(params);
    } else {
      return this.sendSMS(params);
    }
  }

  /**
   * Enviar código de verificación 2FA
   */
  async sendVerificationCode(params: VerificationParams): Promise<string> {
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 dígitos

      const message = `Tu código de verificación INMOVA es: ${code}. Válido por 10 minutos.`;

      await this.sendMessage({
        to: params.phoneNumber,
        message,
        channel: params.channel || 'sms',
      });

      logger.info(`Verification code sent to ${params.phoneNumber}`);

      return code; // Guardar en BD o Redis con TTL
    } catch (error) {
      logger.error('Error sending verification code:', error);
      throw error;
    }
  }

  /**
   * Obtener estado de mensaje
   */
  async getMessageStatus(messageSid: string): Promise<MessageStatus> {
    try {
      const response = await fetch(
        `${this.baseUrl}/Accounts/${this.accountSid}/Messages/${messageSid}.json`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get message status: ${response.statusText}`);
      }

      const data = await response.json();
      return data.status as MessageStatus;
    } catch (error) {
      logger.error('Error getting message status:', error);
      throw error;
    }
  }

  /**
   * Obtener historial de mensajes
   */
  async getMessageHistory(phoneNumber: string, limit: number = 50): Promise<any[]> {
    try {
      const to = this.normalizePhoneNumber(phoneNumber);
      
      const response = await fetch(
        `${this.baseUrl}/Accounts/${this.accountSid}/Messages.json?To=${to}&PageSize=${limit}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get message history: ${response.statusText}`);
      }

      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      logger.error('Error getting message history:', error);
      throw error;
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validar configuración de Twilio
 */
export function isTwilioConfigured(config?: TwilioConfig | null): boolean {
  if (!config) return false;
  return !!(
    config.accountSid &&
    config.authToken &&
    config.phoneNumber &&
    config.enabled
  );
}

/**
 * Obtener configuración de Twilio desde variables de entorno
 */
export function getTwilioConfigFromEnv(): TwilioConfig | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
  const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

  if (!accountSid || !authToken || !phoneNumber) {
    return null;
  }

  return {
    accountSid,
    authToken,
    phoneNumber,
    whatsappNumber,
    enabled: true,
  };
}

/**
 * Obtener cliente de Twilio
 */
export function getTwilioClient(config?: TwilioConfig): TwilioClient | null {
  const twilioConfig = config || getTwilioConfigFromEnv();

  if (!twilioConfig || !isTwilioConfigured(twilioConfig)) {
    return null;
  }

  return new TwilioClient(twilioConfig);
}

/**
 * Envío rápido de SMS (helper)
 */
export async function sendQuickSMS(
  to: string,
  message: string,
  config?: TwilioConfig
): Promise<MessageResult | null> {
  try {
    const client = getTwilioClient(config);

    if (!client) {
      logger.warn('Twilio not configured, SMS not sent');
      return null;
    }

    return await client.sendSMS({ to, message });
  } catch (error) {
    logger.error('Error in sendQuickSMS:', error);
    return null;
  }
}

/**
 * Envío rápido de WhatsApp (helper)
 */
export async function sendQuickWhatsApp(
  to: string,
  message: string,
  config?: TwilioConfig
): Promise<MessageResult | null> {
  try {
    const client = getTwilioClient(config);

    if (!client) {
      logger.warn('Twilio not configured, WhatsApp not sent');
      return null;
    }

    return await client.sendWhatsApp({ to, message });
  } catch (error) {
    logger.error('Error in sendQuickWhatsApp:', error);
    return null;
  }
}

/**
 * Templates de mensajes comunes
 */
export const MessageTemplates = {
  // Recordatorio de pago
  paymentReminder: (tenantName: string, amount: number, dueDate: string) => 
    `Hola ${tenantName}, te recordamos que tu próximo pago de €${amount} vence el ${dueDate}. ¡Gracias!`,

  // Confirmación de pago
  paymentConfirmation: (tenantName: string, amount: number) =>
    `¡Pago recibido! Gracias ${tenantName}, hemos recibido tu pago de €${amount}. Recibo enviado por email.`,

  // Solicitud de mantenimiento recibida
  maintenanceReceived: (tenantName: string, ticketId: string) =>
    `Hola ${tenantName}, hemos recibido tu solicitud de mantenimiento #${ticketId}. Te contactaremos pronto.`,

  // Mantenimiento programado
  maintenanceScheduled: (tenantName: string, date: string, time: string) =>
    `Hola ${tenantName}, tu mantenimiento está programado para el ${date} a las ${time}. Confirma tu disponibilidad.`,

  // Bienvenida
  welcome: (tenantName: string, address: string) =>
    `¡Bienvenido/a ${tenantName}! Tu contrato en ${address} está activo. Descarga la app INMOVA para gestionar todo.`,

  // Verificación 2FA
  verification2FA: (code: string) =>
    `Tu código de verificación INMOVA es: ${code}. Válido por 10 minutos.`,
};
