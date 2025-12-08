/**
 * Configuración de Email Transaccional
 * 
 * Soporta múltiples proveedores:
 * - SendGrid (recomendado para producción)
 * - SMTP genérico
 * - Nodemailer
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
  }>;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

let transporter: Transporter | null = null;

/**
 * Crear transporter de email
 */
function createTransporter(): Transporter {
  if (transporter) {
    return transporter;
  }

  // Configuración para SendGrid
  if (process.env.SENDGRID_API_KEY) {
    transporter = nodemailer.createTransporter({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }
  // Configuración SMTP genérica
  else if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASSWORD!,
      },
    });
  }
  // Desarrollo: Ethereal Email (testing)
  else if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️  No email provider configured. Using console logging.');
    // En desarrollo, solo loguear
    transporter = nodemailer.createTransporter({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    } as any);
  } else {
    throw new Error('Email configuration missing. Configure SENDGRID_API_KEY or SMTP settings.');
  }

  return transporter;
}

/**
 * Enviar email
 */
export async function sendEmail(
  options: EmailOptions
): Promise<SendEmailResult> {
  try {
    const transporter = createTransporter();

    const from = options.from || process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_FROM || 'noreply@inmova.app';
    const fromName = process.env.SENDGRID_FROM_NAME || 'INMOVA';

    const mailOptions = {
      from: `${fromName} <${from}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      cc: options.cc,
      bcc: options.bcc,
      attachments: options.attachments,
    };

    // En desarrollo, solo loguear
    if (process.env.NODE_ENV === 'development' && !process.env.SENDGRID_API_KEY && !process.env.SMTP_HOST) {
      console.log('📧 [DEV] Email que se enviaría:', {
        to: mailOptions.to,
        subject: mailOptions.subject,
        from: mailOptions.from,
      });
      return {
        success: true,
        messageId: 'dev-mode-' + Date.now(),
      };
    }

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email enviado:', {
      messageId: info.messageId,
      to: mailOptions.to,
      subject: mailOptions.subject,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Templates de email comunes
 */
export const emailTemplates = {
  /**
   * Email de bienvenida
   */
  welcome: (userName: string, loginUrl: string) => ({
    subject: 'Bienvenido a INMOVA',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>¡Bienvenido a INMOVA!</h1>
            </div>
            <div class="content">
              <p>Hola ${userName},</p>
              <p>Gracias por unirte a INMOVA, la plataforma integral de gestión inmobiliaria.</p>
              <p>Tu cuenta ha sido creada exitosamente. Ahora puedes acceder a todas las funcionalidades de la plataforma:</p>
              <ul>
                <li>Gestión de propiedades</li>
                <li>Control de contratos y rentas</li>
                <li>Mantenimiento y tickets</li>
                <li>Reportes y analytics</li>
                <li>Y mucho más...</li>
              </ul>
              <div style="text-align: center;">
                <a href="${loginUrl}" class="button">Acceder a INMOVA</a>
              </div>
              <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
              <p>¡Bienvenido a bordo!</p>
            </div>
            <div class="footer">
              <p>© 2025 INMOVA. Todos los derechos reservados.</p>
              <p>inmova.app</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  /**
   * Email de recuperación de contraseña
   */
  passwordReset: (userName: string, resetUrl: string) => ({
    subject: 'Restablecer contraseña - INMOVA',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #667eea; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Restablecer Contraseña</h1>
            </div>
            <div class="content">
              <p>Hola ${userName},</p>
              <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en INMOVA.</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
              </div>
              <div class="warning">
                <strong>⚠️ Importante:</strong> Este enlace expirará en 1 hora por seguridad.
              </div>
              <p>Si no solicitaste este cambio, puedes ignorar este email. Tu contraseña permanecerá sin cambios.</p>
              <p>Por seguridad, nunca compartas este enlace con nadie.</p>
            </div>
            <div class="footer">
              <p>© 2025 INMOVA. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  /**
   * Email de notificación de pago
   */
  paymentConfirmation: (userName: string, amount: string, concept: string, invoiceUrl?: string) => ({
    subject: 'Confirmación de pago - INMOVA',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .amount { font-size: 32px; font-weight: bold; color: #10b981; text-align: center; margin: 20px 0; }
            .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✓ Pago Confirmado</h1>
            </div>
            <div class="content">
              <p>Hola ${userName},</p>
              <p>Hemos recibido tu pago correctamente.</p>
              <div class="amount">${amount}</div>
              <div class="details">
                <p><strong>Concepto:</strong> ${concept}</p>
                <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              ${invoiceUrl ? `
              <div style="text-align: center;">
                <a href="${invoiceUrl}" class="button">Descargar Factura</a>
              </div>
              ` : ''}
              <p>Gracias por tu pago. Si tienes alguna pregunta, no dudes en contactarnos.</p>
            </div>
            <div class="footer">
              <p>© 2025 INMOVA. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  /**
   * Email de recordatorio
   */
  reminder: (userName: string, reminderText: string, actionUrl?: string, actionText?: string) => ({
    subject: 'Recordatorio - INMOVA',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .reminder { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 Recordatorio</h1>
            </div>
            <div class="content">
              <p>Hola ${userName},</p>
              <div class="reminder">
                <p>${reminderText}</p>
              </div>
              ${actionUrl && actionText ? `
              <div style="text-align: center;">
                <a href="${actionUrl}" class="button">${actionText}</a>
              </div>
              ` : ''}
              <p>Este es un recordatorio automático de INMOVA.</p>
            </div>
            <div class="footer">
              <p>© 2025 INMOVA. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
};

/**
 * Verificar configuración de email
 */
export async function verifyEmailConfiguration(): Promise<boolean> {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Configuración de email verificada correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error en configuración de email:', error);
    return false;
  }
}
