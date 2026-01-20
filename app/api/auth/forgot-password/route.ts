/**
 * API de Recuperación de Contraseña - Envío de Token
 * 
 * POST /api/auth/forgot-password
 * 
 * Envía un email con un token para resetear la contraseña.
 * El token se envía tanto al email principal como al email de recuperación.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Schema de validación
const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

// Configuración del transporter de email
const getEmailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

/**
 * POST /api/auth/forgot-password
 * Solicita recuperación de contraseña
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar entrada
    const { email } = forgotPasswordSchema.parse(body);
    
    // Buscar usuario por email principal O email de recuperación
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { recoveryEmail: email.toLowerCase() },
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
    
    // IMPORTANTE: Siempre responder con éxito para evitar enumeration attacks
    if (!user) {
      // Simular delay para evitar timing attacks
      await new Promise(resolve => setTimeout(resolve, 1000));
      return NextResponse.json({
        success: true,
        message: 'Si el email existe en nuestro sistema, recibirás instrucciones para recuperar tu contraseña.',
      });
    }
    
    // Generar token seguro
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Token expira en 1 hora
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
    
    // Guardar token en la base de datos
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: resetTokenHash,
        resetTokenExpiry,
      },
    });
    
    // Generar URL de reset
    const baseUrl = process.env.NEXTAUTH_URL || 'https://inmovaapp.com';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;
    
    // Preparar emails a enviar
    const emailsToSend: string[] = [user.email];
    if (user.recoveryEmail) {
      emailsToSend.push(user.recoveryEmail);
    }
    
    // Enviar email(s)
    try {
      const transporter = getEmailTransporter();
      
      const emailPromises = emailsToSend.map(emailAddress => {
        return transporter.sendMail({
          from: process.env.SMTP_FROM || '"Inmova App" <noreply@inmovaapp.com>',
          to: emailAddress,
          subject: '🔐 Recuperación de Contraseña - Inmova',
          html: generateResetEmail(user.name || 'Usuario', resetUrl),
          text: `
Hola ${user.name || 'Usuario'},

Has solicitado recuperar tu contraseña en Inmova.

Para crear una nueva contraseña, haz clic en el siguiente enlace:
${resetUrl}

Este enlace expirará en 1 hora.

Si no solicitaste este cambio, puedes ignorar este email.

Saludos,
El equipo de Inmova
          `.trim(),
        });
      });
      
      await Promise.all(emailPromises);
      
      console.log(`[Password Recovery] Email sent to ${emailsToSend.length} address(es) for user ${user.id}`);
    } catch (emailError) {
      logger.error('[Password Recovery] Error sending email:', emailError);
      // No revelar error de email al usuario
    }
    
    return NextResponse.json({
      success: true,
      message: 'Si el email existe en nuestro sistema, recibirás instrucciones para recuperar tu contraseña.',
    });
    
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Email inválido',
          details: error.errors,
        },
        { status: 400 }
      );
    }
    
    logger.error('[Password Recovery] Error:', error);
    return NextResponse.json(
      { error: 'Error procesando la solicitud' },
      { status: 500 }
    );
  }
}

/**
 * Genera el HTML del email de recuperación
 */
function generateResetEmail(userName: string, resetUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperación de Contraseña</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f7;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f7;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 40px 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                🔐 Recupera tu Contraseña
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #1f2937; font-size: 16px; line-height: 1.6;">
                Hola <strong>${userName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 15px; line-height: 1.6;">
                Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Inmova.
              </p>
              
              <p style="margin: 0 0 30px; color: #4b5563; font-size: 15px; line-height: 1.6;">
                Haz clic en el botón de abajo para crear una nueva contraseña:
              </p>
              
              <!-- Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" 
                       style="display: inline-block; background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">
                      Restablecer Contraseña
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 20px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                <strong>⏰ Este enlace expirará en 1 hora.</strong>
              </p>
              
              <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:
              </p>
              
              <p style="margin: 0 0 20px; word-break: break-all; color: #4F46E5; font-size: 12px;">
                ${resetUrl}
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="margin: 0; color: #9ca3af; font-size: 13px; line-height: 1.6;">
                Si no solicitaste este cambio, puedes ignorar este email de forma segura. Tu contraseña actual seguirá funcionando.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-radius: 0 0 12px 12px;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 13px;">
                © ${new Date().getFullYear()} Inmova. Todos los derechos reservados.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Este es un email automático, por favor no respondas.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
