import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email-config';
import { z } from 'zod';
import crypto from 'crypto';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Rate limiting simple en memoria (en producción usar Redis)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutos
const MAX_ATTEMPTS = 5;

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= MAX_ATTEMPTS) {
    return false;
  }

  record.count++;
  return true;
}

// Schema de validación
const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    
    // Rate limiting por IP
    if (!checkRateLimit(ip)) {
      logger.warn('Rate limit exceeded for forgot-password', { ip });
      return NextResponse.json(
        { 
          success: true, // Siempre retornamos success para no revelar información
          message: 'Si el email existe en nuestro sistema, recibirás un enlace de recuperación.' 
        },
        { status: 200 }
      );
    }

    const body = await req.json();
    
    // Validar datos
    const validationResult = forgotPasswordSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Rate limiting adicional por email
    if (!checkRateLimit(`email:${normalizedEmail}`)) {
      return NextResponse.json(
        { 
          success: true,
          message: 'Si el email existe en nuestro sistema, recibirás un enlace de recuperación.' 
        },
        { status: 200 }
      );
    }

    // Buscar usuario por email principal O email de recuperación
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { recoveryEmail: normalizedEmail },
        ],
        activo: true,
      },
      select: {
        id: true,
        email: true,
        recoveryEmail: true,
        name: true,
      },
    });

    // IMPORTANTE: Siempre retornamos el mismo mensaje para no revelar si el email existe
    if (!user) {
      logger.info('Forgot password requested for non-existent email', { email: normalizedEmail });
      return NextResponse.json({
        success: true,
        message: 'Si el email existe en nuestro sistema, recibirás un enlace de recuperación.',
      });
    }

    // Generar token seguro
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hashear el token antes de guardarlo (seguridad adicional)
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Guardar token hasheado con expiración de 1 hora
    const expiryDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry: expiryDate,
      },
    });

    // Determinar a qué email enviar (preferir el de recuperación si existe)
    const targetEmail = user.recoveryEmail || user.email;

    // Construir URL de reset
    const baseUrl = process.env.NEXTAUTH_URL || 'https://inmovaapp.com';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    // Enviar email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .security-tip { background: #e8f4fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Recuperar Contraseña</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${user.name}</strong>,</p>
              <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en INMOVA.</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
              </div>
              
              <div class="warning">
                <strong>⚠️ Importante:</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                  <li>Este enlace expirará en <strong>1 hora</strong> por seguridad.</li>
                  <li>Solo puedes usar este enlace <strong>una vez</strong>.</li>
                  <li>Si no solicitaste este cambio, ignora este email.</li>
                </ul>
              </div>
              
              <div class="security-tip">
                <strong>🛡️ Consejo de seguridad:</strong>
                <p style="margin: 5px 0 0 0;">Nunca compartas este enlace con nadie. INMOVA nunca te pedirá tu contraseña por email o teléfono.</p>
              </div>
              
              <p style="font-size: 12px; color: #666;">
                Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:<br>
                <span style="word-break: break-all;">${resetUrl}</span>
              </p>
            </div>
            <div class="footer">
              <p>Este email fue enviado desde INMOVA</p>
              <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este mensaje.</p>
              <p>© 2026 INMOVA. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResult = await sendEmail({
      to: targetEmail,
      subject: '🔐 Restablecer contraseña - INMOVA',
      html: emailHtml,
    });

    if (!emailResult.success) {
      logger.error('Error sending password reset email', { 
        userId: user.id, 
        error: emailResult.error 
      });
      // No revelamos el error exacto al usuario
    } else {
      logger.info('Password reset email sent', { 
        userId: user.id, 
        targetEmail: targetEmail.replace(/(.{2}).*(@.*)/, '$1***$2') 
      });
    }

    // Log para auditoría
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'PASSWORD_RESET_REQUESTED',
          entityType: 'User',
          entityId: user.id,
          details: {
            requestedAt: new Date().toISOString(),
            ip,
            userAgent: req.headers.get('user-agent') || 'unknown',
          },
        },
      });
    } catch (auditError) {
      logger.warn('Failed to create audit log for password reset', auditError);
    }

    return NextResponse.json({
      success: true,
      message: 'Si el email existe en nuestro sistema, recibirás un enlace de recuperación.',
    });

  } catch (error) {
    logger.error('Error in forgot-password API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
