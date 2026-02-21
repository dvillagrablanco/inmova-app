/**
 * SISTEMA DE EMAILS TRANSACCIONALES AUTOMATIZADOS
 * Zero-Touch Onboarding System
 */

import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import logger from '@/lib/logger';
export interface EmailTemplate {
  id: string;
  subject: string;
  preheader: string;
  trigger: 'immediate' | 'delayed';
  delayHours?: number;
  condition?: (user: any) => boolean;
}

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
  replyTo?: string;
}

/**
 * Configuración de plantillas de email
 */
export const EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
  WELCOME: {
    id: 'welcome',
    subject: '🎉 ¡Bienvenido a INMOVA! Tu cuenta está lista',
    preheader: 'Configura tu cuenta en 2 minutos y descubre cómo INMOVA puede transformar tu negocio',
    trigger: 'immediate'
  },
  ACTIVATION_REMINDER: {
    id: 'activation_reminder',
    subject: '⏰ Tu dashboard te está esperando, {{firstName}}',
    preheader: 'No te pierdas las funcionalidades que harán crecer tu negocio',
    trigger: 'delayed',
    delayHours: 24,
    condition: (user) => !user.lastLoginAt || user.onboardingProgress < 50
  },
  FIRST_WIN: {
    id: 'first_win',
    subject: '🎯 ¡Genial! Ya tienes tu primera propiedad en INMOVA',
    preheader: 'Descubre qué hacer ahora para aprovechar al máximo la plataforma',
    trigger: 'immediate',
    condition: (user) => user.buildingsCount === 1
  },
  FEATURE_DISCOVERY: {
    id: 'feature_discovery',
    subject: '💡 5 funcionalidades que quizás no conoces',
    preheader: 'Saca el máximo provecho a INMOVA con estos tips',
    trigger: 'delayed',
    delayHours: 168, // 7 días
    condition: (user) => user.featuresUsed < 5
  },
  REACTIVATION: {
    id: 'reactivation',
    subject: '¿Necesitas ayuda con INMOVA, {{firstName}}?',
    preheader: 'Estamos aquí para ayudarte a sacar el máximo provecho',
    trigger: 'delayed',
    delayHours: 336, // 14 días
    condition: (user) => {
      const daysSinceLastLogin = user.lastLoginAt 
        ? Math.floor((Date.now() - new Date(user.lastLoginAt).getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      return daysSinceLastLogin >= 14;
    }
  }
};

/**
 * Servicio de envío de emails
 */
export class EmailService {
  private readonly apiKey: string;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || process.env.POSTMARK_API_KEY || '';
    this.fromEmail = process.env.EMAIL_FROM || 'inmovaapp@gmail.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'INMOVA';
  }

  /**
   * Enviar email genérico
   */
  async send(data: EmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Usar SendGrid o Postmark según disponibilidad
      if (process.env.SENDGRID_API_KEY) {
        return await this.sendWithSendGrid(data);
      } else if (process.env.POSTMARK_API_KEY) {
        return await this.sendWithPostmark(data);
      } else {
        // Fallback: Guardar en base de datos para envío manual
        console.log('[EMAIL] No email provider configured. Email saved to database.');
        return { success: false, error: 'No email provider configured' };
      }
    } catch (error) {
      logger.error('[EMAIL] Error sending email:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Enviar email usando SendGrid
   */
  private async sendWithSendGrid(data: EmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: data.to }],
          subject: data.subject
        }],
        from: { email: data.from || this.fromEmail, name: this.fromName },
        reply_to: data.replyTo ? { email: data.replyTo } : undefined,
        content: [
          { type: 'text/plain', value: data.text },
          { type: 'text/html', value: data.html }
        ]
      })
    });

    if (response.ok) {
      return { success: true, messageId: response.headers.get('x-message-id') || undefined };
    } else {
      const error = await response.text();
      return { success: false, error };
    }
  }

  /**
   * Enviar email usando Postmark
   */
  private async sendWithPostmark(data: EmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const response = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'X-Postmark-Server-Token': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        From: data.from || this.fromEmail,
        To: data.to,
        Subject: data.subject,
        HtmlBody: data.html,
        TextBody: data.text,
        ReplyTo: data.replyTo,
        MessageStream: 'outbound'
      })
    });

    if (response.ok) {
      const result = await response.json();
      return { success: true, messageId: result.MessageID };
    } else {
      const error = await response.text();
      return { success: false, error };
    }
  }

  /**
   * Enviar email de bienvenida
   */
  async sendWelcomeEmail(user: { email: string; name: string; businessModel?: string }) {
    const html = this.renderWelcomeEmail(user);
    const text = this.renderWelcomeEmailText(user);

    return await this.send({
      to: user.email,
      subject: EMAIL_TEMPLATES.WELCOME.subject,
      html,
      text
    });
  }

  /**
   * Enviar recordatorio de activación
   */
  async sendActivationReminder(user: { email: string; name: string; businessModel?: string }) {
    const html = this.renderActivationReminderEmail(user);
    const text = this.renderActivationReminderText(user);

    return await this.send({
      to: user.email,
      subject: EMAIL_TEMPLATES.ACTIVATION_REMINDER.subject.replace('{{firstName}}', user.name.split(' ')[0]),
      html,
      text
    });
  }

  /**
   * Enviar celebración de primer logro
   */
  async sendFirstWinEmail(user: { email: string; name: string; achievement: string }) {
    const html = this.renderFirstWinEmail(user);
    const text = this.renderFirstWinEmailText(user);

    return await this.send({
      to: user.email,
      subject: EMAIL_TEMPLATES.FIRST_WIN.subject,
      html,
      text
    });
  }

  /**
   * Renderizar email de bienvenida (HTML)
   */
  private renderWelcomeEmail(user: { name: string; businessModel?: string }): string {
    const firstName = user.name.split(' ')[0];
    
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido a INMOVA</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">🎉 ¡Bienvenido a INMOVA!</h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 18px; color: #1f2937; line-height: 1.6;">
                Hola <strong>${firstName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px; font-size: 16px; color: #4b5563; line-height: 1.6;">
                Tu cuenta en INMOVA está lista. Estás a solo <strong>2 minutos</strong> de empezar a gestionar tus propiedades de forma profesional.
              </p>
              
              <div style="background-color: #f9fafb; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 10px; color: #1f2937; font-size: 16px; font-weight: 600;">💡 ¿Por dónde empezar?</h3>
                <ul style="margin: 10px 0 0; padding-left: 20px; color: #4b5563; line-height: 1.8;">
                  <li>Explora tu dashboard con <strong>datos de ejemplo</strong></li>
                  <li>Crea tu primera propiedad en 60 segundos</li>
                  <li>O importa tus datos existentes desde Excel</li>
                </ul>
              </div>
              
              <!-- CTA Principal -->
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${process.env.NEXTAUTH_URL}/home?welcome=true" 
                       style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      🚀 Ir a mi Dashboard
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Video Tutorial -->
              <div style="background-color: #f0fdf4; border: 1px solid #86efac; padding: 20px; margin: 20px 0; border-radius: 6px; text-align: center;">
                <p style="margin: 0 0 10px; font-size: 14px; color: #166534; font-weight: 600;">🎥 Tutorial rápido</p>
                <p style="margin: 0 0 15px; font-size: 14px; color: #166534;">
                  Mira cómo crear tu primera propiedad en 60 segundos:
                </p>
                <a href="https://www.youtube.com/watch?v=zm55Gdl5G1Q" 
                   style="display: inline-block; padding: 12px 24px; background-color: #22c55e; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                  ▶️ Ver Video
                </a>
              </div>
              
              <!-- Enlaces secundarios -->
              <p style="margin: 30px 0 0; font-size: 14px; color: #6b7280; text-align: center;">
                <a href="${process.env.NEXTAUTH_URL}/admin/importar" style="color: #667eea; text-decoration: none;">📂 Importar mis datos</a>
                &nbsp;&nbsp;|
                &nbsp;&nbsp;<a href="https://www.inmova.app/ayuda" style="color: #667eea; text-decoration: none;">📖 Centro de ayuda</a>
                &nbsp;&nbsp;|
                &nbsp;&nbsp;<a href="mailto:inmovaapp@gmail.com" style="color: #667eea; text-decoration: none;">📧 Contactar soporte</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 10px; font-size: 12px; color: #6b7280; text-align: center;">
                © ${new Date().getFullYear()} INMOVA. Todos los derechos reservados.
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                Este es un email automático. Si no creaste una cuenta en INMOVA, ignora este mensaje.
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
  }

  /**
   * Renderizar email de bienvenida (Texto plano)
   */
  private renderWelcomeEmailText(user: { name: string }): string {
    const firstName = user.name.split(' ')[0];
    return `
¡Bienvenido a INMOVA!

Hola ${firstName},

Tu cuenta en INMOVA está lista. Estás a solo 2 minutos de empezar a gestionar tus propiedades de forma profesional.

¿Por dónde empezar?
- Explora tu dashboard con datos de ejemplo
- Crea tu primera propiedad en 60 segundos
- O importa tus datos existentes desde Excel

Ir a mi Dashboard: ${process.env.NEXTAUTH_URL}/home?welcome=true

Tutorial rápido: https://www.youtube.com/watch?v=zm55Gdl5G1Q

Enlaces útiles:
- Importar mis datos: ${process.env.NEXTAUTH_URL}/admin/importar
- Centro de ayuda: https://www.inmova.app/ayuda
- Contactar soporte: inmovaapp@gmail.com

© ${new Date().getFullYear()} INMOVA. Todos los derechos reservados.
    `.trim();
  }

  /**
   * Renderizar email de recordatorio de activación (HTML)
   */
  private renderActivationReminderEmail(user: { name: string; businessModel?: string }): string {
    const firstName = user.name.split(' ')[0];
    
    return `
<!DOCTYPE html>
<html lang="es">
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 20px; color: #1f2937; font-size: 28px;">Tu dashboard te está esperando, ${firstName} ⏰</h1>
              
              <p style="margin: 0 0 20px; font-size: 16px; color: #4b5563; line-height: 1.6;">
                Notamos que aún no has completado la configuración de tu cuenta. No te preocupes, te ayudamos a empezar en solo <strong>2 minutos</strong>.
              </p>
              
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%); padding: 24px; border-radius: 8px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px; color: #92400e; font-size: 18px;">🎯 3 razones para activarte hoy:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #92400e; line-height: 2;">
                  <li><strong>Ahorra tiempo</strong>: Automatiza tareas repetitivas</li>
                  <li><strong>Controla tus ingresos</strong>: Dashboard en tiempo real</li>
                  <li><strong>Sin compromiso</strong>: 30 días de prueba gratuita</li>
                </ul>
              </div>
              
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${process.env.NEXTAUTH_URL}/home?reminder=true" 
                       style="display: inline-block; padding: 16px 32px; background-color: #f59e0b; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
                      ✨ Completar configuración (2 min)
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0 0; font-size: 14px; color: #6b7280; text-align: center;">
                ¿Necesitas ayuda? <a href="mailto:inmovaapp@gmail.com" style="color: #667eea;">Escríbenos</a>
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
  }

  /**
   * Renderizar email de recordatorio de activación (Texto plano)
   */
  private renderActivationReminderText(user: { name: string }): string {
    const firstName = user.name.split(' ')[0];
    return `
Tu dashboard te está esperando, ${firstName}

Notamos que aún no has completado la configuración de tu cuenta. No te preocupes, te ayudamos a empezar en solo 2 minutos.

3 razones para activarte hoy:
- Ahorra tiempo: Automatiza tareas repetitivas
- Controla tus ingresos: Dashboard en tiempo real
- Sin compromiso: 30 días de prueba gratuita

Completar configuración: ${process.env.NEXTAUTH_URL}/home?reminder=true

¿Necesitas ayuda? Escríbenos a inmovaapp@gmail.com
    `.trim();
  }

  /**
   * Renderizar email de primer logro (HTML)
   */
  private renderFirstWinEmail(user: { name: string; achievement: string }): string {
    const firstName = user.name.split(' ')[0];
    
    return `
<!DOCTYPE html>
<html lang="es">
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td style="padding: 40px; text-align: center;">
              <div style="font-size: 64px; margin-bottom: 20px;">🎯</div>
              <h1 style="margin: 0 0 20px; color: #1f2937; font-size: 28px;">¡Genial, ${firstName}!</h1>
              
              <p style="margin: 0 0 30px; font-size: 18px; color: #4b5563; line-height: 1.6;">
                Ya tienes ${user.achievement} en INMOVA. ¡Excelente progreso!
              </p>
              
              <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); padding: 24px; border-radius: 8px; margin: 30px 0; text-align: left;">
                <h3 style="margin: 0 0 15px; color: #065f46; font-size: 18px;">🚀 Qué hacer ahora:</h3>
                <ol style="margin: 0; padding-left: 20px; color: #065f46; line-height: 2;">
                  <li>Añade más detalles (fotos, documentos)</li>
                  <li>Configura tus primeros contratos</li>
                  <li>Invita a tu equipo a colaborar</li>
                </ol>
              </div>
              
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${process.env.NEXTAUTH_URL}/home" 
                       style="display: inline-block; padding: 16px 32px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
                      📊 Ver mi Dashboard
                    </a>
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
</html>
    `;
  }

  /**
   * Renderizar email de primer logro (Texto plano)
   */
  private renderFirstWinEmailText(user: { name: string; achievement: string }): string {
    const firstName = user.name.split(' ')[0];
    return `
¡Genial, ${firstName}!

Ya tienes ${user.achievement} en INMOVA. ¡Excelente progreso!

Qué hacer ahora:
1. Añade más detalles (fotos, documentos)
2. Configura tus primeros contratos
3. Invita a tu equipo a colaborar

Ver mi Dashboard: ${process.env.NEXTAUTH_URL}/home
    `.trim();
  }
}

// Exportar instancia singleton
export const emailService = new EmailService();
