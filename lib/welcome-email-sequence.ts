/**
 * Secuencia de emails automáticos para nuevos usuarios.
 * Se ejecuta automáticamente al registrarse y los días siguientes.
 */

import logger from '@/lib/logger';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

const APP_URL = process.env.NEXTAUTH_URL || 'https://inmovaapp.com';
const FROM_NAME = 'INMOVA';

function emailTemplate(title: string, body: string, ctaText?: string, ctaUrl?: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:24px;text-align:center;border-radius:8px 8px 0 0;">
    <h1 style="margin:0;font-size:22px;">${title}</h1>
  </div>
  <div style="background:#f9f9f9;padding:24px;border-radius:0 0 8px 8px;">
    ${body}
    ${ctaText && ctaUrl ? `
    <div style="text-align:center;margin:24px 0;">
      <a href="${ctaUrl}" style="background:#4F46E5;color:white;padding:12px 28px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:500;">${ctaText}</a>
    </div>` : ''}
    <p style="color:#9ca3af;font-size:12px;margin-top:24px;text-align:center;">
      INMOVA · Gestión Inmobiliaria Profesional<br/>
      <a href="${APP_URL}/ayuda" style="color:#6366f1;">Centro de Ayuda</a> · 
      <a href="mailto:soporte@inmova.app" style="color:#6366f1;">Soporte</a>
    </p>
  </div>
</body></html>`;
}

export const WELCOME_EMAILS = [
  {
    day: 0,
    subject: '¡Bienvenido a INMOVA! Tu cuenta está lista',
    template: (name: string) => emailTemplate(
      `¡Bienvenido, ${name}!`,
      `<p>Tu cuenta en INMOVA está activa y lista para usar.</p>
       <p>Para empezar, solo necesitas <strong>5 minutos</strong>:</p>
       <ol>
         <li>Configura tu empresa (nombre, CIF)</li>
         <li>Crea tu primer edificio</li>
         <li>Añade unidades y un inquilino</li>
         <li>Genera tu primer contrato</li>
       </ol>
       <p>A partir de ahí, INMOVA se encarga de los cobros, recordatorios y renovaciones automáticamente.</p>`,
      'Empezar ahora', `${APP_URL}/dashboard`
    ),
  },
  {
    day: 1,
    subject: 'Consejo: Cómo cobrar automáticamente las rentas',
    template: (name: string) => emailTemplate(
      'Cobros automáticos con INMOVA',
      `<p>Hola ${name},</p>
       <p>¿Sabías que puedes cobrar las rentas automáticamente?</p>
       <p>Tus inquilinos registran su tarjeta una vez, y cada mes se les cobra el día que tú indiques. Sin perseguir pagos.</p>
       <p><strong>Cómo activarlo:</strong></p>
       <ol>
         <li>Ve al contrato del inquilino</li>
         <li>Activa "Cobro automático"</li>
         <li>El inquilino recibe un email seguro para registrar su tarjeta</li>
       </ol>
       <p>Si un pago falla, recibirás alerta automática.</p>`,
      'Configurar cobros', `${APP_URL}/pagos`
    ),
  },
  {
    day: 3,
    subject: 'Tu inquilino tiene su propio portal',
    template: (name: string) => emailTemplate(
      'Portal del Inquilino',
      `<p>Hola ${name},</p>
       <p>Cada inquilino que registras con email recibe acceso automático a su propio portal donde puede:</p>
       <ul>
         <li>Ver y pagar sus recibos online</li>
         <li>Reportar incidencias con fotos</li>
         <li>Descargar su contrato y recibos</li>
         <li>Comunicarse contigo por chat</li>
       </ul>
       <p>No necesitas hacer nada. El portal se activa automáticamente al crear el inquilino.</p>
       <p>Esto reduce el 80% de las llamadas y WhatsApps de tus inquilinos.</p>`,
      'Ver inquilinos', `${APP_URL}/inquilinos`
    ),
  },
  {
    day: 7,
    subject: '¿Cómo va todo? ¿Necesitas ayuda?',
    template: (name: string) => emailTemplate(
      '¿Cómo va tu experiencia?',
      `<p>Hola ${name},</p>
       <p>Llevas una semana con INMOVA. Quería asegurarme de que todo va bien.</p>
       <p>Si tienes alguna duda o necesitas ayuda para configurar algo, tienes varias opciones:</p>
       <ul>
         <li><strong>Centro de Ayuda:</strong> Guías paso a paso para todo</li>
         <li><strong>Chatbot IA:</strong> Pregunta lo que necesites, 24/7</li>
         <li><strong>Email:</strong> soporte@inmova.app (respuesta en 24h)</li>
       </ul>
       <p>Tu opinión nos importa mucho. Si hay algo que podríamos mejorar, simplemente responde a este email.</p>`,
      'Centro de Ayuda', `${APP_URL}/ayuda`
    ),
  },
];

export async function sendWelcomeEmail(userId: string, dayIndex: number = 0): Promise<boolean> {
  try {
    const prisma = await getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user?.email) return false;

    const emailData = WELCOME_EMAILS[dayIndex];
    if (!emailData) return false;

    const { sendEmail } = await import('@/lib/email-config');
    const result = await sendEmail({
      to: user.email,
      subject: emailData.subject,
      html: emailData.template(user.name || 'usuario'),
    });

    logger.info(`[WelcomeSequence] Day ${emailData.day} email sent to ${user.email}`);
    return result.success;
  } catch (error) {
    logger.error('[WelcomeSequence] Error sending email:', error);
    return false;
  }
}

export async function processWelcomeSequence(): Promise<{ sent: number; errors: number }> {
  const prisma = await getPrisma();
  let sent = 0;
  let errors = 0;

  for (let i = 0; i < WELCOME_EMAILS.length; i++) {
    const emailConfig = WELCOME_EMAILS[i];
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - emailConfig.day);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const users = await prisma.user.findMany({
      where: {
        createdAt: { gte: startOfDay, lte: endOfDay },
        activo: true,
      },
      select: { id: true, email: true },
    });

    for (const user of users) {
      const success = await sendWelcomeEmail(user.id, i);
      if (success) sent++;
      else errors++;
    }
  }

  return { sent, errors };
}
