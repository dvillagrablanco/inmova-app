import { NextRequest, NextResponse } from 'next/server';
export const dynamic = "force-dynamic";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import logger from '@/lib/logger';
import crypto from 'crypto';

// Generar token de recuperación
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      );
    }

    // Buscar usuario super admin
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.role !== 'super_admin') {
      // Por seguridad, no revelamos si el email existe o no
      return NextResponse.json({
        message: 'Si el email existe, se enviará un enlace de recuperación'
      });
    }

    // Generar token de recuperación
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora

    // Guardar token en la base de datos
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // TODO: Enviar email con el token
    // Por ahora, retornamos el token para desarrollo
    logger.info(`Token de recuperación generado para ${email}: ${resetToken}`);

    return NextResponse.json({
      message: 'Si el email existe, se enviará un enlace de recuperación',
      // En producción, NO devolver el token
      ...(process.env.NODE_ENV === 'development' && { token: resetToken }),
    });
  } catch (error) {
    logger.error('Error al generar token de recuperación:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

// Restablecer contraseña con token
export async function PUT(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token y nueva contraseña son requeridos' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      );
    }

    // Buscar usuario con el token válido
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
        role: 'super_admin',
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 400 }
      );
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña y limpiar token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    logger.info(`Contraseña restablecida para super admin: ${user.email}`);

    return NextResponse.json({
      message: 'Contraseña restablecida exitosamente',
    });
  } catch (error) {
    logger.error('Error al restablecer contraseña:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
