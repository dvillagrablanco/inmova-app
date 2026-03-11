// @ts-nocheck
import nodemailer from 'nodemailer';

import logger from '@/lib/logger';
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPartnerWelcomeEmail(partner: {
  name: string;
  email: string;
  type: string;
  referralCode: string;
}) {
  const subject = `¡Bienvenido al Programa de Partners de Inmova! 🎉`;

  const html = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="background-color: #2563eb; color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0;">¡Bienvenido a Inmova Partners!</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f9fafb;">
          <p style="font-size: 18px;">Hola <strong>${partner.name}</strong>,</p>
          
          <p style="font-size: 16px;">Tu solicitud para unirte al <strong>Programa de Partners de Inmova</strong> ha sido recibida correctamente.</p>
          
          <div style="background-color: white; border-left: 4px solid #2563eb; padding: 20px; margin: 30px 0;">
            <h3 style="margin-top: 0; color: #2563eb;">📋 Próximos Pasos:</h3>
            <ol style="padding-left: 20px;">
              <li><strong>Revisión (24-48h):</strong> Nuestro equipo revisará tu solicitud</li>
              <li><strong>Aprobación:</strong> Recibirás un email de confirmación</li>
              <li><strong>Onboarding:</strong> Acceso a materiales y dashboard</li>
              <li><strong>¡Empieza a Ganar!</strong> Comienza a referir clientes</li>
            </ol>
          </div>
          
          <div style="background-color: #eff6ff; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <h3 style="margin-top: 0; color: #1e40af;">🎯 Tu Código de Referido:</h3>
            <div style="text-align: center; background-color: white; padding: 20px; border-radius: 8px; margin: 15px 0;">
              <p style="font-size: 32px; font-weight: bold; margin: 0; font-family: monospace; color: #2563eb;">${partner.referralCode}</p>
            </div>
            <p style="margin: 0; text-align: center; font-size: 14px; color: #64748b;">Guarda este código. Lo necesitarás tras la aprobación.</p>
          </div>
          
          <div style="background-color: white; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <h3 style="margin-top: 0;">💰 Tu Modelo de Remuneración:</h3>
            <ul style="padding-left: 20px;">
              <li><strong>25% Comisión Recurrente:</strong> €37.25/mes por cliente (plan Pro)</li>
              <li><strong>€200 Bono Alta:</strong> Por cada nuevo cliente que firme</li>
              <li><strong>Bonos Trimestrales:</strong> Hasta 30% extra por volumen</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 40px 0;">
            <p style="font-size: 14px; color: #64748b;">¿Tienes preguntas?</p>
            <p style="font-size: 14px; color: #64748b;">Responde a este email o escríbenos a <a href="mailto:partners@inmovaapp.com" style="color: #2563eb;">partners@inmovaapp.com</a></p>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 40px; text-align: center;">
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">
              Este es un mensaje automático del sistema Inmova Partners<br/>
              © 2025 Inmova App - Todos los derechos reservados
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@inmovaapp.com',
      to: partner.email,
      subject,
      html,
    });

    // Email sent successfully
  } catch (error) {
    logger.error('[Partner Welcome Email Error]:', error);
    throw error;
  }
}

export async function sendPartnerApprovalEmail(partner: {
  name: string;
  email: string;
  referralCode: string;
  commissionRate: number;
  level: string;
}) {
  const subject = `🎉 ¡Tu cuenta de Partner ha sido APROBADA!`;

  const dashboardUrl = `https://inmovaapp.com/partners/dashboard`;
  const referralLink = `https://inmovaapp.com/r/${partner.referralCode}`;

  const html = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="background-color: #10b981; color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0;">✅ ¡Cuenta Aprobada!</h1>
          <p style="font-size: 18px; margin-top: 10px; opacity: 0.9;">Ya puedes empezar a generar ingresos</p>
        </div>
        
        <div style="padding: 30px; background-color: #f9fafb;">
          <p style="font-size: 18px;">Hola <strong>${partner.name}</strong>,</p>
          
          <p style="font-size: 16px;">¡Excelentes noticias! 🎉</p>
          
          <p style="font-size: 16px;">Tu solicitud ha sido <strong>APROBADA</strong> y ya formas parte oficial del Programa de Partners de Inmova.</p>
          
          <div style="background-color: white; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0;">
            <h3 style="margin-top: 0; color: #10b981;">📊 Detalles de Tu Cuenta:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0;"><strong>Nivel de Partner:</strong></td>
                <td style="text-align: right; color: #2563eb;">${partner.level}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Comisión Recurrente:</strong></td>
                <td style="text-align: right; color: #10b981;">${partner.commissionRate}%</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Bono por Alta:</strong></td>
                <td style="text-align: right; color: #10b981;">€200</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #eff6ff; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <h3 style="margin-top: 0; color: #1e40af;">🔗 Tu Link de Referido:</h3>
            <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; word-break: break-all;">
              <a href="${referralLink}" style="color: #2563eb; font-family: monospace; font-size: 14px;">${referralLink}</a>
            </div>
            <p style="margin: 10px 0 0 0; text-align: center; font-size: 14px; color: #64748b;">
              Comparte este link con tus clientes potenciales
            </p>
          </div>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${dashboardUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Acceder a Mi Dashboard
            </a>
          </div>
          
          <div style="background-color: white; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <h3 style="margin-top: 0;">🚀 Empieza Ahora:</h3>
            <ol style="padding-left: 20px;">
              <li style="margin-bottom: 10px;"><strong>Accede al Dashboard:</strong> Revisa materiales y estadísticas</li>
              <li style="margin-bottom: 10px;"><strong>Descarga Materiales:</strong> Presentaciones, banners, folletos</li>
              <li style="margin-bottom: 10px;"><strong>Comparte tu Link:</strong> Envíalo a clientes potenciales</li>
              <li style="margin-bottom: 10px;"><strong>Trackea Comisiones:</strong> Monitorea en tiempo real</li>
            </ol>
          </div>
          
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 30px 0;">
            <p style="margin: 0; font-size: 14px;">
              <strong>💡 Tip:</strong> Los partners más exitosos combinan el link con llamadas personalizadas. La tasa de conversión promedio es del 15-20%.
            </p>
          </div>
          
          <div style="text-align: center; margin: 40px 0;">
            <p style="font-size: 14px; color: #64748b;">¿Dudas? ¿Necesitas soporte?</p>
            <p style="font-size: 14px; color: #64748b;">
              Email: <a href="mailto:partners@inmovaapp.com" style="color: #2563eb;">partners@inmovaapp.com</a><br/>
              WhatsApp: <a href="https://wa.me/34600000000" style="color: #10b981;">+34 600 000 000</a>
            </p>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 40px; text-align: center;">
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">
              Bienvenido a la familia Inmova Partners 🎉<br/>
              © 2025 Inmova App - Todos los derechos reservados
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@inmovaapp.com',
      to: partner.email,
      subject,
      html,
    });

    // Email sent successfully
  } catch (error) {
    logger.error('[Partner Approval Email Error]:', error);
    throw error;
  }
}

export async function sendAdminNewPartnerNotification(partner: {
  name: string;
  email: string;
  type: string;
  company?: string;
}) {
  const subject = `🆕 Nuevo Partner Pendiente de Aprobación: ${partner.name}`;

  const adminUrl = `https://inmovaapp.com/admin/partners`;

  const html = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="background-color: #f59e0b; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Nuevo Partner Pendiente</h1>
        </div>
        
        <div style="padding: 20px;">
          <p>Se ha registrado un nuevo partner que requiere aprobación:</p>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Nombre:</strong> ${partner.name}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${partner.email}</p>
            <p style="margin: 5px 0;"><strong>Tipo:</strong> ${partner.type}</p>
            ${partner.company ? `<p style="margin: 5px 0;"><strong>Empresa:</strong> ${partner.company}</p>` : ''}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${adminUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Revisar en Panel Admin
            </a>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@inmovaapp.com',
      to: process.env.ADMIN_EMAIL || 'admin@inmovaapp.com',
      subject,
      html,
    });

    // Notification sent successfully
  } catch (error) {
    logger.error('[Admin Notification Error]:', error);
  }
}
