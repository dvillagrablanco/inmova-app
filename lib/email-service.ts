/**
 * Servicio de Envío de Emails
 *
 * Gestiona el envío de correos electrónicos transaccionales y de marketing
 */

import nodemailer from 'nodemailer';

// Configuración del transporter (ajustar según el proveedor)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content?: string;
    path?: string;
  }>;
}

/**
 * Enviar un email
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // En desarrollo, solo logear
    if (process.env.NODE_ENV === 'development' || !process.env.SMTP_USER) {
      console.log('[EMAIL] (DEMO) Email que se enviaría a:', options.to);
      console.log('[EMAIL] (DEMO) Asunto:', options.subject);
      return true;
    }

    const mailOptions = {
      from: options.from || `"INMOVA" <${process.env.SMTP_USER}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
      attachments: options.attachments,
    };

    await transporter.sendMail(mailOptions);
    console.log('[EMAIL] Email enviado exitosamente a:', options.to);
    return true;
  } catch (error) {
    console.error('[EMAIL] Error al enviar email:', error);
    return false;
  }
}

/**
 * Enviar email de bienvenida
 */
export async function sendWelcomeEmail(to: string, nombre: string) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">¡Bienvenido a INMOVA!</h2>
      <p>Hola ${nombre},</p>
      <p>Bienvenido a INMOVA, tu plataforma todo-en-uno para gestión inmobiliaria profesional.</p>
      <p>Comienza ahora explorando tu dashboard y configurando tu cuenta.</p>
      <p style="text-align: center; margin-top: 30px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
           style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Ir al Dashboard
        </a>
      </p>
    </div>
  `;

  return await sendEmail({
    to,
    subject: '¡Bienvenido a INMOVA!',
    html,
  });
}

export default {
  sendEmail,
  sendWelcomeEmail,
};
