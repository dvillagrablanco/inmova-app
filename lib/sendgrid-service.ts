/**
 * Servicio de SendGrid para envío de emails transaccionales
 *
 * Este servicio proporciona una interfaz simplificada para enviar emails
 * usando SendGrid, con soporte para templates HTML y texto plano.
 */

import logger, { logError } from './logger';

interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    content: string; // Base64 encoded
    filename: string;
    type?: string;
    disposition?: 'attachment' | 'inline';
  }>;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
}

interface SendGridResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Verifica si SendGrid está configurado correctamente
 */
export function isSendGridConfigured(): boolean {
  const apiKey = process.env.SENDGRID_API_KEY;
  return !!apiKey && !apiKey.includes('placeholder');
}

/**
 * Envía un email usando SendGrid
 */
export async function sendEmail(options: EmailOptions): Promise<SendGridResponse> {
  // Verificar configuración
  if (!isSendGridConfigured()) {
    const errorMsg =
      'SendGrid no está configurado. Por favor, configura SENDGRID_API_KEY en las variables de entorno.';
    logger.warn('[SendGrid] ' + errorMsg);

    // En desarrollo, solo log pero no falla
    if (process.env.NODE_ENV === 'development') {
      console.log('[SendGrid] Email simulado:', {
        to: options.to,
        subject: options.subject,
        text: options.text?.substring(0, 100) + '...',
      });
      return { success: true, messageId: 'dev-' + Date.now() };
    }

    return { success: false, error: errorMsg };
  }

  try {
    const apiKey = process.env.SENDGRID_API_KEY!;
    const fromEmail = options.from || process.env.SENDGRID_FROM_EMAIL || 'noreply@inmova.app';
    const fromName = options.fromName || 'INMOVA';

    // Construir el payload para SendGrid
    const payload: any = {
      personalizations: [
        {
          to: Array.isArray(options.to)
            ? options.to.map((email) => ({ email }))
            : [{ email: options.to }],
        },
      ],
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: options.subject,
    };

    // Añadir CC si existe
    if (options.cc) {
      payload.personalizations[0].cc = Array.isArray(options.cc)
        ? options.cc.map((email) => ({ email }))
        : [{ email: options.cc }];
    }

    // Añadir BCC si existe
    if (options.bcc) {
      payload.personalizations[0].bcc = Array.isArray(options.bcc)
        ? options.bcc.map((email) => ({ email }))
        : [{ email: options.bcc }];
    }

    // Añadir reply-to si existe
    if (options.replyTo) {
      payload.reply_to = { email: options.replyTo };
    }

    // Añadir contenido
    if (options.templateId) {
      // Usar template de SendGrid
      payload.template_id = options.templateId;
      if (options.dynamicTemplateData) {
        payload.personalizations[0].dynamic_template_data = options.dynamicTemplateData;
      }
    } else {
      // Usar contenido directo
      payload.content = [];

      if (options.text) {
        payload.content.push({
          type: 'text/plain',
          value: options.text,
        });
      }

      if (options.html) {
        payload.content.push({
          type: 'text/html',
          value: options.html,
        });
      }

      // Si no hay contenido, usar el subject como texto
      if (payload.content.length === 0) {
        payload.content.push({
          type: 'text/plain',
          value: options.subject,
        });
      }
    }

    // Añadir attachments si existen
    if (options.attachments && options.attachments.length > 0) {
      payload.attachments = options.attachments;
    }

    // Enviar email
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`SendGrid API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    // SendGrid devuelve 202 Accepted en éxito
    const messageId = response.headers.get('X-Message-Id') || 'unknown';

    logger.info(`[SendGrid] Email enviado exitosamente a ${options.to}`, { messageId });

    return {
      success: true,
      messageId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    logError(new Error(`[SendGrid] Error enviando email: ${errorMessage}`), {
      to: options.to,
      subject: options.subject,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Plantillas predefinidas para emails comunes
 */
export const EmailTemplates = {
  /**
   * Email de bienvenida para nuevos usuarios
   */
  welcome: (userName: string, loginUrl: string) => ({
    subject: '¡Bienvenido a INMOVA!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Bienvenido a INMOVA!</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${userName}</strong>,</p>
            <p>Nos complace darte la bienvenida a INMOVA, la plataforma integral para la gestión inmobiliaria.</p>
            <p>Ya puedes acceder a tu cuenta y comenzar a explorar todas las funcionalidades que tenemos para ti:</p>
            <ul>
              <li>Gestión de propiedades y unidades</li>
              <li>Administración de contratos e inquilinos</li>
              <li>Control de pagos y finanzas</li>
              <li>Mantenimiento y mucho más</li>
            </ul>
            <center>
              <a href="${loginUrl}" class="button">Acceder a mi cuenta</a>
            </center>
            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
            <p>¡Gracias por elegir INMOVA!</p>
          </div>
          <div class="footer">
            <p>© 2024 INMOVA. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      ¡Bienvenido a INMOVA!
      
      Hola ${userName},
      
      Nos complace darte la bienvenida a INMOVA, la plataforma integral para la gestión inmobiliaria.
      
      Ya puedes acceder a tu cuenta en: ${loginUrl}
      
      Gracias por elegir INMOVA.
    `.trim(),
  }),

  /**
   * Notificación de pago recibido
   */
  paymentReceived: (tenantName: string, amount: number, reference: string) => ({
    subject: 'Pago recibido correctamente',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .amount { font-size: 32px; font-weight: bold; color: #10b981; text-align: center; margin: 20px 0; }
          .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Pago Recibido</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${tenantName}</strong>,</p>
            <p>Hemos recibido tu pago correctamente.</p>
            <div class="amount">€${amount.toFixed(2)}</div>
            <div class="details">
              <p><strong>Referencia:</strong> ${reference}</p>
              <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
              <p><strong>Estado:</strong> <span style="color: #10b981;">Pagado</span></p>
            </div>
            <p>Gracias por tu pago puntual.</p>
          </div>
          <div class="footer">
            <p>© 2024 INMOVA. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Pago Recibido
      
      Hola ${tenantName},
      
      Hemos recibido tu pago de €${amount.toFixed(2)}
      Referencia: ${reference}
      Fecha: ${new Date().toLocaleDateString('es-ES')}
      
      Gracias por tu pago puntual.
    `.trim(),
  }),

  /**
   * Recordatorio de pago pendiente
   */
  paymentReminder: (tenantName: string, amount: number, dueDate: string) => ({
    subject: 'Recordatorio: Pago pendiente',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .amount { font-size: 32px; font-weight: bold; color: #f59e0b; text-align: center; margin: 20px 0; }
          .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Recordatorio de Pago</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${tenantName}</strong>,</p>
            <p>Te recordamos que tienes un pago pendiente:</p>
            <div class="amount">€${amount.toFixed(2)}</div>
            <div class="details">
              <p><strong>Fecha de vencimiento:</strong> ${dueDate}</p>
              <p><strong>Estado:</strong> <span style="color: #f59e0b;">Pendiente</span></p>
            </div>
            <p>Por favor, realiza el pago antes de la fecha de vencimiento para evitar recargos.</p>
            <center>
              <a href="https://inmova.app/portal-inquilino/pagos" class="button">Realizar Pago</a>
            </center>
          </div>
          <div class="footer">
            <p>© 2024 INMOVA. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Recordatorio de Pago
      
      Hola ${tenantName},
      
      Te recordamos que tienes un pago pendiente de €${amount.toFixed(2)}
      Fecha de vencimiento: ${dueDate}
      
      Por favor, realiza el pago antes de la fecha de vencimiento.
      
      Accede a: https://inmova.app/portal-inquilino/pagos
    `.trim(),
  }),
};
