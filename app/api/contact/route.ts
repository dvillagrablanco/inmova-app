import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email-config';
import { CONTACT_EMAIL, getContactEmail, ContactFormType } from '@/lib/contact-config';
import { z } from 'zod';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Schema de validación
const contactSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  telefono: z.string().optional(),
  empresa: z.string().optional(),
  mensaje: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres'),
  tipo: z.enum(['landing', 'soporte', 'demo', 'partner', 'chatbot', 'ewoorker', 'feedback', 'prensa', 'otro']).optional(),
  asunto: z.string().optional(),
  paginaOrigen: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validar datos
    const validationResult = contactSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Datos inválidos', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    const tipo = (data.tipo || 'landing') as ContactFormType;
    const destinatario = getContactEmail(tipo);

    // Construir asunto del email
    const tipoLabels: Record<string, string> = {
      landing: 'Contacto Web',
      soporte: 'Soporte',
      demo: 'Solicitud de Demo',
      partner: 'Partners',
      chatbot: 'Chatbot',
      ewoorker: 'eWoorker',
      feedback: 'Feedback',
      prensa: 'Prensa',
      otro: 'Contacto',
    };

    const asuntoEmail = data.asunto || `[${tipoLabels[tipo]}] Nuevo mensaje de ${data.nombre}`;

    // Construir HTML del email
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .field { margin-bottom: 20px; }
            .label { font-weight: bold; color: #667eea; margin-bottom: 5px; }
            .value { background: #f9f9f9; padding: 10px; border-radius: 4px; border-left: 3px solid #667eea; }
            .message-box { background: #f0f4ff; padding: 20px; border-radius: 8px; margin-top: 20px; }
            .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .badge { display: inline-block; background: #667eea; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📩 Nuevo Mensaje de Contacto</h1>
              <span class="badge">${tipoLabels[tipo]}</span>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">👤 Nombre</div>
                <div class="value">${data.nombre}</div>
              </div>
              
              <div class="field">
                <div class="label">📧 Email</div>
                <div class="value"><a href="mailto:${data.email}">${data.email}</a></div>
              </div>
              
              ${data.telefono ? `
              <div class="field">
                <div class="label">📱 Teléfono</div>
                <div class="value"><a href="tel:${data.telefono}">${data.telefono}</a></div>
              </div>
              ` : ''}
              
              ${data.empresa ? `
              <div class="field">
                <div class="label">🏢 Empresa</div>
                <div class="value">${data.empresa}</div>
              </div>
              ` : ''}
              
              <div class="message-box">
                <div class="label">💬 Mensaje</div>
                <p style="white-space: pre-wrap;">${data.mensaje}</p>
              </div>
              
              ${data.paginaOrigen ? `
              <div class="field" style="margin-top: 20px;">
                <div class="label">🌐 Página de Origen</div>
                <div class="value">${data.paginaOrigen}</div>
              </div>
              ` : ''}
            </div>
            <div class="footer">
              <p>Este email fue generado automáticamente desde INMOVA</p>
              <p>Fecha: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Enviar email
    const result = await sendEmail({
      to: destinatario,
      subject: asuntoEmail,
      html,
      replyTo: data.email,
    });

    if (!result.success) {
      logger.error('Error enviando email de contacto:', result.error);
      return NextResponse.json(
        { error: 'Error al enviar el mensaje. Por favor, inténtalo de nuevo.' },
        { status: 500 }
      );
    }

    logger.info('Email de contacto enviado:', {
      tipo,
      email: data.email,
      nombre: data.nombre,
      messageId: result.messageId,
    });

    return NextResponse.json({
      success: true,
      message: 'Mensaje enviado correctamente. Nos pondremos en contacto contigo pronto.',
    });

  } catch (error) {
    logger.error('Error en API de contacto:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
