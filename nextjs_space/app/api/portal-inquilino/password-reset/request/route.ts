import { NextRequest, NextResponse } from 'next/server';
import { createPasswordResetToken } from '@/lib/tenant-invitation-service';
import logger from '@/lib/logger';

// Simulación de envío de email (en producción usar un servicio real)
async function sendPasswordResetEmail(email: string, token: string, tenantName: string) {
  // TODO: Integrar con servicio de email (SendGrid, AWS SES, etc.)
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/portal-inquilino/password-reset/${token}`;
  
  logger.info('Email de recuperación generado', {
    email,
    resetUrl,
    tenantName
  });
  
  // Por ahora solo log, en producción enviar email real
  console.log(`
==============================================
RECUPERACIÓN DE CONTRASEÑA - PORTAL INQUILINO
==============================================
Para: ${email}
Nombre: ${tenantName}

Hola ${tenantName},

Has solicitado restablecer tu contraseña del Portal del Inquilino.

Haz clic en el siguiente enlace para crear una nueva contraseña:
${resetUrl}

Este enlace expirará en 24 horas.

Si no solicitaste este cambio, ignora este mensaje.

Saludos,
Equipo de Soporte
==============================================
`);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email requerido' },
        { status: 400 }
      );
    }

    // Crear el token de recuperación
    const result = await createPasswordResetToken(email);

    // Por seguridad, siempre responder con éxito aunque el email no exista
    if (result) {
      await sendPasswordResetEmail(
        email,
        result.token,
        result.tenant.nombreCompleto
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña'
    });
  } catch (error: any) {
    logger.error('Error al solicitar recuperación de contraseña', {
      error: error.message
    });
    
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
