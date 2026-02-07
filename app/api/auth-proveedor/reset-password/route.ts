import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

import { prisma } from '@/lib/db';
import logger from '@/lib/logger';
import { hashResetToken } from '@/lib/password-reset';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const tokenHash = hashResetToken(parsed.data.token);
    const now = new Date();

    const resetToken = await prisma.providerPasswordResetToken.findFirst({
      where: {
        token: tokenHash,
        used: false,
        expiresAt: { gt: now },
      },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(parsed.data.password, 10);

    await prisma.provider.update({
      where: { id: resetToken.providerId },
      data: { password: hashedPassword },
    });

    await prisma.providerPasswordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true, usedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error resetting provider password', error);
    return NextResponse.json(
      { error: 'No se pudo restablecer la contraseña' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/auth-proveedor/reset-password - Restablecer contraseña
export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token y nueva contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Validar longitud de contraseña
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Buscar token
    const resetToken = await prisma.providerPasswordResetToken.findUnique({
      where: { token },
      include: { provider: true },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 400 }
      );
    }

    // Verificar si el token ya fue usado
    if (resetToken.used) {
      return NextResponse.json(
        { error: 'Este enlace ya fue utilizado' },
        { status: 400 }
      );
    }

    // Verificar si el token expió
    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json(
        { error: 'Este enlace ha expirado' },
        { status: 400 }
      );
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña del proveedor
    await prisma.provider.update({
      where: { id: resetToken.providerId },
      data: { password: hashedPassword },
    });

    // Marcar token como usado
    await prisma.providerPasswordResetToken.update({
      where: { id: resetToken.id },
      data: {
        used: true,
        usedAt: new Date(),
      },
    });

    logger.info(
      `Contraseña restablecida para proveedor: ${resetToken.provider.email}`
    );

    return NextResponse.json({
      success: true,
      message: 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión.',
    });
  } catch (error) {
    logger.error('Error al restablecer contraseña:', error);
    return NextResponse.json(
      { error: 'Error al restablecer contraseña' },
      { status: 500 }
    );
  }
}
