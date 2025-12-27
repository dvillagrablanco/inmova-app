import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

// POST /api/auth-proveedor/forgot-password - Solicitar recuperación de contraseña
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'El email es requerido' },
        { status: 400 }
      );
    }

    // Buscar proveedor por email
    const proveedor = await prisma.provider.findFirst({
      where: { email },
    });

    // No revelar si el email existe o no por seguridad
    if (!proveedor) {
      return NextResponse.json({
        success: true,
        message: 'Si el email está registrado, recibirás un enlace para restablecer tu contraseña.',
      });
    }

    // Verificar que el proveedor está activo
    if (!proveedor.activo) {
      return NextResponse.json({
        success: true,
        message: 'Si el email está registrado, recibirás un enlace para restablecer tu contraseña.',
      });
    }

    // Generar token único
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token válido por 1 hora

    // Guardar token en la base de datos
    await prisma.providerPasswordResetToken.create({
      data: {
        providerId: proveedor.id,
        token,
        expiresAt,
      },
    });

    // TODO: Enviar email con el enlace de recuperación
    // const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/portal-proveedor/reset-password?token=${token}`;
    // await sendEmail({
    //   to: proveedor.email,
    //   subject: 'Recuperación de contraseña',
    //   html: `<p>Haz clic en el siguiente enlace para restablecer tu contraseña: <a href="${resetUrl}">${resetUrl}</a></p>`
    // });

    logger.info(
      `Token de recuperación generado para proveedor: ${proveedor.email}`
    );

    return NextResponse.json({
      success: true,
      message: 'Si el email está registrado, recibirás un enlace para restablecer tu contraseña.',
      // En desarrollo, devolver el token para testing
      ...(process.env.NODE_ENV === 'development' && { token }),
    });
  } catch (error) {
    logger.error('Error en solicitud de recuperación de contraseña:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
