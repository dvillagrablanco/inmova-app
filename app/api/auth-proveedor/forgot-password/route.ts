import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/db';
import logger from '@/lib/logger';
import { sendEmail } from '@/lib/email-config';
import { buildResetLink, generateResetToken, hashResetToken } from '@/lib/password-reset';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const provider = await prisma.provider.findFirst({ where: { email } });

    if (provider) {
      const rawToken = generateResetToken();
      const tokenHash = hashResetToken(rawToken);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await prisma.providerPasswordResetToken.updateMany({
        where: { providerId: provider.id, used: false },
        data: { used: true, usedAt: new Date() },
      });

      await prisma.providerPasswordResetToken.create({
        data: {
          providerId: provider.id,
          token: tokenHash,
          expiresAt,
        },
      });

      const resetLink = buildResetLink('/portal-proveedor/reset-password', rawToken);

      try {
        const emailResult = await sendEmail({
          to: provider.email || email,
          subject: 'Restablecer contraseña del portal de proveedores',
          text: `Solicitaste restablecer tu contraseña. Usa este enlace: ${resetLink}`,
          html: `
            <p>Solicitaste restablecer tu contraseña del portal de proveedores.</p>
            <p>Usa este enlace para crear una nueva contraseña:</p>
            <p><a href="${resetLink}">Restablecer contraseña</a></p>
            <p>Si no fuiste tú, ignora este mensaje.</p>
          `,
        });

        if (!emailResult.success) {
          logger.warn('Provider password reset email not sent', { providerId: provider.id });
        }
      } catch (emailError) {
        logger.error('Error sending provider password reset email', emailError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error processing provider forgot password request', error);
    return NextResponse.json(
      { error: 'No se pudo procesar la solicitud' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
